import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { fetchProcessos } from '../data/sheetsApi';
import { mockProcesses } from '../data/mockData';
import type { SeiProcess } from '../types';
import { useConfig } from './ConfigContext';

interface ProcessosContextData {
    processes: SeiProcess[];
    isLoading: boolean;
    isMock: boolean;
    refreshProcessos: () => Promise<void>;
    dashboardStats: {
        totalAtivos: number;
        emAnalise: number;
        aprovadosMes: number;
        pendentes: number;
    };
}

const ProcessosContext = createContext<ProcessosContextData>({} as ProcessosContextData);

export function ProcessosProvider({ children }: { children: ReactNode }) {
    const { getActiveSheetsUrl, getTargetSheetUrl, isSheetsLinked } = useConfig();
    const [processes, setProcesses] = useState<SeiProcess[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMock, setIsMock] = useState(false);

    const loadProcessos = useCallback(async () => {
        setIsLoading(true);
        setIsMock(false);

        const apiUrl = getActiveSheetsUrl();
        const sheetUrl = getTargetSheetUrl();

        if (!isSheetsLinked || !apiUrl || !sheetUrl) {
            setProcesses(mockProcesses);
            setIsMock(true);
            setIsLoading(false);
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await fetchProcessos(apiUrl, sheetUrl);
            if (data && data.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: SeiProcess[] = data.map((row: any, i: number) => ({
                    id: row['ID'] || String(i + 1),
                    seiNumber: row['N° DO PROCESSO'] || `PROC-${i}`,
                    requerente: row['REQUERENTE'] || row['CADASTRO'] || 'Não Informado',
                    cadastro: row['CADASTRO'] || '',
                    lote: row['LOTE'] || '',
                    gleba: row['GLEBA'] || '',
                    assunto: row['TIPO DE PROCESSO'] || '',
                    category: row['SETOR'] || '',
                    status: row['SITUAÇÃO'] || 'Em Análise',
                    responsavel: row['ANALISTA / DESENHISTA'] || '',
                    dataCriacao: row['DATA DE ABERTURA'] || new Date().toISOString(),
                    dataAtualizacao: new Date().toISOString(),
                    endereco: row['OBSERVAÇÃO'] || '',
                    driveLink: row['LINK DRIVE'] || '',
                    hasFiles: false,
                    prioridade: row['PRIORIDADE'] || 'Normal',
                }));
                setProcesses(mapped);
                setIsMock(false);
            } else {
                setProcesses(mockProcesses);
                setIsMock(true);
            }
        } catch (e) {
            console.error('[ProcessosContext] Erro ao carregar:', e);
            setProcesses(mockProcesses);
            setIsMock(true);
        } finally {
            setIsLoading(false);
        }
    }, [getActiveSheetsUrl, getTargetSheetUrl, isSheetsLinked]);

    useEffect(() => {
        loadProcessos();
    }, [loadProcessos]);

    const stats = useMemo(() => ({
        totalAtivos: processes.filter(p => p.status !== 'Arquivado').length,
        emAnalise: processes.filter(p => p.status === 'Em Análise').length,
        aprovadosMes: processes.filter(p => p.status === 'Aprovado').length,
        pendentes: processes.filter(p => p.status === 'Pendente').length,
    }), [processes]);

    return (
        <ProcessosContext.Provider value={{
            processes,
            isLoading,
            isMock,
            refreshProcessos: loadProcessos,
            dashboardStats: stats
        }}>
            {children}
        </ProcessosContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProcessos() {
    return useContext(ProcessosContext);
}
