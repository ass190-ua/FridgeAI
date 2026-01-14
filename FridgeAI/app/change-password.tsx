import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ui/Toast';
import { useI18n } from '@/context/I18nContext';

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' });

  const router = useRouter();
  const { t } = useI18n();

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();

    if (password.length < 6) {
      setToast({ visible: true, message: t('changePassword.errMinLength'), type: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    setLoading(false);

    if (error) {
      setToast({ visible: true, message: error.message, type: 'error' });
    } else {
      setToast({ visible: true, message: t('changePassword.okUpdated'), type: 'success' });
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-open-outline" size={40} color="#818CF8" />
        </View>

        <Text style={styles.title}>{t('changePassword.title')}</Text>
        <Text style={styles.subtitle}>{t('changePassword.subtitle')}</Text>

        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder={t('changePassword.passwordPlaceholder')}
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{t('changePassword.saveAndEnter')}</Text>}
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
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 35, fontSize: 15 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E1E', borderRadius: 14,
    borderWidth: 1, borderColor: '#333',
    width: '100%', height: 60, paddingHorizontal: 15, marginBottom: 25
  },
  inputFocused: { borderColor: '#818CF8', backgroundColor: '#1A1A2E' },

  input: { flex: 1, color: 'white', fontSize: 16, height: '100%' },
  eyeBtn: { padding: 8 },

  button: {
    backgroundColor: '#818CF8', width: '100%', height: 55, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
