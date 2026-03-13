import { ExternalLink, FileText, Scale, Book, Scroll, Plus } from 'lucide-react';
import { useNormativas } from '../context/NormativasContext';
import { useState } from 'react';
import { NewNormativaModal } from '../components/NewNormativaModal';
import type { NormativaItem } from '../types';

const tipoIcons: Record<NormativaItem['tipo'], React.ReactNode> = {
    'Lei': <Scale size={16} className="text-[#4a90d9]" />,
    'Decreto': <Scroll size={16} className="text-amber-500" />,
    'Portaria': <FileText size={16} className="text-orange-500" />,
    'Resolução': <Book size={16} className="text-green-500" />,
    'Regulamentação': <FileText size={16} className="text-purple-500" />,
    'Orientação': <FileText size={16} className="text-pink-500" />,
    'Parecer': <FileText size={16} className="text-teal-500" />,
};

const tipoColors: Record<NormativaItem['tipo'], string> = {
    'Lei': 'text-[#4a90d9] bg-[#e8f3fd] border-[#c5dff5]',
    'Decreto': 'text-amber-600 bg-amber-50 border-amber-200',
    'Portaria': 'text-orange-600 bg-orange-50 border-orange-200',
    'Resolução': 'text-green-600 bg-green-50 border-green-200',
    'Regulamentação': 'text-purple-600 bg-purple-50 border-purple-200',
    'Orientação': 'text-pink-600 bg-pink-50 border-pink-200',
    'Parecer': 'text-teal-600 bg-teal-50 border-teal-200',
};

const tipoBg: Record<NormativaItem['tipo'], string> = {
    'Lei': 'bg-[#e8f3fd]',
    'Decreto': 'bg-amber-50',
    'Portaria': 'bg-orange-50',
    'Resolução': 'bg-green-50',
    'Regulamentação': 'bg-purple-50',
    'Orientação': 'bg-pink-50',
    'Parecer': 'bg-teal-50',
};

export function Normativas({ tipo, searchQuery = '' }: { tipo?: string, searchQuery?: string }) {
    const { normativas, isLoading } = useNormativas();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filtered = normativas.filter(n => {
        const matchesType = !tipo || n.tipo.toLowerCase() === tipo.toLowerCase();
        const matchesSearch = !searchQuery ||
            n.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.ementa.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[#0f1f30]">Normativas</h2>
                    <p className="text-xs text-[#8fa5b8] mt-0.5">Leis, decretos, portarias e demais instrumentos normativos</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3a7bc8] transition-all"
                >
                    <Plus size={16} /> Novo Item
                </button>
            </div>

            <div className="grid gap-3">
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a90d9] mx-auto mb-4"></div>
                        <p className="text-sm text-[#4a6075]">Carregando base legislativa...</p>
                    </div>
                ) : (
                    filtered.map(item => (
                        <div key={item.id}
                            className="bg-white border border-[#dde3ee] rounded-xl p-4 hover:border-[#4a90d9]/30 hover:shadow-md transition-all shadow-sm group">
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 ${tipoBg[item.tipo] || 'bg-gray-50'} rounded-xl flex-shrink-0`}>
                                    {tipoIcons[item.tipo] || <FileText size={16} className="text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tipoColors[item.tipo] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                            {item.tipo}
                                        </span>
                                        <span className="text-xs font-mono text-[#8fa5b8]">{item.numero}</span>
                                        <span className="text-[10px] text-[#8fa5b8] ml-auto">
                                            {new Date(item.data).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#1e2d40] mb-1">{item.titulo}</h3>
                                    <p className="text-xs text-[#4a6075] leading-relaxed">{item.ementa}</p>
                                    {item.driveLink && (
                                        <a href={item.driveLink} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-[#4a90d9] hover:text-[#3a7bc8] mt-2 font-medium">
                                            <ExternalLink size={11} /> Ver documento no Drive
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && filtered.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-[#dde3ee]">
                        <FileText size={40} className="text-[#dde3ee] mx-auto mb-3" />
                        <p className="text-[#4a6075] font-medium">Nenhuma normativa encontrada</p>
                        <p className="text-xs text-[#8fa5b8] mt-1">Esta categoria ainda não possui documentos cadastrados</p>
                    </div>
                )}
            </div>

            <NewNormativaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
