import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Text, StatusBar, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NUEVOS ESTADOS
  const [confirmPassword, setConfirmPassword] = useState(''); // Para verificar pass
  const [showPassword, setShowPassword] = useState(false);    // Para el ojito
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  // --- FUNCIÓN 1: AUTENTICACIÓN (LOGIN O REGISTRO) ---
  async function handleAuth() {
    setLoading(true);
    
    // 1. Validaciones básicas
    if (!email || !password) {
      Alert.alert("Faltan datos", "Por favor escribe email y contraseña.");
      setLoading(false);
      return;
    }

    // 2. Validación extra SOLO para Registro
    if (isRegistering) {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Las contraseñas no coinciden. Compruébalo.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        Alert.alert("Seguridad", "La contraseña debe tener al menos 6 caracteres.");
        setLoading(false);
        return;
      }
    }

    let error;

    if (isRegistering) {
      // REGISTRARSE
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      error = signUpError;
      if (!error) Alert.alert('¡Casi listo!', 'Te hemos enviado un email para confirmar tu cuenta.');
    } else {
      // INICIAR SESIÓN
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      error = signInError;
    }

    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  // --- FUNCIÓN 2: RECUPERAR CONTRASEÑA ---
  async function handleResetPassword() {
    if (!email) return Alert.alert("Falta el email", "Escribe tu correo arriba.");
    
    setLoading(true);
    
    // Usamos signInWithOtp para generar un código de 6 dígitos
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
    });
    
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // Si todo va bien, vamos a la pantalla de poner el código
      router.push({ pathname: '/verify-code', params: { email: email } });
      Alert.alert("Código enviado", "Revisa tu correo y copia el número.");
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* LOGO */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={{fontSize: 40}}>🧊</Text>
          </View>
          <Text style={styles.appName}>Fridge<Text style={styles.brandColor}>AI</Text></Text>
          <Text style={styles.subtitle}>Tu cocina inteligente</Text>
        </View>

        {/* FORMULARIO */}
        <View style={styles.form}>
          
          {/* EMAIL */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder="Correo electrónico"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* CONTRASEÑA (Con Ojito) */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              placeholder="Contraseña"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword} // Aquí está la magia
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{padding: 5}}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* CONFIRMAR CONTRASEÑA (Solo en Registro) */}
          {isRegistering && (
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                placeholder="Repite la contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* BOTÓN DE ACCIÓN */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAuth} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegistering ? 'Crear cuenta gratis' : 'Entrar en mi cocina'}
              </Text>
            )}
          </TouchableOpacity>

          {/* LINK OLVIDÉ CONTRASEÑA (Solo en Login) */}
          {!isRegistering && (
            <TouchableOpacity onPress={handleResetPassword} style={styles.forgotButton}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

        </View>

        {/* CAMBIO DE MODO */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRegistering ? '¿Ya tienes cuenta?' : '¿Eres nuevo aquí?'}
          </Text>
          <TouchableOpacity onPress={() => {
            setIsRegistering(!isRegistering);
            setConfirmPassword(''); // Limpiamos el campo al cambiar
          }}>
            <Text style={styles.linkText}>
              {isRegistering ? ' Inicia Sesión' : ' Regístrate ahora'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ESTILOS DARK MODE
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#333',
    shadowColor: '#818CF8', shadowOffset: {width:0, height:4}, shadowOpacity:0.2, shadowRadius:10, elevation:5
  },
  appName: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  brandColor: { color: '#818CF8' },
  subtitle: { color: '#888', marginTop: 5, fontSize: 16 },

  form: { gap: 15, marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E1E', borderRadius: 12,
    borderWidth: 1, borderColor: '#333',
    height: 55, paddingHorizontal: 15
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 16, height: '100%' },
  
  forgotButton: { alignSelf: 'flex-end', paddingVertical: 5 },
  forgotText: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },

  primaryButton: { 
    backgroundColor: '#818CF8', height: 55, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4
  },
  primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  footerText: { color: '#888', fontSize: 15 },
  linkText: { color: '#818CF8', fontWeight: 'bold', fontSize: 15 }
});