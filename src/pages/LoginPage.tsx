import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Building2, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Preencha e-mail e senha.');
            return;
        }
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) {
            setError(result.error || 'Credenciais inválidas. Tente novamente.');
        }
        // Se sucesso, o AuthContext detecta automaticamente via onAuthStateChange
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
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'linear-gradient(135deg, #3b5fa0 0%, #5b7ec8 100%)',
                        borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Building2 size={28} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', margin: '0 0 6px' }}>
                        SEURBH Dashboard
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7a8d', margin: 0 }}>
                        Secretaria de Urbanismo, Regularização e Habitação
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
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
                            style={{
                                width: '100%', padding: '10px 14px',
                                border: '1.5px solid #d1d8e0', borderRadius: '8px',
                                fontSize: '14px', color: '#1a2332',
                                outline: 'none', boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#3b5fa0'}
                            onBlur={e => e.target.style.borderColor = '#d1d8e0'}
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
                                style={{
                                    width: '100%', padding: '10px 40px 10px 14px',
                                    border: '1.5px solid #d1d8e0', borderRadius: '8px',
                                    fontSize: '14px', color: '#1a2332',
                                    outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b5fa0'}
                                onBlur={e => e.target.style.borderColor = '#d1d8e0'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', color: '#6b7a8d', padding: 0,
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '10px 12px',
                            marginBottom: '16px', fontSize: '13px', color: '#b91c1c',
                        }}>
                            <AlertCircle size={15} />
                            {error}
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
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {loading ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Entrando...</>
                        ) : (
                            <><LogIn size={16} /> Entrar</>
                        )}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px', marginBottom: 0 }}>
                    Acesso restrito a servidores autorizados da SEURBH
                </p>
            </div>
        </div>
    );
}
