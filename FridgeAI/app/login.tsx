import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Text, StatusBar, ScrollView, Keyboard } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Toast } from '@/components/ui/Toast';
import { useI18n } from '@/context/I18nContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const router = useRouter();
  const { t } = useI18n();

  const showToast = (msg: string, type: 'success'|'error' = 'error') => {
    setToast({ visible: true, message: msg, type });
  };

  async function handleAuth() {
    Keyboard.dismiss();
    setLoading(true);

    if (!email || !password) {
      showToast(t('login.errFillAll'), 'error');
      setLoading(false);
      return;
    }

    if (isRegistering) {
      if (password !== confirmPassword) {
        showToast(t('login.errPasswordsNoMatch'), 'error');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        showToast(t('login.errPasswordShort'), 'error');
        setLoading(false);
        return;
      }
    }

    let error;

    if (isRegistering) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) showToast(t('login.okAccountCreated'), 'success');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    }

    if (error) showToast(error.message, 'error');
    setLoading(false);
  }

  async function handleResetPassword() {
    Keyboard.dismiss();

    if (!email) {
      showToast(t('login.errWriteEmailFirst'), 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(t('login.okCodeSent'), 'success');
      setTimeout(() => {
        router.push({ pathname: '/verify-code', params: { email: email } });
      }, 1500);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 40 }}>🧊</Text>
          </View>
          <Text style={styles.appName}>Fridge<Text style={styles.brandColor}>AI</Text></Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
            <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? '#818CF8' : '#666'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={[styles.inputContainer, focusedInput === 'pass' && styles.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'pass' ? '#818CF8' : '#666'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('pass')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 5 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {isRegistering && (
            <View style={[styles.inputContainer, focusedInput === 'confirm' && styles.inputFocused]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'confirm' ? '#818CF8' : '#666'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                placeholder={t('login.confirmPasswordPlaceholder')}
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('confirm')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegistering ? t('login.createAccount') : t('login.loginButton')}
              </Text>
            )}
          </TouchableOpacity>

          {!isRegistering && (
            <TouchableOpacity onPress={handleResetPassword} style={styles.forgotButton}>
              <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRegistering ? t('login.alreadyHaveAccount') : t('login.newHere')}
          </Text>
          <TouchableOpacity onPress={() => { setIsRegistering(!isRegistering); setToast({ visible: false, message: '', type: 'success' }); }}>
            <Text style={styles.linkText}>
              {isRegistering ? ` ${t('login.signIn')}` : ` ${t('login.signUpNow')}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast {...toast} onHide={() => setToast(prev => ({...prev, visible: false}))} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, padding: 30, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  appName: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  brandColor: { color: '#818CF8' },
  subtitle: { color: '#888', marginTop: 5 },

  form: { gap: 15, marginBottom: 30 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#333', height: 55, paddingHorizontal: 15 },
  inputFocused: { borderColor: '#818CF8', backgroundColor: '#1A1A2E' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 16, height: '100%' },

  forgotButton: { alignSelf: 'center', paddingVertical: 10, marginTop: 5 },
  forgotText: { color: '#888', fontSize: 14 },

  primaryButton: { backgroundColor: '#818CF8', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  footerText: { color: '#888', fontSize: 15 },
  linkText: { color: '#818CF8', fontWeight: 'bold', fontSize: 15 }
});
