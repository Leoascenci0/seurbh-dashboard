import { useState } from 'react';
import {
    ExternalLink,
    Eye,
    ChevronUp,
    ChevronDown,
    Filter,
    Download,
    Folders,
    Search,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import type { SeiProcess, ProcessStatus } from '../types';
import { concluirProcesso } from '../data/sheetsApi';
import { useProcessos } from '../context/ProcessosContext';
import { useConfig } from '../context/ConfigContext';

interface ProcessTableProps {
    processes: SeiProcess[];
    searchQuery: string;
}

const statusConfig: Record<ProcessStatus, { label: string; color: string; bg: string; dot: string }> = {
    'Em Análise': { label: 'Em Análise', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    'Aprovado': { label: 'Aprovado', color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    'Pendente': { label: 'Pendente', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
    'Indeferido': { label: 'Indeferido', color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
    'Arquivado': { label: 'Arquivado', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
};

const prioridadeConfig = {
    'Alta': 'text-red-500 font-bold',
    'Normal': 'text-[#8fa5b8]',
    'Baixa': 'text-green-500',
};

type SortField = 'seiNumber' | 'requerente' | 'dataAtualizacao' | 'status' | 'prioridade';

export function ProcessTable({ processes, searchQuery }: ProcessTableProps) {
    const { refreshProcessos } = useProcessos();
    const { driveRootFolderId, getActiveSheetsUrl } = useConfig();
    const [statusFilter, setStatusFilter] = useState<ProcessStatus | 'Todos'>('Todos');
    const [sortField, setSortField] = useState<SortField>('dataAtualizacao');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // uploadRow was removed since we replaced the upload button with the conclude button temporarily
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [concluindoId, setConcluindoId] = useState<string | null>(null);

    const allStatuses: (ProcessStatus | 'Todos')[] = ['Todos', 'Em Análise', 'Pendente', 'Aprovado', 'Indeferido', 'Arquivado'];

    const filtered = processes
        .filter(p => {
            const matchStatus = statusFilter === 'Todos' || p.status === statusFilter;
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || [p.seiNumber, p.requerente, p.assunto, p.responsavel, p.endereco]
                .some(val => val.toLowerCase().includes(q));
            return matchStatus && matchSearch;
        })
        .sort((a, b) => {
            let valA = '';
            let valB = '';
            if (sortField === 'seiNumber') { valA = a.seiNumber; valB = b.seiNumber; }
            if (sortField === 'requerente') { valA = a.requerente; valB = b.requerente; }
            if (sortField === 'dataAtualizacao') { valA = a.dataAtualizacao; valB = b.dataAtualizacao; }
            if (sortField === 'status') { valA = a.status; valB = b.status; }
            if (sortField === 'prioridade') {
                const order = { Alta: 0, Normal: 1, Baixa: 2 };
                return sortDir === 'asc' ? order[a.prioridade] - order[b.prioridade] : order[b.prioridade] - order[a.prioridade];
            }
            const cmp = valA.localeCompare(valB);
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const renderSortIcon = (field: SortField) => (
        <span className="ml-1 inline-flex flex-col">
            {sortField === field
                ? sortDir === 'asc' ? <ChevronUp size={12} className="text-[#4a90d9]" /> : <ChevronDown size={12} className="text-[#4a90d9]" />
                : <span className="text-[10px] text-[#c8d6e5]">↕</span>
            }
        </span>
    );

    const handleConcluir = async (e: React.MouseEvent, processId: string, seiNumber: string) => {
        e.stopPropagation();
        setConcluindoId(processId);

        const success = await concluirProcesso(seiNumber, driveRootFolderId, getActiveSheetsUrl());
        if (success) {
            await refreshProcessos();
        } else {
            alert('Falha ao concluir processo. Tente novamente mais tarde.');
        }

        setConcluindoId(null);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-white border border-[#dde3ee] rounded-xl p-1 flex-wrap shadow-sm">
                    <Filter size={12} className="text-[#8fa5b8] ml-2" />
                    {allStatuses.map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                statusFilter === s
                                    ? 'bg-[#4a90d9] text-white shadow-sm'
                                    : 'text-[#4a6075] hover:text-[#1e2d40] hover:bg-[#f0f5ff]'
                            )}
                        >
                            {s}
                            {s !== 'Todos' && (
                                <span className="ml-1.5 opacity-60">
                                    {processes.filter(p => p.status === s).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="ml-auto text-xs text-[#8fa5b8]">
                    {filtered.length} processo{filtered.length !== 1 ? 's' : ''}
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#4a6075] hover:text-[#1e2d40] border border-[#dde3ee] hover:border-[#4a90d9]/50 hover:bg-[#f0f5ff] bg-white">
                    <Download size={13} /> Exportar
                </button>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#dde3ee]">
                    <Search size={40} className="text-[#dde3ee] mb-3" />
                    <p className="text-[#4a6075] font-medium">Nenhum processo encontrado</p>
                    <p className="text-xs text-[#8fa5b8] mt-1">Tente ajustar seus filtros ou termos de busca</p>
                </div>
            ) : (
                <div className="bg-white border border-[#dde3ee] rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#dde3ee] bg-[#f8fafc]">
                                    <th className="text-left px-4 py-3">
                                        <button onClick={() => handleSort('seiNumber')} className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider hover:text-[#4a90d9] flex items-center">
                                            Nº SEI {renderSortIcon('seiNumber')}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3">
                                        <button onClick={() => handleSort('requerente')} className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider hover:text-[#4a90d9] flex items-center">
                                            Requerente {renderSortIcon('requerente')}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 hidden xl:table-cell">
                                        <span className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider">Assunto</span>
                                    </th>
                                    <th className="text-left px-4 py-3">
                                        <button onClick={() => handleSort('status')} className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider hover:text-[#4a90d9] flex items-center">
                                            Status {renderSortIcon('status')}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                                        <button onClick={() => handleSort('prioridade')} className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider hover:text-[#4a90d9] flex items-center">
                                            Prior. {renderSortIcon('prioridade')}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">
                                        <button onClick={() => handleSort('dataAtualizacao')} className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider hover:text-[#4a90d9] flex items-center">
                                            Atualizado {renderSortIcon('dataAtualizacao')}
                                        </button>
                                    </th>
                                    <th className="text-right px-4 py-3">
                                        <span className="text-xs font-semibold text-[#4a6075] uppercase tracking-wider">Ações</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((proc, idx) => {
                                    const sc = statusConfig[proc.status];
                                    const isEven = idx % 2 === 0;
                                    const isExpanded = expandedRow === proc.id;

                                    return (
                                        <>
                                            <tr
                                                key={proc.id}
                                                className={clsx(
                                                    'border-b border-[#eaeff7] transition-colors cursor-pointer',
                                                    isEven ? 'bg-white' : 'bg-[#fafbfd]',
                                                    'hover:bg-[#f0f5ff]'
                                                )}
                                                onClick={() => setExpandedRow(isExpanded ? null : proc.id)}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono text-xs font-bold text-[#4a90d9]">{proc.seiNumber}</span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div>
                                                        <p className="text-sm text-[#1e2d40] font-medium truncate max-w-[160px]">{proc.requerente}</p>
                                                        <p className="text-[10px] text-[#8fa5b8]">{proc.cadastro}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden xl:table-cell">
                                                    <p className="text-xs text-[#4a6075] truncate max-w-[200px]" title={proc.assunto}>{proc.assunto}</p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', sc.bg, sc.color)}>
                                                        <span className={clsx('w-1.5 h-1.5 rounded-full', sc.dot)} />
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 hidden lg:table-cell">
                                                    <span className={clsx('text-xs', prioridadeConfig[proc.prioridade])}>
                                                        {proc.prioridade === 'Alta' ? '▲' : proc.prioridade === 'Baixa' ? '▽' : '—'} {proc.prioridade}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 hidden md:table-cell">
                                                    <span className="text-xs text-[#8fa5b8]">
                                                        {new Date(proc.dataAtualizacao).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => setExpandedRow(isExpanded ? null : proc.id)}
                                                            className="p-1.5 rounded-md text-[#8fa5b8] hover:text-[#4a90d9] hover:bg-[#e8f3fd]" title="Ver detalhes">
                                                            <Eye size={14} />
                                                        </button>
                                                        {proc.driveLink ? (
                                                            <a href={proc.driveLink} target="_blank" rel="noopener noreferrer"
                                                                className="p-1.5 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 shadow-sm border border-green-100 bg-white" title="Abrir pasta no Drive">
                                                                <Folders size={14} />
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleConcluir(e, proc.id, proc.seiNumber)}
                                                                disabled={concluindoId === proc.id}
                                                                className="p-1.5 rounded-md text-[#4a90d9] hover:text-white hover:bg-[#4a90d9] transition-colors shadow-sm border border-[#c5dff5] bg-[#e8f3fd] disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Concluir e Criar Pasta">
                                                                {concluindoId === proc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr key={`detail-${proc.id}`} className="bg-[#f8faff] border-b border-[#dde3ee]">
                                                    <td colSpan={7} className="px-6 py-4">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                            <div>
                                                                <p className="text-[#8fa5b8] mb-1 font-semibold uppercase tracking-wide text-[10px]">Cadastro / Lote / Gleba</p>
                                                                <p className="text-[#1e2d40]">{proc.cadastro} - Lote {proc.lote} ({proc.gleba})</p>
                                                                <p className="text-[9px] text-[#8fa5b8] mt-0.5">{proc.endereco}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[#8fa5b8] mb-1 font-semibold uppercase tracking-wide text-[10px]">Analista Responsável</p>
                                                                <p className="text-[#1e2d40]">{proc.responsavel}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[#8fa5b8] mb-1 font-semibold uppercase tracking-wide text-[10px]">Categoria</p>
                                                                <p className="text-[#1e2d40]">{proc.category}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[#8fa5b8] mb-1 font-semibold uppercase tracking-wide text-[10px]">Data Inicial</p>
                                                                <p className="text-[#1e2d40]">{new Date(proc.dataCriacao).toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                            <div className="col-span-2 md:col-span-4">
                                                                <p className="text-[#8fa5b8] mb-1 font-semibold uppercase tracking-wide text-[10px]">Assunto Completo</p>
                                                                <p className="text-[#1e2d40]">{proc.assunto}</p>
                                                            </div>
                                                            {proc.driveLink && (
                                                                <div className="col-span-2 md:col-span-4">
                                                                    <a href={proc.driveLink} target="_blank" rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 text-[#4a90d9] hover:text-[#3a7bc8] font-medium">
                                                                        <ExternalLink size={12} /> Acessar Pasta no Google Drive
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
