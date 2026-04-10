import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3, Building2, TreePine, Users, Ruler, MapPin,
    Plus, RefreshCw, Loader2, AlertCircle, TrendingUp,
    TrendingDown, Minus, Edit3, Check, X, Save
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { fetchDadosCidade, saveDadoCidade } from '../data/sheetsApi';
import type { DadoCidadeSheet } from '../data/sheetsApi';

// ─── Ícones por categoria ─────────────────────────────────────────────────────
const categoryIcons: Record<string, React.ReactNode> = {
    'Urbanismo': <Building2 size={18} />,
    'Habitação': <Building2 size={18} />,
    'Ambiental': <TreePine size={18} />,
    'Social': <Users size={18} />,
    'Infraestrutura': <Ruler size={18} />,
    'Geral': <MapPin size={18} />,
};

const categoryColors: Record<string, string> = {
    'Urbanismo': 'from-[#4a90d9] to-[#2d6ab0]',
    'Habitação': 'from-violet-500 to-violet-700',
    'Ambiental': 'from-green-500 to-green-700',
    'Social': 'from-amber-500 to-amber-700',
    'Infraestrutura': 'from-orange-500 to-orange-700',
    'Geral': 'from-[#1e2d40] to-[#2d4b73]',
};

// ─── Mock para exibição antes de configurar ───────────────────────────────────
const dadosMock: DadoCidadeSheet[] = [
    { ID: 'm1', CATEGORIA: 'Geral', INDICADOR: 'População', VALOR: '460.000', UNIDADE: 'hab', FONTE: 'IBGE 2022', DATA_REFERENCIA: '2022', OBSERVACAO: 'Estimativa' },
    { ID: 'm2', CATEGORIA: 'Geral', INDICADOR: 'Área Total', VALOR: '487', UNIDADE: 'km²', FONTE: 'IBGE', DATA_REFERENCIA: '2023', OBSERVACAO: '' },
    { ID: 'm3', CATEGORIA: 'Urbanismo', INDICADOR: 'Processos Ativos', VALOR: '—', UNIDADE: 'processos', FONTE: 'SEURBH', DATA_REFERENCIA: new Date().getFullYear().toString(), OBSERVACAO: '' },
    { ID: 'm4', CATEGORIA: 'Urbanismo', INDICADOR: 'Alvarás Emitidos', VALOR: '—', UNIDADE: 'alvarás/ano', FONTE: 'SEURBH', DATA_REFERENCIA: new Date().getFullYear().toString(), OBSERVACAO: '' },
    { ID: 'm5', CATEGORIA: 'Habitação', INDICADOR: 'Taxa de Crescimento', VALOR: '1.2', UNIDADE: '% a.a.', FONTE: 'PDM', DATA_REFERENCIA: '2023', OBSERVACAO: '' },
    { ID: 'm6', CATEGORIA: 'Ambiental', INDICADOR: 'Área Verde p/ Habitante', VALOR: '21', UNIDADE: 'm²/hab', FONTE: 'IPPUM', DATA_REFERENCIA: '2022', OBSERVACAO: '' },
];

// ─── Formulário inline de novo indicador ─────────────────────────────────────
function NovoIndicadorForm({
    onSave,
    onCancel,
    isSaving
}: {
    onSave: (dado: Partial<DadoCidadeSheet>) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<Partial<DadoCidadeSheet>>({
        CATEGORIA: 'Geral',
        UNIDADE: '',
        FONTE: '',
        DATA_REFERENCIA: new Date().getFullYear().toString(),
    });

    const categorias = ['Geral', 'Urbanismo', 'Habitação', 'Ambiental', 'Social', 'Infraestrutura'];

    return (
        <div className="bg-[#f0f4f8] border border-[#dde3ee] rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-[#1e2d40]">Novo Indicador</p>
            <div className="grid grid-cols-2 gap-3">
                <select value={form.CATEGORIA} onChange={e => setForm(f => ({ ...f, CATEGORIA: e.target.value }))}
                    className="col-span-2 w-full px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]">
                    {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Indicador *" value={form.INDICADOR || ''} onChange={e => setForm(f => ({ ...f, INDICADOR: e.target.value }))}
                    className="col-span-2 px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]" />
                <input placeholder="Valor *" value={form.VALOR || ''} onChange={e => setForm(f => ({ ...f, VALOR: e.target.value }))}
                    className="px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]" />
                <input placeholder="Unidade (ex: hab, km²)" value={form.UNIDADE || ''} onChange={e => setForm(f => ({ ...f, UNIDADE: e.target.value }))}
                    className="px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]" />
                <input placeholder="Fonte (ex: IBGE)" value={form.FONTE || ''} onChange={e => setForm(f => ({ ...f, FONTE: e.target.value }))}
                    className="px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]" />
                <input placeholder="Ano de Referência" value={form.DATA_REFERENCIA || ''} onChange={e => setForm(f => ({ ...f, DATA_REFERENCIA: e.target.value }))}
                    className="px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]" />
                <input placeholder="Observação (opcional)" value={form.OBSERVACAO || ''} onChange={e => setForm(f => ({ ...f, OBSERVACAO: e.target.value }))}
                    className="col-span-2 px-3 py-2 text-sm border border-[#dde3ee] rounded-lg bg-white focus:outline-none focus:border-[#4a90d9]" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[#4a6075] hover:bg-[#dde3ee] rounded-lg transition-all flex items-center gap-1.5">
                    <X size={14} /> Cancelar
                </button>
                <button onClick={() => onSave(form)} disabled={!form.INDICADOR || !form.VALOR || isSaving}
                    className="px-4 py-2 text-sm font-bold bg-[#4a90d9] text-white rounded-lg hover:bg-[#3a7bc8] disabled:opacity-50 transition-all flex items-center gap-1.5">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Salvar
                </button>
            </div>
        </div>
    );
}

// ─── Card de Indicador ────────────────────────────────────────────────────────
function IndicadorCard({ dado, trend }: { dado: DadoCidadeSheet; trend?: 'up' | 'down' | 'stable' }) {
    const trendIcon = trend === 'up'
        ? <TrendingUp size={14} className="text-green-500" />
        : trend === 'down'
            ? <TrendingDown size={14} className="text-red-500" />
            : <Minus size={14} className="text-[#8fa5b8]" />;

    return (
        <div className="bg-white border border-[#dde3ee] rounded-xl p-4 hover:shadow-md transition-all shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8fa5b8]">{dado.CATEGORIA || 'Geral'}</span>
                {trend && trendIcon}
            </div>
            <p className="text-2xl font-bold text-[#0f1f30] mb-1">
                {dado.VALOR || '—'}
                {dado.UNIDADE && <span className="text-sm font-normal text-[#4a6075] ml-1">{dado.UNIDADE}</span>}
            </p>
            <p className="text-sm font-semibold text-[#1e2d40] mb-2">{dado.INDICADOR}</p>
            {dado.OBSERVACAO && <p className="text-xs text-[#4a6075] italic">{dado.OBSERVACAO}</p>}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f0f4f8]">
                <span className="text-[10px] text-[#8fa5b8]">{dado.DATA_REFERENCIA || '—'}</span>
                <span className="text-[10px] text-[#8fa5b8]">Fonte: {dado.FONTE || '—'}</span>
            </div>
        </div>
    );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function DadosCidade() {
    const { sheetsApiUrl, targetSheetUrl, isSheetsLinked } = useConfig();
    const [dados, setDados] = useState<DadoCidadeSheet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('Todos');

    const categorias = ['Todos', 'Geral', 'Urbanismo', 'Habitação', 'Ambiental', 'Social', 'Infraestrutura'];

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadDados = useCallback(async () => {
        if (!isSheetsLinked || !sheetsApiUrl || !targetSheetUrl) {
            setDados(dadosMock);
            return;
        }
        setIsLoading(true);
        const result = await fetchDadosCidade(sheetsApiUrl, targetSheetUrl);
        setDados(result.length > 0 ? result : dadosMock);
        setIsLoading(false);
    }, [isSheetsLinked, sheetsApiUrl, targetSheetUrl]);

    useEffect(() => { loadDados(); }, [loadDados]);

    const handleSave = async (form: Partial<DadoCidadeSheet>) => {
        if (!isSheetsLinked || !sheetsApiUrl || !targetSheetUrl) {
            showToast('Configure a planilha primeiro.', 'error');
            return;
        }
        setIsSaving(true);
        const result = await saveDadoCidade(form, sheetsApiUrl, targetSheetUrl);
        if (result.success) {
            showToast('Indicador salvo com sucesso!', 'success');
            setShowForm(false);
            await loadDados();
        } else {
            showToast(result.error || 'Erro ao salvar.', 'error');
        }
        setIsSaving(false);
    };

    const filtered = activeCategory === 'Todos'
        ? dados
        : dados.filter(d => d.CATEGORIA === activeCategory);

    // Agrupar por categoria para o layout tipo mural
    const grouped = filtered.reduce<Record<string, DadoCidadeSheet[]>>((acc, d) => {
        const cat = d.CATEGORIA || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(d);
        return acc;
    }, {});

    return (
        <div className="p-6 space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-lg border text-sm font-medium ${toast.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[#0f1f30] flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#4a90d9]" />
                        Dados da Cidade
                    </h2>
                    <p className="text-xs text-[#8fa5b8] mt-0.5">Indicadores municipais de Maringá — Urbanismo e Habitação</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadDados} className="p-2 rounded-lg bg-white border border-[#dde3ee] hover:border-[#4a90d9]/40 text-[#4a6075] transition-all" title="Atualizar">
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowForm(f => !f)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#4a90d9] text-white rounded-xl text-sm font-bold hover:bg-[#3a7bc8] transition-all shadow-md shadow-[#4a90d9]/25"
                    >
                        <Plus size={15} />
                        Novo Indicador
                    </button>
                </div>
            </div>

            {/* Aviso de mock */}
            {!isSheetsLinked && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>Exibindo dados demonstrativos. Configure a planilha para ver seus dados reais.</span>
                </div>
            )}

            {/* Formulário */}
            {showForm && (
                <NovoIndicadorForm
                    onSave={handleSave}
                    onCancel={() => setShowForm(false)}
                    isSaving={isSaving}
                />
            )}

            {/* Filtro por categoria */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {categorias.map(cat => {
                    const count = cat === 'Todos' ? dados.length : dados.filter(d => d.CATEGORIA === cat).length;
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat
                                ? 'bg-[#1e2d40] text-white'
                                : 'bg-white border border-[#dde3ee] text-[#4a6075] hover:border-[#4a90d9]/40'}`}
                        >
                            {cat !== 'Todos' && categoryIcons[cat]}
                            {cat}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeCategory === cat ? 'bg-white/20' : 'bg-[#f0f4f8]'}`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-[#4a90d9]" />
                </div>
            ) : (
                /* Cards por categoria */
                <div className="space-y-8">
                    {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat}>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${categoryColors[cat] || categoryColors.Geral} text-white text-sm font-bold mb-4 shadow-md`}>
                                {categoryIcons[cat] || <MapPin size={16} />}
                                {cat}
                                <span className="opacity-70 text-xs font-normal">({items.length})</span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {items.map(dado => (
                                    <IndicadorCard key={dado.ID} dado={dado} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border border-[#dde3ee]">
                            <BarChart3 size={40} className="text-[#dde3ee] mx-auto mb-3" />
                            <p className="text-[#4a6075] font-medium">Nenhum indicador nesta categoria</p>
                            <p className="text-xs text-[#8fa5b8] mt-1">Clique em "Novo Indicador" para adicionar</p>
                        </div>
                    )}
                </div>
            )}

            {/* Hero Banner */}
            <div className="p-5 bg-gradient-to-r from-[#1e2d40] to-[#2d4b73] rounded-2xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 80% 50%, #4a90d9, transparent 60%)'
                }} />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Edit3 size={18} />
                        </div>
                        <div>
                            <p className="font-bold">Quer atualizar os dados?</p>
                            <p className="text-xs text-white/60">Edite diretamente na aba "Dados Cidade" da sua planilha</p>
                        </div>
                    </div>
                    {isSheetsLinked && (
                        <a
                            href={targetSheetUrl ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all border border-white/20"
                        >
                            <BarChart3 size={14} />
                            Abrir Planilha
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
