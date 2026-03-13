import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ConfigContextData {
    driveRootFolderId: string | null;
    normativasFolderId: string | null;
    sheetsApiUrl: string | null;
    isDriveLinked: boolean;
    isNormativasLinked: boolean;
    isSheetsLinked: boolean;
    updateDriveId: (urlOrId: string) => { success: boolean; id?: string; error?: string };
    updateNormativasId: (urlOrId: string) => { success: boolean; id?: string; error?: string };
    updateSheetsUrl: (url: string) => { success: boolean; url?: string; error?: string };
    clearDriveConfig: () => void;
    clearNormativasConfig: () => void;
    clearSheetsConfig: () => void;
    getActiveSheetsUrl: () => string;
}

const ConfigContext = createContext<ConfigContextData>({} as ConfigContextData);

const DRIVE_URL_REGEX = /\/folders\/([a-zA-Z0-9-_]+)|id=([a-zA-Z0-9-_]+)/;

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

    const isDriveLinked = !!driveRootFolderId;
    const isNormativasLinked = !!normativasFolderId;
    const isSheetsLinked = !!sheetsApiUrl;

    const getActiveSheetsUrl = () => {
        return sheetsApiUrl || import.meta.env.VITE_GOOGLE_SHEETS_API_URL || "";
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

    return (
        <ConfigContext.Provider value={{
            driveRootFolderId,
            normativasFolderId,
            sheetsApiUrl,
            isDriveLinked,
            isNormativasLinked,
            isSheetsLinked,
            updateDriveId,
            updateNormativasId,
            updateSheetsUrl,
            clearDriveConfig,
            clearNormativasConfig,
            clearSheetsConfig,
            getActiveSheetsUrl
        }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    return useContext(ConfigContext);
}
