/**
 * chatApi.ts — API de Chat em Tempo Real para o Dashboard SEURBH
 * Utiliza Supabase Realtime para sincronização instantânea de mensagens.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ChatProfile {
    id: string;
    nome_completo: string;
    cargo?: string;
    email?: string;
}

export interface ChatChannel {
    id: string;
    type: 'general' | 'private' | 'group';
    name: string | null;
    created_by: string | null;
    created_at: string;
    // Enriquecidos no cliente
    displayName?: string;
    memberIds?: string[];
    unreadCount?: number;
    lastMessage?: string;
    lastMessageAt?: string;
}

export interface ChatMessage {
    id: string;
    channel_id: string;
    sender_id: string;
    sender_name: string;
    sender_initials: string;
    content: string;
    read_by: string[];
    created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chatTable = (table: string) => (supabase as any).from(table);

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const fetchChatProfiles = async (): Promise<ChatProfile[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
        const { data } = await chatTable('profiles')
            .select('id, nome_completo, cargo, email');
        return data ?? [];
    } catch (_) { return []; }
};

// ─── Channels ─────────────────────────────────────────────────────────────────

export const fetchUserChannels = async (userId: string): Promise<ChatChannel[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
        // Canal geral
        const { data: general } = await chatTable('chat_channels')
            .select('*')
            .eq('type', 'general');

        // Canais onde o usuário é membro
        const { data: memberRows } = await chatTable('chat_channel_members')
            .select('channel_id')
            .eq('user_id', userId);

        const memberIds = (memberRows ?? []).map((r: { channel_id: string }) => r.channel_id);

        let memberChannels: ChatChannel[] = [];
        if (memberIds.length > 0) {
            const { data } = await chatTable('chat_channels')
                .select('*')
                .in('id', memberIds);
            memberChannels = data ?? [];
        }

        // Deduplica
        const all: ChatChannel[] = [...(general ?? []), ...memberChannels];
        return all.filter((ch, idx, arr) => arr.findIndex(c => c.id === ch.id) === idx);
    } catch (_) { return []; }
};

export const fetchChannelMemberIds = async (channelId: string): Promise<string[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
        const { data } = await chatTable('chat_channel_members')
            .select('user_id')
            .eq('channel_id', channelId);
        return (data ?? []).map((r: { user_id: string }) => r.user_id);
    } catch (_) { return []; }
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const fetchMessages = async (channelId: string, limit = 60): Promise<ChatMessage[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
        const { data } = await chatTable('chat_messages')
            .select('*')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return ((data ?? []) as ChatMessage[]).reverse();
    } catch (_) { return []; }
};

export const sendMessage = async (
    channelId: string,
    senderId: string,
    senderName: string,
    senderInitials: string,
    content: string
): Promise<ChatMessage | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
        const { data, error } = await chatTable('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: senderId,
                sender_name: senderName,
                sender_initials: senderInitials,
                content: content.trim(),
                read_by: [senderId],
            })
            .select()
            .single();
        if (error) throw error;
        return data as ChatMessage;
    } catch (e) {
        console.error('Erro ao enviar mensagem:', e);
        return null;
    }
};

export const markChannelAsRead = async (channelId: string, userId: string): Promise<void> => {
    if (!isSupabaseConfigured()) return;
    try {
        const { data: msgs } = await chatTable('chat_messages')
            .select('id, read_by')
            .eq('channel_id', channelId)
            .not('sender_id', 'eq', userId);

        if (!msgs) return;
        const unread = (msgs as { id: string; read_by: string[] }[])
            .filter(m => !m.read_by?.includes(userId));

        for (const msg of unread) {
            const newReadBy = [...(msg.read_by || []), userId];
            await chatTable('chat_messages')
                .update({ read_by: newReadBy })
                .eq('id', msg.id);
        }
    } catch (_) { /* silencia erros de leitura */ }
};

// ─── Create Channels ──────────────────────────────────────────────────────────

export const findOrCreatePrivateChannel = async (
    currentUserId: string,
    targetUserId: string
): Promise<ChatChannel | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
        // Busca canais privados onde o usuário atual é membro
        const { data: myRows } = await chatTable('chat_channel_members')
            .select('channel_id')
            .eq('user_id', currentUserId);
        const myChannelIds = (myRows ?? []).map((r: { channel_id: string }) => r.channel_id);

        if (myChannelIds.length > 0) {
            // Verifica se o target também é membro de algum desses canais (private)
            const { data: shared } = await chatTable('chat_channels')
                .select('id')
                .eq('type', 'private')
                .in('id', myChannelIds);

            for (const ch of (shared ?? [])) {
                const { data: members } = await chatTable('chat_channel_members')
                    .select('user_id')
                    .eq('channel_id', ch.id);
                const ids = (members ?? []).map((m: { user_id: string }) => m.user_id);
                if (ids.includes(targetUserId) && ids.includes(currentUserId)) {
                    // Canal já existe — retorna
                    const { data: existing } = await chatTable('chat_channels')
                        .select('*')
                        .eq('id', ch.id)
                        .single();
                    return existing as ChatChannel;
                }
            }
        }

        // Cria novo canal privado
        const { data: channel, error } = await chatTable('chat_channels')
            .insert({ type: 'private', created_by: currentUserId })
            .select()
            .single();
        if (error) throw error;

        await chatTable('chat_channel_members').insert([
            { channel_id: channel.id, user_id: currentUserId },
            { channel_id: channel.id, user_id: targetUserId },
        ]);
        return channel as ChatChannel;
    } catch (e) {
        console.error('Erro ao criar canal privado:', e);
        return null;
    }
};

export const createGroupChannel = async (
    name: string,
    creatorId: string,
    memberIds: string[]
): Promise<ChatChannel | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
        const { data: channel, error } = await chatTable('chat_channels')
            .insert({ type: 'group', name, created_by: creatorId })
            .select()
            .single();
        if (error) throw error;

        const unique = [...new Set([creatorId, ...memberIds])];
        await chatTable('chat_channel_members').insert(
            unique.map(uid => ({ channel_id: channel.id, user_id: uid }))
        );
        return channel as ChatChannel;
    } catch (e) {
        console.error('Erro ao criar grupo:', e);
        return null;
    }
};

// ─── Realtime Subscription ────────────────────────────────────────────────────

export const subscribeToChannel = (
    channelId: string,
    onInsert: (msg: ChatMessage) => void,
    onUpdate?: (msg: ChatMessage) => void
): (() => void) => {
    const sub = supabase
        .channel(`chat_room_${channelId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
            payload => onInsert(payload.new as ChatMessage)
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
            payload => onUpdate?.(payload.new as ChatMessage)
        )
        .subscribe();

    return () => { supabase.removeChannel(sub); };
};
