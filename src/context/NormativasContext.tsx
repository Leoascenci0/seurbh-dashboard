import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchNormativas, saveNormativa } from '../data/sheetsApi';
import { mockNormativas } from '../data/mockData';
import type { NormativaItem } from '../types';
import { useConfig } from './ConfigContext';

interface NormativasContextData {
    normativas: NormativaItem[];
    isLoading: boolean;
    isMock: boolean;
    refreshNormativas: () => Promise<void>;
    addNormativa: (norma: Omit<NormativaItem, 'id' | 'driveLink'>) => Promise<{ success: boolean; error?: string }>;
}

const NormativasContext = createContext<NormativasContextData>({} as NormativasContextData);

export function NormativasProvider({ children }: { children: ReactNode }) {
    const { getActiveSheetsUrl, getTargetSheetUrl, isSheetsLinked, driveRootFolderId } = useConfig();
    const [normativas, setNormativas] = useState<NormativaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMock, setIsMock] = useState(false);

    const loadNormativas = useCallback(async () => {
        setIsLoading(true);
        setIsMock(false);

        const apiUrl = getActiveSheetsUrl();
        const sheetUrl = getTargetSheetUrl();

        if (!isSheetsLinked || !apiUrl || !sheetUrl) {
            setNormativas(mockNormativas);
            setIsMock(true);
            setIsLoading(false);
            return;
        }

        try {
            const data = await fetchNormativas(apiUrl, sheetUrl);
            if (data && data.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: NormativaItem[] = data.map((row: any, i: number) => ({
                    id: row['ID'] || String(i + 1),
                    tipo: row['TIPO'] || 'Lei',
                    numero: row['NUMERO'] || '',
                    titulo: row['TITULO'] || '',
                    data: row['DATA'] || new Date().toISOString(),
                    ementa: row['EMENTA'] || '',
                    driveLink: row['LINK_DRIVE'] || '',
                    status: row['STATUS'] || 'Ativo',
                    area: row['AREA'] || '',
                }));
                setNormativas(mapped);
                setIsMock(false);
            } else {
                setNormativas(mockNormativas);
                setIsMock(true);
            }
        } catch (e) {
            console.error('[NormativasContext] Erro ao carregar:', e);
            setNormativas(mockNormativas);
            setIsMock(true);
        } finally {
            setIsLoading(false);
        }
    }, [getActiveSheetsUrl, getTargetSheetUrl, isSheetsLinked]);

    useEffect(() => {
        loadNormativas();
    }, [loadNormativas]);

    const addNormativa = async (norma: Omit<NormativaItem, 'id' | 'driveLink'>): Promise<{ success: boolean; error?: string }> => {
        const apiUrl = getActiveSheetsUrl();
        const sheetUrl = getTargetSheetUrl();

        if (!isSheetsLinked || !apiUrl || !sheetUrl) {
            return { success: false, error: 'Configure a planilha antes de salvar normativas.' };
        }

        try {
            const result = await saveNormativa(
                {
                    TIPO: norma.tipo as NormativaItem['tipo'],
                    NUMERO: norma.numero,
                    TITULO: norma.titulo,
                    EMENTA: norma.ementa,
                    DATA: norma.data,
                },
                apiUrl,
                sheetUrl,
                driveRootFolderId
            );

            if (result.success) {
                await loadNormativas();
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (e) {
            console.error('[NormativasContext] Erro ao salvar:', e);
            return { success: false, error: String(e) };
        }
    };

    return (
        <NormativasContext.Provider value={{
            normativas,
            isLoading,
            isMock,
            refreshNormativas: loadNormativas,
            addNormativa,
        }}>
            {children}
        </NormativasContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNormativas() {
    return useContext(NormativasContext);
}
