import { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageCircle, X, ChevronLeft, Send, Search,
    Bell, BellOff, Hash, Lock, Users, UserPlus,
    Loader2, Volume2, VolumeX, Plus, Check, CheckCheck,
    Settings, Smile,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    fetchUserChannels, fetchMessages, sendMessage as apiSend,
    subscribeToChannel, fetchChatProfiles, markChannelAsRead,
    findOrCreatePrivateChannel, createGroupChannel,
    fetchChannelMemberIds,
} from '../data/chatApi';
import type { ChatChannel, ChatMessage, ChatProfile } from '../data/chatApi';

// ─── Sound ───────────────────────────────────────────────────────────────────
function playNotifSound() {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch (_) { /* silencia em caso de erro */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CHAT_GRADIENT_COLORS = [
    ['#4a90d9', '#2a6ab5'], ['#8b5cf6', '#6d28d9'],
    ['#10b981', '#059669'], ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'], ['#06b6d4', '#0891b2'],
];

function nameToColor(name: string): string[] {
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CHAT_GRADIENT_COLORS.length;
    return CHAT_GRADIENT_COLORS[idx];
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateDivider(d: string): string {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const [from, to] = nameToColor(name);
    const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
    return (
        <div
            className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none`}
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
            {getInitials(name)}
        </div>
    );
}

// ─── Read Status ──────────────────────────────────────────────────────────────
function ReadStatus({ msg, memberCount, currentUserId }: { msg: ChatMessage; memberCount: number; currentUserId: string }) {
    if (msg.sender_id !== currentUserId) return null;
    const readers = msg.read_by.filter(id => id !== currentUserId);
    const allRead = memberCount > 1 && readers.length >= memberCount - 1;

    if (allRead) return <CheckCheck size={13} className="text-blue-300 flex-shrink-0" />;
    return <Check size={13} className="text-white/50 flex-shrink-0" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ChatWidget() {
    const { session, isSupabaseReady } = useAuth();
    const userId = session.userId;
    const userName = session.profile?.nome_completo || session.email || 'Usuário';
    const userInitials = getInitials(userName);

    // Panel state
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'list' | 'chat' | 'new-direct' | 'new-group'>('list');
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [memberCount, setMemberCount] = useState(2);
    const [profiles, setProfiles] = useState<ChatProfile[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);

    // Settings
    const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('chat_notif') !== 'false');
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('chat_sound') !== 'false');
    const [showSettings, setShowSettings] = useState(false);

    // New group form
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const globalSubsRef = useRef<Map<string, () => void>>(new Map());

    const supabaseOk = isSupabaseReady && isSupabaseConfigured();

    // ── Load channels + profiles ──────────────────────────────
    const loadChannels = useCallback(async () => {
        if (!supabaseOk || !userId) return;
        setIsLoading(true);
        const [chs, profs] = await Promise.all([
            fetchUserChannels(userId),
            fetchChatProfiles(),
        ]);

        // Enriquecer nomes dos canais privados
        const enriched = await Promise.all(chs.map(async (ch) => {
            if (ch.type === 'general') {
                return { ...ch, displayName: 'Canal Geral' };
            }
            if (ch.type === 'private') {
                const members = await fetchChannelMemberIds(ch.id);
                const otherId = members.find(id => id !== userId);
                const other = profs.find(p => p.id === otherId);
                return {
                    ...ch,
                    displayName: other?.nome_completo || 'Conversa',
                    memberIds: members,
                };
            }
            // group
            return { ...ch, displayName: ch.name || 'Grupo' };
        }));

        setChannels(enriched);
        setProfiles(profs);
        setIsLoading(false);
    }, [supabaseOk, userId]);

    useEffect(() => {
        if (isOpen && supabaseOk) {
            loadChannels();
        }
    }, [isOpen, supabaseOk, loadChannels]);

    // ── Global subscriptions for unread tracking ──────────────
    useEffect(() => {
        if (!supabaseOk || channels.length === 0) return;

        channels.forEach(ch => {
            if (globalSubsRef.current.has(ch.id)) return;
            const unsub = subscribeToChannel(
                ch.id,
                (msg) => {
                    if (msg.sender_id === userId) return;
                    const isActive = activeChannel?.id === ch.id;
                    if (isActive) {
                        setMessages(prev => [...prev, msg]);
                        markChannelAsRead(ch.id, userId);
                    } else {
                        setChannels(prev => prev.map(c =>
                            c.id === ch.id
                                ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: msg.content }
                                : c
                        ));
                        setTotalUnread(prev => prev + 1);
                        if (notifEnabled && soundEnabled) playNotifSound();
                    }
                }
            );
            globalSubsRef.current.set(ch.id, unsub);
        });

        return () => {
            globalSubsRef.current.forEach(unsub => unsub());
            globalSubsRef.current.clear();
        };
    }, [channels.length, userId, supabaseOk, activeChannel?.id, notifEnabled, soundEnabled]);

    // ── Open a channel ─────────────────────────────────────────
    const openChannel = useCallback(async (channel: ChatChannel) => {
        setActiveChannel(channel);
        setView('chat');
        setMessages([]);
        setIsLoading(true);

        // Load messages
        const msgs = await fetchMessages(channel.id);
        setMessages(msgs);

        // Member count for read receipts
        if (channel.type !== 'general') {
            const ids = await fetchChannelMemberIds(channel.id);
            setMemberCount(ids.length);
        } else {
            setMemberCount(profiles.length || 2);
        }

        // Mark as read
        await markChannelAsRead(channel.id, userId);
        setChannels(prev => prev.map(c =>
            c.id === channel.id ? { ...c, unreadCount: 0 } : c
        ));
        setTotalUnread(prev => Math.max(0, prev - (channel.unreadCount || 0)));

        setIsLoading(false);

        // Subscribe to real-time updates for this channel
        if (unsubscribeRef.current) unsubscribeRef.current();
        unsubscribeRef.current = subscribeToChannel(
            channel.id,
            (msg) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                markChannelAsRead(channel.id, userId);
            },
            (updated) => {
                setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
            }
        );

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [userId, profiles.length]);

    // ── Auto-scroll ────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Settings toggles ───────────────────────────────────────
    const toggleNotif = () => {
        const next = !notifEnabled;
        setNotifEnabled(next);
        localStorage.setItem('chat_notif', String(next));
    };
    const toggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem('chat_sound', String(next));
    };

    // ── Send message ───────────────────────────────────────────
    const handleSend = async () => {
        if (!newMsg.trim() || isSending || !activeChannel) return;
        setIsSending(true);
        const content = newMsg;
        setNewMsg('');

        // Otimista
        const optimistic: ChatMessage = {
            id: `opt-${Date.now()}`,
            channel_id: activeChannel.id,
            sender_id: userId,
            sender_name: userName,
            sender_initials: userInitials,
            content,
            read_by: [userId],
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        const sent = await apiSend(activeChannel.id, userId, userName, userInitials, content);
        if (sent) {
            setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
        }
        setIsSending(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Create direct chat ─────────────────────────────────────
    const handleOpenDirect = async (profile: ChatProfile) => {
        if (!supabaseOk) return;
        setIsLoading(true);
        const ch = await findOrCreatePrivateChannel(userId, profile.id);
        if (ch) {
            const enriched = { ...ch, displayName: profile.nome_completo };
            setChannels(prev => {
                const exists = prev.find(c => c.id === ch.id);
                return exists ? prev : [...prev, enriched];
            });
            await openChannel(enriched);
        }
        setIsLoading(false);
    };

    // ── Create group ───────────────────────────────────────────
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) return;
        setIsLoading(true);
        const ch = await createGroupChannel(groupName, userId, selectedMembers);
        if (ch) {
            const enriched = { ...ch, displayName: groupName };
            setChannels(prev => [...prev, enriched]);
            setGroupName('');
            setSelectedMembers([]);
            await openChannel(enriched);
        }
        setIsLoading(false);
    };

    // ── Cleanup ────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            unsubscribeRef.current?.();
            globalSubsRef.current.forEach(u => u());
        };
    }, []);

    // ── Render helpers ─────────────────────────────────────────
    const filteredProfiles = profiles.filter(p =>
        p.id !== userId && p.nome_completo.toLowerCase().includes(search.toLowerCase())
    );

    const filteredChannels = channels.filter(ch =>
        (ch.displayName || ch.name || '').toLowerCase().includes(search.toLowerCase())
    );

    // Grouping messages by date
    type DateGroup = { date: string; msgs: ChatMessage[] };
    const msgGroups: DateGroup[] = messages.reduce<DateGroup[]>((acc, msg) => {
        const dateLabel = fmtDateDivider(msg.created_at);
        const last = acc[acc.length - 1];
        if (last?.date === dateLabel) { last.msgs.push(msg); }
        else { acc.push({ date: dateLabel, msgs: [msg] }); }
        return acc;
    }, []);

    if (!session.isAuthenticated && isSupabaseReady) return null;

    return (
        <>
            {/* ── Floating Button ─────────────────────────────── */}
            <button
                onClick={() => setIsOpen(o => !o)}
                title="Chat da Equipe"
                style={{ bottom: '5rem', right: '1.5rem' }}
                className="fixed z-40 w-14 h-14 rounded-full bg-[#4a90d9] text-white shadow-xl shadow-[#4a90d9]/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
                {isOpen
                    ? <X size={22} />
                    : (
                        <div className="relative">
                            <MessageCircle size={24} />
                            {totalUnread > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center animate-pulse">
                                    {totalUnread > 9 ? '9+' : totalUnread}
                                </span>
                            )}
                        </div>
                    )
                }
            </button>

            {/* ── Chat Panel ──────────────────────────────────── */}
            {isOpen && (
                <div
                    className="fixed z-50 bottom-24 right-6 w-[370px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-[#dde3ee]"
                    style={{
                        height: '560px',
                        animation: 'slideUpFade 0.25s ease-out',
                        background: '#ffffff',
                    }}
                >
                    {/* ── Header ──────────────────────────── */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1e2d40] to-[#2d4b73] text-white flex-shrink-0">
                        {view !== 'list' && (
                            <button onClick={() => { setView('list'); setActiveChannel(null); unsubscribeRef.current?.(); }}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <div className="flex-1 min-w-0">
                            {view === 'list' && (
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={16} className="text-blue-300 flex-shrink-0" />
                                    <span className="font-bold text-sm">Chat da Equipe</span>
                                </div>
                            )}
                            {view === 'chat' && activeChannel && (
                                <div className="flex items-center gap-2">
                                    {activeChannel.type === 'general' && <Hash size={14} className="text-blue-300 flex-shrink-0" />}
                                    {activeChannel.type === 'private' && <Lock size={14} className="text-green-300 flex-shrink-0" />}
                                    {activeChannel.type === 'group' && <Users size={14} className="text-violet-300 flex-shrink-0" />}
                                    <span className="font-bold text-sm truncate">{activeChannel.displayName}</span>
                                </div>
                            )}
                            {view === 'new-direct' && <span className="font-bold text-sm">Nova Conversa</span>}
                            {view === 'new-group' && <span className="font-bold text-sm">Criar Grupo</span>}
                        </div>

                        <div className="flex items-center gap-1">
                            {view === 'list' && (
                                <>
                                    <button onClick={() => { setView('new-direct'); setSearch(''); }} title="Nova Conversa"
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                        <UserPlus size={16} />
                                    </button>
                                    <button onClick={() => { setView('new-group'); setSearch(''); }} title="Novo Grupo"
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                        <Plus size={16} />
                                    </button>
                                    <button onClick={() => setShowSettings(s => !s)} title="Configurações"
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                        <Settings size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Settings Panel ──────────────────── */}
                    {showSettings && view === 'list' && (
                        <div className="flex-shrink-0 border-b border-[#dde3ee] bg-[#f8fafc] px-4 py-3 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a6075]">Notificações</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#4a6075] flex items-center gap-2"><Bell size={13} /> Ativar alertas</span>
                                <button onClick={toggleNotif}
                                    className={`w-10 h-5 rounded-full transition-all relative flex items-center ${notifEnabled ? 'bg-[#4a90d9]' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifEnabled ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#4a6075] flex items-center gap-2"><Volume2 size={13} /> Som</span>
                                <button onClick={toggleSound}
                                    className={`w-10 h-5 rounded-full transition-all relative flex items-center ${soundEnabled ? 'bg-[#4a90d9]' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${soundEnabled ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-2 text-[10px] text-[#8fa5b8] items-center pt-1">
                                {notifEnabled ? <Bell size={11} /> : <BellOff size={11} />}
                                {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
                                <span>{notifEnabled ? 'Notificações ativas' : 'Notificações desativadas'}</span>
                            </div>
                        </div>
                    )}

                    {/* ── Supabase Warning ─────────────────── */}
                    {!supabaseOk && (
                        <div className="flex-1 flex items-center justify-center p-6 text-center text-[#8fa5b8]">
                            <div>
                                <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-semibold">Chat indisponível</p>
                                <p className="text-xs mt-1">Configure o Supabase para usar o chat em tempo real.</p>
                            </div>
                        </div>
                    )}

                    {/* ══ VIEW: CHANNEL LIST ═══════════════════ */}
                    {supabaseOk && view === 'list' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Search */}
                            <div className="px-3 pt-3 pb-2 flex-shrink-0">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa5b8]" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Buscar conversas..."
                                        className="w-full bg-[#f0f4f8] border border-[#dde3ee] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1e2d40] placeholder:text-[#8fa5b8] focus:outline-none focus:border-[#4a90d9] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {isLoading && (
                                    <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#4a90d9]" /></div>
                                )}
                                {!isLoading && filteredChannels.length === 0 && (
                                    <div className="text-center py-10 text-[#8fa5b8]">
                                        <Smile size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-xs">Nenhuma conversa ainda</p>
                                        <p className="text-[10px] mt-1">Clique em <UserPlus size={10} className="inline" /> para iniciar</p>
                                    </div>
                                )}
                                {filteredChannels.map(channel => (
                                    <button
                                        key={channel.id}
                                        onClick={() => openChannel(channel)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f0f4f8] last:border-0"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white ${channel.type === 'general' ? 'bg-gradient-to-br from-[#4a90d9] to-[#2d4b73]' : channel.type === 'group' ? 'bg-gradient-to-br from-violet-500 to-violet-700' : ''}`}>
                                            {channel.type === 'general' && <Hash size={18} />}
                                            {channel.type === 'group' && <Users size={18} />}
                                            {channel.type === 'private' && <Avatar name={channel.displayName || 'U'} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-[#0f1f30] truncate">{channel.displayName || channel.name || 'Conversa'}</span>
                                                {channel.lastMessageAt && (
                                                    <span className="text-[10px] text-[#8fa5b8] ml-1 flex-shrink-0">{fmtTime(channel.lastMessageAt)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-xs text-[#8fa5b8] truncate max-w-[200px]">{channel.lastMessage || 'Sem mensagens'}</span>
                                                {(channel.unreadCount || 0) > 0 && (
                                                    <span className="ml-1 w-5 h-5 rounded-full bg-[#4a90d9] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                        {channel.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ VIEW: NEW DIRECT ════════════════════ */}
                    {supabaseOk && view === 'new-direct' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-3 pt-3 pb-2 flex-shrink-0">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa5b8]" />
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar servidor..."
                                        className="w-full bg-[#f0f4f8] border border-[#dde3ee] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1e2d40] placeholder:text-[#8fa5b8] focus:outline-none focus:border-[#4a90d9] transition-all" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {isLoading && <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#4a90d9]" /></div>}
                                {filteredProfiles.map(profile => (
                                    <button key={profile.id} onClick={() => handleOpenDirect(profile)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f0f4f8]">
                                        <Avatar name={profile.nome_completo} />
                                        <div>
                                            <p className="text-sm font-semibold text-[#0f1f30]">{profile.nome_completo}</p>
                                            <p className="text-xs text-[#8fa5b8]">{profile.cargo || 'Servidor'}</p>
                                        </div>
                                    </button>
                                ))}
                                {filteredProfiles.length === 0 && !isLoading && (
                                    <p className="text-xs text-center text-[#8fa5b8] py-8">Nenhum servidor encontrado.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ VIEW: NEW GROUP ══════════════════════ */}
                    {supabaseOk && view === 'new-group' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-3 flex-shrink-0 border-b border-[#dde3ee] space-y-2">
                                <input value={groupName} onChange={e => setGroupName(e.target.value)}
                                    placeholder="Nome do grupo..."
                                    className="w-full bg-[#f0f4f8] border border-[#dde3ee] rounded-xl px-3 py-2 text-sm text-[#1e2d40] placeholder:text-[#8fa5b8] focus:outline-none focus:border-[#4a90d9]" />
                                <p className="text-[10px] text-[#8fa5b8]">{selectedMembers.length} membro(s) selecionado(s)</p>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {profiles.filter(p => p.id !== userId).map(profile => {
                                    const selected = selectedMembers.includes(profile.id);
                                    return (
                                        <button key={profile.id}
                                            onClick={() => setSelectedMembers(prev => selected ? prev.filter(i => i !== profile.id) : [...prev, profile.id])}
                                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-[#f0f4f8] ${selected ? 'bg-[#eaf3fd]' : 'hover:bg-[#f8fafc]'}`}>
                                            <Avatar name={profile.nome_completo} />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#0f1f30]">{profile.nome_completo}</p>
                                                <p className="text-xs text-[#8fa5b8]">{profile.cargo || 'Servidor'}</p>
                                            </div>
                                            {selected && <Check size={16} className="text-[#4a90d9] flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="p-3 flex-shrink-0 border-t border-[#dde3ee]">
                                <button onClick={handleCreateGroup}
                                    disabled={!groupName.trim() || selectedMembers.length === 0 || isLoading}
                                    className="w-full py-2.5 bg-[#4a90d9] text-white text-sm font-bold rounded-xl hover:bg-[#3a7bc8] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                                    Criar Grupo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ══ VIEW: CHAT WINDOW ════════════════════ */}
                    {supabaseOk && view === 'chat' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f4f8]">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1" style={{ background: 'linear-gradient(180deg, #f0f4f8 0%, #eaf0f7 100%)' }}>
                                {isLoading && <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-[#4a90d9]" /></div>}
                                {!isLoading && messages.length === 0 && (
                                    <div className="text-center py-10 text-[#8fa5b8]">
                                        <MessageCircle size={36} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">Nenhuma mensagem ainda. Seja o primeiro!</p>
                                    </div>
                                )}

                                {msgGroups.map(group => (
                                    <div key={group.date}>
                                        {/* Date divider */}
                                        <div className="flex items-center gap-2 my-3">
                                            <div className="flex-1 h-px bg-[#dde3ee]" />
                                            <span className="text-[10px] font-semibold text-[#8fa5b8] bg-[#f0f4f8] px-2 py-0.5 rounded-full border border-[#dde3ee]">{group.date}</span>
                                            <div className="flex-1 h-px bg-[#dde3ee]" />
                                        </div>

                                        {group.msgs.map((msg, idx) => {
                                            const isMine = msg.sender_id === userId;
                                            const prevMsg = idx > 0 ? group.msgs[idx - 1] : null;
                                            const isFirst = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                            return (
                                                <div key={msg.id} className={`flex items-end gap-2 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                    {/* Avatar (only for first in sequence) */}
                                                    {!isMine && (
                                                        <div className="w-7 flex-shrink-0">
                                                            {isFirst ? <Avatar name={msg.sender_name} size="sm" /> : null}
                                                        </div>
                                                    )}
                                                    {/* Bubble */}
                                                    <div className={`max-w-[78%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                                        {!isMine && isFirst && (
                                                            <span className="text-[10px] font-bold text-[#4a90d9] mb-1 ml-1">{msg.sender_name}</span>
                                                        )}
                                                        <div
                                                            style={isMine ? { background: 'linear-gradient(135deg, #4a90d9, #2d6ab0)' } : { background: '#ffffff' }}
                                                            className={`px-3 py-2 rounded-2xl shadow-sm ${isMine ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-[#1e2d40] border border-[#dde3ee]'} ${isFirst && isMine ? 'rounded-tr-md' : ''} ${isFirst && !isMine ? 'rounded-tl-md' : ''}`}
                                                        >
                                                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                            <span className={`text-[9px] ${isMine ? 'text-[#8fa5b8]' : 'text-[#8fa5b8]'}`}>
                                                                {fmtTime(msg.created_at)}
                                                            </span>
                                                            {isMine && (
                                                                <ReadStatus msg={msg} memberCount={memberCount} currentUserId={userId} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="flex-shrink-0 p-3 bg-white border-t border-[#dde3ee]">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={newMsg}
                                        onChange={e => setNewMsg(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Mensagem... (Enter para enviar)"
                                        spellCheck
                                        lang="pt-BR"
                                        rows={1}
                                        style={{ maxHeight: '96px', resize: 'none' }}
                                        className="flex-1 bg-[#f0f4f8] border border-[#dde3ee] rounded-xl px-3 py-2 text-sm text-[#1e2d40] placeholder:text-[#8fa5b8] focus:outline-none focus:border-[#4a90d9] transition-all overflow-y-auto"
                                        onInput={(e) => {
                                            const el = e.currentTarget;
                                            el.style.height = 'auto';
                                            el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!newMsg.trim() || isSending}
                                        className="w-9 h-9 flex-shrink-0 bg-[#4a90d9] text-white rounded-xl flex items-center justify-center hover:bg-[#3a7bc8] disabled:opacity-40 transition-all active:scale-95"
                                    >
                                        {isSending
                                            ? <Loader2 size={15} className="animate-spin" />
                                            : <Send size={15} strokeWidth={2.5} />
                                        }
                                    </button>
                                </div>
                                <p className="text-[9px] text-[#8fa5b8] mt-1.5 text-right">Shift+Enter para nova linha</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Animation Keyframes ──────────────────────────── */}
            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
