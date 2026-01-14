import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;           // preferencia usuario
  isDark: boolean;        // modo final (resolved)
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

//determinamos si esta oscuro
function resolveIsDark(theme: Theme, systemScheme: ColorSchemeName) {
    //vale true si el scheme es dark
    const systemDark = systemScheme === 'dark';
    return theme === 'dark' || (theme === 'system' && systemDark);
}

//envuelve la app y provee el contexto
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    //crear estados
    const [theme, setThemeState] = useState<Theme>('system');
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

    // 1) cargar preferencia guardada al arrancar
    useEffect(() => {
        (async () => {
        const saved = await AsyncStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
            setThemeState(saved);
        }
        })();
    }, []);

    // 2) escuchar cambios del tema del sistema (si el usuario elige "system")
    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemScheme(colorScheme);
        });
        return () => sub.remove();
    }, []);

    // 3) setTheme: actualiza estado y persiste
    const setTheme = (t: Theme) => {
        setThemeState(t);
        AsyncStorage.setItem('theme', t);
    };

    const isDark = resolveIsDark(theme, systemScheme);

    // useMemo: evita recrear el objeto en cada render
    const value = useMemo(() => ({ theme, isDark, setTheme }), [theme, isDark]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useThemeContext debe usarse dentro de <ThemeProvider>');
    return ctx;
}
