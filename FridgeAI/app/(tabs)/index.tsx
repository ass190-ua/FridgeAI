import { useState, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, View, StatusBar, Text, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { generarReceta } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/components/ui/Toast';

const SUGGESTIONS = ['Pollo', 'Arroz', 'Huevos', 'Tomate', 'Pasta', 'Queso', 'Leche', 'Atún'];

export default function HomeScreen() {
  const [ingredientes, setIngredientes] = useState('');
  const [receta, setReceta] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Datos del usuario
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' });

  const router = useRouter();

  // Cargamos los datos del usuarios (Email + Avatar)
  useFocusEffect(
    useCallback(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
           setUserEmail(user.email || '');
           if (user.user_metadata?.avatar_url) {
               setAvatarUrl(user.user_metadata.avatar_url);
           } else {
               setAvatarUrl(null);
           }
        }
      });
    }, [])
  );

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : '👤';
  };

  const handleCrearReceta = async () => {
    if (!ingredientes.trim()) return;
    Keyboard.dismiss();
    setCargando(true);
    setReceta(null);
    
    const resultado = await generarReceta(ingredientes);
    
    if (resultado) {
      setReceta(resultado);
    } else {
      setToast({ visible: true, message: "Error conectando con el chef", type: 'error' });
    }
    setCargando(false);
  };

  const handleGuardarFavorito = async () => {
    if (!receta) return;
    setGuardando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás logueado");

      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        title: receta.nombre,
        ingredients: ingredientes,
        recipe_json: receta
      });

      if (error) throw error;
      setToast({ visible: true, message: "¡Receta guardada en favoritos!", type: 'success' });

    } catch (e: any) {
      setToast({ visible: true, message: "No se pudo guardar", type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const addSuggestion = (item: string) => {
    const text = ingredientes.trim() ? `${ingredientes}, ${item}` : item;
    setIngredientes(text);
  };

  const clearAll = () => {
    setIngredientes('');
    setReceta(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, Chef 👋</Text>
            <Text style={styles.title}>Fridge<Text style={styles.brandColor}>AI</Text></Text>
          </View>
          
          {/* Avatar dinámico: Foto o Iniciales */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
             {avatarUrl ? (
                 <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
             ) : (
                 <Text style={styles.avatarText}>{getInitials(userEmail)}</Text>
             )}
          </TouchableOpacity>
        </View>

        {/* Input de ingredientes */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
             <Text style={styles.label}>¿Qué hay en tu nevera?</Text>
             {ingredientes.length > 0 && (
                <TouchableOpacity onPress={() => setIngredientes('')}>
                  <Text style={styles.clearText}>Borrar todo</Text>
                </TouchableOpacity>
             )}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ej: 2 huevos, limón, arroz..."
              placeholderTextColor="#555"
              value={ingredientes}
              onChangeText={setIngredientes}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !ingredientes.trim() && styles.disabledButton]} 
              onPress={handleCrearReceta}
              disabled={cargando || !ingredientes.trim()}
            >
              {cargando ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Ionicons name="sparkles" size={24} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sugerencias */}
        {!receta && !cargando && (
          <View style={styles.suggestionsContainer}>
            {SUGGESTIONS.map((item, index) => (
              <TouchableOpacity key={index} style={styles.chip} onPress={() => addSuggestion(item)}>
                <Text style={styles.chipText}>+ {item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Estado de carga */}
        {cargando && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>El chef está pensando...</Text>
            <ActivityIndicator size="large" color="#818CF8" />
          </View>
        )}

        {/* Tarjeta de resultado */}
        {receta && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{receta.nombre}</Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity 
                  style={[styles.actionBtn, guardando && {opacity: 0.5}]} 
                  onPress={handleGuardarFavorito}
                  disabled={guardando}
                >
                  <Ionicons name={guardando ? "checkmark" : "heart"} size={22} color={guardando ? "#4ADE80" : "#FF4444"} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={clearAll}>
                  <Ionicons name="close" size={22} color="#AAA" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tagsContainer}>
              <View style={styles.tag}><Text style={styles.tagText}>⏱️ {receta.tiempo}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>🔥 {receta.calorias}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>📊 {receta.dificultad}</Text></View>
            </View>

            <Text style={styles.description}>"{receta.descripcion}"</Text>
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>🛒 Ingredientes</Text>
            {receta.ingredientes_necesarios.map((item: string, i: number) => (
              <Text key={i} style={styles.text}>• {item}</Text>
            ))}

            <View style={{height: 20}} />

            <Text style={styles.sectionTitle}>🍳 Pasos</Text>
            {receta.pasos.map((paso: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>{i + 1}</Text></View>
                <Text style={styles.text}>{paso}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.newRecipeBtn} onPress={clearAll}>
              <Text style={styles.newRecipeText}>✨ Generar nueva receta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Toast {...toast} onHide={() => setToast(prev => ({...prev, visible: false}))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll: { padding: 24, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  greeting: { color: '#888', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  brandColor: { color: '#818CF8' },
  
  // Avatar
  avatarBtn: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', 
    borderWidth: 1, borderColor: '#333', overflow: 'hidden' // Importante para que la imagen no salga
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#818CF8', fontWeight: 'bold', fontSize: 16 },
  
  inputSection: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#818CF8', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  clearText: { color: '#FF4444', fontSize: 12 },

  inputWrapper: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  input: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 16, padding: 18,
    fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#333', 
    minHeight: 60, shadowColor: '#818CF8', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 10
  },
  sendButton: { backgroundColor: '#818CF8', width: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { backgroundColor: '#333' },

  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1E1E1E', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  chipText: { color: '#CCC', fontSize: 14 },

  loadingContainer: { marginTop: 60, alignItems: 'center' },
  loadingText: { color: '#888', marginBottom: 20 },

  card: { backgroundColor: '#1E1E1E', borderRadius: 24, padding: 24, marginTop: 10, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', flex: 1, marginRight: 10 },
  actionBtn: { backgroundColor: '#2A2A2A', padding: 10, borderRadius: 50, marginLeft: 5 },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: '#2A2A2A', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  tagText: { color: '#CCC', fontSize: 12, fontWeight: '600' },

  description: { color: '#AAA', fontStyle: 'italic', marginBottom: 10, lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 15 },
  
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#818CF8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumber: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  text: { color: '#DDD', fontSize: 16, lineHeight: 24, flex: 1 },

  newRecipeBtn: { marginTop: 30, padding: 15, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  newRecipeText: { color: '#818CF8', fontWeight: 'bold' }
});