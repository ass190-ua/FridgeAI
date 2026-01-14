import { useState, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, View, StatusBar, Text, Keyboard, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { generarReceta } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/components/ui/Toast';

import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

const SUGGESTIONS = ['Pollo', 'Arroz', 'Huevos', 'Tomate', 'Pasta', 'Queso', 'Leche', 'Atún'];

export default function HomeScreen() {
  const [ingredientes, setIngredientes] = useState('');
  const [receta, setReceta] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const router = useRouter();

  // tema actual
  const { isDark } = useThemeContext();
  const c = Colors[isDark ? 'dark' : 'light'];

  useFocusEffect(
    useCallback(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserEmail(user.email || '');
          if (user.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
          else setAvatarUrl(null);
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

    if (resultado) setReceta(resultado);
    else setToast({ visible: true, message: 'Error conectando con el chef', type: 'error' });

    setCargando(false);
  };

  const handleGuardarFavorito = async () => {
    if (!receta) return;
    setGuardando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás logueado');

      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        title: receta.nombre,
        ingredients: ingredientes,
        recipe_json: receta,
      });

      if (error) throw error;
      setToast({ visible: true, message: '¡Receta guardada en favoritos!', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: 'No se pudo guardar', type: 'error' });
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

  // Colores “derivados” (para mantener tu estilo)
  const bg = c.background;
  const cardBg = isDark ? '#1E1E1E' : '#F3F4F6';
  const border = isDark ? '#333' : '#E5E7EB';
  const subtle = isDark ? '#888' : '#6B7280';
  const chipText = isDark ? '#CCC' : '#374151';
  const danger = '#FF4444';
  const tint = '#818CF8';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: subtle }]}>Hola, Chef 👋</Text>
            <Text style={[styles.title, { color: c.text }]}>
              Fridge<Text style={[styles.brandColor, { color: tint }]}>AI</Text>
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={[styles.avatarBtn, { backgroundColor: cardBg, borderColor: border }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: tint }]}>{getInitials(userEmail)}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: tint }]}>¿Qué hay en tu nevera?</Text>
            {ingredientes.length > 0 && (
              <TouchableOpacity onPress={() => setIngredientes('')}>
                <Text style={[styles.clearText, { color: danger }]}>Borrar todo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, color: c.text, borderColor: border }]}
              placeholder="Ej: 2 huevos, limón, arroz..."
              placeholderTextColor={isDark ? '#555' : '#9CA3AF'}
              value={ingredientes}
              onChangeText={setIngredientes}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: tint }, !ingredientes.trim() && [styles.disabledButton, { backgroundColor: isDark ? '#333' : '#CBD5E1' }]]}
              onPress={handleCrearReceta}
              disabled={cargando || !ingredientes.trim()}
            >
              {cargando ? <ActivityIndicator color="#000" /> : <Ionicons name="sparkles" size={24} color="#000" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sugerencias */}
        {!receta && !cargando && (
          <View style={styles.suggestionsContainer}>
            {SUGGESTIONS.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.chip, { backgroundColor: cardBg, borderColor: border }]} onPress={() => addSuggestion(item)}>
                <Text style={[styles.chipText, { color: chipText }]}>+ {item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading */}
        {cargando && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: subtle }]}>El chef está pensando...</Text>
            <ActivityIndicator size="large" color={tint} />
          </View>
        )}

        {/* Resultado */}
        {receta && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{receta.nombre}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }, guardando && { opacity: 0.5 }]}
                  onPress={handleGuardarFavorito}
                  disabled={guardando}
                >
                  <Ionicons name={guardando ? 'checkmark' : 'heart'} size={22} color={guardando ? '#4ADE80' : danger} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]} onPress={clearAll}>
                  <Ionicons name="close" size={22} color={isDark ? '#AAA' : '#475569'} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tagsContainer}>
              <View style={[styles.tag, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
                <Text style={[styles.tagText, { color: chipText }]}>⏱️ {receta.tiempo}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
                <Text style={[styles.tagText, { color: chipText }]}>🔥 {receta.calorias}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
                <Text style={[styles.tagText, { color: chipText }]}>📊 {receta.dificultad}</Text>
              </View>
            </View>

            <Text style={[styles.description, { color: isDark ? '#AAA' : '#475569' }]}>"{receta.descripcion}"</Text>
            <View style={[styles.divider, { backgroundColor: border }]} />

            <Text style={[styles.sectionTitle, { color: c.text }]}>🛒 Ingredientes</Text>
            {receta.ingredientes_necesarios.map((item: string, i: number) => (
              <Text key={i} style={[styles.text, { color: isDark ? '#DDD' : '#334155' }]}>
                • {item}
              </Text>
            ))}

            <View style={{ height: 20 }} />

            <Text style={[styles.sectionTitle, { color: c.text }]}>🍳 Pasos</Text>
            {receta.pasos.map((paso: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepCircle, { backgroundColor: tint }]}>
                  <Text style={[styles.stepNumber, { color: '#FFF' }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.text, { color: isDark ? '#DDD' : '#334155' }]}>{paso}</Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.newRecipeBtn, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB', borderColor: border }]} onPress={clearAll}>
              <Text style={[styles.newRecipeText, { color: tint }]}>✨ Generar nueva receta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Toast {...toast} onHide={() => setToast((prev) => ({ ...prev, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  greeting: { fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  brandColor: {},

  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontWeight: 'bold', fontSize: 16 },

  inputSection: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  clearText: { fontSize: 12 },

  inputWrapper: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  input: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 60,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sendButton: { width: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  disabledButton: {},

  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14 },

  loadingContainer: { marginTop: 60, alignItems: 'center' },
  loadingText: { marginBottom: 20 },

  card: { borderRadius: 24, padding: 24, marginTop: 10, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', flex: 1, marginRight: 10 },
  actionBtn: { padding: 10, borderRadius: 50, marginLeft: 5 },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '600' },

  description: { fontStyle: 'italic', marginBottom: 10, lineHeight: 22 },
  divider: { height: 1, marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },

  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumber: { fontWeight: 'bold', fontSize: 14 },
  text: { fontSize: 16, lineHeight: 24, flex: 1 },

  newRecipeBtn: { marginTop: 30, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  newRecipeText: { fontWeight: 'bold' },
});
