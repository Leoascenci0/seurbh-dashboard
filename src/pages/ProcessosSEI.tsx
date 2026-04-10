import { useState } from 'react';
import { DynamicProcessForm } from '../components/DynamicProcessForm';
import { Plus, TrendingUp, Clock, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { ProcessTable } from '../components/ProcessTable';
import { useProcessos } from '../context/ProcessosContext';

interface ProcessosSEIProps {
    searchQuery: string;
}

function StatCard({ icon, label, value, sub, color, bg, border }: {
    icon: React.ReactNode; label: string; value: number | string; sub?: string;
    color: string; bg: string; border: string;
}) {
    return (
        <div className={`bg-white border ${border} rounded-xl p-4 hover:shadow-md transition-all shadow-sm`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-[#8fa5b8] font-medium">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                    {sub && <p className="text-[10px] text-[#8fa5b8] mt-1">{sub}</p>}
                </div>
                <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

export function ProcessosSEI({ searchQuery }: ProcessosSEIProps) {
    const { processes, dashboardStats, isLoading } = useProcessos();
    const [showDynamicModal, setShowDynamicModal] = useState(false);
    const [successToast, setSuccessToast] = useState(false);

    const handleSuccess = () => {
        setShowDynamicModal(false);
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 4000);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Toast */}
            {successToast && (
                <div className="fixed top-20 right-6 z-50 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-lg">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Processo criado com sucesso!</span>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[#0f1f30]">Processos SEI</h2>
                    <p className="text-xs text-[#8fa5b8] mt-0.5 flex items-center gap-1.5">
                        <Activity size={11} /> Atualizado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={() => setShowDynamicModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a90d9] text-white text-sm font-bold hover:bg-[#3a7bc8] shadow-md shadow-[#4a90d9]/25 active:scale-95 transition-all"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Processo Novo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={18} />} label="Processos Ativos" value={dashboardStats.totalAtivos}
                    sub="Total em andamento" color="text-[#4a90d9]" bg="bg-[#e8f3fd]" border="border-[#c5dff5]" />
                <StatCard icon={<Clock size={18} />} label="Em Análise" value={dashboardStats.emAnalise}
                    sub="Aguardando análise" color="text-amber-600" bg="bg-amber-50" border="border-amber-200" />
                <StatCard icon={<CheckCircle size={18} />} label="Aprovados" value={dashboardStats.aprovadosMes}
                    sub="Processos deferidos" color="text-green-600" bg="bg-green-50" border="border-green-200" />
                <StatCard icon={<AlertTriangle size={18} />} label="Pendentes" value={dashboardStats.pendentes}
                    sub="Aguardando documentação" color="text-orange-600" bg="bg-orange-50" border="border-orange-200" />
            </div>

            {/* Tabela */}
            {isLoading ? (
                <div className="flex justify-center p-8 text-[#8fa5b8]">
                    <div className="animate-pulse flex items-center gap-2">
                        <Activity className="animate-spin" size={16} /> Carregando processos do painel...
                    </div>
                </div>
            ) : (
                <ProcessTable processes={processes} searchQuery={searchQuery} />
            )}

            {showDynamicModal && (
                <DynamicProcessForm
                    onClose={() => setShowDynamicModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
