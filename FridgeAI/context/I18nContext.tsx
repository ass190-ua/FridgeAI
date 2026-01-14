import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Language, translations } from '@/i18n/translations';

type I18nContextValue = {
  language: Language;
  setLanguage: (lng: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return Object.keys(vars).reduce((acc, k) => {
    return acc.replaceAll(`{{${k}}}`, String(vars[k]));
  }, text);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('language');
      if (saved === 'es' || saved === 'en') {
        setLanguageState(saved);
      }
    })();
  }, []);

  const setLanguage = (lng: Language) => {
    setLanguageState(lng);
    AsyncStorage.setItem('language', lng);
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const value =
      getByPath(translations[language], key) ??
      getByPath(translations.en, key) ??
      key;

    if (typeof value !== 'string') return key;
    return interpolate(value, vars);
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  return ctx;
}
