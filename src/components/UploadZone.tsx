import { useState, useCallback } from 'react';
import { Upload, X, File, CheckCircle, Image, FileText, FileArchive, AlertCircle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import clsx from 'clsx';

interface UploadedFile {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'done' | 'error';
    progress: number;
}

interface UploadZoneProps {
    onClose?: () => void;
    compact?: boolean;
    seiNumber?: string;
}

function getFileIcon(file: File) {
    const type = file.type;
    if (type.startsWith('image/')) return <Image size={16} className="text-[#4a90d9]" />;
    if (type === 'application/pdf') return <FileText size={16} className="text-red-400" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive size={16} className="text-amber-500" />;
    return <File size={16} className="text-[#8fa5b8]" />;
}

export function UploadZone({ compact = false }: UploadZoneProps) {
    const { isDriveLinked } = useConfig();
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const addFiles = useCallback((newFiles: FileList | null) => {
        if (!isDriveLinked) {
            alert('Por favor, vincule uma pasta do Google Drive nas configurações primeiro!');
            return;
        }
        if (!newFiles) return;
        const fileArray = Array.from(newFiles).map(file => ({
            id: Math.random().toString(36).slice(2),
            file,
            status: 'pending' as const,
            progress: 0,
        }));
        setFiles(prev => [...prev, ...fileArray]);

        fileArray.forEach(uf => {
            setTimeout(() => {
                setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'uploading' } : f));
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 25 + 10;
                    if (progress >= 100) {
                        clearInterval(interval);
                        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'done', progress: 100 } : f));
                    } else {
                        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress } : f));
                    }
                }, 300);
            }, 300);
        });
    }, [isDriveLinked]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    }, [addFiles]);

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-3">
            <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input-upload')?.click()}
                className={clsx(
                    'border-2 border-dashed rounded-xl cursor-pointer text-center transition-all duration-200',
                    compact ? 'p-4' : 'p-8',
                    isDragging
                        ? 'border-[#4a90d9] bg-[#e8f3fd] scale-[1.01]'
                        : 'border-[#c8d6e5] hover:border-[#4a90d9]/60 hover:bg-[#f0f5ff]'
                )}
            >
                <input
                    id="file-input-upload"
                    type="file"
                    title="Selecione um arquivo"
                    multiple
                    className="hidden"
                    onChange={e => addFiles(e.target.files)}
                />
                <div className={clsx('flex flex-col items-center gap-2', compact ? 'gap-1' : 'gap-3')}>
                    <div className={clsx(
                        'rounded-full flex items-center justify-center transition-colors',
                        compact ? 'w-10 h-10' : 'w-14 h-14',
                        isDragging ? 'bg-[#4a90d9]/15 text-[#4a90d9]' : 'bg-[#eef2f7] text-[#8fa5b8]'
                    )}>
                        <Upload size={compact ? 18 : 24} />
                    </div>
                    {!compact ? (
                        <div className="flex flex-col items-center">
                            <div>
                                <p className="text-sm font-semibold text-[#1e2d40]">
                                    {isDragging ? 'Solte os arquivos aqui' : 'Arraste e solte os arquivos'}
                                </p>
                                <p className="text-xs text-[#8fa5b8] mt-1">ou clique para selecionar</p>
                            </div>
                            <p className="text-[10px] text-[#8fa5b8] mt-2">PDF, DWG, DXF, JPG, PNG, ZIP — Máx. 50MB por arquivo</p>
                        </div>
                    ) : (
                        <p className="text-xs text-[#8fa5b8]">Arraste ou clique para enviar</p>
                    )}
                </div>
            </div>

            {!isDriveLinked && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <p>O sistema não está vinculado a uma pasta do Google Drive. Os uploads não funcionarão corretamente.</p>
                </div>
            )}

            {files.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                    {files.map(uf => (
                        <div key={uf.id} className="flex items-center gap-3 bg-[#f8fafc] rounded-lg px-3 py-2.5 border border-[#dde3ee]">
                            {getFileIcon(uf.file)}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#1e2d40] truncate">{uf.file.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {uf.status === 'uploading' && (
                                        <>
                                            <div className="flex-1 h-1 bg-[#dde3ee] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#4a90d9] rounded-full transition-all duration-300"
                                                    style={{ width: `${uf.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-[#8fa5b8] flex-shrink-0">{Math.round(uf.progress)}%</span>
                                        </>
                                    )}
                                    {uf.status === 'pending' && <span className="text-[10px] text-[#8fa5b8]">Na fila...</span>}
                                    {uf.status === 'done' && <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle size={10} /> Enviado</span>}
                                    {uf.status === 'error' && <span className="text-[10px] text-red-500">Erro</span>}
                                </div>
                            </div>
                            <button title="Excluir" onClick={() => removeFile(uf.id)} className="text-[#8fa5b8] hover:text-red-400 flex-shrink-0">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
