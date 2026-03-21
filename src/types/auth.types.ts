/**
 * Tipos de autenticação e autorização - SEURBH Dashboard
 * 
 * Supabase é usado para: autenticação, perfis de usuário, roles e log de atividades.
 * Google Sheets/Drive continua sendo o repositório dos dados dos processos.
 */

/** Papéis de usuário no sistema */
export type UserRole =
    | 'admin'       // Acesso total: configura sistema, gerencia usuários
    | 'gestor'      // Gerencia processos, aprova, conclui
    | 'analista'    // Cria e edita processos
    | 'viewer';     // Somente leitura

/** Perfil do usuário salvo no Supabase (tabela `profiles`) */
export interface UserProfile {
    id: string;                    // UUID do auth.users
    nome_completo: string;
    email: string;
    cargo?: string;
    setor?: string;
    avatar_url?: string;
    role: UserRole;
    ativo: boolean;
    preferencias?: Record<string, unknown>;  // Configurações de interface
    created_at?: string;
    updated_at?: string;
}

/** Sessão de usuário enriquecida com perfil */
export interface UserSession {
    userId: string;
    email: string;
    profile: UserProfile | null;
    role: UserRole;
    isAuthenticated: boolean;
}

/** Permissões por role */
export const PERMISSIONS: Record<UserRole, {
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canManageUsers: boolean;
    canConfigureSystem: boolean;
}> = {
    admin: {
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canManageUsers: true,
        canConfigureSystem: true,
    },
    gestor: {
        canEdit: true,
        canDelete: false,
        canApprove: true,
        canManageUsers: false,
        canConfigureSystem: false,
    },
    analista: {
        canEdit: true,
        canDelete: false,
        canApprove: false,
        canManageUsers: false,
        canConfigureSystem: false,
    },
    viewer: {
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canManageUsers: false,
        canConfigureSystem: false,
    },
};
