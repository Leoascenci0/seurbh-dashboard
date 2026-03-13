import {
    FolderOpen, CheckCircle, Clock, AlertTriangle,
    TrendingUp, Users, ArrowRight, FileText, Activity
} from 'lucide-react';
import { mockTeam } from '../data/mockData';
import { useProcessos } from '../context/ProcessosContext';
import type { ProcessStatus } from '../types';

const statusConfig: Record<ProcessStatus, { color: string; dot: string }> = {
    'Em Análise': { color: 'text-amber-600', dot: 'bg-amber-400' },
    'Aprovado': { color: 'text-green-600', dot: 'bg-green-500' },
    'Pendente': { color: 'text-orange-600', dot: 'bg-orange-400' },
    'Indeferido': { color: 'text-red-500', dot: 'bg-red-400' },
    'Arquivado': { color: 'text-slate-400', dot: 'bg-slate-300' },
};

export function Dashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
    const { processes, dashboardStats } = useProcessos();
    const recent = [...processes].sort((a, b) =>
        new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime()
    ).slice(0, 5);

    const alta = processes.filter(p => p.prioridade === 'Alta' && p.status !== 'Aprovado' && p.status !== 'Arquivado');

    return (
        <div className="p-6 space-y-6">
            {/* Greeting banner */}
            <div className="bg-gradient-to-br from-[#4a90d9] to-[#2a6ab5] rounded-2xl p-6 relative overflow-hidden text-white shadow-lg shadow-[#4a90d9]/20">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className="text-white/70" />
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">SEURBH — Sistema de Gestão</span>
                    </div>
                    <h1 className="text-xl font-bold mb-1">Bem-vinda, Patricia! 👋</h1>
                    <p className="text-sm text-white/80">
                        Você tem <span className="text-white font-semibold">{dashboardStats.emAnalise} processos em análise</span> e{' '}
                        <span className="text-white font-semibold">{dashboardStats.pendentes} pendentes</span> para revisão hoje.
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <FolderOpen size={18} />, label: 'Processos Ativos', value: dashboardStats.totalAtivos, color: 'text-[#4a90d9]', bg: 'bg-[#e8f3fd]', border: 'border-[#c5dff5]' },
                    { icon: <Clock size={18} />, label: 'Em Análise', value: dashboardStats.emAnalise, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { icon: <CheckCircle size={18} />, label: 'Aprovados', value: dashboardStats.aprovadosMes, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                    { icon: <AlertTriangle size={18} />, label: 'Pendentes', value: dashboardStats.pendentes, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                ].map(stat => (
                    <div key={stat.label} className={`bg-white border ${stat.border} rounded-xl p-4 hover:shadow-md transition-all shadow-sm`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-[#8fa5b8] font-medium">{stat.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Recent processes */}
                <div className="lg:col-span-2 bg-white border border-[#dde3ee] rounded-xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dde3ee] bg-[#f8fafc]">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={15} className="text-[#4a90d9]" />
                            <h3 className="text-sm font-bold text-[#1e2d40]">Processos Recentes</h3>
                        </div>
                        <button onClick={() => onNavigate('processos-sei')} className="text-[10px] text-[#4a90d9] hover:text-[#3a7bc8] flex items-center gap-1 font-semibold">
                            Ver todos <ArrowRight size={10} />
                        </button>
                    </div>
                    <div className="divide-y divide-[#eaeff7]">
                        {recent.map(p => {
                            const sc = statusConfig[p.status];
                            return (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f5ff] transition-colors cursor-pointer">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[11px] text-[#4a90d9] font-bold flex-shrink-0">{p.seiNumber}</span>
                                            <span className="text-xs text-[#1e2d40] truncate">{p.requerente}</span>
                                        </div>
                                        <p className="text-[10px] text-[#8fa5b8] truncate mt-0.5">{p.assunto}</p>
                                    </div>
                                    <span className={`text-[10px] font-semibold whitespace-nowrap ${sc.color}`}>{p.status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Alta prioridade */}
                    <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-red-100 bg-red-50">
                            <AlertTriangle size={13} className="text-red-500" />
                            <h3 className="text-xs font-bold text-red-600">Alta Prioridade</h3>
                            <span className="ml-auto text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold">{alta.length}</span>
                        </div>
                        <div className="divide-y divide-[#eaeff7]">
                            {alta.slice(0, 3).map(p => (
                                <div key={p.id} className="px-4 py-2.5 hover:bg-red-50 cursor-pointer transition-colors">
                                    <p className="font-mono text-[11px] text-[#4a90d9] font-bold">{p.seiNumber}</p>
                                    <p className="text-[10px] text-[#8fa5b8] truncate">{p.requerente}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-white border border-[#dde3ee] rounded-xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#dde3ee] bg-[#f8fafc]">
                            <Users size={13} className="text-[#4a90d9]" />
                            <h3 className="text-xs font-bold text-[#1e2d40]">Equipe</h3>
                            <button onClick={() => onNavigate('equipe')} className="ml-auto text-[10px] text-[#4a90d9] flex items-center gap-1 font-semibold">
                                Ver <ArrowRight size={10} />
                            </button>
                        </div>
                        <div className="divide-y divide-[#eaeff7]">
                            {mockTeam.map(m => (
                                <div key={m.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f0f5ff] transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4a90d9] to-[#2a6ab5] flex items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] font-bold text-white">{m.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium text-[#1e2d40] truncate">{m.nome}</p>
                                        <p className="text-[9px] text-[#8fa5b8]">{m.processosSob} processos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                    { id: 'processos-sei', icon: <FolderOpen size={18} />, label: 'Processos SEI', desc: 'Ver todos os processos ativos' },
                    { id: 'normativas', icon: <FileText size={18} />, label: 'Normativas', desc: 'Leis, decretos e portarias' },
                    { id: 'equipe', icon: <Users size={18} />, label: 'Equipe', desc: 'Pastas individuais dos servidores' },
                ].map(link => (
                    <button key={link.id} onClick={() => onNavigate(link.id)}
                        className="bg-white border border-[#dde3ee] rounded-xl p-4 text-left hover:border-[#4a90d9]/40 hover:bg-[#f0f5ff] hover:shadow-md transition-all shadow-sm group">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[#4a90d9] group-hover:scale-110 transition-transform">{link.icon}</span>
                            <span className="text-sm font-bold text-[#1e2d40]">{link.label}</span>
                            <ArrowRight size={13} className="ml-auto text-[#c8d6e5] group-hover:text-[#4a90d9] group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[11px] text-[#8fa5b8]">{link.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
