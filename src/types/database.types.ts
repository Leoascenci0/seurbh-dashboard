export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            processos: {
                Row: {
                    id: string;
                    sei_number: string;
                    requerente: string;
                    cadastro: string;
                    lote: string;
                    gleba: string;
                    assunto: string;
                    category: string;
                    status: string;
                    responsavel: string;
                    data_criacao: string;
                    data_atualizacao: string;
                    endereco: string;
                    drive_link: string | null;
                    has_files: boolean;
                    prioridade: string;
                };
                Insert: Omit<Database['public']['Tables']['processos']['Row'], 'id' | 'data_criacao' | 'data_atualizacao'> & {
                    id?: string;
                    data_criacao?: string;
                    data_atualizacao?: string;
                };
                Update: Partial<Database['public']['Tables']['processos']['Insert']>;
            };
            normativas: {
                Row: {
                    id: string;
                    tipo: string;
                    numero: string;
                    titulo: string;
                    data: string;
                    ementa: string;
                    drive_link: string | null;
                };
                Insert: Omit<Database['public']['Tables']['normativas']['Row'], 'id'> & {
                    id?: string;
                };
                Update: Partial<Database['public']['Tables']['normativas']['Insert']>;
            };
            equipe: {
                Row: {
                    id: string;
                    nome: string;
                    cargo: string;
                    setor: string;
                    email: string;
                    avatar: string | null;
                    processos_sob: number;
                    drive_folder: string | null;
                };
                Insert: Omit<Database['public']['Tables']['equipe']['Row'], 'id'> & {
                    id?: string;
                };
                Update: Partial<Database['public']['Tables']['equipe']['Insert']>;
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}

// Tipos extraídos convenientemente
export type ProcessoRow = Database['public']['Tables']['processos']['Row'];
export type ProcessoInsert = Database['public']['Tables']['processos']['Insert'];
export type ProcessoUpdate = Database['public']['Tables']['processos']['Update'];

export type NormativaRow = Database['public']['Tables']['normativas']['Row'];
export type NormativaInsert = Database['public']['Tables']['normativas']['Insert'];

export type EquipeRow = Database['public']['Tables']['equipe']['Row'];
export type EquipeInsert = Database['public']['Tables']['equipe']['Insert'];
export type EquipeUpdate = Database['public']['Tables']['equipe']['Update'];
