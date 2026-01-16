import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Allergen,
  DEFAULT_PREFS,
  Diet,
  getUserPreferences,
  upsertUserPreferences,
  UserPreferences,
} from '@/lib/userPreferences';

type UserPreferencesContextValue = {
  prefs: UserPreferences;
  loading: boolean;
  saving: boolean;

  setDiet: (diet: Diet) => void;
  toggleAllergen: (allergen: Allergen) => void;

  addCustomAllergy: (value: string) => void;
  removeCustomAllergy: (value: string) => void;
  clearCustomAllergies: () => void;

  refresh: () => Promise<void>;
  save: () => Promise<void>;

  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const mountedRef = useRef(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const remote = await getUserPreferences();
      if (mountedRef.current) setPrefs(remote);
    } catch (e) {
      if (mountedRef.current) setPrefs(DEFAULT_PREFS);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsertUserPreferences(prefs);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const setDiet = (diet: Diet) => {
    setPrefs((prev) => ({ ...prev, diet }));
  };

  const toggleAllergen = (allergen: Allergen) => {
    setPrefs((prev) => {
      const exists = prev.allergies.includes(allergen);
      const allergies = exists
        ? prev.allergies.filter((a) => a !== allergen)
        : [...prev.allergies, allergen];

      return { ...prev, allergies };
    });
  };

  const addCustomAllergy = (value: string) => {
    const v = value.trim();
    if (!v) return;

    setPrefs((prev) => {
      const normalized = v.toLowerCase();
      const exists = prev.customAllergies.some((x) => x.toLowerCase() === normalized);
      if (exists) return prev;
      return { ...prev, customAllergies: [...prev.customAllergies, v] };
    });
  };

  const removeCustomAllergy = (value: string) => {
    setPrefs((prev) => ({
      ...prev,
      customAllergies: prev.customAllergies.filter((x) => x !== value),
    }));
  };

  const clearCustomAllergies = () => {
    setPrefs((prev) => ({ ...prev, customAllergies: [] }));
  };

  useEffect(() => {
    mountedRef.current = true;

    refresh();

    const { data } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      mountedRef.current = false;
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      prefs,
      loading,
      saving,
      setDiet,
      toggleAllergen,
      addCustomAllergy,
      removeCustomAllergy,
      clearCustomAllergies,
      refresh,
      save,
      setPrefs,
    }),
    [prefs, loading, saving]
  );

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return ctx;
}
