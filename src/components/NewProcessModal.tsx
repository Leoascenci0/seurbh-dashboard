import { useState } from 'react';
import { X, FileDigit, User, MapPin, Tag, AlertTriangle, ChevronDown, PenLine } from 'lucide-react';
import { UploadZone } from './UploadZone';
import type { ProcessCategory, ProcessStatus } from '../types';
import { saveProcesso, createDriveFolder } from '../data/sheetsApi';
import { useProcessos } from '../context/ProcessosContext';
import { useConfig } from '../context/ConfigContext';

interface NewProcessModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

// Categorias globais providas pelo ConfigContext agora.

const technicians = [
    'Arq. Patricia Melo',
    'Eng. Ricardo Souza',
    'Arq. Felipe Andrade',
    'Arq. Camila Torres',
];

const glebas = [
    'Gleba Patrimônio Iguatemi',
    'Gleba Patrimônio Maringá',
    'Gleba Patrimônio Paissandu',
    'Gleba Patrimônio Sarandi',
    'Gleba Ribeirão Atlantique',
    'Gleba Ribeirão Caixias',
    'Gleba Ribeirão Centenário',
    'Gleba Ribeirão Chapecó',
    'Gleba Ribeirão Colombo',
    'Gleba Ribeirão Maringá',
    'Gleba Ribeirão Morangueiro',
    'Gleba Ribeirão Paissandu',
    'Gleba Ribeirão Pinguim',
    'Gleba Ribeirão Sarandi',
];

export function NewProcessModal({ onClose, onSuccess }: NewProcessModalProps) {
    const { getActiveSheetsUrl, getTargetSheetUrl, driveRootFolderId, customCategories, addCategory } = useConfig();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string>('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [form, setForm] = useState({
        seiNumber: '',
        requerente: '',
        cadastro: '',
        lote: '',
        gleba: '',
        assunto: '',
        category: '' as ProcessCategory | '',
        status: 'Em Análise' as ProcessStatus,
        responsavel: '',
        endereco: '',
        prioridade: 'Normal' as 'Alta' | 'Normal' | 'Baixa',
    });

    const update = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };
    const { refreshProcessos } = useProcessos();

    const handleSubmit = async () => {
        if (!form.seiNumber.trim() || !form.requerente.trim() || !form.category) {
            setValidationError('Preencha os campos obrigatórios: Número do Processo, Requerente e Categoria.');
            setStep(1);
            return;
        }
        setValidationError(null);

        setIsLoading(true);
        try {
            // Se houver ID raiz do drive, criar a subpasta automaticamente
            let newDriveLink = '';
            if (driveRootFolderId && getActiveSheetsUrl()) {
                setFeedbackMessage('Criando pasta no Google Drive...');
                try {
                    const reqFolderName = form.requerente.split(' ')[0] || form.requerente;
                    const folderName = `${form.seiNumber} - ${reqFolderName}`;
                    const driveRes = await createDriveFolder(folderName, driveRootFolderId, getActiveSheetsUrl());
                    newDriveLink = driveRes.folderUrl;
                } catch (e) {
                    console.error("Falha ao criar pasta, prosseguindo sem ela", e);
                }
            }

            setFeedbackMessage('Salvando Processo...');

            const success = await saveProcesso({
                CADASTRO: form.cadastro,
                LOTE: form.lote,
                GLEBA: form.gleba,
                REQUERENTE: form.requerente,
                'N° DO PROCESSO': form.seiNumber,
                'DATA DE ABERTURA': new Date().toISOString().split('T')[0],
                'TIPO DE PROCESSO': form.assunto,
                SETOR: form.category as ProcessCategory,
                SITUAÇÃO: form.status,
                'ANALISTA / DESENHISTA': form.responsavel,
                OBSERVAÇÃO: form.endereco,
                'Link do Drive': newDriveLink, // Nova propriedade!
                'DRIVE_ROOT_ID': driveRootFolderId || ''
            }, getActiveSheetsUrl(), getTargetSheetUrl());

            if (success) {
                await refreshProcessos();
                onSuccess();
                onClose();
            } else {
                setValidationError('Erro ao salvar. Verifique a API de Planilhas.');
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

            <div className="relative w-full max-w-2xl bg-white border border-[#dde3ee] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#dde3ee] bg-[#f8fafc] flex-shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-[#0f1f30]">Novo Processo SEI</h2>
                        <p className="text-xs text-[#8fa5b8] mt-0.5">Fase final de implantação com validação real</p>
                    </div>
                    <button onClick={onClose} title="Fechar" className="p-2 rounded-lg text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#eef2f7]">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-2 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                  ${step === s ? 'bg-[#4a90d9] text-white' : step > s ? 'bg-green-500 text-white' : 'bg-[#eef2f7] text-[#8fa5b8]'}`}>
                                    {step > s ? '✓' : s}
                                </div>
                                <span className={`text-xs ${step === s ? 'text-[#4a90d9] font-semibold' : 'text-[#8fa5b8]'}`}>
                                    {s === 1 ? 'Dados' : s === 2 ? 'Classificação' : 'Documentos'}
                                </span>
                                {s < 3 && <div className={`flex-1 h-px w-8 ${step > s ? 'bg-green-400' : 'bg-[#dde3ee]'}`} />}
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
                                <div className="col-span-2">
                                    <label className={labelClass}><FileDigit size={12} className="inline mr-1" />Número do Processo</label>
                                    <input className={inputClass} placeholder="Ex: 17.523.001234-7 ou Processo SEI" value={form.seiNumber} onChange={e => update('seiNumber', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}><User size={12} className="inline mr-1" />Requerente</label>
                                    <input className={inputClass} placeholder="Nome ou Razão Social" value={form.requerente} onChange={e => update('requerente', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Cadastro do Lote</label>
                                    <input className={inputClass} placeholder="XXXXX-XX-XX" value={form.cadastro} onChange={e => update('cadastro', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Lote</label>
                                    <input className={inputClass} placeholder="Digite o lote" value={form.lote} onChange={e => update('lote', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Gleba</label>
                                    <div className="relative">
                                        <select title="Gleba" className={`${inputClass} appearance-none pr-8`} value={form.gleba} onChange={e => update('gleba', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {glebas.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Assunto / Objeto</label>
                                    <textarea className={`${inputClass} resize-none h-20`} placeholder="Objeto do processo..." value={form.assunto} onChange={e => update('assunto', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}><MapPin size={12} className="inline mr-1" />Endereço</label>
                                    <input className={inputClass} placeholder="Endereço Completo" value={form.endereco} onChange={e => update('endereco', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}><Tag size={12} className="inline mr-1" />Categoria</label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <select title="Categoria" className={`${inputClass} appearance-none pr-8`} value={form.category} onChange={e => update('category', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" />
                                    </div>
                                    <button
                                        type="button"
                                        title="Adicionar nova categoria"
                                        onClick={() => {
                                            const newCat = window.prompt("Digite o nome da nova categoria:");
                                            if (newCat && newCat.trim() !== '') {
                                                addCategory(newCat);
                                                update('category', newCat.trim());
                                            }
                                        }}
                                        className="p-2.5 rounded-lg border border-[#dde3ee] bg-[#f8fafc] text-[#4a90d9] hover:bg-[#eef2f7] transition-all"
                                    >
                                        <PenLine size={16} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Analista Responsável</label>
                                <div className="relative">
                                    <select title="Responsável" className={`${inputClass} appearance-none pr-8`} value={form.responsavel} onChange={e => update('responsavel', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Prioridade</label>
                                <div className="flex gap-2">
                                    {(['Alta', 'Normal', 'Baixa'] as const).map(p => (
                                        <button key={p} onClick={() => update('prioridade', p)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all
                                            ${form.prioridade === p ? 'bg-[#e8f3fd] border-[#4a90d9] text-[#4a90d9]' : 'border-[#dde3ee] text-[#8fa5b8]'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <UploadZone seiNumber={form.seiNumber} />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#dde3ee] flex items-center justify-between flex-shrink-0 bg-[#f8fafc]">
                    <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                        className="px-4 py-2 rounded-lg text-sm text-[#4a6075] border border-[#dde3ee]">
                        {step === 1 ? 'Cancelar' : 'Voltar'}
                    </button>
                    <button
                        onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#4a90d9] text-white disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (feedbackMessage || 'Salvando...') : step === 3 ? 'Finalizar' : 'Próximo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
