import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function LoginPage() {
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email || !password || (mode === 'register' && !nome)) {
            setError('Preencha os campos obrigatórios.');
            return;
        }

        setLoading(true);

        if (mode === 'login') {
            const result = await login(email, password);
            setLoading(false);
            if (!result.success) {
                setError(result.error || 'Credenciais inválidas. Tente novamente.');
            }
        } else {
            // Register Mode
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: nome }
                }
            });

            setLoading(false);

            if (signUpError) {
                setError(signUpError.message);
            } else if (data.session) {
                window.location.reload();
            } else {
                setSuccessMsg('Conta criada com sucesso! Você já pode entrar.');
                setMode('login');
                setPassword('');
            }
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf3 100%)',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                padding: '48px 40px',
                width: '100%',
                maxWidth: '420px',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'linear-gradient(135deg, #3b5fa0 0%, #5b7ec8 100%)',
                        borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>SB</span>
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', margin: '0 0 6px' }}>
                        SEURBH Dashboard
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7a8d', margin: '0 0 24px' }}>
                        Secretaria de Urbanismo, Regularização e Habitação
                    </p>

                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: '8px', padding: '4px' }}>
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                            style={{
                                flex: 1, padding: '8px', cursor: 'pointer', border: 'none',
                                background: mode === 'login' ? '#fff' : 'transparent',
                                borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                                color: mode === 'login' ? '#1a2332' : '#6b7a8d',
                                boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                            style={{
                                flex: 1, padding: '8px', cursor: 'pointer', border: 'none',
                                background: mode === 'register' ? '#fff' : 'transparent',
                                borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                                color: mode === 'register' ? '#1a2332' : '#6b7a8d',
                                boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Criar Conta
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                placeholder="Seu nome"
                                required
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    border: '1.5px solid #d1d8e0', borderRadius: '8px',
                                    fontSize: '14px', color: '#1a2332',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            E-mail institucional
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="usuario@prefeitura.gov.br"
                            autoComplete="email"
                            required
                            style={{
                                width: '100%', padding: '10px 14px',
                                border: '1.5px solid #d1d8e0', borderRadius: '8px',
                                fontSize: '14px', color: '#1a2332',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Senha
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                style={{
                                    width: '100%', padding: '10px 40px 10px 14px',
                                    border: '1.5px solid #d1d8e0', borderRadius: '8px',
                                    fontSize: '14px', color: '#1a2332',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', color: '#6b7a8d', padding: 0,
                                    display: 'flex', alignItems: 'center', fontSize: '12px'
                                }}
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        {mode === 'register' && (
                            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Mínimo de 6 caracteres.</p>
                        )}
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '10px 12px',
                            marginBottom: '16px', fontSize: '13px', color: '#b91c1c',
                        }}>
                            <strong style={{ marginRight: '8px' }}>Erro:</strong>
                            {typeof error === 'string' ? error : 'Ocorreu um erro inesperado.'}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            borderRadius: '8px', padding: '10px 12px',
                            marginBottom: '16px', fontSize: '13px', color: '#1e40af',
                        }}>
                            <strong style={{ marginRight: '8px' }}>Aviso:</strong>
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '12px',
                            background: loading ? '#8faad4' : 'linear-gradient(135deg, #3b5fa0 0%, #5b7ec8 100%)',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            fontSize: '14px', fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading
                            ? 'Aguarde...'
                            : (mode === 'login' ? 'Entrar no Sistema' : 'Criar minha Conta')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px', marginBottom: 0 }}>
                    Acesso restrito a servidores autorizados da SEURBH
                </p>
            </div>
        </div>
    );
}
