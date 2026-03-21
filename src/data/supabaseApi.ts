/**
 * supabaseApi.ts
 *
 * API Supabase focada em:
 * - Autenticação (login, logout, sessão)
 * - Perfis de usuário e permissões
 * - Log de atividades
 *
 * NOTA: Dados brutos dos processos e arquivos ficam no Google Sheets/Drive.
 */
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/auth.types';

// ─────────────────────────────────────────────────────────────
// AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────

/** Login com e-mail e senha */
export const sbLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
};

/** Logout */
export const sbLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

/** Sessão atual */
export const sbGetSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
};

// ─────────────────────────────────────────────────────────────
// PERFIS DE USUÁRIO
// Usa 'any' pois os tipos do Supabase são gerados após o banco existir.
// Após criar as tabelas, rode: npx supabase gen types para atualizar.
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profilesTable = () => (supabase as any).from('profiles');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const atividadesTable = () => (supabase as any).from('atividades');

/** Busca o perfil completo do usuário logado */
export const sbGetProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await profilesTable()
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Perfil ainda não criado
        console.error('[Supabase] Erro ao buscar perfil:', error.message);
        return null;
    }
    return data as UserProfile;
};

/** Cria ou atualiza o perfil do usuário */
export const sbUpsertProfile = async (profile: Partial<UserProfile> & { id: string }): Promise<boolean> => {
    const { error } = await profilesTable()
        .upsert(profile, { onConflict: 'id' });

    if (error) {
        console.error('[Supabase] Erro ao salvar perfil:', error.message);
        return false;
    }
    return true;
};

/** Busca o role do usuário na tabela de perfis */
export const sbGetUserRole = async (userId: string): Promise<UserRole> => {
    const { data, error } = await profilesTable()
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !data) return 'viewer';
    return (data.role as UserRole) ?? 'viewer';
};

// ─────────────────────────────────────────────────────────────
// LOG DE ATIVIDADES
// ─────────────────────────────────────────────────────────────

/** Registra uma ação do usuário no sistema */
export const sbLogAtividade = async (params: {
    userId: string;
    acao: string;
    detalhes?: string;
    refId?: string;
    refTipo?: string;
}): Promise<void> => {
    const { error } = await atividadesTable().insert({
        user_id: params.userId,
        acao: params.acao,
        detalhes: params.detalhes ?? null,
        ref_id: params.refId ?? null,
        ref_tipo: params.refTipo ?? null,
    });
    if (error) {
        console.error('[Supabase] Erro ao logar atividade:', error.message);
    }
};

/** Busca o histórico de atividades recentes */
export const sbGetAtividades = async (limit = 50): Promise<unknown[]> => {
    const { data, error } = await atividadesTable()
        .select('*, profiles(nome_completo, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Supabase] Erro ao buscar atividades:', error.message);
        return [];
    }
    return data ?? [];
};

/** Salva preferências de interface do usuário (tema, filtros padrão, etc.) */
export const sbSavePreferencias = async (userId: string, prefs: Record<string, unknown>): Promise<boolean> => {
    const { error } = await profilesTable()
        .update({ preferencias: prefs })
        .eq('id', userId);

    if (error) {
        console.error('[Supabase] Erro ao salvar preferências:', error.message);
        return false;
    }
    return true;
};
