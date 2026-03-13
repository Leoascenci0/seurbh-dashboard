import type { NormativaItem } from '../types';

const GAS_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL || "";

export interface ProcessoSheet {
    [key: string]: string | undefined;
}

export const fetchProcessos = async (targetUrl?: string): Promise<ProcessoSheet[]> => {
    const url = targetUrl || GAS_URL;
    if (!url) {
        console.warn("URL do Google Apps Script não configurada.");
        return [];
    }

    try {
        const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}sheet=Processos`);
        const json = await response.json();
        if (json.status === 'success') {
            return json.data;
        }
        throw new Error(json.message);
    } catch (error) {
        console.error("Erro ao buscar processos do Sheets:", error);
        return [];
    }
};

export const fetchNormativas = async (targetUrl?: string): Promise<NormativaItem[]> => {
    const url = targetUrl || GAS_URL;
    if (!url) {
        console.warn("URL do Google Apps Script não configurada para Normativas.");
        return [];
    }

    try {
        const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}sheet=Normativas`);
        const json = await response.json();
        if (json.status === 'success') {
            return json.data;
        }
        throw new Error(json.message);
    } catch (error) {
        console.error("Erro ao buscar normativas do Sheets:", error);
        return [];
    }
};

export const saveProcesso = async (processo: ProcessoSheet, targetUrl?: string): Promise<boolean> => {
    const url = targetUrl || GAS_URL;
    if (!url) {
        console.warn("GAS_URL não configurada para salvar processo.");
        return true;
    }

    try {
        const payload = {
            action: 'save_processo',
            ...processo
        };

        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        return true;
    } catch (error) {
        console.error("Erro ao salvar processo no Sheets:", error);
        return false;
    }
};

export const saveNormativa = async (normativa: any, targetUrl?: string): Promise<boolean> => {
    const url = targetUrl || GAS_URL;
    if (!url) {
        console.warn("GAS_URL não configurada para salvar normativa.");
        return true;
    }

    try {
        const payload = {
            action: 'save_normativa',
            ...normativa
        };

        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        return true;
    } catch (error) {
        console.error("Erro ao salvar normativa no Sheets:", error);
        return false;
    }
};

export const concluirProcesso = async (seiNumber: string, driveId?: string | null, targetUrl?: string): Promise<boolean> => {
    const url = targetUrl || GAS_URL;
    if (!url) {
        console.warn("GAS_URL não configurada para concluir processo.");
        return false;
    }

    try {
        const payload = {
            action: 'concluir_processo',
            seiNumber,
            DRIVE_ROOT_ID: driveId || ''
        };

        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        return true;
    } catch (error) {
        console.error("Erro ao concluir processo no Sheets:", error);
        return false;
    }
};
