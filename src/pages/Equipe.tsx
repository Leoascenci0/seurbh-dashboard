import { useState } from 'react';
import { ExternalLink, FolderOpen, Mail, Briefcase, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { mockTeam } from '../data/mockData';
import type { TeamMember } from '../types';
import { NewMemberModal } from '../components/NewMemberModal';

function getInitials(nome: string) {
    if (!nome) return '?';
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const avatarGradients = [
    'from-[#4a90d9] to-[#2a6ab5]',
    'from-amber-400 to-amber-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
];

export function Equipe() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeam);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleAddMember = (member: TeamMember) => {
        setTeamMembers(prev => [member, ...prev]);
    };

    const handleDeleteMember = (id: string) => {
        setTeamMembers(prev => prev.filter(m => m.id !== id));
        setOpenMenuId(null);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#0f1f30]">Diretório Corporativo</h2>
                    <p className="text-sm text-[#8fa5b8] mt-1">Gerencie os membros da equipe SEURBH e seus respectivos acessos</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#4a90d9] hover:bg-[#3b7cbc] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#4a90d9]/20 active:scale-[0.98]"
                >
                    <Plus size={18} />
                    <span>Novo Membro</span>
                </button>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teamMembers.map((member, idx) => (
                    <div key={member.id}
                        className="bg-white border border-[#dde3ee] rounded-2xl p-5 hover:border-[#4a90d9]/40 hover:shadow-lg transition-all shadow-sm group relative">

                        {/* Kebab Menu */}
                        <div className="absolute top-4 right-4">
                            <button
                                aria-label="Ações do Membro"
                                title="Ações"
                                onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                className="p-1.5 text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#f8fafc] rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                            >
                                <MoreVertical size={16} />
                            </button>

                            {openMenuId === member.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white border border-[#dde3ee] shadow-lg rounded-xl z-10 py-1 overflow-hidden">
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Remover
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start gap-4 pr-6">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradients[idx % 4]} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                <span className="text-lg font-bold text-white">{getInitials(member.nome)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-[#0f1f30] truncate" title={member.nome}>{member.nome}</h3>
                                <p className="text-sm text-[#4a90d9] font-semibold mt-0.5">{member.cargo}</p>
                                <div className="flex items-center gap-1.5 mt-2 bg-[#f8fafc] inline-flex px-2 py-1 rounded-md border border-[#eaeff7]">
                                    <Briefcase size={12} className="text-[#8fa5b8]" />
                                    <span className="text-xs font-medium text-[#647b91] truncate max-w-[150px]" title={member.setor}>{member.setor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="mt-5 pt-4 border-t border-[#f0f4f8] flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <a href={`mailto:${member.email}`}
                                    className="flex items-center gap-2 text-xs font-medium text-[#8fa5b8] hover:text-[#4a90d9] transition-colors truncate max-w-[60%]">
                                    <Mail size={14} className="flex-shrink-0" /> <span className="truncate">{member.email}</span>
                                </a>
                                <div className="text-right">
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-lg font-bold text-[#4a90d9] leading-none">{member.processosSob}</span>
                                        <span className="text-[10px] font-bold text-[#8fa5b8] uppercase tracking-wider">proc.</span>
                                    </div>
                                </div>
                            </div>

                            {member.driveFolder && (
                                <a href={member.driveFolder} target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f8fafc] text-sm text-[#4a90d9] hover:bg-[#e8f3fd] font-semibold transition-colors border border-[#eaeff7] hover:border-[#c5dff5]">
                                    <FolderOpen size={16} />
                                    Acessar Pasta no Drive
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {isModalOpen && (
                <NewMemberModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddMember}
                />
            )}
        </div>
    );
}
