import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Indica se o Supabase está configured (ambas as variáveis de ambiente presentes).
 * Usado pelos contextos para decidir qual backend usar.
 */
export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== 'https://seu-projeto.supabase.co' &&
        supabaseAnonKey !== 'sua-anon-key');
};

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            // Mudamos a chave para escapar de um possível "navigator.locks" travado de sessões antigas
            storageKey: 'seurbh-auth-token-v2',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);
