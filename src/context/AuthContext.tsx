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
        if (!isSupabaseReady) {
            setIsLoading(false);
            return;
        }

        // Checa sessão inicial
        supabase.auth.getSession().then(async ({ data }) => {
            if (data.session?.user) {
                const built = await buildSession(data.session.user);
                setSession(built);
            }
            setIsLoading(false);
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
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
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
