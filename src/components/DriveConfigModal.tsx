import { useState } from 'react';
import { X, Cloud, Link, CheckCircle, AlertCircle, Trash2, Code, Copy, Check, HelpCircle, Download } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { APPS_SCRIPT_CODE } from '../data/googleSheetsScript';
import { initInfrastructure } from '../data/sheetsApi';
import clsx from 'clsx';

interface DriveConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DriveConfigModal({ isOpen, onClose }: DriveConfigModalProps) {
    const {
        driveRootFolderId, isDriveLinked, updateDriveId, clearDriveConfig,
        normativasFolderId, isNormativasLinked, updateNormativasId, clearNormativasConfig,
        sheetsApiUrl, isSheetsLinked, updateSheetsUrl, clearSheetsConfig,
        targetSheetUrl, isTargetSheetLinked, updateTargetSheetUrl, clearTargetSheetConfig, getTargetSheetUrl, getActiveSheetsUrl
    } = useConfig();
    const [driveInputValue, setDriveInputValue] = useState('');
    const [normativasInputValue, setNormativasInputValue] = useState('');
    const [sheetsInputValue, setSheetsInputValue] = useState('');
    const [targetSheetInputValue, setTargetSheetInputValue] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string, target: 'drive' | 'normativas' | 'sheets' | 'targetSheet' | 'copy' | 'init' } | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    if (!isOpen) return null;

    const handleLinkDrive = () => {
        const result = updateDriveId(driveInputValue);
        if (result.success) {
            setFeedback({ type: 'success', message: 'Pasta vinculada com sucesso!', target: 'drive' });
            setDriveInputValue('');
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ type: 'error', message: result.error || 'Erro ao vincular.', target: 'drive' });
        }
    };

    const handleLinkNormativas = () => {
        const result = updateNormativasId(normativasInputValue);
        if (result.success) {
            setFeedback({ type: 'success', message: 'Pasta normativa vinculada!', target: 'normativas' });
            setNormativasInputValue('');
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ type: 'error', message: result.error || 'Erro ao vincular.', target: 'normativas' });
        }
    };

    const handleLinkSheets = () => {
        const result = updateSheetsUrl(sheetsInputValue);
        if (result.success) {
            setFeedback({ type: 'success', message: 'Planilha vinculada com sucesso!', target: 'sheets' });
            setSheetsInputValue('');
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ type: 'error', message: result.error || 'URL inválida.', target: 'sheets' });
        }
    };

    const handleUnlinkDrive = () => {
        if (confirm('Deseja realmente desvincular esta pasta?')) {
            clearDriveConfig();
            setFeedback(null);
        }
    };

    const handleUnlinkNormativas = () => {
        if (confirm('Deseja desvincular a pasta de normativas?')) {
            clearNormativasConfig();
            setFeedback(null);
        }
    };

    const handleLinkTargetSheet = () => {
        const result = updateTargetSheetUrl(targetSheetInputValue);
        if (result.success) {
            setFeedback({ type: 'success', message: 'Planilha alvo vinculada!', target: 'targetSheet' });
            setTargetSheetInputValue('');
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ type: 'error', message: result.error || 'URL inválida.', target: 'targetSheet' });
        }
    };

    const handleUnlinkSheets = () => {
        if (confirm('Deseja realmente desvincular o Robô Integrador?')) {
            clearSheetsConfig();
            setFeedback(null);
        }
    };

    const handleUnlinkTargetSheet = () => {
        if (confirm('Deseja desvincular a planilha de dados?')) {
            clearTargetSheetConfig();
            setFeedback(null);
        }
    };

    const handleInitInfra = async () => {
        const robotUrl = getActiveSheetsUrl();
        const sheetUrl = getTargetSheetUrl();

        if (!robotUrl || !sheetUrl) {
            setFeedback({ type: 'error', message: 'Vincule a URL do Robô e da Planilha Alvo primeiro.', target: 'init' });
            return;
        }

        setIsInitializing(true);
        setFeedback({ type: 'success', message: 'Enviando comandos para o robô. Aguarde...', target: 'init' });

        try {
            const resp = await initInfrastructure(sheetUrl, robotUrl);
            setFeedback({ type: 'success', message: 'Sucesso! Planilha preparada com abas e colunas.', target: 'init' });
            setTimeout(() => setFeedback(null), 6000);
        } catch (e: any) {
            setFeedback({ type: 'error', message: e.message || 'Erro ao comunicar com o Google.', target: 'init' });
        } finally {
            setIsInitializing(false);
        }
    };

    const handleCopyScript = async () => {
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
            setFeedback({ type: 'success', message: 'Código copiado para o clipboard!', target: 'copy' });
            setTimeout(() => setFeedback(null), 3000);
        } catch {
            setFeedback({ type: 'error', message: 'Erro ao copiar código.', target: 'copy' });
        } finally {
            setIsCopying(false);
        }
    };

    const handleExportConfig = () => {
        const config = {
            driveRootFolderId,
            sheetsApiUrl,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config_dashboard_seurbh_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0b1219]/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#1b2838] border border-[#2a475e] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a475e] bg-[#171d25]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4a90d9]/20 flex items-center justify-center text-[#4a90d9]">
                            <Cloud size={20} />
                        </div>
                        <h3 className="font-bold text-[#e1e1e1] tracking-wide">Configurações de Nuvem</h3>
                    </div>
                    <button onClick={onClose} title="Fechar" className="text-[#8fa5b8] hover:text-[#e1e1e1] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Tutorial Seção */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8fa5b8] tracking-widest uppercase flex items-center gap-2">
                                <HelpCircle size={14} className="text-amber-400" /> Tutorial: Configuração Inicial
                            </label>
                            <p className="text-[10px] text-[#5e768d]">Siga estes passos para colocar o sistema no ar.</p>
                        </div>

                        <div className="bg-[#1a222c] border border-amber-900/30 rounded-lg p-4 space-y-4">
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-100 uppercase tracking-tighter">Prepare a Planilha</p>
                                        <p className="text-[11px] text-[#8fa5b8] leading-relaxed">
                                            Crie uma planilha e uma aba chamada <b className="text-[#e1e1e1]">"Processos"</b>. Clique em <b className="text-[#e1e1e1]">Copiar Código do Script</b> abaixo.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-100 uppercase tracking-tighter">Instale o Apps Script</p>
                                        <p className="text-[11px] text-[#8fa5b8] leading-relaxed">
                                            Na planilha, vá em <b className="text-[#e1e1e1]">Extensões &gt; Apps Script</b>. Cole o código e clique em <b className="text-[#e1e1e1]">Implantar (App da Web)</b>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-100 uppercase tracking-tighter">Vincule os Links</p>
                                        <p className="text-[11px] text-[#8fa5b8] leading-relaxed">
                                            Role para baixo e cole o <b className="text-[#e1e1e1]">Link da Pasta do Drive</b>, a <b className="text-[#e1e1e1]">URL do Robô</b> e a <b className="text-[#e1e1e1]">URL da Planilha Alvo</b>. Pressione os botões para vincular.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-[#4edb83]/20 text-[#4edb83] flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</span>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-[#4edb83] uppercase tracking-tighter">Prepare a Infraestrutura</p>
                                        <p className="text-[11px] text-[#8fa5b8] leading-relaxed">
                                            Com tudo vinculado, aperte no botão mágico lá no final: <b className="text-[#e1e1e1]">"Preparar Infraestrutura da Planilha"</b>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#2a475e] pt-2" />

                    {/* Seção Drive */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8fa5b8] tracking-widest uppercase">1. Armazenamento (Drive)</label>
                            <p className="text-[10px] text-[#5e768d]">Organização automática de arquivos por processo.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={driveInputValue}
                                    onChange={(e) => setDriveInputValue(e.target.value)}
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    className="w-full bg-[#0d141b] border border-[#2a475e] rounded-lg px-4 py-2.5 text-sm text-[#e1e1e1] placeholder:text-[#384b5f] focus:outline-none focus:border-[#4a90d9] transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#384b5f]">
                                    <Link size={14} />
                                </div>
                            </div>

                            <button
                                onClick={handleLinkDrive}
                                className="w-full py-2.5 bg-[#4a90d9] hover:bg-[#5da0e6] text-[#e1e1e1] font-bold rounded-lg shadow-lg shadow-[#4a90d9]/10 transition-all active:scale-[0.98] text-sm"
                            >
                                Vincular Pasta
                            </button>
                        </div>

                        <div className={clsx(
                            "p-3 rounded-lg border flex items-center justify-between transition-colors",
                            isDriveLinked
                                ? "bg-[#18281d] border-[#2d4d38] text-[#4edb83]"
                                : "bg-[#1f191a] border-[#4d2a2c] text-[#eb5757]"
                        )}>
                            <div className="flex items-center gap-2.5">
                                {isDriveLinked ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">
                                        {isDriveLinked ? "Drive Vinculado" : "Drive Não Vinculado"}
                                    </p>
                                    {isDriveLinked && driveRootFolderId && (
                                        <p className="text-[9px] opacity-70 mt-0.5 truncate max-w-[150px]">
                                            ID: {driveRootFolderId.substring(0, 12)}...
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isDriveLinked && (
                                <button
                                    onClick={handleUnlinkDrive}
                                    className="p-1.5 hover:bg-[#eb5757]/10 text-[#eb5757] rounded-md transition-colors"
                                    title="Desvincular"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        {feedback?.target === 'drive' && (
                            <div className={clsx("text-[10px] font-medium animate-in slide-in-from-top-1", feedback.type === 'success' ? "text-[#4edb83]" : "text-[#eb5757]")}>
                                {feedback.message}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#2a475e] pt-2" />

                    {/* Seção Normativas */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8fa5b8] tracking-widest uppercase text-amber-500/80">2. Biblioteca Legislativa (Drive)</label>
                            <p className="text-[10px] text-[#5e768d]">Pasta onde as leis e decretos serão organizados.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={normativasInputValue}
                                    onChange={(e) => setNormativasInputValue(e.target.value)}
                                    placeholder="Link da Pasta 'Normativas' no Drive..."
                                    className="w-full bg-[#0d141b] border border-[#2a475e] rounded-lg px-4 py-2.5 text-sm text-[#e1e1e1] placeholder:text-[#384b5f] focus:outline-none focus:border-amber-500/50 transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#384b5f]">
                                    <Link size={14} />
                                </div>
                            </div>

                            <button
                                onClick={handleLinkNormativas}
                                className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 font-bold rounded-lg border border-amber-600/30 transition-all active:scale-[0.98] text-sm"
                            >
                                Vincular Pasta Normativa
                            </button>
                        </div>

                        <div className={clsx(
                            "p-3 rounded-lg border flex items-center justify-between transition-colors",
                            isNormativasLinked
                                ? "bg-[#282418] border-amber-900/50 text-amber-400"
                                : "bg-[#1f191a] border-[#4d2a2c] text-[#eb5757]"
                        )}>
                            <div className="flex items-center gap-2.5">
                                {isNormativasLinked ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">
                                        {isNormativasLinked ? "Normativas Vinculadas" : "Sem Pasta Normativa"}
                                    </p>
                                    {isNormativasLinked && normativasFolderId && (
                                        <p className="text-[9px] opacity-70 mt-0.5 truncate max-w-[150px]">
                                            ID: {normativasFolderId.substring(0, 12)}...
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isNormativasLinked && (
                                <button
                                    onClick={handleUnlinkNormativas}
                                    className="p-1.5 hover:bg-[#eb5757]/10 text-[#eb5757] rounded-md transition-colors"
                                    title="Desvincular"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        {feedback?.target === 'normativas' && (
                            <div className={clsx("text-[10px] font-medium animate-in slide-in-from-top-1", feedback.type === 'success' ? "text-amber-400" : "text-[#eb5757]")}>
                                {feedback.message}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#2a475e] pt-2" />

                    {/* Seção Planilha */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8fa5b8] tracking-widest uppercase">3. Dados (Sheets API)</label>
                            <p className="text-[10px] text-[#5e768d]">URL do Web App implantado no Google Apps Script.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={sheetsInputValue}
                                    onChange={(e) => setSheetsInputValue(e.target.value)}
                                    placeholder="https://script.google.com/macros/s/..."
                                    className="w-full bg-[#0d141b] border border-[#2a475e] rounded-lg px-4 py-2.5 text-sm text-[#e1e1e1] placeholder:text-[#384b5f] focus:outline-none focus:border-[#4a90d9] transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#384b5f]">
                                    <Link size={14} />
                                </div>
                            </div>

                            <button
                                onClick={handleLinkSheets}
                                className="w-full py-2.5 bg-[#4a90d9] hover:bg-[#5da0e6] text-[#e1e1e1] font-bold rounded-lg shadow-lg shadow-[#4a90d9]/10 transition-all active:scale-[0.98] text-sm"
                            >
                                Vincular API de Dados
                            </button>
                        </div>

                        <div className={clsx(
                            "p-3 rounded-lg border flex items-center justify-between transition-colors",
                            isSheetsLinked
                                ? "bg-[#18281d] border-[#2d4d38] text-[#4edb83]"
                                : "bg-[#1f191a] border-[#4d2a2c] text-[#eb5757]"
                        )}>
                            <div className="flex items-center gap-2.5">
                                {isSheetsLinked ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">
                                        {isSheetsLinked ? "API Vinculada" : "API Não Vinculada"}
                                    </p>
                                    {isSheetsLinked && sheetsApiUrl && (
                                        <p className="text-[9px] opacity-70 mt-0.5 truncate max-w-[150px]">
                                            URL: {sheetsApiUrl.substring(0, 25)}...
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isSheetsLinked && (
                                <button
                                    onClick={handleUnlinkSheets}
                                    className="p-1.5 hover:bg-[#eb5757]/10 text-[#eb5757] rounded-md transition-colors"
                                    title="Desvincular"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        {feedback?.target === 'sheets' && (
                            <div className={clsx("text-[10px] font-medium animate-in slide-in-from-top-1", feedback.type === 'success' ? "text-[#4edb83]" : "text-[#eb5757]")}>
                                {feedback.message}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#2a475e] pt-2" />

                    {/* Seção Planilha Alvo e Preparação */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8fa5b8] tracking-widest uppercase">4. Planilha Alvo (Onde os dados ficam)</label>
                            <p className="text-[10px] text-[#5e768d]">URL ou ID da planilha Google vazia (ou existente).</p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={targetSheetInputValue}
                                    onChange={(e) => setTargetSheetInputValue(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    className="w-full bg-[#0d141b] border border-[#2a475e] rounded-lg px-4 py-2.5 text-sm text-[#e1e1e1] placeholder:text-[#384b5f] focus:outline-none focus:border-[#4a90d9] transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#384b5f]">
                                    <Link size={14} />
                                </div>
                            </div>

                            <button
                                onClick={handleLinkTargetSheet}
                                className="w-full py-2.5 bg-[#4a90d9] hover:bg-[#5da0e6] text-[#e1e1e1] font-bold rounded-lg shadow-lg shadow-[#4a90d9]/10 transition-all active:scale-[0.98] text-sm"
                            >
                                Vincular Planilha Alvo
                            </button>
                        </div>

                        <div className={clsx(
                            "p-3 rounded-lg border flex items-center justify-between transition-colors",
                            isTargetSheetLinked
                                ? "bg-[#18281d] border-[#2d4d38] text-[#4edb83]"
                                : "bg-[#1f191a] border-[#4d2a2c] text-[#eb5757]"
                        )}>
                            <div className="flex items-center gap-2.5">
                                {isTargetSheetLinked ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">
                                        {isTargetSheetLinked ? "Planilha Vinculada" : "Pl. Não Vinculada"}
                                    </p>
                                    {isTargetSheetLinked && targetSheetUrl && (
                                        <p className="text-[9px] opacity-70 mt-0.5 truncate max-w-[150px]">
                                            URL: {targetSheetUrl.substring(0, 25)}...
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isTargetSheetLinked && (
                                <button
                                    onClick={handleUnlinkTargetSheet}
                                    className="p-1.5 hover:bg-[#eb5757]/10 text-[#eb5757] rounded-md transition-colors"
                                    title="Desvincular"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        {feedback?.target === 'targetSheet' && (
                            <div className={clsx("text-[10px] font-medium animate-in slide-in-from-top-1", feedback.type === 'success' ? "text-[#4edb83]" : "text-[#eb5757]")}>
                                {feedback.message}
                            </div>
                        )}

                        {/* THE MAGIC BUTTON */}
                        <div className="mt-6">
                            <button
                                onClick={handleInitInfra}
                                disabled={isInitializing}
                                className={clsx(
                                    "w-full py-3 flex items-center justify-center gap-2 font-bold rounded-lg transition-all active:scale-[0.98] text-sm text-white shadow-xl",
                                    isInitializing ? "bg-[#384b5f] cursor-not-allowed opacity-70" : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500"
                                )}
                            >
                                {isInitializing ? (
                                    <><Code className="animate-spin" size={18} /> Processando Comandos...</>
                                ) : (
                                    <><CheckCircle size={18} /> Preparar Infraestrutura da Planilha</>
                                )}
                            </button>
                            {feedback?.target === 'init' && (
                                <div className={clsx("text-xs font-bold mt-2 text-center animate-in slide-in-from-top-1", feedback.type === 'success' ? "text-[#4edb83]" : "text-[#eb5757]")}>
                                    {feedback.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-[#2a475e] pt-2" />

                    {/* Seção Script Técnico */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8fa5b8] tracking-widest uppercase flex items-center gap-2">
                                <Code size={14} className="text-[#4a90d9]" /> 4. Configuração da Planilha
                            </label>
                            <p className="text-[10px] text-[#5e768d]">Código necessário para instalar em novas planilhas.</p>
                        </div>

                        <div className="bg-[#0d141b] border border-[#2a475e] rounded-lg p-4 space-y-3">
                            <p className="text-[11px] text-[#8fa5b8] leading-relaxed">
                                Para cada nova planilha, você deve colar este script no menu <b>Extensões &gt; Apps Script</b> e implantar como <b>Web App</b>.
                            </p>

                            <button
                                onClick={handleCopyScript}
                                disabled={isCopying}
                                className={clsx(
                                    "w-full py-2.5 flex items-center justify-center gap-2 font-bold rounded-lg transition-all active:scale-[0.98] text-sm",
                                    feedback?.target === 'copy' && feedback.type === 'success'
                                        ? "bg-[#18281d] text-[#4edb83] border border-[#2d4d38]"
                                        : "bg-[#2a475e]/30 hover:bg-[#2a475e]/50 text-[#e1e1e1] border border-[#384b5f]"
                                )}
                            >
                                {feedback?.target === 'copy' && feedback.type === 'success' ? (
                                    <><Check size={16} /> Código Copiado!</>
                                ) : (
                                    <><Copy size={16} /> Copiar Código do Script</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Tip & Export */}
                <div className="px-6 py-4 bg-[#171d25] border-t border-[#2a475e] flex items-center justify-between">
                    <p className="text-[10px] text-[#5e768d] italic">
                        Dica: O ID da pasta será usado para gerenciar subpastas.
                    </p>
                    <button
                        onClick={handleExportConfig}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#4a90d9] hover:text-[#5da0e6] transition-colors"
                        title="Exportar Configurações para Backup"
                    >
                        <Download size={12} /> Exportar Backup
                    </button>
                </div>
            </div>
        </div>
    );
}
