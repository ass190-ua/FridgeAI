// app/_layout.tsx  (o donde tengas este RootLayout)
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, StatusBar } from 'react-native';

// provider de tema de la carpeta context
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';

//Esta función contiene tu lógica actual + el theme dinámico
function RootLayoutInner() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  //isDark viene de tu ThemeContext
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

    // segments[0] es el primer trozo de la ruta actual (login, (tabs), etc.)
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

  //React Navigation theme (tabs, headers, etc.)
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

//Este es el RootLayout real: envuelve toda la app con tu ThemeProvider
export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
