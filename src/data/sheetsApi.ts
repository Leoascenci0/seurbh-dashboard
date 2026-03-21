import type { NormativaItem } from '../types';

export interface ProcessoSheet {
    [key: string]: string | undefined | boolean;
}

// Helper para fazer requisições POST seguras para Web Apps do Google sem esbarrar no CORS
const fetchGas = async (payload: any, url: string) => {
    if (!url) {
        throw new Error("URL do Google Apps Script não configurada.");
    }

    // IMPORTANTE: text/plain evita o pre-flight OPTIONS que quebra o CORS do Google Apps Script
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
    });

    const json = await response.json();
    return json;
};

export const fetchProcessos = async (targetUrl: string, sheetUrl: string): Promise<ProcessoSheet[]> => {
    if (!targetUrl || !sheetUrl) return [];
    try {
        const json = await fetchGas({ action: 'fetch_processos', sheetUrl }, targetUrl);
        if (json.status === 'success') {
            return json.data;
        }
        return [];
    } catch (error) {
        console.error("Erro ao buscar processos do Sheets:", error);
        return [];
    }
};

export const fetchNormativas = async (targetUrl: string, sheetUrl: string): Promise<NormativaItem[]> => {
    if (!targetUrl || !sheetUrl) return [];
    try {
        const json = await fetchGas({ action: 'fetch_normativas', sheetUrl }, targetUrl);
        if (json.status === 'success') {
            return json.data;
        }
        return [];
    } catch (error) {
        console.error("Erro ao buscar normativas do Sheets:", error);
        return [];
    }
};

export const saveProcesso = async (processo: ProcessoSheet, targetUrl: string, sheetUrl: string): Promise<boolean> => {
    if (!targetUrl || !sheetUrl) return false;
    try {
        const json = await fetchGas({
            action: 'save_process',
            sheetUrl,
            processData: processo
        }, targetUrl);
        return json.status === 'success';
    } catch (error) {
        console.error("Erro ao salvar processo no Sheets:", error);
        return false;
    }
};

export const saveNormativa = async (normativa: any, targetUrl: string, sheetUrl: string): Promise<boolean> => {
    if (!targetUrl || !sheetUrl) return false;
    try {
        const json = await fetchGas({
            action: 'save_normativa', // Added to IntegradorWorkspace later or handled differently
            sheetUrl,
            normativaData: normativa
        }, targetUrl);
        return json.status === 'success';
    } catch (error) {
        console.error("Erro ao salvar normativa no Sheets:", error);
        return false;
    }
};

export const createDriveFolder = async (folderName: string, parentFolderUrl: string, targetUrl: string) => {
    if (!targetUrl || !parentFolderUrl) throw new Error("Parâmetros insuficientes");
    const json = await fetchGas({
        action: 'create_process_folder',
        parentFolderUrl,
        folderName
    }, targetUrl);

    if (json.status !== 'success') {
        throw new Error(json.message);
    }
    return json.data; // { folderId, folderUrl, folderName }
};

export const initInfrastructure = async (sheetUrl: string, targetUrl: string) => {
    if (!targetUrl || !sheetUrl) throw new Error("Parâmetros insuficientes");
    const json = await fetchGas({
        action: 'init_infra',
        sheetUrl
    }, targetUrl);

    if (json.status !== 'success') {
        throw new Error(json.message);
    }
    return json;
};

export const concluirProcesso = async (seiNumber: string, driveRootId: string | null, targetUrl: string): Promise<boolean> => {
    // Na nova arquitetura, o link do drive é gerado automaticamente no cadastro.
    // Esta função fica como fallback para preencher a lacuna na Tabela de Processos.
    console.log("Mock de Conclusão - Pasta do processo: ", seiNumber);
    return true;
};
