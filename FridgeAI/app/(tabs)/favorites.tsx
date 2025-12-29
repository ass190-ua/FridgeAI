import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Toast } from '@/components/ui/Toast'; 

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estado para el Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' });

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
  };

  const fetchFavorites = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setFavorites(data || []);
    }
    setLoading(false);
  };

  // Lógica de borrado
  const handleDelete = async (id: number) => {
    // Guardamos copia por si falla
    const previousFavorites = [...favorites];
    
    // Borramos visualmente inmediatamente
    setFavorites(prev => prev.filter(item => item.id !== id));
    
    // Borramos en segundo plano
    const { error } = await supabase.from('favorites').delete().eq('id', id);

    if (error) {
      // Si falla, revertimos y avisamos
      setFavorites(previousFavorites);
      showToast("No se pudo eliminar. Revisa tu conexión.", "error");
    } else {
      showToast("Receta eliminada", "success");
    }
  };

  // Componente que aparece al deslizar a la izquierda
  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(id)}>
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>Borrar</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const receta = item.recipe_json;
    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity style={styles.card} onPress={() => { setSelectedRecipe(receta); setModalVisible(true); }} activeOpacity={0.9}>
          
          <View style={styles.cardContent}>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle} numberOfLines={1}>{receta.nombre}</Text>
              
              <View style={styles.metaRow}>
                 <View style={styles.miniTag}>
                    <Ionicons name="time-outline" size={12} color="#888" />
                    <Text style={styles.metaText}>{receta.tiempo}</Text>
                 </View>
                 <View style={styles.miniTag}>
                    <Ionicons name="flame-outline" size={12} color="#888" />
                    <Text style={styles.metaText}>{receta.calorias}</Text>
                 </View>
              </View>
              
              <Text style={styles.cardDate}>
                Guardado el {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#444" style={{marginLeft: 10}}/>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>Mis Favoritos ❤️</Text>

        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFavorites} tintColor="#818CF8" />}
          ListEmptyComponent={!loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                 <Ionicons name="book-outline" size={50} color="#818CF8" />
              </View>
              <Text style={styles.emptyText}>Tu recetario está vacío</Text>
              <Text style={styles.emptySubText}>Tus mejores creaciones aparecerán aquí.</Text>
            </View>
          ) : null}
        />

        {/* Componente TOAST flotante */}
        <Toast {...toast} onHide={() => setToast(prev => ({...prev, visible: false}))} />

        {/* Modal de detalle */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBg}>
            {selectedRecipe && (
              <ScrollView contentContainerStyle={{padding: 30, paddingBottom: 80}}>
                {/* Cabecera Modal */}
                <View style={styles.modalHeaderRow}>
                   <Text style={styles.modalTitle}>{selectedRecipe.nombre}</Text>
                   <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color="#333"/>
                   </TouchableOpacity>
                </View>

                {/* Tags Destacados */}
                <View style={styles.tagsRow}>
                    <View style={styles.tag}><Text style={styles.tagText}>🔥 {selectedRecipe.calorias}</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>⏱️ {selectedRecipe.tiempo}</Text></View>
                    {selectedRecipe.dificultad && (
                        <View style={styles.tag}><Text style={styles.tagText}>📊 {selectedRecipe.dificultad}</Text></View>
                    )}
                </View>

                <Text style={styles.desc}>"{selectedRecipe.descripcion}"</Text>
                
                <View style={styles.divider}/>

                <Text style={styles.sectionHeader}>🛒 Ingredientes</Text>
                <View style={styles.ingList}>
                    {selectedRecipe.ingredientes_necesarios.map((ing:string, i:number) => (
                        <View key={i} style={styles.ingRow}>
                            <Ionicons name="ellipse" size={6} color="#818CF8" style={{marginTop:8}}/>
                            <Text style={styles.li}>{ing}</Text>
                        </View>
                    ))}
                </View>

                <View style={{height: 20}}/>

                <Text style={styles.sectionHeader}>👨‍🍳 Instrucciones</Text>
                  {selectedRecipe.pasos.map((paso:string, i:number) => (
                    <View key={i} style={styles.stepBox}>
                        <View style={styles.stepCircle}><Text style={styles.stepNum}>{i+1}</Text></View>
                        <Text style={styles.stepText}>{paso}</Text>
                    </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: 'white', marginTop: 10, marginBottom: 20, letterSpacing: -1 },
  list: { paddingBottom: 100 },
  
  // Card de receta
  card: { 
    backgroundColor: '#1E1E1E', 
    padding: 20, 
    marginBottom: 12, 
    borderRadius: 16, 
    // Borde izquierdo de color para destacar
    borderLeftWidth: 4, 
    borderLeftColor: '#818CF8',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  miniTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#AAA', fontSize: 13, fontWeight: '500' },
  cardDate: { color: '#666', fontSize: 11, marginTop: 4 },

  // Acción de borrado (SWIPE)
  deleteAction: { 
    backgroundColor: '#EF4444', 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: 90, 
    height: '90%',
    borderRadius: 16, 
    marginTop: 2, 
    marginRight: 10 
  },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginTop: 4 },

  // Estado vacío
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.8 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  emptySubText: { color: '#888', marginTop: 8 },

  // Modal
  modalBg: {flex:1, backgroundColor:'#121212'},
  modalHeaderRow: {flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 15},
  modalTitle: {color:'white', fontSize:28, fontWeight:'800', flex: 1, marginRight: 10},
  closeBtn: {backgroundColor: '#FFF', borderRadius: 20, padding: 5},
  
  tagsRow: {flexDirection:'row', gap:10, marginBottom:20, flexWrap: 'wrap'},
  tag: {backgroundColor:'#2A2A2A', paddingVertical:6, paddingHorizontal:12, borderRadius:8, borderWidth: 1, borderColor: '#333'},
  tagText:{color:'#CCC', fontWeight:'700', fontSize: 13},
  
  desc: {color:'#AAA', fontStyle:'italic', fontSize:16, lineHeight:24},
  divider: {height:1, backgroundColor:'#333', marginVertical:25},
  
  sectionHeader: {color:'#818CF8', fontSize:20, fontWeight:'800', marginBottom:15, textTransform: 'uppercase', letterSpacing: 1},
  
  ingList: {backgroundColor: '#1A1A1A', borderRadius: 16, padding: 15},
  ingRow: {flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start'},
  li: {color:'#EEE', fontSize:16, lineHeight:22, flex: 1},
  
  stepBox: {marginBottom: 20, flexDirection: 'row'},
  stepCircle: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#818CF8', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  stepNum: {color: 'white', fontWeight: 'bold'},
  stepText: {color: '#DDD', fontSize: 16, lineHeight: 24, flex: 1}
});