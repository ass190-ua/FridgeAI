import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ui/Toast';
import { useI18n } from '@/context/I18nContext';

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' });
  const [isFocused, setIsFocused] = useState(false);

  const router = useRouter();
  const { t } = useI18n();

  const handleVerify = async () => {
    Keyboard.dismiss();

    if (!code || code.length < 6) {
      setToast({ visible: true, message: t('verifyCode.errCodeIncomplete'), type: 'error' });
      return;
    }

    setLoading(true);

    let { error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email',
    });

    if (error) {
      const { error: errorRecovery } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'recovery',
      });
      error = errorRecovery;
    }

    if (error) {
      setToast({ visible: true, message: t('verifyCode.errInvalidOrExpired'), type: 'error' });
      setLoading(false);
    } else {
      setToast({ visible: true, message: t('verifyCode.okVerified'), type: 'success' });
      setTimeout(() => {
        router.replace('/change-password');
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbox-ellipses-outline" size={40} color="#818CF8" />
        </View>

        <Text style={styles.title}>{t('verifyCode.title')}</Text>
        <Text style={styles.subtitle}>
          {t('verifyCode.subtitlePrefix')} {email}
        </Text>

        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder={t('verifyCode.codePlaceholder')}
            placeholderTextColor="#444"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={10}
            autoFocus
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{t('verifyCode.verifyButton')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 25, padding: 10 }} onPress={() => router.back()}>
          <Text style={styles.cancelLink}>{t('verifyCode.cancel')}</Text>
        </TouchableOpacity>
      </View>

      <Toast {...toast} onHide={() => setToast(prev => ({...prev, visible: false}))} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 30 },
  content: { alignItems: 'center', width: '100%' },

  iconCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#1E1E1E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 25,
    borderWidth: 1, borderColor: '#333',
    shadowColor: '#818CF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 15
  },

  title: { fontSize: 26, fontWeight: '800', color: 'white', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 35, fontSize: 15, paddingHorizontal: 20 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E1E1E', borderRadius: 16,
    borderWidth: 1, borderColor: '#333',
    width: '100%', height: 70, marginBottom: 25
  },
  inputFocused: { borderColor: '#818CF8', backgroundColor: '#1A1A2E' },

  input: {
    color: 'white', fontSize: 28, fontWeight: 'bold',
    textAlign: 'center', width: '100%', height: '100%',
    letterSpacing: 4
  },

  button: {
    backgroundColor: '#818CF8', width: '100%', height: 55, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  cancelLink: { color: '#666', fontSize: 15, fontWeight: '500' }
});
