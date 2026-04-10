import { useState } from 'react';
import {
    ChevronDown,
    Info,
    FileText,
    Users,
    MapPin,
    ArrowRight,
    CheckCircle2,
    X,
    AlertCircle,
    PenLine,
    Scissors,
    Merge,
    LayoutGrid,
    CopySlash,
    HelpCircle,
    ClipboardList,
    Check,
    Hash,
    ChevronRight,
    Upload,
    User,
    Building2,
    Star,
    AlertTriangle,
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { CategoryManagerModal } from './CategoryManagerModal';
import { UploadZone } from './UploadZone';
import { saveProcesso, createDriveFolder } from '../data/sheetsApi';
import { useProcessos } from '../context/ProcessosContext';
import type { ProcessStatus } from '../types';

interface DynamicProcessFormProps {
    onClose?: () => void;
    onSuccess?: () => void;
}

interface FormInputs {
    // Identificação
    seiNumber: string;
    requerente: string;
    // Localização
    cadastro: string;
    lote: string;
    gleba: string;
    endereco: string;
    // Categoria/tipo
    categoria: string;
    // Campos específicos por categoria
    tipoDesmembramento: string;
    justificativaLei: string;
    tipoRemembramento: string;
    cadastroChave: string;
    assuntoProcesso: string;
    nomeLoteamento: string;
    // Classificação
    status: ProcessStatus;
    responsavel: string;
    prioridade: 'Alta' | 'Normal' | 'Baixa';
}

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

const technicians = [
    'Arq. Patricia Melo',
    'Eng. Ricardo Souza',
    'Arq. Felipe Andrade',
    'Arq. Camila Torres',
];

const categoryCards = [
    {
        id: 'Loteamentos e Condomínios',
        icon: LayoutGrid,
        label: 'Loteamentos e Condomínios',
        description: 'Aprovação de novos empreendimentos, reserva de nome, viabilidade, LPCG e fases de implantação.',
        color: '#4a90d9',
        bg: '#eaf3fd',
        border: '#b3d4f5',
    },
    {
        id: 'Desmembramento',
        icon: Scissors,
        label: 'Desmembramento',
        description: 'Subdivisão de imóvel com aproveitamento de vias existentes, sem a abertura de novas.',
        color: '#f59e0b',
        bg: '#fef9ee',
        border: '#fcd89a',
    },
    {
        id: 'Remembramento',
        icon: Merge,
        label: 'Remembramento',
        description: 'Unificação de dois ou mais lotes em uma única matrícula imobiliária.',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#6ee7b7',
    },
    {
        id: 'Desdobro',
        icon: CopySlash,
        label: 'Desdobro',
        description: 'Divisão de lote em partes, sem abertura de novas vias, com acesso às já existentes.',
        color: '#8b5cf6',
        bg: '#f5f3ff',
        border: '#c4b5fd',
    },
];

// ── Componentes auxiliares ──────────────────────────────────

function Tooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="text-[#8fa5b8] hover:text-[#4a90d9] transition-colors ml-1 align-middle"
                tabIndex={-1}
            >
                <HelpCircle size={13} />
            </button>
            {show && (
                <span
                    style={{ animation: 'fadeInUp 0.15s ease-out' }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#1e2d40] text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 z-50 pointer-events-none shadow-xl"
                >
                    {text}
                    <span className="block w-2 h-2 bg-[#1e2d40] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                </span>
            )}
        </span>
    );
}

function ProgressBar({ step }: { step: number }) {
    const steps = [
        { num: 1, label: 'Tipo' },
        { num: 2, label: 'Identificação' },
        { num: 3, label: 'Localização' },
        { num: 4, label: 'Classificação' },
        { num: 5, label: 'Documentos' },
    ];
    return (
        <div className="px-6 py-4 border-b border-[#dde3ee] bg-white">
            <div className="flex items-center">
                {steps.map((s, i) => (
                    <div key={s.num} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div
                                style={{
                                    transition: 'all 0.3s ease',
                                    background: step > s.num ? '#10b981' : step === s.num ? '#4a90d9' : '#e2e8f0',
                                    color: step >= s.num ? 'white' : '#94a3b8',
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
                            >
                                {step > s.num ? <Check size={11} /> : s.num}
                            </div>
                            <span
                                style={{ transition: 'color 0.3s' }}
                                className={`text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                                    step === s.num ? 'text-[#4a90d9]' : step > s.num ? 'text-[#10b981]' : 'text-[#94a3b8]'
                                }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="flex-1 mx-2 mb-4">
                                <div className="h-[2px] rounded-full bg-[#e2e8f0] overflow-hidden">
                                    <div
                                        style={{
                                            width: step > s.num ? '100%' : '0%',
                                            transition: 'width 0.4s ease',
                                            background: 'linear-gradient(90deg, #4a90d9, #10b981)',
                                        }}
                                        className="h-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Step 1: Seleção por Cards ────────────────────────────────

function StepTipo({ selected, onSelect }: { selected: string; onSelect: (cat: string) => void }) {
    return (
        <div style={{ animation: 'fadeInUp 0.25s ease-out' }} className="space-y-3">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-[#0f1f30]">Qual é o tipo de processo?</h3>
                <p className="text-xs text-[#8fa5b8] mt-0.5">Selecione a categoria para prosseguir com o cadastro.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {categoryCards.map((card) => {
                    const Icon = card.icon;
                    const isSelected = selected === card.id;
                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => onSelect(card.id)}
                            style={{
                                borderColor: isSelected ? card.color : '#dde3ee',
                                background: isSelected ? card.bg : '#f8fafc',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? `0 0 0 3px ${card.color}22` : 'none',
                            }}
                            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left group hover:border-[#b0c4de] active:scale-[0.99]"
                        >
                            <div
                                style={{ background: isSelected ? card.color : '#e2e8f0', transition: 'background 0.2s' }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            >
                                <Icon size={20} color={isSelected ? 'white' : '#64748b'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div style={{ color: isSelected ? card.color : '#1e2d40', transition: 'color 0.2s' }} className="text-sm font-bold">
                                    {card.label}
                                </div>
                                <div className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{card.description}</div>
                            </div>
                            <div
                                style={{
                                    background: isSelected ? card.color : 'transparent',
                                    borderColor: isSelected ? card.color : '#dde3ee',
                                    transition: 'all 0.2s',
                                }}
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            >
                                {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Step 2: Identificação ───────────────────────────────────

function StepIdentificacao({
    form, errors, update, categoria, customAssuntos, setIsAssuntosModalOpen,
}: {
    form: FormInputs;
    errors: Partial<Record<keyof FormInputs, string>>;
    update: (f: keyof FormInputs, v: string) => void;
    categoria: string;
    customAssuntos: string[];
    setIsAssuntosModalOpen: (v: boolean) => void;
}) {
    const catInfo = categoryCards.find(c => c.id === categoria);
    const labelStyle = 'block text-[10px] font-bold uppercase tracking-wider text-[#4a6075] mb-1.5 flex items-center gap-1';

    const inputClass = (field: keyof FormInputs) => {
        const base = 'w-full bg-[#f8fafc] border rounded-lg px-4 py-2.5 text-sm text-[#1e2d40] placeholder:text-[#8fa5b8] focus:outline-none transition-all';
        if (errors[field]) return `${base} border-red-300 focus:border-red-400 bg-red-50/30`;
        const val = form[field];
        if (val && String(val).trim()) return `${base} border-green-300 focus:border-green-400`;
        return `${base} border-[#dde3ee] focus:border-[#4a90d9] focus:bg-white`;
    };

    const selectClass = (field: keyof FormInputs) => {
        const base = 'w-full bg-[#f8fafc] border rounded-lg px-4 py-2.5 text-sm text-[#1e2d40] focus:outline-none appearance-none cursor-pointer transition-all';
        if (errors[field]) return `${base} border-red-300`;
        const val = form[field];
        if (val && String(val).trim()) return `${base} border-green-300`;
        return `${base} border-[#dde3ee] focus:border-[#4a90d9]`;
    };

    const FieldStatus = ({ field }: { field: keyof FormInputs }) => {
        const val = form[field];
        if (errors[field]) return <AlertCircle size={14} className="text-red-400 flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;
        if (val && String(val).trim()) return <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;
        return null;
    };

    return (
        <div style={{ animation: 'fadeInUp 0.25s ease-out' }} className="space-y-5">
            {catInfo && (
                <div style={{ background: catInfo.bg, border: `1px solid ${catInfo.border}`, color: catInfo.color }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    <catInfo.icon size={15} />
                    {catInfo.label}
                    <span style={{ color: catInfo.color + '99' }} className="ml-auto text-[10px] font-normal">Tipo selecionado</span>
                </div>
            )}

            {/* Nº SEI */}
            <div>
                <label className={labelStyle}>
                    <Hash size={11} />
                    Número do Processo SEI
                    <Tooltip text="Número único do processo no sistema SEI. Ex: 17.523.000123-0. Pode ser deixado em branco se ainda não gerado." />
                </label>
                <div className="relative">
                    <input value={form.seiNumber} onChange={e => update('seiNumber', e.target.value)}
                        className={inputClass('seiNumber')} placeholder="Ex: 17.523.000123-0" />
                    <FieldStatus field="seiNumber" />
                </div>
                {errors.seiNumber && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.seiNumber}</p>}
            </div>

            {/* Requerente */}
            <div>
                <label className={labelStyle}><User size={11} />Requerente / Proprietário *
                    <Tooltip text="Nome completo da pessoa física ou razão social da empresa requerente." />
                </label>
                <div className="relative">
                    <input value={form.requerente} onChange={e => update('requerente', e.target.value)}
                        className={inputClass('requerente')} placeholder="Nome ou razão social" />
                    <FieldStatus field="requerente" />
                </div>
                {errors.requerente && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.requerente}</p>}
            </div>

            {/* Campos específicos por categoria */}
            {categoria === 'Desmembramento' && (
                <div style={{ background: '#fef9ee', borderColor: '#fcd89a', animation: 'fadeInUp 0.25s ease-out' }}
                    className="p-5 rounded-xl border space-y-4">
                    <div className="flex items-center gap-2 text-[#f59e0b] text-xs font-bold uppercase tracking-wide">
                        <Scissors size={13} />Detalhes do Desmembramento
                    </div>
                    <div>
                        <label className={labelStyle}>Tipo de Desmembramento</label>
                        <div className="relative">
                            <select title="Tipo" value={form.tipoDesmembramento} onChange={e => update('tipoDesmembramento', e.target.value)} className={selectClass('tipoDesmembramento')}>
                                <option value="Subdivisão">Subdivisão</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                        </div>
                    </div>
                    <div>
                        <label className={labelStyle}>
                            Justificativa / Lei Aplicável
                            <Tooltip text="Especifique as condições legais. Ex: LC 1104/2017." />
                        </label>
                        <textarea value={form.justificativaLei} onChange={e => update('justificativaLei', e.target.value)}
                            rows={3} className={`${inputClass('justificativaLei')} resize-none`}
                            placeholder="Ex: LC 1104/2017 — subdivisão conforme art. 5º..." />
                        {errors.justificativaLei && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.justificativaLei}</p>}
                    </div>
                </div>
            )}

            {categoria === 'Remembramento' && (
                <div style={{ background: '#ecfdf5', borderColor: '#6ee7b7', animation: 'fadeInUp 0.25s ease-out' }}
                    className="p-5 rounded-xl border space-y-4">
                    <div className="flex items-center gap-2 text-[#10b981] text-xs font-bold uppercase tracking-wide">
                        <Merge size={13} />Detalhes do Remembramento
                    </div>
                    <div>
                        <label className={labelStyle}>Tipo de Remembramento</label>
                        <div className="relative">
                            <select title="Tipo" value={form.tipoRemembramento} onChange={e => update('tipoRemembramento', e.target.value)} className={selectClass('tipoRemembramento')}>
                                <option value="Unificação">Unificação</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                        </div>
                    </div>
                </div>
            )}

            {categoria === 'Loteamentos e Condomínios' && (
                <div style={{ animation: 'fadeInUp 0.25s ease-out' }} className="space-y-4">
                    <div style={{ borderLeft: '3px solid #4a90d9' }} className="pl-4 pr-5 py-4 bg-[#f0f7ff] rounded-r-xl border border-[#b3d4f5] border-l-0">
                        <label className={labelStyle}>
                            Cadastro (Chave de Vinculação)
                            <Tooltip text="Número que agrupa TODOS os processos de um mesmo loteamento." />
                        </label>
                        <div className="relative">
                            <input value={form.cadastroChave} onChange={e => update('cadastroChave', e.target.value)}
                                className={inputClass('cadastroChave')} placeholder="Ex: 12345-67" />
                            <FieldStatus field="cadastroChave" />
                        </div>
                        {errors.cadastroChave && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.cadastroChave}</p>}
                        <p className="mt-1.5 text-[10px] text-[#4a90d9] font-semibold uppercase tracking-wide flex items-center gap-1">
                            <AlertCircle size={10} />Agrupa todos os processos deste loteamento
                        </p>
                    </div>

                    <div>
                        <label className={labelStyle}><ClipboardList size={11} />Assunto / Fase do Processo *
                            <Tooltip text="Selecione a fase atual do loteamento no fluxo de aprovação." />
                        </label>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <select title="Assunto" value={form.assuntoProcesso} onChange={e => update('assuntoProcesso', e.target.value)} className={selectClass('assuntoProcesso')}>
                                    <option value="">Selecione a fase...</option>
                                    {customAssuntos.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                            </div>
                            <button type="button" title="Gerenciar assuntos" onClick={() => setIsAssuntosModalOpen(true)}
                                className="p-2.5 rounded-lg border border-[#dde3ee] bg-[#f8fafc] text-[#4a90d9] hover:bg-[#eef2f7] transition-all flex-shrink-0">
                                <PenLine size={16} />
                            </button>
                        </div>
                        {errors.assuntoProcesso && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.assuntoProcesso}</p>}
                    </div>

                    <div>
                        <label className={labelStyle}><FileText size={11} />Nome do Empreendimento</label>
                        <div className="relative">
                            <input value={form.nomeLoteamento} onChange={e => update('nomeLoteamento', e.target.value)}
                                className={inputClass('nomeLoteamento')} placeholder="Ex: Residencial Aurora" />
                            <FieldStatus field="nomeLoteamento" />
                        </div>
                    </div>
                </div>
            )}

            {categoria === 'Desdobro' && (
                <div style={{ background: '#f5f3ff', borderColor: '#c4b5fd', animation: 'fadeInUp 0.25s ease-out' }}
                    className="p-5 rounded-xl border">
                    <div className="flex items-center gap-2 text-[#8b5cf6] text-xs font-bold uppercase tracking-wide mb-2">
                        <CopySlash size={13} />Informações do Desdobro
                    </div>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                        O desdobro é uma divisão simples de lote em partes, com acesso pelas vias já existentes. Preencha os dados básicos e continue.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Step 3: Localização ─────────────────────────────────────

function StepLocalizacao({
    form, errors, update,
}: {
    form: FormInputs;
    errors: Partial<Record<keyof FormInputs, string>>;
    update: (f: keyof FormInputs, v: string) => void;
}) {
    const labelStyle = 'block text-[10px] font-bold uppercase tracking-wider text-[#4a6075] mb-1.5 flex items-center gap-1';

    const inputClass = (field: keyof FormInputs) => {
        const base = 'w-full bg-[#f8fafc] border rounded-lg px-4 py-2.5 text-sm text-[#1e2d40] placeholder:text-[#8fa5b8] focus:outline-none transition-all';
        if (errors[field]) return `${base} border-red-300 focus:border-red-400 bg-red-50/30`;
        const val = form[field];
        if (val && String(val).trim()) return `${base} border-green-300 focus:border-green-400`;
        return `${base} border-[#dde3ee] focus:border-[#4a90d9] focus:bg-white`;
    };

    const selectClass = (field: keyof FormInputs) => {
        const base = 'w-full bg-[#f8fafc] border rounded-lg px-4 py-2.5 text-sm text-[#1e2d40] focus:outline-none appearance-none cursor-pointer transition-all';
        if (errors[field]) return `${base} border-red-300`;
        const val = form[field];
        if (val && String(val).trim()) return `${base} border-green-300`;
        return `${base} border-[#dde3ee] focus:border-[#4a90d9]`;
    };

    const FieldStatus = ({ field }: { field: keyof FormInputs }) => {
        const val = form[field];
        if (errors[field]) return <AlertCircle size={14} className="text-red-400 flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;
        if (val && String(val).trim()) return <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;
        return null;
    };

    return (
        <div style={{ animation: 'fadeInUp 0.25s ease-out' }} className="space-y-5">
            <div className="mb-1">
                <h3 className="text-sm font-bold text-[#0f1f30]">Localização do Imóvel</h3>
                <p className="text-xs text-[#8fa5b8] mt-0.5">Informe o cadastro, lote, gleba e endereço.</p>
            </div>

            {/* Cadastro + Lote (lado a lado) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyle}>
                        <Building2 size={11} />
                        Cadastro do Lote
                        <Tooltip text="Número de cadastro imobiliário no município. Formato: XXXXX-XX-XX" />
                    </label>
                    <div className="relative">
                        <input value={form.cadastro} onChange={e => update('cadastro', e.target.value)}
                            className={inputClass('cadastro')} placeholder="XXXXX-XX-XX" />
                        <FieldStatus field="cadastro" />
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>
                        <Hash size={11} />
                        Lote
                        <Tooltip text="Número do lote conforme matrícula ou registro." />
                    </label>
                    <div className="relative">
                        <input value={form.lote} onChange={e => update('lote', e.target.value)}
                            className={inputClass('lote')} placeholder="Ex: Lote 12" />
                        <FieldStatus field="lote" />
                    </div>
                </div>
            </div>

            {/* Gleba */}
            <div>
                <label className={labelStyle}><MapPin size={11} />Gleba</label>
                <div className="relative">
                    <select title="Gleba" value={form.gleba} onChange={e => update('gleba', e.target.value)} className={selectClass('gleba')}>
                        <option value="">Selecione a gleba...</option>
                        {glebas.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                </div>
            </div>

            {/* Endereço */}
            <div>
                <label className={labelStyle}><MapPin size={11} />Endereço Completo</label>
                <div className="relative">
                    <input value={form.endereco} onChange={e => update('endereco', e.target.value)}
                        className={inputClass('endereco')} placeholder="Rua, Número, Bairro — Maringá/PR" />
                    <FieldStatus field="endereco" />
                </div>
            </div>
        </div>
    );
}

// ── Step 4: Classificação ───────────────────────────────────

function StepClassificacao({
    form, update, errors, customCategories, setIsCatModalOpen,
}: {
    form: FormInputs;
    update: (f: keyof FormInputs, v: string) => void;
    errors: Partial<Record<keyof FormInputs, string>>;
    customCategories: string[];
    setIsCatModalOpen: (v: boolean) => void;
}) {
    const labelStyle = 'block text-[10px] font-bold uppercase tracking-wider text-[#4a6075] mb-1.5 flex items-center gap-1';
    const selectClass = 'w-full bg-[#f8fafc] border border-[#dde3ee] rounded-lg px-4 py-2.5 text-sm text-[#1e2d40] focus:outline-none appearance-none cursor-pointer focus:border-[#4a90d9] transition-all';

    const priorities: Array<{ value: 'Alta' | 'Normal' | 'Baixa'; label: string; color: string; bg: string }> = [
        { value: 'Alta', label: '🔴 Alta', color: '#ef4444', bg: '#fef2f2' },
        { value: 'Normal', label: '🟡 Normal', color: '#f59e0b', bg: '#fefce8' },
        { value: 'Baixa', label: '🟢 Baixa', color: '#10b981', bg: '#ecfdf5' },
    ];

    const statuses: Array<{ value: ProcessStatus; label: string }> = [
        { value: 'Em Análise', label: 'Em Análise' },
        { value: 'Aprovado', label: 'Aprovado' },
        { value: 'Pendente', label: 'Pendente' },
        { value: 'Indeferido', label: 'Indeferido' },
        { value: 'Arquivado', label: 'Arquivado' },
    ];


    return (
        <div style={{ animation: 'fadeInUp 0.25s ease-out' }} className="space-y-5">
            <div className="mb-1">
                <h3 className="text-sm font-bold text-[#0f1f30]">Classificação do Processo</h3>
                <p className="text-xs text-[#8fa5b8] mt-0.5">Defina setor, responsável, status e prioridade.</p>
            </div>

            {/* Categoria do Setor */}
            <div>
                <label className={labelStyle}>
                    Setor / Categoria *
                    <Tooltip text="Categoria interna do setor SEURBH responsável." />
                </label>
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <select title="Categoria" value={form.categoria} onChange={e => update('categoria', e.target.value)} className={`${selectClass} ${errors.categoria ? 'border-red-300' : ''}`}>
                            <option value="">Selecione o setor...</option>
                            {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                    </div>
                    <button type="button" title="Gerenciar categorias" onClick={() => setIsCatModalOpen(true)}
                        className="p-2.5 rounded-lg border border-[#dde3ee] bg-[#f8fafc] text-[#4a90d9] hover:bg-[#eef2f7] transition-all flex-shrink-0">
                        <PenLine size={16} />
                    </button>
                </div>
                {errors.categoria && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.categoria}</p>}
            </div>

            {/* Analista Responsável */}
            <div>
                <label className={labelStyle}><Users size={11} />Analista Responsável</label>
                <div className="relative">
                    <select title="Responsável" value={form.responsavel} onChange={e => update('responsavel', e.target.value)} className={selectClass}>
                        <option value="">Selecione o analista...</option>
                        {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                </div>
            </div>

            {/* Status */}
            <div>
                <label className={labelStyle}>Status Inicial</label>
                <div className="relative">
                    <select title="Status" value={form.status} onChange={e => update('status', e.target.value as ProcessStatus)} className={selectClass}>
                        {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={15} />
                </div>
            </div>

            {/* Prioridade */}
            <div>
                <label className={labelStyle}><Star size={11} />Prioridade</label>
                <div className="grid grid-cols-3 gap-2">
                    {priorities.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => update('prioridade', p.value)}
                            style={{
                                borderColor: form.prioridade === p.value ? p.color : '#dde3ee',
                                background: form.prioridade === p.value ? p.bg : '#f8fafc',
                                color: form.prioridade === p.value ? p.color : '#64748b',
                                transition: 'all 0.2s',
                                boxShadow: form.prioridade === p.value ? `0 0 0 2px ${p.color}33` : 'none',
                            }}
                            className="py-2.5 rounded-xl text-xs font-bold border"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Step 5: Documentos ──────────────────────────────────────

function StepDocumentos({ seiNumber }: { seiNumber: string }) {
    return (
        <div style={{ animation: 'fadeInUp 0.25s ease-out' }} className="space-y-4">
            <div className="mb-1">
                <h3 className="text-sm font-bold text-[#0f1f30]">Documentos e Arquivos</h3>
                <p className="text-xs text-[#8fa5b8] mt-0.5">
                    Faça upload dos documentos iniciais. Eles serão enviados automaticamente para a pasta do processo no Google Drive.
                </p>
            </div>

            {seiNumber && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eaf3fd] border border-[#b3d4f5] rounded-xl text-xs text-[#4a90d9] font-semibold">
                    <Upload size={13} />
                    Pasta de destino: processo <span className="font-mono">{seiNumber}</span>
                </div>
            )}

            <UploadZone seiNumber={seiNumber} compact={false} />

            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                    O upload é opcional nesta etapa. Você poderá adicionar documentos posteriormente acessando o processo na tabela.
                </p>
            </div>
        </div>
    );
}

// ── Componente Principal ────────────────────────────────────

export function DynamicProcessForm({ onClose, onSuccess }: DynamicProcessFormProps) {
    const {
        customAssuntos, replaceAssuntos,
        customCategories, replaceCategories,
        customLoteamentoCategories, replaceLoteamentoCategories,
        getActiveSheetsUrl, getTargetSheetUrl, driveRootFolderId,
    } = useConfig();
    const { refreshProcessos } = useProcessos();

    const [isLoteCatModalOpen, setIsLoteCatModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isAssuntosModalOpen, setIsAssuntosModalOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [globalError, setGlobalError] = useState<string | null>(null);

    const [form, setForm] = useState<FormInputs>({
        seiNumber: '',
        requerente: '',
        cadastro: '',
        lote: '',
        gleba: '',
        endereco: '',
        categoria: '',
        tipoDesmembramento: 'Subdivisão',
        justificativaLei: '',
        tipoRemembramento: 'Unificação',
        cadastroChave: '',
        assuntoProcesso: '',
        nomeLoteamento: '',
        status: 'Em Análise',
        responsavel: '',
        prioridade: 'Normal',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormInputs, string>>>({});

    const update = (field: keyof FormInputs, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
        setGlobalError(null);
    };

    const validateStep = (s: number): boolean => {
        const newErr: Partial<Record<keyof FormInputs, string>> = {};

        if (s === 1 && !form.categoria) return false; // botão desabilitado

        if (s === 2) {
            if (!form.requerente.trim()) newErr.requerente = 'Campo obrigatório.';
            if (form.categoria === 'Desmembramento' && !form.justificativaLei.trim())
                newErr.justificativaLei = 'Informe a justificativa legal.';
            if (form.categoria === 'Loteamentos e Condomínios') {
                if (!form.cadastroChave.trim()) newErr.cadastroChave = 'Campo obrigatório.';
                if (!form.assuntoProcesso) newErr.assuntoProcesso = 'Selecione a fase.';
            }
        }

        if (s === 4) {
            if (!form.categoria.trim()) newErr.categoria = 'Selecione o setor.';
        }

        setErrors(newErr);
        return Object.keys(newErr).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        setStep(prev => (prev < 5 ? (prev + 1) as typeof step : prev));
    };

    const handleBack = () => {
        setStep(prev => (prev > 1 ? (prev - 1) as typeof step : prev));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setGlobalError(null);

        try {
            let newDriveLink = '';
            const sheetsUrl = getActiveSheetsUrl();
            const targetUrl = getTargetSheetUrl();

            if (driveRootFolderId && sheetsUrl) {
                setFeedbackMsg('Criando pasta no Google Drive...');
                try {
                    const reqName = form.requerente.split(' ')[0] || form.requerente;
                    const folderName = form.seiNumber
                        ? `${form.seiNumber} - ${reqName}`
                        : `${form.categoria} - ${reqName}`;
                    const driveRes = await createDriveFolder(folderName, driveRootFolderId, sheetsUrl);
                    newDriveLink = driveRes.folderUrl ?? '';
                } catch (e) {
                    console.warn('Não foi possível criar pasta no Drive:', e);
                }
            }

            setFeedbackMsg('Salvando processo...');

            const success = await saveProcesso({
                CADASTRO: form.cadastro,
                LOTE: form.lote,
                GLEBA: form.gleba,
                REQUERENTE: form.requerente,
                'N° DO PROCESSO': form.seiNumber,
                'DATA DE ABERTURA': new Date().toISOString().split('T')[0],
                'TIPO DE PROCESSO': form.assuntoProcesso || form.categoria,
                SETOR: form.categoria,
                SITUAÇÃO: form.status,
                'ANALISTA / DESENHISTA': form.responsavel,
                OBSERVAÇÃO: form.endereco,
                PRIORIDADE: form.prioridade,
                'Link do Drive': newDriveLink,
                'DRIVE_ROOT_ID': driveRootFolderId || '',
                ...(form.nomeLoteamento && { 'NOME_LOTEAMENTO': form.nomeLoteamento }),
                ...(form.cadastroChave && { 'CADASTRO_CHAVE': form.cadastroChave }),
            }, sheetsUrl, targetUrl);

            if (success) {
                await refreshProcessos();
                if (onSuccess) onSuccess();
                else if (onClose) onClose();
            } else {
                setGlobalError('Erro ao salvar. Verifique a configuração da API de planilhas.');
            }
        } catch (err) {
            console.error(err);
            setGlobalError('Erro técnico ao salvar o processo.');
        } finally {
            setIsLoading(false);
            setFeedbackMsg('');
        }
    };

    const TOTAL_STEPS = 5;
    const stepTitles = ['Tipo', 'Identificação', 'Localização', 'Classificação', 'Documentos'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e2d40]/40 backdrop-blur-sm">
            <div
                style={{ animation: 'scaleIn 0.2s ease-out' }}
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#dde3ee] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="bg-white px-6 py-5 border-b border-[#dde3ee] flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-[#0f1f30] flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#eaf3fd' }}>
                                <LayoutGrid size={15} color="#4a90d9" />
                            </span>
                            Novo Processo de Parcelamento
                        </h2>
                        <p className="text-[#8fa5b8] text-xs mt-0.5">
                            SEURBH · Etapa {step} de {TOTAL_STEPS}: <span className="font-semibold text-[#4a90d9]">{stepTitles[step - 1]}</span>
                        </p>
                    </div>
                    {onClose && (
                        <button type="button" onClick={onClose} title="Fechar"
                            className="p-2 text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#f0f4f8] rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <ProgressBar step={step} />

                {/* Error global */}
                {globalError && (
                    <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs">
                        <AlertTriangle size={14} />
                        {globalError}
                    </div>
                )}

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#dde3ee transparent' }}>
                    {step === 1 && (
                        <StepTipo selected={form.categoria} onSelect={cat => update('categoria', cat)} />
                    )}
                    {step === 2 && (
                        <StepIdentificacao
                            form={form} errors={errors} update={update}
                            categoria={form.categoria}
                            customAssuntos={customAssuntos}
                            setIsAssuntosModalOpen={setIsAssuntosModalOpen}
                        />
                    )}
                    {step === 3 && (
                        <StepLocalizacao form={form} errors={errors} update={update} />
                    )}
                    {step === 4 && (
                        <StepClassificacao
                            form={form} errors={errors} update={update}
                            customCategories={customCategories}
                            setIsCatModalOpen={setIsCatModalOpen}
                        />
                    )}
                    {step === 5 && (
                        <StepDocumentos seiNumber={form.seiNumber} />
                    )}
                </form>

                {/* Footer */}
                <div className="bg-[#f8fafc] px-6 py-4 border-t border-[#dde3ee] flex items-center justify-between flex-shrink-0">
                    <button
                        type="button"
                        onClick={step === 1 ? onClose : handleBack}
                        className="px-5 py-2.5 text-sm font-semibold text-[#4a6075] hover:text-[#1e2d40] hover:bg-[#eef2f7] rounded-lg transition-all border border-transparent hover:border-[#dde3ee]"
                    >
                        {step === 1 ? 'Cancelar' : '← Voltar'}
                    </button>

                    {step < TOTAL_STEPS ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={step === 1 && !form.categoria}
                            style={{
                                opacity: step === 1 && !form.categoria ? 0.4 : 1,
                                background: 'linear-gradient(135deg, #4a90d9 0%, #3d7bc0 100%)',
                            }}
                            className="px-6 py-2.5 text-white rounded-xl font-bold text-sm shadow-md shadow-[#4a90d9]/20 flex items-center gap-2 disabled:cursor-not-allowed transition-all hover:shadow-lg active:scale-95"
                        >
                            Próxima Etapa
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2.5 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px #10b98133' }}
                        >
                            <CheckCircle2 size={17} />
                            {isLoading ? feedbackMsg || 'Salvando...' : 'Cadastrar no SEURBH'}
                            {!isLoading && <ArrowRight size={15} />}
                        </button>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />

            {/* Modais de gerenciamento */}
            {isLoteCatModalOpen && (
                <CategoryManagerModal title="Categorias de Loteamento" items={customLoteamentoCategories}
                    onSave={newItems => replaceLoteamentoCategories(newItems)} onClose={() => setIsLoteCatModalOpen(false)} />
            )}
            {isCatModalOpen && (
                <CategoryManagerModal title="Categorias de Setor" items={customCategories}
                    onSave={newItems => replaceCategories(newItems)} onClose={() => setIsCatModalOpen(false)} />
            )}
            {isAssuntosModalOpen && (
                <CategoryManagerModal title="Assuntos do Loteamento" items={customAssuntos}
                    onSave={newItems => replaceAssuntos(newItems)} onClose={() => setIsAssuntosModalOpen(false)} />
            )}
        </div>
    );
}
