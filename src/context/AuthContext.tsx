import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sbGetProfile, sbLogout } from '../data/supabaseApi';
import type { UserSession, UserProfile, UserRole } from '../types/auth.types';
import { PERMISSIONS } from '../types/auth.types';

interface AuthContextData {
    session: UserSession;
    isLoading: boolean;
    isSupabaseReady: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => void;
    can: (permission: keyof typeof PERMISSIONS[UserRole]) => boolean;
}

const defaultSession: UserSession = {
    userId: '',
    email: '',
    profile: null,
    role: 'viewer',
    isAuthenticated: false,
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<UserSession>(defaultSession);
    const [isLoading, setIsLoading] = useState(true);
    const isSupabaseReady = isSupabaseConfigured();

    const buildSession = useCallback(async (supabaseUser: { id: string; email?: string } | null): Promise<UserSession> => {
        if (!supabaseUser) return defaultSession;

        const profile = await sbGetProfile(supabaseUser.id);
        return {
            userId: supabaseUser.id,
            email: supabaseUser.email ?? '',
            profile,
            role: profile?.role ?? 'viewer',
            isAuthenticated: true,
        };
    }, []);

    useEffect(() => {
        console.log("[AuthContext] isSupabaseReady:", isSupabaseReady);
        if (!isSupabaseReady) {
            setIsLoading(false);
            return;
        }

        console.log("[AuthContext] Iniciando carregamento da sessão...");

        // Promise para forçar o destravamento caso o getSession do SDK congele silenciosamente
        const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout no getSession do Supabase")), 8000)
        );

        // Checa sessão inicial com Race
        Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
        ]).then(async ({ data, error }) => {
            console.log("[AuthContext] getSession finalizado", { data, error });
            if (error) {
                console.error("Erro no getSession:", error);
                setIsLoading(false);
                return;
            }
            try {
                if (data?.session?.user) {
                    const built = await buildSession(data.session.user);
                    setSession(built);
                }
            } catch (err) {
                console.error("Erro crítico ao construir a sessão:", err);
            } finally {
                setIsLoading(false);
            }
        }).catch(err => {
            console.error("Exceção não tratada ou Timeout no getSession:", err);
            setIsLoading(false); // Destrava a UI em caso de Exception
        });

        // Listener para mudanças (login, logout, refresh token)
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
            if (supabaseSession?.user) {
                const built = await buildSession(supabaseSession.user);
                setSession(built);
            } else {
                setSession(defaultSession);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [isSupabaseReady, buildSession]);

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (!isSupabaseReady) {
            return { success: false, error: 'Supabase não configurado. Verifique as variáveis de ambiente.' };
        }
        try {
            const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout: O servidor de autenticação demorou muito para responder na primeira conexão. Tente novamente.")), 25000)
            );

            const { error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                timeoutPromise
            ]);

            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message || String(e) };
        }
    }, [isSupabaseReady]);

    const logout = useCallback(async () => {
        if (isSupabaseReady) {
            await sbLogout();
        }
        setSession(defaultSession);
    }, [isSupabaseReady]);

    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        setSession(prev => ({
            ...prev,
            profile: prev.profile ? { ...prev.profile, ...updates } : null,
            role: updates.role ?? prev.role,
        }));
    }, []);

    /** Verifica se o usuário logado tem uma determinada permissão */
    const can = useCallback((permission: keyof typeof PERMISSIONS[UserRole]): boolean => {
        return PERMISSIONS[session.role][permission] ?? false;
    }, [session.role]);

    const value = useMemo(() => ({
        session,
        isLoading,
        isSupabaseReady,
        login,
        logout,
        updateProfile,
        can,
    }), [session, isLoading, isSupabaseReady, login, logout, updateProfile, can]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
