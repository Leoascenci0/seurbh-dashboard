import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { fetchProcessos } from '../data/sheetsApi';
import { mockProcesses } from '../data/mockData';
import type { SeiProcess } from '../types';
import { useConfig } from './ConfigContext';

interface ProcessosContextData {
    processes: SeiProcess[];
    isLoading: boolean;
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
    const { getActiveSheetsUrl, getTargetSheetUrl } = useConfig();
    const [processes, setProcesses] = useState<SeiProcess[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadProcessos = async () => {
        setIsLoading(true);
        try {
            const data = await fetchProcessos(getActiveSheetsUrl(), getTargetSheetUrl());
            if (data && data.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: SeiProcess[] = data.map((row: any, i: number) => ({
                    id: row.id || row.ID || String(i + 1),
                    seiNumber: row['N° DO PROCESSO'] || row.seiNumber || row['Número SEI'] || row.Numero || `PROC-${i}`,
                    requerente: row.REQUERENTE || row.CADASTRO || row.requerente || row.Requerente || 'Não Informado',
                    cadastro: row.CADASTRO || row['CADASTRO_LOTE'] || '',
                    lote: row.LOTE || row['N° LOTE'] || '',
                    gleba: row.GLEBA || row['NOME_GLEBA'] || '',
                    assunto: row['TIPO DE PROCESSO'] || row.assunto || row.Assunto || '',
                    category: row.SETOR || row.category || row.Categoria || '',
                    status: row.SITUAÇÃO || row.status || row.Status || 'Em Análise',
                    responsavel: row.responsavel || row['ANALISTA / DESENHISTA'] || '',
                    dataCriacao: row['DATA DE ABERTURA'] || row.dataCriacao || row['Data de Criação'] || new Date().toISOString(),
                    dataAtualizacao: row.dataAtualizacao || row['Data de Atualização'] || new Date().toISOString(),
                    endereco: row.OBSERVAÇÃO || row.endereco || row.Endereço || '',
                    driveLink: row.driveLink || row['Link do Drive'] || '',
                    hasFiles: row.hasFiles === 'true' || row.hasFiles === 'SIM' || false,
                    prioridade: row.prioridade || row.Prioridade || 'Normal',
                }));
                setProcesses(mapped);
            } else {
                setProcesses(mockProcesses);
            }
        } catch (e) {
            console.error(e);
            setProcesses(mockProcesses);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProcessos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stats = useMemo(() => {
        return {
            totalAtivos: processes.filter(p => p.status !== 'Arquivado').length,
            emAnalise: processes.filter(p => p.status === 'Em Análise').length,
            aprovadosMes: processes.filter(p => p.status === 'Aprovado').length,
            pendentes: processes.filter(p => p.status === 'Pendente').length,
        };
    }, [processes]);

    return (
        <ProcessosContext.Provider value={{
            processes,
            isLoading,
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
