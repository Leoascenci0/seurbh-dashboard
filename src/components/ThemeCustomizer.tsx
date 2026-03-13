import { useState } from 'react';
import { Palette, X, Sun, Moon, BookOpen, RotateCcw, Check } from 'lucide-react';
import { useTheme, PRESET_COLORS, type ThemeMode } from '../context/ThemeContext';
import clsx from 'clsx';

const MODES: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Claro', icon: <Sun size={13} /> },
    { id: 'dark', label: 'Escuro', icon: <Moon size={13} /> },
    { id: 'sepia', label: 'Sépia', icon: <BookOpen size={13} /> },
];

export function ThemeCustomizer() {
    const [open, setOpen] = useState(false);
    const { accentColor, mode, setAccentColor, setMode, resetTheme } = useTheme();

    return (
        <>
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

            {/* Floating button */}
            <button
                onClick={() => setOpen(o => !o)}
                title="Personalizar Tema"
                className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                style={{ backgroundColor: 'var(--accent-color)', boxShadow: '0 4px 20px var(--accent-shadow,rgba(0,0,0,.2))' }}
            >
                {open ? <X size={20} /> : <Palette size={20} />}
            </button>

            {/* Panel */}
            <div
                className={clsx(
                    'fixed bottom-20 right-6 z-50 w-72 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden',
                    open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
                )}
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}>
                    <Palette size={15} style={{ color: 'var(--accent-color)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Personalizar Tema</span>
                    <button onClick={resetTheme} title="Restaurar padrão" className="ml-auto p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <RotateCcw size={13} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Mode */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Modo</p>
                        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                                    style={mode === m.id
                                        ? { backgroundColor: 'var(--accent-color)', color: '#fff' }
                                        : { color: 'var(--text-muted)' }
                                    }
                                >
                                    {m.icon} {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preset swatches */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Cor de Destaque</p>
                        <div className="grid grid-cols-4 gap-2">
                            {PRESET_COLORS.map(p => (
                                <button
                                    key={p.accent}
                                    onClick={() => setAccentColor(p.accent)}
                                    title={p.name}
                                    className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all hover:opacity-90"
                                    style={accentColor === p.accent ? { backgroundColor: 'var(--bg-primary)', outline: `2px solid ${p.accent}`, outlineOffset: '1px' } : {}}
                                >
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: p.accent }}>
                                        {accentColor === p.accent && <Check size={12} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom picker */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Cor Personalizada</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                            <input
                                type="color"
                                value={accentColor}
                                onChange={e => setAccentColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-2 p-0.5"
                                style={{ borderColor: 'var(--border-color)', background: 'transparent' }}
                            />
                            <div className="flex-1">
                                <p className="text-[9px] font-semibold uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>Hex</p>
                                <input
                                    type="text"
                                    value={accentColor}
                                    onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value); }}
                                    maxLength={7}
                                    className="text-sm font-mono font-bold bg-transparent outline-none w-full"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: accentColor }} />
                        </div>
                    </div>

                    {/* Mini preview */}
                    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pré-visualização</p>
                        <div className="flex gap-2 items-center flex-wrap">
                            <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent-color)' }}>Botão</button>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)', backgroundColor: 'var(--bg-surface)' }}>Secundário</button>
                            <a href="#" className="text-xs font-medium underline" style={{ color: 'var(--accent-color)' }} onClick={e => e.preventDefault()}>Link</a>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                            <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
