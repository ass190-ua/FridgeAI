import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (password.length < 6) return Alert.alert("Error", "Mínimo 6 caracteres.");
    setLoading(true);

    // Como ya estamos logueados por el código OTP, solo actualizamos el usuario
    const { error } = await supabase.auth.updateUser({ password: password });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("¡Hecho!", "Contraseña actualizada correctamente.", [
        { text: "Ir al Inicio", onPress: () => router.replace('/(tabs)') }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-open-outline" size={40} color="#4ADE80" />
        </View>
        
        <Text style={styles.title}>Nueva Contraseña</Text>
        <Text style={styles.subtitle}>Acceso verificado. Crea tu nueva clave.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Guardar Nueva Clave</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 30 },
  content: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#333', width: '100%', height: 55, paddingHorizontal: 15, marginBottom: 20 },
  input: { flex: 1, color: 'white', fontSize: 16, height: '100%' },
  button: { backgroundColor: '#4ADE80', width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});