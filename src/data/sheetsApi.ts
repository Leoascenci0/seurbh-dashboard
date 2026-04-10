/**
 * sheetsApi.ts — Camada de comunicação com o Google Apps Script
 * O Apps Script é implantado como Web App e serve como backend HTTP.
 *
 * CORS: usamos Content-Type text/plain para evitar pre-flight OPTIONS
 * que o Google Apps Script não suporta.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProcessoSheet {
  [key: string]: string | number | boolean | null | undefined;
}

export interface MembroSheets {
  ID: string;
  NOME_COMPLETO: string;
  CARGO: string;
  EMAIL: string;
  RAMAL?: string;
  SETOR?: string;
  STATUS?: string;
  DATA_ENTRADA?: string;
  FOTO_URL?: string;
}

export interface NormativaSheet {
  ID: string;
  TIPO: 'Lei' | 'Decreto' | 'Portaria' | 'Resolução' | 'Regulamentação' | 'Orientação' | 'Parecer';
  NUMERO: string;
  TITULO: string;
  EMENTA: string;
  DATA: string;
  STATUS?: string;
  LINK_DOC?: string;
  LINK_DRIVE?: string;
  AREA?: string;
}

export interface DadoCidadeSheet {
  ID: string;
  CATEGORIA: string;
  INDICADOR: string;
  VALOR: string;
  UNIDADE?: string;
  DATA_REFERENCIA?: string;
  FONTE?: string;
  OBSERVACAO?: string;
}

export interface ModeloSheet {
  ID: string;
  TIPO: 'Prancha' | 'Documento' | 'Template';
  NOME: string;
  DESCRICAO?: string;
  DRIVE_FILE_ID?: string;
  DRIVE_URL?: string;
  VERSAO?: string;
  DATA_CRIACAO?: string;
}

export interface DriveItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  url: string;
  size?: number;
  updatedAt: string;
}

interface GasResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// ─── Core HTTP ────────────────────────────────────────────────────────────────

/**
 * Faz uma requisição POST para o Google Apps Script.
 * Usa text/plain para evitar CORS pre-flight.
 */
const fetchGas = async <T = unknown>(
  payload: Record<string, unknown>,
  url: string
): Promise<GasResponse<T>> => {
  if (!url) throw new Error('URL do Google Apps Script não configurada.');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
  }

  const json: GasResponse<T> = await response.json();
  return json;
};

// ─── Ping / Verificação ───────────────────────────────────────────────────────

export const pingGas = async (apiUrl: string): Promise<boolean> => {
  try {
    const res = await fetchGas({ action: 'ping' }, apiUrl);
    return res.status === 'success';
  } catch {
    return false;
  }
};

// ─── Inicialização ────────────────────────────────────────────────────────────

/**
 * Inicializa a infraestrutura da planilha e pastas do Drive.
 * Chama init_infra no Apps Script que cria as abas e subpastas.
 */
export const initInfrastructure = async (
  apiUrl: string,
  sheetUrl: string,
  driveFolderId: string | null
): Promise<{ success: boolean; results?: unknown; error?: string }> => {
  try {
    const res = await fetchGas({
      action: 'init_infra',
      sheetUrl,
      driveFolderId: driveFolderId || null,
    }, apiUrl);

    if (res.status === 'success') return { success: true, results: res.data };
    return { success: false, error: res.message };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

// ─── Processos ────────────────────────────────────────────────────────────────

export const fetchProcessos = async (
  apiUrl: string,
  sheetUrl: string
): Promise<ProcessoSheet[]> => {
  if (!apiUrl || !sheetUrl) return [];
  try {
    const res = await fetchGas<ProcessoSheet[]>({ action: 'fetch_processos', sheetUrl }, apiUrl);
    if (res.status === 'success') return res.data ?? [];
    console.error('[sheetsApi] fetchProcessos error:', res.message);
    return [];
  } catch (e) {
    console.error('[sheetsApi] fetchProcessos exception:', e);
    return [];
  }
};

export const saveProcesso = async (
  processo: ProcessoSheet,
  apiUrl: string,
  sheetUrl: string,
  driveFolderId?: string | null
): Promise<{ success: boolean; id?: string; driveLink?: string; error?: string }> => {
  if (!apiUrl || !sheetUrl) return { success: false, error: 'API ou Planilha não configuradas.' };
  try {
    const res = await fetchGas<{ id: string; driveLink: string | null }>({
      action: 'save_process',
      sheetUrl,
      driveFolderId: driveFolderId || null,
      processData: processo,
    }, apiUrl);

    if (res.status === 'success') {
      return { success: true, id: res.data?.id, driveLink: res.data?.driveLink ?? undefined };
    }
    return { success: false, error: res.message };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

export const deleteProcesso = async (
  id: string,
  apiUrl: string,
  sheetUrl: string
): Promise<boolean> => {
  if (!apiUrl || !sheetUrl) return false;
  try {
    const res = await fetchGas({ action: 'delete_process', sheetUrl, id }, apiUrl);
    return res.status === 'success';
  } catch {
    return false;
  }
};

// ─── Normativas ───────────────────────────────────────────────────────────────

export const fetchNormativas = async (
  apiUrl: string,
  sheetUrl: string
): Promise<NormativaSheet[]> => {
  if (!apiUrl || !sheetUrl) return [];
  try {
    const res = await fetchGas<NormativaSheet[]>({ action: 'fetch_normativas', sheetUrl }, apiUrl);
    if (res.status === 'success') return res.data ?? [];
    return [];
  } catch {
    return [];
  }
};

export const saveNormativa = async (
  normativa: Partial<NormativaSheet>,
  apiUrl: string,
  sheetUrl: string,
  driveFolderId?: string | null
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!apiUrl || !sheetUrl) return { success: false, error: 'API ou Planilha não configuradas.' };
  try {
    const res = await fetchGas<{ id: string }>({
      action: 'save_normativa',
      sheetUrl,
      driveFolderId: driveFolderId || null,
      normativaData: normativa,
    }, apiUrl);

    if (res.status === 'success') return { success: true, id: res.data?.id };
    return { success: false, error: res.message };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

// ─── Equipe ───────────────────────────────────────────────────────────────────

export const fetchEquipe = async (
  apiUrl: string,
  sheetUrl: string
): Promise<MembroSheets[]> => {
  if (!apiUrl || !sheetUrl) return [];
  try {
    const res = await fetchGas<MembroSheets[]>({ action: 'fetch_equipe', sheetUrl }, apiUrl);
    if (res.status === 'success') return res.data ?? [];
    return [];
  } catch {
    return [];
  }
};

export const saveMembro = async (
  membro: Partial<MembroSheets>,
  apiUrl: string,
  sheetUrl: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!apiUrl || !sheetUrl) return { success: false, error: 'API ou Planilha não configuradas.' };
  try {
    const res = await fetchGas<{ id: string }>({
      action: 'save_membro',
      sheetUrl,
      membroData: membro,
    }, apiUrl);

    if (res.status === 'success') return { success: true, id: res.data?.id };
    return { success: false, error: res.message };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

export const deleteMembro = async (
  id: string,
  apiUrl: string,
  sheetUrl: string
): Promise<boolean> => {
  if (!apiUrl || !sheetUrl) return false;
  try {
    const res = await fetchGas({ action: 'delete_membro', sheetUrl, id }, apiUrl);
    return res.status === 'success';
  } catch {
    return false;
  }
};

// ─── Dados da Cidade ──────────────────────────────────────────────────────────

export const fetchDadosCidade = async (
  apiUrl: string,
  sheetUrl: string
): Promise<DadoCidadeSheet[]> => {
  if (!apiUrl || !sheetUrl) return [];
  try {
    const res = await fetchGas<DadoCidadeSheet[]>({ action: 'fetch_dados_cidade', sheetUrl }, apiUrl);
    if (res.status === 'success') return res.data ?? [];
    return [];
  } catch {
    return [];
  }
};

export const saveDadoCidade = async (
  dado: Partial<DadoCidadeSheet>,
  apiUrl: string,
  sheetUrl: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!apiUrl || !sheetUrl) return { success: false, error: 'API ou Planilha não configuradas.' };
  try {
    const res = await fetchGas<{ id: string }>({
      action: 'save_dado_cidade',
      sheetUrl,
      dadoData: dado,
    }, apiUrl);

    if (res.status === 'success') return { success: true, id: res.data?.id };
    return { success: false, error: res.message };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

// ─── Modelos ──────────────────────────────────────────────────────────────────

export const fetchModelos = async (
  apiUrl: string,
  sheetUrl: string
): Promise<ModeloSheet[]> => {
  if (!apiUrl || !sheetUrl) return [];
  try {
    const res = await fetchGas<ModeloSheet[]>({ action: 'fetch_modelos', sheetUrl }, apiUrl);
    if (res.status === 'success') return res.data ?? [];
    return [];
  } catch {
    return [];
  }
};

// ─── Drive ────────────────────────────────────────────────────────────────────

export const listDriveFolder = async (
  folderId: string,
  apiUrl: string
): Promise<{ folderName: string; items: DriveItem[] }> => {
  if (!folderId || !apiUrl) return { folderName: '', items: [] };
  try {
    const res = await fetchGas<{ folderName: string; items: DriveItem[] }>({
      action: 'list_drive_folder',
      folderId,
    }, apiUrl);
    if (res.status === 'success' && res.data) return res.data;
    return { folderName: '', items: [] };
  } catch {
    return { folderName: '', items: [] };
  }
};

export const createDriveFolder = async (
  folderName: string,
  parentFolderId: string,
  apiUrl: string
): Promise<{ folderId?: string; folderUrl?: string; folderName?: string; error?: string }> => {
  if (!parentFolderId || !apiUrl) return { error: 'Parâmetros insuficientes.' };
  try {
    const res = await fetchGas<{ folderId: string; folderUrl: string; folderName: string }>({
      action: 'create_process_folder',
      parentFolderId,
      folderName,
    }, apiUrl);

    if (res.status === 'success' && res.data) return res.data;
    return { error: res.message };
  } catch (e) {
    return { error: String(e) };
  }
};
