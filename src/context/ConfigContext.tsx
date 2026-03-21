import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ConfigContextData {
    driveRootFolderId: string | null;
    normativasFolderId: string | null;
    sheetsApiUrl: string | null;
    targetSheetUrl: string | null;
    isDriveLinked: boolean;
    isNormativasLinked: boolean;
    isSheetsLinked: boolean;
    isTargetSheetLinked: boolean;
    updateDriveId: (urlOrId: string) => { success: boolean; id?: string; error?: string };
    updateNormativasId: (urlOrId: string) => { success: boolean; id?: string; error?: string };
    updateSheetsUrl: (url: string) => { success: boolean; url?: string; error?: string };
    updateTargetSheetUrl: (url: string) => { success: boolean; url?: string; error?: string };
    clearDriveConfig: () => void;
    clearNormativasConfig: () => void;
    clearSheetsConfig: () => void;
    clearTargetSheetConfig: () => void;
    getActiveSheetsUrl: () => string;
    getTargetSheetUrl: () => string;

    // Novas Listas Dinâmicas
    customCategories: string[];
    customAssuntos: string[];
    addCategory: (cat: string) => void;
    addAssunto: (assunto: string) => void;
    removeCategory: (cat: string) => void;
    removeAssunto: (assunto: string) => void;
}

const ConfigContext = createContext<ConfigContextData>({} as ConfigContextData);

const DRIVE_URL_REGEX = /\/folders\/([a-zA-Z0-9-_]+)|id=([a-zA-Z0-9-_]+)/;

export const defaultCategories = [
    'Alvará de Construção', 'Habite-se', 'Regularização', 'Parcelamento',
    'Uso e Ocupação', 'Impugnação', 'Recurso', 'Desmembramento',
    'Remembramento', 'Desdobro', 'Loteamentos e Condomínios'
];

export const defaultAssuntos = [
    'Reserva de Nome de Loteamento', 'Viabilidade', 'LPCG', 'Mapa de Aptidão',
    'Diretriz Viária', 'Aprovação Prévia', 'Conferência de Eixo',
    'Projetos Complementares', 'Processo de Caução', 'Aprovação Final',
    'Baixa de Lotes Caucionados', 'Liberação para Construção'
];

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [driveRootFolderId, setDriveRootFolderId] = useState<string | null>(() => {
        return localStorage.getItem('seurbh_drive_root_id');
    });

    const [normativasFolderId, setNormativasFolderId] = useState<string | null>(() => {
        return localStorage.getItem('seurbh_normativas_root_id');
    });

    const [sheetsApiUrl, setSheetsApiUrl] = useState<string | null>(() => {
        return localStorage.getItem('seurbh_sheets_api_url');
    });

    const [targetSheetUrl, setTargetSheetUrl] = useState<string | null>(() => {
        return localStorage.getItem('seurbh_target_sheet_url');
    });

    const isDriveLinked = !!driveRootFolderId;
    const isNormativasLinked = !!normativasFolderId;
    const isSheetsLinked = !!sheetsApiUrl;
    const isTargetSheetLinked = !!targetSheetUrl;

    const getActiveSheetsUrl = () => {
        return sheetsApiUrl || import.meta.env.VITE_GOOGLE_SHEETS_API_URL || "";
    };

    const getTargetSheetUrl = () => {
        return targetSheetUrl || "";
    };

    // Estados das Listas Dinâmicas
    const [customCategories, setCustomCategories] = useState<string[]>(() => {
        const saved = localStorage.getItem('seurbh_custom_categories');
        return saved ? JSON.parse(saved) : defaultCategories;
    });

    const [customAssuntos, setCustomAssuntos] = useState<string[]>(() => {
        const saved = localStorage.getItem('seurbh_custom_assuntos');
        return saved ? JSON.parse(saved) : defaultAssuntos;
    });

    const addCategory = (cat: string) => {
        const txt = cat.trim();
        if (txt && !customCategories.includes(txt)) {
            const newList = [...customCategories, txt];
            setCustomCategories(newList);
            localStorage.setItem('seurbh_custom_categories', JSON.stringify(newList));
        }
    };

    const removeCategory = (cat: string) => {
        const newList = customCategories.filter(c => c !== cat);
        setCustomCategories(newList);
        localStorage.setItem('seurbh_custom_categories', JSON.stringify(newList));
    };

    const addAssunto = (assunto: string) => {
        const txt = assunto.trim();
        if (txt && !customAssuntos.includes(txt)) {
            const newList = [...customAssuntos, txt];
            setCustomAssuntos(newList);
            localStorage.setItem('seurbh_custom_assuntos', JSON.stringify(newList));
        }
    };

    const removeAssunto = (assunto: string) => {
        const newList = customAssuntos.filter(a => a !== assunto);
        setCustomAssuntos(newList);
        localStorage.setItem('seurbh_custom_assuntos', JSON.stringify(newList));
    };

    const updateDriveId = (urlOrId: string) => {
        if (!urlOrId.trim()) return { success: false, error: 'O link ou ID não pode estar vazio.' };

        let id = urlOrId.trim();

        // Se parecer uma URL, tenta extrair o ID
        if (id.includes('drive.google.com')) {
            const match = id.match(DRIVE_URL_REGEX);
            if (match) {
                id = match[1] || match[2];
            } else {
                return { success: false, error: 'Link do Google Drive inválido.' };
            }
        }

        // Validação básica de ID do Drive (alfanumérico, geralmente 33 chars)
        if (id.length < 20) {
            return { success: false, error: 'ID da pasta parece ser curto demais ou inválido.' };
        }

        localStorage.setItem('seurbh_drive_root_id', id);
        setDriveRootFolderId(id);
        return { success: true, id };
    };

    const updateNormativasId = (urlOrId: string) => {
        if (!urlOrId.trim()) return { success: false, error: 'O link ou ID não pode estar vazio.' };
        let id = urlOrId.trim();
        if (id.includes('drive.google.com')) {
            const match = id.match(DRIVE_URL_REGEX);
            if (match) {
                id = match[1] || match[2];
            } else {
                return { success: false, error: 'Link do Google Drive inválido.' };
            }
        }
        if (id.length < 20) {
            return { success: false, error: 'ID da pasta inválido.' };
        }
        localStorage.setItem('seurbh_normativas_root_id', id);
        setNormativasFolderId(id);
        return { success: true, id };
    };

    const updateSheetsUrl = (url: string) => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return { success: false, error: 'A URL não pode estar vazia.' };

        if (!trimmedUrl.startsWith('https://script.google.com/')) {
            return { success: false, error: 'A URL deve ser um link válido do Google Apps Script.' };
        }

        localStorage.setItem('seurbh_sheets_api_url', trimmedUrl);
        setSheetsApiUrl(trimmedUrl);
        return { success: true, url: trimmedUrl };
    };

    const updateTargetSheetUrl = (url: string) => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return { success: false, error: 'A URL ou ID da planilha não pode estar vazia.' };

        localStorage.setItem('seurbh_target_sheet_url', trimmedUrl);
        setTargetSheetUrl(trimmedUrl);
        return { success: true, url: trimmedUrl };
    };

    const clearDriveConfig = () => {
        localStorage.removeItem('seurbh_drive_root_id');
        setDriveRootFolderId(null);
    };

    const clearNormativasConfig = () => {
        localStorage.removeItem('seurbh_normativas_root_id');
        setNormativasFolderId(null);
    };

    const clearSheetsConfig = () => {
        localStorage.removeItem('seurbh_sheets_api_url');
        setSheetsApiUrl(null);
    };

    const clearTargetSheetConfig = () => {
        localStorage.removeItem('seurbh_target_sheet_url');
        setTargetSheetUrl(null);
    };

    return (
        <ConfigContext.Provider value={{
            driveRootFolderId,
            normativasFolderId,
            sheetsApiUrl,
            targetSheetUrl,
            isDriveLinked,
            isNormativasLinked,
            isSheetsLinked,
            isTargetSheetLinked,
            updateDriveId,
            updateNormativasId,
            updateSheetsUrl,
            updateTargetSheetUrl,
            clearDriveConfig,
            clearNormativasConfig,
            clearSheetsConfig,
            clearTargetSheetConfig,
            getActiveSheetsUrl,
            getTargetSheetUrl,
            customCategories,
            customAssuntos,
            addCategory,
            removeCategory,
            addAssunto,
            removeAssunto
        }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    return useContext(ConfigContext);
}
