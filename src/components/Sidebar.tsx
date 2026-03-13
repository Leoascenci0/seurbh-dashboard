import { useState } from 'react';
import {
    LayoutDashboard,
    MapPin,
    FileText,
    Users,
    FolderOpen,
    LayoutTemplate,
    Info,
    ChevronRight,
    Building2,
    ChevronDown,
    X,
    Menu,
    Settings,
} from 'lucide-react';
import { DriveConfigModal } from './DriveConfigModal';
import clsx from 'clsx';

interface NavItem {
    id: string;
    label: string;
    code: string;
    icon: React.ReactNode;
    subItems?: { id: string; label: string }[];
}

const navItems: NavItem[] = [
    {
        id: 'dados-cidade',
        label: 'Dados Cidade',
        code: '00',
        icon: <MapPin size={18} />,
    },
    {
        id: 'normativas',
        label: 'Normativas',
        code: '01',
        icon: <FileText size={18} />,
        subItems: [
            { id: 'leis', label: 'Leis' },
            { id: 'decretos', label: 'Decretos' },
            { id: 'portarias', label: 'Portarias' },
            { id: 'resolucoes', label: 'Resoluções' },
            { id: 'regulamentacoes', label: 'Regulamentações' },
            { id: 'orientacoes', label: 'Orientações' },
            { id: 'pareceres', label: 'Pareceres' },
        ],
    },
    {
        id: 'equipe',
        label: 'Equipe',
        code: '02',
        icon: <Users size={18} />,
    },
    {
        id: 'processos-sei',
        label: 'Processos SEI',
        code: '03',
        icon: <FolderOpen size={18} />,
    },
    {
        id: 'modelos',
        label: 'Modelos',
        code: '04',
        icon: <LayoutTemplate size={18} />,
        subItems: [
            { id: 'pranchas', label: 'Pranchas' },
            { id: 'documentos', label: 'Documentos' },
            { id: 'templates', label: 'Templates' },
        ],
    },
    {
        id: 'informacoes',
        label: 'Informações Gerais',
        code: '05',
        icon: <Info size={18} />,
    },
];

interface SidebarProps {
    activeSection: string;
    onSectionChange: (id: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
        'processos-sei': true,
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [configModalOpen, setConfigModalOpen] = useState(false);

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelect = (id: string) => {
        onSectionChange(id);
        setMobileOpen(false);
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-[#dde3ee]">
                <div className="w-9 h-9 rounded-lg bg-[#4a90d9] flex items-center justify-center shadow-md shadow-[#4a90d9]/30">
                    <Building2 size={20} className="text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-[#4a90d9] tracking-widest uppercase leading-none">SEURBH</p>
                    <p className="text-[10px] text-[#8fa5b8] leading-tight mt-0.5">Sistema de Gestão</p>
                </div>
            </div>

            {/* Nav label */}
            <div className="px-5 pt-5 pb-2">
                <p className="text-[10px] font-semibold text-[#8fa5b8] tracking-widest uppercase">Navegação</p>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
                {navItems.map(item => {
                    const isActive = activeSection === item.id || activeSection.startsWith(item.id + '-');
                    const isExpanded = expandedItems[item.id];

                    return (
                        <div key={item.id} className="mb-1">
                            <button
                                onClick={() => {
                                    if (item.subItems) {
                                        toggleExpanded(item.id);
                                        if (!isExpanded) handleSelect(item.id);
                                    } else {
                                        handleSelect(item.id);
                                    }
                                }}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium group',
                                    isActive
                                        ? 'bg-[#e8f3fd] text-[#4a90d9] border border-[#c5dff5]'
                                        : 'text-[#4a6075] hover:bg-[#f0f5ff] hover:text-[#1e2d40]'
                                )}
                            >
                                <span className={clsx('flex-shrink-0', isActive ? 'text-[#4a90d9]' : 'text-[#8fa5b8] group-hover:text-[#4a90d9]')}>
                                    {item.icon}
                                </span>
                                <span className="flex-1 text-left">
                                    <span className="text-[10px] font-bold opacity-50 mr-1">{item.code}_</span>
                                    {item.label}
                                </span>
                                {item.subItems && (
                                    <ChevronDown
                                        size={14}
                                        className={clsx('flex-shrink-0 transition-transform duration-200', isExpanded && 'rotate-180')}
                                    />
                                )}
                            </button>

                            {/* Sub Items */}
                            {item.subItems && isExpanded && (
                                <div className="ml-4 mt-1 border-l border-[#dde3ee] pl-3 space-y-0.5">
                                    {item.subItems.map(sub => {
                                        const subId = `${item.id}-${sub.id}`;
                                        const isSubActive = activeSection === subId;
                                        return (
                                            <button
                                                key={sub.id}
                                                onClick={() => handleSelect(subId)}
                                                className={clsx(
                                                    'w-full text-left px-3 py-2 rounded-md text-xs font-medium',
                                                    isSubActive
                                                        ? 'text-[#4a90d9] bg-[#e8f3fd]'
                                                        : 'text-[#64748b] hover:text-[#1e2d40] hover:bg-[#f0f5ff]'
                                                )}
                                            >
                                                <ChevronRight size={10} className="inline mr-1.5 opacity-40" />
                                                {sub.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Dashboard link at bottom */}
            <div className="px-3 pb-4 border-t border-[#dde3ee] pt-3">
                <button
                    onClick={() => handleSelect('dashboard')}
                    className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                        activeSection === 'dashboard'
                            ? 'bg-[#e8f3fd] text-[#4a90d9] border border-[#c5dff5]'
                            : 'text-[#4a6075] hover:bg-[#f0f5ff] hover:text-[#1e2d40]'
                    )}
                >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </button>
            </div>

            {/* Config & Settings */}
            <div className="px-3 pb-4 space-y-1">
                <button
                    onClick={() => setConfigModalOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#4a6075] hover:bg-[#f0f5ff] hover:text-[#1e2d40] border border-transparent transition-all"
                >
                    <Settings size={18} />
                    <span>Configurações</span>
                </button>
            </div>

            <DriveConfigModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} />
        </div>
    );

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white text-[#4a90d9] shadow-md border border-[#dde3ee]"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Desktop sidebar */}
            <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-[#dde3ee] z-40 hidden lg:block shadow-sm">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 h-full w-64 bg-white border-r border-[#dde3ee] z-50 lg:hidden shadow-xl',
                    'transform transition-transform duration-300',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
