import { useState } from 'react';
import { X, User, Briefcase, Mail, FolderOpen, Tag } from 'lucide-react';
import type { TeamMember } from '../types';

interface NewMemberModalProps {
    onClose: () => void;
    onSave: (member: TeamMember) => void;
}

export function NewMemberModal({ onClose, onSave }: NewMemberModalProps) {
    const [form, setForm] = useState({
        nome: '',
        cargo: '',
        setor: '',
        email: '',
        driveFolder: '',
    });

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Formação do novo membro
        const newMember: TeamMember = {
            id: Date.now().toString(),
            nome: form.nome,
            cargo: form.cargo,
            setor: form.setor,
            email: form.email,
            processosSob: 0,
            ...(form.driveFolder ? { driveFolder: form.driveFolder } : {})
        };

        onSave(newMember);
        onClose();
    };

    const inputClass = "w-full bg-[#f8fafc] border border-[#dde3ee] rounded-lg px-3 py-2.5 text-sm text-[#1e2d40] placeholder-[#8fa5b8] focus:outline-none focus:border-[#4a90d9] focus:bg-white focus:ring-1 focus:ring-[#4a90d9]/20";
    const labelClass = "block text-xs font-semibold text-[#4a6075] uppercase tracking-wider mb-1.5";
    const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa5b8]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1e2d40]/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white border border-[#dde3ee] rounded-2xl shadow-2xl shadow-[#1e2d40]/15 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#dde3ee] bg-[#f8fafc] rounded-t-2xl">
                    <div>
                        <h2 className="text-base font-bold text-[#0f1f30]">Novo Membro da Equipe</h2>
                        <p className="text-xs text-[#8fa5b8] mt-0.5">Cadastre um novo perfil corporativo no painel</p>
                    </div>
                    <button title="Fechar" onClick={onClose} className="p-2 rounded-lg text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#eef2f7] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className={labelClass}>Nome Completo</label>
                        <div className="relative">
                            <User size={16} className={iconClass} />
                            <input
                                required
                                type="text"
                                placeholder="Ex: Maria Clara Silva"
                                value={form.nome}
                                onChange={(e) => update('nome', e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Cargo</label>
                            <div className="relative">
                                <Briefcase size={16} className={iconClass} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Arquiteta"
                                    value={form.cargo}
                                    onChange={(e) => update('cargo', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Setor</label>
                            <div className="relative">
                                <Tag size={16} className={iconClass} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Aprovação de Projetos"
                                    value={form.setor}
                                    onChange={(e) => update('setor', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>E-mail Corporativo</label>
                        <div className="relative">
                            <Mail size={16} className={iconClass} />
                            <input
                                required
                                type="email"
                                placeholder="maria.clara@seurbh.gov.br"
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Link da Pasta no Drive (Opcional)</label>
                        <div className="relative">
                            <FolderOpen size={16} className={iconClass} />
                            <input
                                type="url"
                                placeholder="https://drive.google.com/drive/folders/..."
                                value={form.driveFolder}
                                onChange={(e) => update('driveFolder', e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-[#eaeff7]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-[#647b91] hover:text-[#1e2d40] hover:bg-[#e8f3fd] rounded-lg transition-colors border border-transparent"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-bold text-white bg-[#4a90d9] hover:bg-[#3b7cbc] rounded-lg shadow-md shadow-[#4a90d9]/20 transition-all active:scale-[0.98]"
                        >
                            Criar Perfil
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
