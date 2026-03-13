import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'sepia';

export const PRESET_COLORS = [
    { name: 'Azul Gov', accent: '#4a90d9', emoji: '🏛️' },
    { name: 'Verde', accent: '#2e8b4a', emoji: '🌿' },
    { name: 'Marinho', accent: '#1a4fa0', emoji: '🌊' },
    { name: 'Roxo', accent: '#7c3aed', emoji: '💜' },
    { name: 'Laranja', accent: '#ea580c', emoji: '🟠' },
    { name: 'Teal', accent: '#0d9488', emoji: '🩵' },
    { name: 'Rosa', accent: '#db2777', emoji: '🌸' },
    { name: 'Grafite', accent: '#475569', emoji: '🔷' },
] as const;

const MODE_VARS: Record<ThemeMode, Record<string, string>> = {
    light: {
        '--bg-primary': '#eef2f7',
        '--bg-surface': '#ffffff',
        '--bg-elevated': '#f8fafc',
        '--text-primary': '#1e2d40',
        '--text-secondary': '#4a6075',
        '--text-muted': '#8fa5b8',
        '--border-color': '#dde3ee',
        '--border-soft': '#eaeff7',
    },
    dark: {
        '--bg-primary': '#171a21',
        '--bg-surface': '#1e2a38',
        '--bg-elevated': '#243447',
        '--text-primary': '#dde8f0',
        '--text-secondary': '#a8c0d0',
        '--text-muted': '#6a8fa8',
        '--border-color': '#2e4460',
        '--border-soft': '#243447',
    },
    sepia: {
        '--bg-primary': '#f5efe0',
        '--bg-surface': '#fdf8ee',
        '--bg-elevated': '#ece6d4',
        '--text-primary': '#3d2b1f',
        '--text-secondary': '#5c4033',
        '--text-muted': '#9c7b67',
        '--border-color': '#d4c4a0',
        '--border-soft': '#e5d8b8',
    },
};

function applyTheme(accent: string, mode: ThemeMode) {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accent);
    Object.entries(MODE_VARS[mode]).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-mode', mode);
}

interface ThemeCtx {
    accentColor: string;
    mode: ThemeMode;
    setAccentColor: (c: string) => void;
    setMode: (m: ThemeMode) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme() {
    const c = useContext(ThemeContext);
    if (!c) throw new Error('useTheme requires ThemeProvider');
    return c;
}

const DEFAULT = { accent: '#4a90d9', mode: 'light' as ThemeMode };

export function ThemeProvider({ children }: { children: ReactNode }) {
    const stored = (() => { try { return JSON.parse(localStorage.getItem('seurbh-theme') || 'null'); } catch { return null; } })();
    const [accentColor, setAcc] = useState<string>(stored?.accent ?? DEFAULT.accent);
    const [mode, setMd] = useState<ThemeMode>(stored?.mode ?? DEFAULT.mode);

    useEffect(() => {
        applyTheme(accentColor, mode);
        localStorage.setItem('seurbh-theme', JSON.stringify({ accent: accentColor, mode }));
    }, [accentColor, mode]);

    const setAccentColor = useCallback((c: string) => setAcc(c), []);
    const setMode = useCallback((m: ThemeMode) => setMd(m), []);
    const resetTheme = useCallback(() => { setAcc(DEFAULT.accent); setMd(DEFAULT.mode); }, []);

    return (
        <ThemeContext.Provider value={{ accentColor, mode, setAccentColor, setMode, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
