import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { TeamMember } from '../types';

// Mock inicial — dados ficam aqui até que as tabelas Supabase sejam configuradas
const mockEquipe: TeamMember[] = [
    {
        id: '1',
        nome: 'Ana Paula Silva',
        cargo: 'Arquiteta',
        setor: 'Urbanismo',
        email: 'ana.silva@prefeitura.gov.br',
        processosSob: 12,
    },
    {
        id: '2',
        nome: 'Carlos Eduardo Santos',
        cargo: 'Engenheiro Civil',
        setor: 'Obras',
        email: 'carlos.santos@prefeitura.gov.br',
        processosSob: 8,
    },
    {
        id: '3',
        nome: 'Mariana Costa',
        cargo: 'Técnica Administrativa',
        setor: 'SEURBH',
        email: 'mariana.costa@prefeitura.gov.br',
        processosSob: 5,
    },
];

interface EquipeContextData {
    equipe: TeamMember[];
    isLoading: boolean;
    addMembro: (membro: Omit<TeamMember, 'id'>) => Promise<boolean>;
    updateMembro: (id: string, updates: Partial<Omit<TeamMember, 'id'>>) => Promise<boolean>;
    deleteMembro: (id: string) => Promise<boolean>;
    refreshEquipe: () => Promise<void>;
}

const EquipeContext = createContext<EquipeContextData>({} as EquipeContextData);

export function EquipeProvider({ children }: { children: ReactNode }) {
    const [equipe, setEquipe] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadEquipe = useCallback(async () => {
        setIsLoading(true);
        // TODO: Quando o Supabase estiver configurado, substituir por query real
        setEquipe(mockEquipe);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadEquipe();
    }, [loadEquipe]);

    const addMembro = useCallback(async (membro: Omit<TeamMember, 'id'>): Promise<boolean> => {
        const novo: TeamMember = { ...membro, id: `local-${Date.now()}` };
        setEquipe(prev => [...prev, novo]);
        return true;
    }, []);

    const updateMembro = useCallback(async (id: string, updates: Partial<Omit<TeamMember, 'id'>>): Promise<boolean> => {
        setEquipe(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        return true;
    }, []);

    const deleteMembro = useCallback(async (id: string): Promise<boolean> => {
        setEquipe(prev => prev.filter(m => m.id !== id));
        return true;
    }, []);

    return (
        <EquipeContext.Provider value={{ equipe, isLoading, addMembro, updateMembro, deleteMembro, refreshEquipe: loadEquipe }}>
            {children}
        </EquipeContext.Provider>
    );
}

export function useEquipe() {
    return useContext(EquipeContext);
}
