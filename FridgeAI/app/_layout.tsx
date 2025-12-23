import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, StatusBar } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

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

    // Arreglo del error de TypeScript: forzamos a string
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
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212'}}>
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  // ESTRUCTURA CORRECTA: StatusBar y ThemeProvider envuelven al Stack, no al revés.
  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-code" />
        <Stack.Screen name="change-password" />
      </Stack>
    </ThemeProvider>
  );
}