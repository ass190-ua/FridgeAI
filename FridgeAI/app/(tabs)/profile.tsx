import { StyleSheet, View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('Cargando...');

  useEffect(() => {
    // Obtenemos el email del usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email || 'Usuario');
    });
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error", error.message);
    // El _layout.tsx detectará que no hay usuario y te mandará al Login solo
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* CABECERA PERFIL */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={{fontSize: 40}}>👤</Text>
          </View>
          <Text style={styles.email}>{userEmail}</Text>
          <Text style={styles.role}>Chef Maestro</Text>
        </View>

        {/* SECCIONES DE AJUSTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <View style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Ionicons name="moon" size={22} color="#818CF8" />
              <Text style={styles.settingText}>Modo Oscuro</Text>
            </View>
            <Switch value={true} disabled trackColor={{false: '#333', true: '#818CF8'}} />
          </View>

          <View style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Ionicons name="language" size={22} color="#818CF8" />
              <Text style={styles.settingText}>Idioma (Español)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 - FridgeAI</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 24, flex: 1 },
  
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E1E1E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: '#333'
  },
  email: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  role: { color: '#818CF8', marginTop: 5 },

  section: { marginBottom: 30 },
  sectionTitle: { color: '#666', marginBottom: 15, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#2A2A2A'
  },
  settingText: { color: '#FFF', fontSize: 16 },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 'auto', marginBottom: 20,
    padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#333', backgroundColor: 'rgba(255, 68, 68, 0.1)'
  },
  logoutText: { color: '#FF4444', fontSize: 16, fontWeight: 'bold' },
  version: { color: '#444', textAlign: 'center', fontSize: 12 }
});