import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    // CAMBIO AQUÍ: Validamos que tenga AL MENOS 6 dígitos, pero no limitamos por arriba estricto
    if (!code || code.length < 6) return Alert.alert("Error", "El código parece incompleto.");
    setLoading(true);

    // Intentamos verificar como Magic Link (Email OTP)
    let { error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email',
    });

    // PLAN B: Si falla como 'email', probamos como 'recovery' (por si acaso Supabase lo catalogó diferente)
    if (error) {
       console.log("Reintentando como recovery...");
       const { error: errorRecovery } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'recovery',
      });
      error = errorRecovery;
    }

    if (error) {
      Alert.alert("Código incorrecto", "Revisa el número del correo e inténtalo de nuevo.");
      setLoading(false);
    } else {
      // ¡ÉXITO!
      router.replace('/change-password'); 
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbox-ellipses-outline" size={40} color="#818CF8" />
        </View>
        
        <Text style={styles.title}>Introduce el Código</Text>
        <Text style={styles.subtitle}>Copia el número que enviamos a tu correo</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Código numérico"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={10} // <--- CAMBIO IMPORTANTE: Ahora permite hasta 10 dígitos
            autoFocus
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Verificar y Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{marginTop: 20}} onPress={() => router.back()}>
          <Text style={{color: '#666'}}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 30 },
  content: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#333', width: '100%', height: 60, paddingHorizontal: 15, marginBottom: 20, justifyContent: 'center' },
  input: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: '100%', letterSpacing: 5 },
  button: { backgroundColor: '#818CF8', width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});