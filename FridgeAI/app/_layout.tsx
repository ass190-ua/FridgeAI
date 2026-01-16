// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, StatusBar } from 'react-native';

import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';

function RootLayoutInner() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const { isDark } = useThemeContext();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const segment = segments[0] as string;
    const inAuthGroup = segment === 'login' || segment === 'verify-code' || segment === 'change-password';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && segment === 'login') {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? '#121212' : '#ffffff',
        }}
      >
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121212' : '#ffffff'}
      />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-code" />
        <Stack.Screen name="change-password" />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <UserPreferencesProvider>
          <RootLayoutInner />
        </UserPreferencesProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
