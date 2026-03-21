import { useState } from 'react';
import {
    ChevronDown,
    Info,
    FileText,
    Users,
    MapPin,
    Database,
    ArrowRight,
    CheckCircle2,
    X,
    AlertCircle,
    PenLine
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

interface FormInputs {
    categoria: string;
    tipoDesmembramento: string;
    justificativaLei: string;
    tipoRemembramento: string;
    cadastroChave: string;
    assuntoProcesso: string;
    requerente: string;
    nomeLoteamento: string;
    gleba: string;
    seiNumber: string;
}

// Arrays dinâmicos agora extraídos do useConfig()

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

export function DynamicProcessForm({ onClose }: { onClose?: () => void }) {
    const { customLoteamentoCategories, customAssuntos, addLoteamentoCategory, addAssunto } = useConfig();
    const [form, setForm] = useState<FormInputs>({
        categoria: '',
        tipoDesmembramento: 'Subdivisão',
        justificativaLei: '',
        tipoRemembramento: 'Unificação',
        cadastroChave: '',
        assuntoProcesso: '',
        requerente: '',
        nomeLoteamento: '',
        gleba: '',
        seiNumber: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormInputs, string>>>({});

    const update = (field: keyof FormInputs, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof FormInputs, string>> = {};
        if (!form.categoria) newErrors.categoria = 'Obrigatório';
        if (!form.seiNumber) newErrors.seiNumber = 'Obrigatório';

        if (form.categoria === 'Desmembramento' && !form.justificativaLei) {
            newErrors.justificativaLei = 'Justificativa é necessária';
        }

        if (form.categoria === 'Loteamentos e Condomínios') {
            if (!form.cadastroChave) newErrors.cadastroChave = 'Obrigatório';
            if (!form.assuntoProcesso) newErrors.assuntoProcesso = 'Obrigatório';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            console.log('Form Data:', form);
            alert('Processo iniciado com sucesso!');
            if (onClose) onClose();
        }
    };

    // Styles matching the main dashboard
    const labelStyle = "block text-[10px] font-bold uppercase tracking-wider text-[#4a6075] mb-1.5 px-1";
    const inputStyle = "w-full bg-[#f8fafc] border border-[#dde3ee] text-[#1e2d40] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a90d9] focus:bg-white transition-all placeholder:text-[#8fa5b8]";
    const selectStyle = "w-full bg-[#f8fafc] border border-[#dde3ee] text-[#1e2d40] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a90d9] appearance-none cursor-pointer transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e2d40]/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#dde3ee] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#f8fafc] p-6 border-b border-[#dde3ee] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#0f1f30] flex items-center gap-2">
                            <Database className="text-[#4a90d9]" size={20} />
                            Novo Processo Relacional
                        </h2>
                        <p className="text-[#8fa5b8] text-xs mt-0.5 font-medium">
                            Gestão Dinâmica de Loteamentos e Desmembramentos
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            title="Fechar"
                            className="p-2 text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#eef2f7] rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelStyle}>Número do Processo SEI</label>
                            <input
                                value={form.seiNumber}
                                onChange={e => update('seiNumber', e.target.value)}
                                className={`${inputStyle} ${errors.seiNumber ? 'border-red-300' : ''}`}
                                placeholder="Ex: 17.523.000123-0"
                            />
                            {errors.seiNumber && <span className="text-red-500 text-[10px] mt-1 block px-1">{errors.seiNumber}</span>}
                        </div>

                        <div>
                            <label className={labelStyle}>Categoria Principal</label>
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                    <select
                                        title="Categoria"
                                        value={form.categoria}
                                        onChange={e => update('categoria', e.target.value)}
                                        className={`${selectStyle} ${errors.categoria ? 'border-red-300' : ''}`}
                                    >
                                        <option value="">Selecione a categoria...</option>
                                        {customLoteamentoCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={16} />
                                </div>
                                <button
                                    type="button"
                                    title="Nova categoria de loteamento"
                                    onClick={() => {
                                        const newCat = window.prompt("Nova categoria:");
                                        if (newCat && newCat.trim() !== '') {
                                            addLoteamentoCategory(newCat);
                                            update('categoria', newCat.trim());
                                        }
                                    }}
                                    className="p-2.5 rounded-lg border border-[#dde3ee] bg-[#f8fafc] text-[#4a90d9] hover:bg-[#eef2f7] transition-all"
                                >
                                    <PenLine size={16} />
                                </button>
                            </div>
                            {errors.categoria && <span className="text-red-500 text-[10px] mt-1 block px-1">{errors.categoria}</span>}
                        </div>
                    </div>

                    {/* Conditional Sections with vanilla React transitions */}
                    <div className="space-y-6 transition-all duration-300">
                        {form.categoria === 'Desmembramento' && (
                            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className={labelStyle}>Tipo de Desmembramento</label>
                                    <select
                                        value={form.tipoDesmembramento}
                                        onChange={e => update('tipoDesmembramento', e.target.value)}
                                        className={selectStyle}
                                    >
                                        <option value="Subdivisão">Subdivisão</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelStyle}>Justificativa / Informação da Lei</label>
                                    <textarea
                                        value={form.justificativaLei}
                                        onChange={e => update('justificativaLei', e.target.value)}
                                        rows={3}
                                        className={`${inputStyle} resize-none ${errors.justificativaLei ? 'border-red-300' : ''}`}
                                        placeholder="Especifique as condições legais (Ex: LC 1104/2017)..."
                                    />
                                    <div className="mt-2 flex items-center gap-1.5 text-[#4a90d9]">
                                        <Info size={12} />
                                        <span className="text-[10px] font-medium italic">Obrigatório para validação do setor de parcelamento.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {form.categoria === 'Remembramento' && (
                            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                <label className={labelStyle}>Tipo de Remembramento</label>
                                <select
                                    value={form.tipoRemembramento}
                                    onChange={e => update('tipoRemembramento', e.target.value)}
                                    className={selectStyle}
                                >
                                    <option value="Unificação">Unificação</option>
                                </select>
                            </div>
                        )}

                        {form.categoria === 'Loteamentos e Condomínios' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-xl border border-[#4a90d9]/30 shadow-sm shadow-[#4a90d9]/5">
                                        <label className={labelStyle}>
                                            Cadastro (Chave de Vinculação)
                                        </label>
                                        <input
                                            value={form.cadastroChave}
                                            onChange={e => update('cadastroChave', e.target.value)}
                                            className={`${inputStyle} ${errors.cadastroChave ? 'border-red-300' : 'border-[#4a90d9]/20'}`}
                                            placeholder="Ex: 12345-67"
                                        />
                                        <div className="mt-2 flex items-center gap-1.5 text-[#4a90d9]">
                                            <AlertCircle size={10} />
                                            <p className="text-[9px] font-bold uppercase">Agrupa todos os processos deste loteamento.</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#f8fafc] p-5 rounded-xl border border-[#dde3ee]">
                                        <label className={labelStyle}>Assunto do Processo</label>
                                        <div className="flex gap-2 items-center">
                                            <div className="relative flex-1">
                                                <select
                                                    title="Assunto do Processo"
                                                    value={form.assuntoProcesso}
                                                    onChange={e => update('assuntoProcesso', e.target.value)}
                                                    className={selectStyle}
                                                >
                                                    <option value="">Selecione a fase...</option>
                                                    {customAssuntos.map(item => (
                                                        <option key={item} value={item}>{item}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={16} />
                                            </div>
                                            <button
                                                type="button"
                                                title="Novo assunto"
                                                onClick={() => {
                                                    const newAssunto = window.prompt("Novo assunto:");
                                                    if (newAssunto && newAssunto.trim() !== '') {
                                                        addAssunto(newAssunto);
                                                        update('assuntoProcesso', newAssunto.trim());
                                                    }
                                                }}
                                                className="p-2.5 rounded-lg border border-[#dde3ee] bg-[#f8fafc] text-[#4a90d9] hover:bg-[#eef2f7] transition-all"
                                            >
                                                <PenLine size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#f8fafc] rounded-xl border border-[#dde3ee] space-y-6">
                                    <div>
                                        <label className={labelStyle}><Users size={12} className="inline mr-2" />Requerente / Proprietário</label>
                                        <input
                                            value={form.requerente}
                                            onChange={e => update('requerente', e.target.value)}
                                            className={inputStyle}
                                            placeholder="Nome da pessoa física ou jurídica"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelStyle}><FileText size={12} className="inline mr-2" />Nome do Empreendimento</label>
                                            <input
                                                value={form.nomeLoteamento}
                                                onChange={e => update('nomeLoteamento', e.target.value)}
                                                className={inputStyle}
                                                placeholder="Ex: Res. Aurora"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelStyle}><MapPin size={12} className="inline mr-2" />Gleba</label>
                                            <div className="relative">
                                                <select
                                                    value={form.gleba}
                                                    onChange={e => update('gleba', e.target.value)}
                                                    className={selectStyle}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {glebas.map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa5b8] pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-[#f8fafc] p-6 border-t border-[#dde3ee] flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-[#4a6075] hover:text-[#1e2d40] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-8 py-2.5 bg-[#4a90d9] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#4a90d9]/20 flex items-center gap-2 hover:bg-[#3d7bc0] active:scale-95 transition-all"
                    >
                        <CheckCircle2 size={18} />
                        Cadastrar no SEURBH
                        <ArrowRight size={16} />
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #dde3ee;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-in {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}} />
            </div>
        </div>
    );
}
