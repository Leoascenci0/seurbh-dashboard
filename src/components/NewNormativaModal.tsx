import { useState } from 'react';
import { X, FileText, Calendar, Tag, AlertTriangle, Scroll, ChevronDown } from 'lucide-react';
import { UploadZone } from './UploadZone';
import type { NormativaItem } from '../types';
import { useNormativas } from '../context/NormativasContext';

interface NewNormativaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const tipos = [
    'Lei',
    'Decreto',
    'Portaria',
    'Resolução',
    'Regulamentação',
    'Orientação',
    'Parecer',
];

export function NewNormativaModal({ isOpen, onClose }: NewNormativaModalProps) {
    const { addNormativa } = useNormativas();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [form, setForm] = useState({
        tipo: 'Lei' as NormativaItem['tipo'],
        numero: '',
        titulo: '',
        data: new Date().toISOString().split('T')[0],
        ementa: '',
    });

    if (!isOpen) return null;

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.numero.trim() || !form.titulo.trim() || !form.ementa.trim()) {
            setValidationError('Preencha os campos obrigatórios: Número, Título e Ementa.');
            setStep(1);
            return;
        }
        setValidationError(null);

        setIsLoading(true);
        try {
            const result = await addNormativa(form);
            if (result.success) {
                onClose();
                setStep(1);
                setForm({
                    tipo: 'Lei',
                    numero: '',
                    titulo: '',
                    data: new Date().toISOString().split('T')[0],
                    ementa: '',
                });
            } else {
                setValidationError(result.error || 'Erro ao salvar normativa na planilha.');
            }
        } catch (error) {
            console.error(error);
            setValidationError('Erro técnico ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-[#f8fafc] border border-[#dde3ee] rounded-lg px-3 py-2.5 text-sm text-[#1e2d40] placeholder-[#8fa5b8] focus:outline-none focus:border-[#4a90d9] focus:bg-white focus:ring-1 focus:ring-[#4a90d9]/20";
    const labelClass = "block text-xs font-semibold text-[#4a6075] uppercase tracking-wider mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1e2d40]/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white border border-[#dde3ee] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#dde3ee] bg-[#f8fafc] flex-shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-[#0f1f30]">Cadastrar Nova Normativa</h2>
                        <p className="text-xs text-[#8fa5b8] mt-0.5">Organização automática por tipo no Drive</p>
                    </div>
                    <button onClick={onClose} title="Fechar" className="p-2 rounded-lg text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#eef2f7]">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-2 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                        {[1, 2].map(s => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                  ${step === s ? 'bg-[#4a90d9] text-white' : step > s ? 'bg-green-500 text-white' : 'bg-[#eef2f7] text-[#8fa5b8]'}`}>
                                    {step > s ? '✓' : s}
                                </div>
                                <span className={`text-xs ${step === s ? 'text-[#4a90d9] font-semibold' : 'text-[#8fa5b8]'}`}>
                                    {s === 1 ? 'Dados da Norma' : 'Documento PDF'}
                                </span>
                                {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-green-400' : 'bg-[#dde3ee]'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
                    {validationError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle size={14} />
                            {validationError}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}><Tag size={12} className="inline mr-1" />Tipo</label>
                                    <div className="relative">
                                        <select
                                            title="Tipo de Normativa"
                                            className={`${inputClass} appearance-none pr-8`}
                                            value={form.tipo}
                                            onChange={e => update('tipo', e.target.value)}
                                        >
                                            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}><Scroll size={12} className="inline mr-1" />Número</label>
                                    <input className={inputClass} placeholder="Ex: 7.786/2001" value={form.numero} onChange={e => update('numero', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="norma-titulo" className={labelClass}><FileText size={12} className="inline mr-1" />Título</label>
                                    <input id="norma-titulo" className={inputClass} placeholder="Ex: Plano Diretor Municipal" value={form.titulo} onChange={e => update('titulo', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}><Calendar size={12} className="inline mr-1" />Data da Publicação</label>
                                    <input type="date" className={inputClass} value={form.data} onChange={e => update('data', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Ementa / Descrição Curta</label>
                                    <textarea className={`${inputClass} resize-none h-24`} placeholder="Resumo do que trata a norma..." value={form.ementa} onChange={e => update('ementa', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                    O arquivo será enviado para a pasta <strong>{form.tipo}s</strong> no Drive sob o nome <strong>{form.numero || 'Anexo'}</strong>.
                                </p>
                            </div>
                            <UploadZone seiNumber={form.numero || 'normativa'} />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#dde3ee] flex items-center justify-between flex-shrink-0 bg-[#f8fafc]">
                    <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                        className="px-4 py-2 rounded-lg text-sm text-[#4a6075] border border-[#dde3ee]">
                        {step === 1 ? 'Cancelar' : 'Voltar'}
                    </button>
                    <button
                        onClick={() => step < 2 ? setStep(s => s + 1) : handleSubmit()}
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#4a90d9] text-white disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? 'Salvando...' : step === 2 ? 'Finalizar Cadastro' : 'Avançar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
