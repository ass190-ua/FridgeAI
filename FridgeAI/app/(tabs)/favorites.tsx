import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const fetchFavorites = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) Alert.alert("Error", error.message);
      else setFavorites(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "¿Eliminar receta?",
      "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase.from('favorites').delete().eq('id', id);
            if (error) Alert.alert("Error", error.message);
            else fetchFavorites();
          }
        }
      ]
    );
  };

  const openRecipe = (recipeJson: any) => {
    setSelectedRecipe(recipeJson);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    const receta = item.recipe_json;

    return (
      <TouchableOpacity style={styles.card} onPress={() => openRecipe(receta)} activeOpacity={0.7}>
        {/* CABECERA DE LA TARJETA */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>{receta.nombre}</Text>
            <Text style={styles.cardDate}>
              Guardado el {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
             <Ionicons name="trash-outline" size={22} color="#FF4444" />
          </TouchableOpacity>
        </View>

        {/* ETIQUETAS (CHIPS) MEJORADAS */}
        <View style={styles.tagsContainer}>
           <View style={styles.chip}>
             <Ionicons name="time-outline" size={14} color="#818CF8" />
             <Text style={styles.chipText}>{receta.tiempo}</Text>
           </View>
           
           <View style={styles.chip}>
             <Ionicons name="flame-outline" size={14} color="#FF9F43" />
             <Text style={styles.chipText}>{receta.calorias}</Text>
           </View>

           {/* Si tienes dificultad, podrías añadirla también */}
           {receta.dificultad && (
             <View style={styles.chip}>
               <Ionicons name="bar-chart-outline" size={14} color="#4ADE80" />
               <Text style={styles.chipText}>{receta.dificultad}</Text>
             </View>
           )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Mi Recetario 📖</Text>

      {loading && favorites.length === 0 ? (
        <ActivityIndicator size="large" color="#818CF8" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFavorites} tintColor="#818CF8" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>Tu recetario está vacío.</Text>
              <Text style={styles.emptySubText}>Ve a la cocina y crea algo delicioso.</Text>
            </View>
          }
        />
      )}

      {/* MODAL DE DETALLE (Igual de funcional pero estilos pulidos) */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          {selectedRecipe && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedRecipe.nombre}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close-circle" size={36} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>"{selectedRecipe.descripcion}"</Text>

              {/* Info rápida en el modal */}
              <View style={styles.modalStatsRow}>
                <Text style={{color: '#888'}}>⏱️ {selectedRecipe.tiempo}</Text>
                <Text style={{color: '#888'}}>🔥 {selectedRecipe.calorias}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>🛒 Ingredientes</Text>
              <View style={styles.ingredientsBox}>
                {selectedRecipe.ingredientes_necesarios.map((ing: string, i: number) => (
                  <View key={i} style={styles.ingredientRow}>
                    <Ionicons name="ellipse" size={6} color="#818CF8" style={{marginTop: 6, marginRight: 8}} />
                    <Text style={styles.textItem}>{ing}</Text>
                  </View>
                ))}
              </View>

              <View style={{height: 25}} />

              <Text style={styles.sectionTitle}>🍳 Pasos a seguir</Text>
              {selectedRecipe.pasos.map((paso: string, i: number) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{i+1}</Text>
                  </View>
                  <Text style={styles.textItem}>{paso}</Text>
                </View>
              ))}
              
              <View style={{height: 50}} />
            </ScrollView>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: 'white', marginTop: 10, marginBottom: 20 },
  list: { paddingBottom: 50 },
  
  // ESTILOS DE ESTADO VACÍO
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.8 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { color: '#666', fontSize: 14, marginTop: 5 },

  // CARD MEJORADA
  card: {
    backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#333',
    // Sombra sutil para dar profundidad
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleContainer: { flex: 1, marginRight: 10 },
  cardTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', lineHeight: 26 },
  cardDate: { color: '#666', fontSize: 12, marginTop: 4 },
  
  deleteBtn: { 
    padding: 8, backgroundColor: 'rgba(255, 68, 68, 0.1)', borderRadius: 12 
  },

  // CHIPS (La solución a lo cortado)
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', // <--- ESTO ES LA CLAVE: Permite que bajen de línea si no caben
    marginTop: 15, 
    gap: 8 
  },
  chip: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#2A2A2A', 
    paddingVertical: 6, paddingHorizontal: 12, 
    borderRadius: 50, // Bordes totalmente redondos
    borderWidth: 1, borderColor: '#333'
  },
  chipText: { color: '#CCC', fontSize: 12, fontWeight: '600', marginLeft: 6 },

  // MODAL MEJORADO
  modalContainer: { flex: 1, backgroundColor: '#121212' },
  modalContent: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', flex: 1, marginRight: 15 },
  closeBtn: { marginTop: -5 },
  modalDescription: { color: '#AAA', fontStyle: 'italic', fontSize: 16, lineHeight: 24, marginTop: 5 },
  modalStatsRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  
  divider: { height: 1, backgroundColor: '#333', marginVertical: 25 },
  sectionTitle: { color: '#818CF8', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  
  ingredientsBox: { backgroundColor: '#1A1A1A', padding: 15, borderRadius: 16 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  
  textItem: { color: '#DDD', fontSize: 16, lineHeight: 24, flex: 1 },
  
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepCircle: { 
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#818CF8', 
    justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 0 
  },
  stepNum: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});