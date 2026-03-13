import { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    pageTitle: string;
    pageBreadcrumb?: string;
}

export function Header({ searchQuery, onSearchChange, pageTitle, pageBreadcrumb }: HeaderProps) {
    const [profileOpen, setProfileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-[#dde3ee] flex items-center gap-4 px-6 shadow-sm">
            {/* Page title */}
            <div className="flex-shrink-0 hidden sm:block">
                {pageBreadcrumb && (
                    <p className="text-[10px] text-[#8fa5b8] uppercase tracking-widest leading-none mb-0.5">{pageBreadcrumb}</p>
                )}
                <h1 className="text-sm font-bold text-[#1e2d40] leading-none">{pageTitle}</h1>
            </div>

            <div className="h-6 w-px bg-[#dde3ee] hidden sm:block" />

            {/* Search */}
            <div className="flex-1 relative max-w-xl">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa5b8] flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Buscar por SEI, requerente, assunto..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full bg-[#f0f4f8] border border-[#dde3ee] rounded-lg pl-9 pr-4 py-2 text-sm text-[#1e2d40] placeholder-[#8fa5b8] focus:outline-none focus:border-[#4a90d9] focus:bg-white focus:ring-1 focus:ring-[#4a90d9]/20"
                />
                {searchQuery && (
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8fa5b8] bg-white border border-[#dde3ee] rounded px-1.5 py-0.5">
                        ESC
                    </kbd>
                )}
            </div>

            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                {/* Notification bell */}
                <button className="relative p-2 rounded-lg text-[#8fa5b8] hover:text-[#4a90d9] hover:bg-[#f0f5ff]">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4a90d9] ring-2 ring-white" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#f0f5ff] group border border-transparent hover:border-[#dde3ee]"
                    >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a90d9] to-[#2a6ab5] flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-xs font-bold text-white">PM</span>
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-semibold text-[#1e2d40] leading-none">Patricia Melo</p>
                            <p className="text-[10px] text-[#8fa5b8] leading-tight mt-0.5">Arquiteta Urbanista</p>
                        </div>
                        <ChevronDown size={14} className={`text-[#8fa5b8] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#dde3ee] rounded-xl shadow-xl shadow-[#1e2d40]/10 z-20 overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#dde3ee] bg-[#f8fafc]">
                                    <p className="text-xs font-semibold text-[#1e2d40]">Patricia Melo</p>
                                    <p className="text-[10px] text-[#8fa5b8] truncate">patricia.melo@seurbh.gov.br</p>
                                </div>
                                <div className="p-1">
                                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#4a6075] hover:bg-[#f0f5ff] hover:text-[#1e2d40]">
                                        <User size={14} /> Meu Perfil
                                    </button>
                                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#4a6075] hover:bg-[#f0f5ff] hover:text-[#1e2d40]">
                                        <Settings size={14} /> Configurações
                                    </button>
                                    <div className="border-t border-[#dde3ee] mt-1 pt-1">
                                        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50">
                                            <LogOut size={14} /> Sair
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
