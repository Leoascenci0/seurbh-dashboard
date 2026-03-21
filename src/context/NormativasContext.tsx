import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchNormativas, saveNormativa } from '../data/sheetsApi';
import { mockNormativas } from '../data/mockData';
import type { NormativaItem } from '../types';
import { useConfig } from './ConfigContext';

interface NormativasContextData {
    normativas: NormativaItem[];
    isLoading: boolean;
    refreshNormativas: () => Promise<void>;
    addNormativa: (norma: Omit<NormativaItem, 'id' | 'driveLink'>) => Promise<boolean>;
}

const NormativasContext = createContext<NormativasContextData>({} as NormativasContextData);

export function NormativasProvider({ children }: { children: ReactNode }) {
    const { getActiveSheetsUrl, getTargetSheetUrl, normativasFolderId } = useConfig();
    const [normativas, setNormativas] = useState<NormativaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadNormativas = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchNormativas(getActiveSheetsUrl(), getTargetSheetUrl());
            if (data && data.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: NormativaItem[] = data.map((row: any, i: number) => ({
                    id: row.id || row.ID || String(i + 1),
                    tipo: row.TIPO || row.tipo || 'Lei',
                    numero: row.NUMERO || row.numero || '',
                    titulo: row.TITULO || row.titulo || '',
                    data: row.DATA || row.data || new Date().toISOString(),
                    ementa: row.EMENTA || row.ementa || '',
                    driveLink: row.driveLink || row['LINK DRIVE'] || '',
                }));
                setNormativas(mapped);
            } else {
                setNormativas(mockNormativas);
            }
        } catch (e) {
            console.error("Erro ao carregar normativas:", e);
            setNormativas(mockNormativas);
        } finally {
            setIsLoading(false);
        }
    }, [getActiveSheetsUrl, getTargetSheetUrl]);

    useEffect(() => {
        loadNormativas();
    }, [loadNormativas]);

    const addNormativa = async (norma: Omit<NormativaItem, 'id' | 'driveLink'>) => {
        try {
            const success = await saveNormativa({
                ...norma,
                'NORMATIVA_ROOT_ID': normativasFolderId || ''
            }, getActiveSheetsUrl(), getTargetSheetUrl());

            if (success) {
                await loadNormativas();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao adicionar normativa:", e);
            return false;
        }
    };

    return (
        <NormativasContext.Provider value={{
            normativas,
            isLoading,
            refreshNormativas: loadNormativas,
            addNormativa
        }}>
            {children}
        </NormativasContext.Provider>
    );
}

export function useNormativas() {
    return useContext(NormativasContext);
}
