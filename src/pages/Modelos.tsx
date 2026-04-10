import { useState, useEffect } from 'react';
import {
    FolderOpen, FileText, Layout, File, ExternalLink,
    AlertCircle, Plus, Upload,
    ChevronRight, Grid, List, Loader2, BookOpen
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { fetchModelos } from '../data/sheetsApi';
import type { DriveItem, ModeloSheet } from '../data/sheetsApi';

const tipoIcons = {
    Prancha: <Layout size={18} className="text-[#4a90d9]" />,
    Documento: <FileText size={18} className="text-amber-500" />,
    Template: <File size={18} className="text-purple-500" />,
    folder: <FolderOpen size={18} className="text-yellow-500" />,
    file: <FileText size={18} className="text-[#4a6075]" />,
};

const tipoColors: Record<string, string> = {
    Prancha: 'text-[#4a90d9] bg-[#e8f3fd] border-[#c5dff5]',
    Documento: 'text-amber-600 bg-amber-50 border-amber-200',
    Template: 'text-purple-600 bg-purple-50 border-purple-200',
};

function formatBytes(bytes?: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
}

// ─── Componente de Card de Modelo ─────────────────────────────────────────────
function ModeloCard({ item, isFile }: { item: ModeloSheet | DriveItem; isFile?: boolean }) {
    const isSheet = 'NOME' in item;
    const nome = isSheet ? item.NOME : item.name;
    const tipo = isSheet ? item.TIPO : (item.type === 'folder' ? 'folder' : 'file');
    const url = isSheet ? item.DRIVE_URL : item.url;
    const desc = isSheet ? item.DESCRICAO : `${item.type === 'folder' ? 'Pasta' : 'Arquivo'} — ${formatDate((item as DriveItem).updatedAt)}`;

    return (
        <div className="bg-white border border-[#dde3ee] rounded-xl p-4 hover:border-[#4a90d9]/40 hover:shadow-md transition-all shadow-sm group">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f0f4f8] rounded-xl flex-shrink-0">
                    {tipoIcons[tipo as keyof typeof tipoIcons] || tipoIcons.file}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isSheet && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tipoColors[tipo] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                {tipo}
                            </span>
                        )}
                        {isFile && (
                            <span className="text-[10px] text-[#8fa5b8]">
                                {formatBytes((item as DriveItem).size)}
                            </span>
                        )}
                    </div>
                    <h3 className="text-sm font-semibold text-[#1e2d40] truncate">{nome}</h3>
                    {desc && <p className="text-xs text-[#4a6075] mt-0.5 line-clamp-2">{desc}</p>}
                    {isSheet && item.VERSAO && (
                        <span className="text-[10px] text-[#8fa5b8] mt-1 inline-block">v{item.VERSAO}</span>
                    )}
                </div>
                {url && (
                    <a
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-[#f0f4f8] text-[#4a90d9] flex-shrink-0"
                        title="Abrir no Drive"
                    >
                        <ExternalLink size={15} />
                    </a>
                )}
            </div>
        </div>
    );
}


// ─── TabBar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: {
    tabs: { id: string; label: string; icon: React.ReactNode }[];
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <div className="flex gap-1 bg-[#f0f4f8] p-1 rounded-xl">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${active === tab.id
                        ? 'bg-white text-[#1e2d40] shadow-sm'
                        : 'text-[#4a6075] hover:text-[#1e2d40]'
                        }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function Modelos() {
    const { sheetsApiUrl, targetSheetUrl, driveRootFolderId, isSheetsLinked, isDriveLinked } = useConfig();
    const [activeTab, setActiveTab] = useState<'pranchas' | 'documentos' | 'templates' | 'catalogo'>('pranchas');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [catalogoItems, setCatalogoItems] = useState<ModeloSheet[]>([]);
    const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false);

    useEffect(() => {
        if (isSheetsLinked && sheetsApiUrl && targetSheetUrl) {
            setIsLoadingCatalogo(true);
            fetchModelos(sheetsApiUrl, targetSheetUrl)
                .then(data => setCatalogoItems(data))
                .finally(() => setIsLoadingCatalogo(false));
        }
    }, [isSheetsLinked, sheetsApiUrl, targetSheetUrl]);

    const tabs = [
        { id: 'pranchas', label: 'Pranchas', icon: <Layout size={15} /> },
        { id: 'documentos', label: 'Documentos', icon: <FileText size={15} /> },
        { id: 'templates', label: 'Templates', icon: <File size={15} /> },
        { id: 'catalogo', label: 'Catálogo', icon: <BookOpen size={15} /> },
    ];

    // Subpastas mapeadas — só funciona se souber o ID da pasta de Modelos no Drive
    // Vamos listar a pasta raiz filtrada por tipo por enquanto
    const subFolderMap: Record<string, string> = {
        pranchas: 'Pranchas',
        documentos: 'Documentos',
        templates: 'Templates',
    };

    const notConfigured = !isSheetsLinked && !isDriveLinked;

    if (notConfigured) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle size={40} className="text-amber-400 mb-4" />
                <h3 className="text-lg font-bold text-[#1e2d40] mb-2">Configuração necessária</h3>
                <p className="text-sm text-[#4a6075] max-w-sm mb-4">
                    Vincule o Google Drive e a planilha de dados para acessar os modelos da equipe.
                </p>
                <p className="text-xs text-[#8fa5b8]">Acesse: Configurações → Vincular Drive</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[#0f1f30]">Modelos</h2>
                    <p className="text-xs text-[#8fa5b8] mt-0.5">Biblioteca de pranchas, documentos e templates padronizados</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#f0f4f8] rounded-lg p-1">
                        <button onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                            <Grid size={14} className="text-[#4a6075]" />
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                            <List size={14} className="text-[#4a6075]" />
                        </button>
                    </div>
                    {isDriveLinked && (
                        <a
                            href={`https://drive.google.com/drive/folders/${driveRootFolderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#dde3ee] rounded-xl text-sm font-medium text-[#4a6075] hover:border-[#4a90d9]/40 hover:text-[#4a90d9] transition-all shadow-sm"
                        >
                            <ExternalLink size={14} />
                            Abrir no Drive
                        </a>
                    )}
                    {isSheetsLinked && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#4a90d9] text-white rounded-xl text-sm font-bold hover:bg-[#3a7bc8] transition-all shadow-md shadow-[#4a90d9]/25">
                            <Upload size={14} />
                            Adicionar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} />

            {/* Content */}
            {activeTab === 'catalogo' ? (
                <div>
                    {isLoadingCatalogo ? (
                        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#4a90d9]" /></div>
                    ) : catalogoItems.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-[#dde3ee]">
                            <BookOpen size={40} className="text-[#dde3ee] mx-auto mb-3" />
                            <p className="text-[#4a6075] font-medium">Catálogo vazio</p>
                            <p className="text-xs text-[#8fa5b8] mt-1">Adicione modelos pela planilha na aba "Modelos"</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                            {catalogoItems.map(item => (
                                <ModeloCard key={item.ID} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            ) : isDriveLinked && sheetsApiUrl ? (
                <div className="bg-white rounded-xl border border-[#dde3ee] p-4">
                    <div className="flex items-center gap-2 text-xs text-[#8fa5b8] mb-4 bg-[#f8fafc] border border-[#eef1f5] rounded-lg p-2.5">
                        <ChevronRight size={12} />
                        <span>Drive / Modelos / {subFolderMap[activeTab]}</span>
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 mb-4">
                        ⚠️ Para listar os arquivos desta pasta, o Apps Script precisa conhecer o ID da subpasta "Modelos".
                        Execute a inicialização no módulo de Configurações para criar e vincular automaticamente.
                    </p>
                    <div className="text-center py-8 text-[#8fa5b8]">
                        <FolderOpen size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Pasta: Modelos / {subFolderMap[activeTab]}</p>
                        <a
                            href={`https://drive.google.com/drive/folders/${driveRootFolderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-xs text-[#4a90d9] hover:underline"
                        >
                            <ExternalLink size={12} />
                            Abrir pasta pai no Drive
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-[#dde3ee]">
                    <AlertCircle size={36} className="text-amber-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#4a6075]">Drive não vinculado</p>
                    <p className="text-xs text-[#8fa5b8] mt-1">Configure o Google Drive nas Configurações para navegar pelos arquivos</p>
                </div>
            )}

            {/* Ação Rápida */}
            {isSheetsLinked && (
                <div className="p-4 bg-gradient-to-r from-[#1e2d40] to-[#2d4b73] rounded-xl text-white flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-sm font-bold">Precisa de um novo modelo?</p>
                        <p className="text-xs text-white/60 mt-0.5">Adicione diretamente na aba "Modelos" da sua planilha de dados</p>
                    </div>
                    <a
                        href={targetSheetUrl ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all border border-white/20"
                    >
                        <Plus size={14} />
                        Abrir Planilha
                    </a>
                </div>
            )}
        </div>
    );
}
