import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, View, StatusBar, Text, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Para navegar

import { generarReceta } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

// Ingredientes comunes para añadir rápido
const SUGGESTIONS = ['Pollo', 'Arroz', 'Huevos', 'Tomate', 'Pasta', 'Queso', 'Leche', 'Atún'];

export default function HomeScreen() {
  const [ingredientes, setIngredientes] = useState('');
  const [receta, setReceta] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const router = useRouter(); // Hook de navegación

  // --- 1. LÓGICA IA ---
  const handleCrearReceta = async () => {
    if (!ingredientes.trim()) return;
    
    Keyboard.dismiss(); // Escondemos teclado
    setCargando(true);
    setReceta(null);
    
    const resultado = await generarReceta(ingredientes);
    
    if (resultado) {
      setReceta(resultado);
    } else {
      Alert.alert("Error", "El chef no ha podido conectar. Verifica tu internet.");
    }
    setCargando(false);
  };

  // --- 2. LÓGICA BD ---
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
      Alert.alert("¡Guardada!", "Receta añadida a tus favoritos ❤️");
    } catch (e: any) {
      Alert.alert("Error guardando", e.message);
    } finally {
      setGuardando(false);
    }
  };

  // --- 3. UTILIDADES UI ---
  const addSuggestion = (item: string) => {
    // Si ya hay texto, añade una coma
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
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, Chef 👋</Text>
            <Text style={styles.title}>Fridge<Text style={styles.brandColor}>AI</Text></Text>
          </View>
          {/* Al pulsar el avatar, vamos al perfil */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarPlaceholder}>
             <Text style={{fontSize: 20}}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>¿Qué tienes en la nevera?</Text>
          {/* Botón para limpiar input si hay texto */}
          {ingredientes.length > 0 && (
            <TouchableOpacity onPress={() => setIngredientes('')}>
              <Text style={styles.clearText}>Borrar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* INPUT FLOTANTE */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ej: Pollo, limón, arroz..."
            placeholderTextColor="#666"
            value={ingredientes}
            onChangeText={setIngredientes}
            multiline
            numberOfLines={2} // Un poco más alto por defecto
          />
          <TouchableOpacity 
            style={[styles.sendButton, !ingredientes.trim() && styles.disabledButton]} 
            onPress={handleCrearReceta}
            disabled={cargando || !ingredientes.trim()}
          >
            {cargando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons name="sparkles" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* SUGERENCIAS RÁPIDAS (CHIPS) - Solo si no hay receta aun */}
        {!receta && !cargando && (
          <View style={styles.suggestionsContainer}>
            {SUGGESTIONS.map((item, index) => (
              <TouchableOpacity key={index} style={styles.chip} onPress={() => addSuggestion(item)}>
                <Text style={styles.chipText}>+ {item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* LOADING */}
        {cargando && (
          <View style={{marginTop: 60, alignItems: 'center'}}>
            <Text style={{color: '#888', marginBottom: 20}}>Consultando el recetario infinito...</Text>
            <ActivityIndicator size="large" color="#818CF8" />
          </View>
        )}

        {/* TARJETA DE RESULTADO */}
        {receta && (
          <View style={styles.card}>
            {/* Cabecera Card */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{receta.nombre}</Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                {/* Botón Guardar */}
                <TouchableOpacity 
                  style={[styles.actionBtn, guardando && {opacity: 0.5}]} 
                  onPress={handleGuardarFavorito}
                  disabled={guardando}
                >
                  <Ionicons name={guardando ? "checkmark" : "heart"} size={22} color="#FF4444" />
                </TouchableOpacity>
                
                {/* Botón Cerrar/Limpiar */}
                <TouchableOpacity style={styles.actionBtn} onPress={clearAll}>
                  <Ionicons name="close" size={22} color="#AAA" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chips de Info */}
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Ionicons name="time-outline" size={14} color="#818CF8" />
                <Text style={styles.tagText}>{receta.tiempo}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="flame-outline" size={14} color="#FF9F43" />
                <Text style={styles.tagText}>{receta.calorias}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="bar-chart-outline" size={14} color="#4ADE80" />
                <Text style={styles.tagText}>{receta.dificultad}</Text>
              </View>
            </View>

            <Text style={styles.description}>"{receta.descripcion}"</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>🛒 Ingredientes</Text>
            {receta.ingredientes_necesarios.map((item: string, i: number) => (
              <View key={i} style={styles.row}>
                <Ionicons name="ellipse" size={6} color="#818CF8" style={{marginRight: 10, marginTop: 6}} />
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}

            <View style={{height: 20}} />

            <Text style={styles.sectionTitle}>🍳 Pasos a seguir</Text>
            {receta.pasos.map((paso: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.text}>{paso}</Text>
              </View>
            ))}

            {/* Botón final para generar otra */}
            <TouchableOpacity style={styles.newRecipeBtn} onPress={clearAll}>
              <Text style={styles.newRecipeText}>✨ Generar nueva receta</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS MEJORADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll: { padding: 24, paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  greeting: { color: '#888', fontSize: 16, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  brandColor: { color: '#818CF8' },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  
  // Input Area
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  label: { color: '#EEE', fontSize: 18, fontWeight: '600' },
  clearText: { color: '#FF4444', fontSize: 14 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  input: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, paddingTop: 16, // PaddingTop fix multiline
    fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#333', marginRight: 10, minHeight: 60
  },
  sendButton: { backgroundColor: '#818CF8', width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#818CF8', shadowOpacity: 0.3, shadowRadius: 10 },
  disabledButton: { backgroundColor: '#2A2A2A', shadowOpacity: 0 },

  // Chips Sugerencias
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 0 },
  chip: { backgroundColor: '#2A2A2A', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  chipText: { color: '#CCC', fontSize: 14 },

  // Card Resultados
  card: { backgroundColor: '#1E1E1E', borderRadius: 24, padding: 24, marginTop: 10, borderWidth: 1, borderColor: '#333', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', flex: 1, marginRight: 10, lineHeight: 28 },
  
  actionBtn: { backgroundColor: '#2A2A2A', padding: 10, borderRadius: 50, marginLeft: 5 },

  // Tags en Card
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  tagText: { color: '#CCC', fontSize: 12, fontWeight: '600' },

  description: { color: '#AAA', fontStyle: 'italic', lineHeight: 22, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 15 },
  
  // Listas
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#818CF8', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 0 },
  stepNumber: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  text: { color: '#DDD', fontSize: 16, lineHeight: 24, flex: 1 },

  // Botón nueva receta
  newRecipeBtn: { marginTop: 30, padding: 15, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  newRecipeText: { color: '#818CF8', fontWeight: 'bold' }
});