import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Toast } from '@/components/ui/Toast';

import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const { isDark } = useThemeContext();
  const c = Colors[isDark ? 'dark' : 'light'];

  const { t } = useI18n();

  const tint = '#818CF8';
  const border = isDark ? '#333' : '#E5E7EB';
  const cardBg = isDark ? '#1E1E1E' : '#F3F4F6';
  const subtle = isDark ? '#888' : '#6B7280';

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
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

  const handleDelete = async (id: number) => {
    const previousFavorites = [...favorites];
    setFavorites((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from('favorites').delete().eq('id', id);

    if (error) {
      setFavorites(previousFavorites);
      showToast(t('favorites.deleteError'), 'error');
    } else {
      showToast(t('favorites.deleted'), 'success');
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(id)}>
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>{t('favorites.delete')}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const receta = item.recipe_json;
    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: cardBg, borderLeftColor: tint }]}
          onPress={() => {
            setSelectedRecipe(receta);
            setModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
                {receta.nombre}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.miniTag}>
                  <Ionicons name="time-outline" size={12} color={subtle} />
                  <Text style={[styles.metaText, { color: isDark ? '#AAA' : '#64748B' }]}>{receta.tiempo}</Text>
                </View>
                <View style={styles.miniTag}>
                  <Ionicons name="flame-outline" size={12} color={subtle} />
                  <Text style={[styles.metaText, { color: isDark ? '#AAA' : '#64748B' }]}>{receta.calorias}</Text>
                </View>
              </View>

              <Text style={[styles.cardDate, { color: isDark ? '#666' : '#94A3B8' }]}>
                {t('favorites.savedOn')} {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={isDark ? '#444' : '#94A3B8'} style={{ marginLeft: 10 }} />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('favorites.title')} ❤️</Text>

        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFavorites} tintColor={tint} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBg, { backgroundColor: cardBg }]}>
                  <Ionicons name="book-outline" size={50} color={tint} />
                </View>
                <Text style={[styles.emptyText, { color: c.text }]}>{t('favorites.emptyTitle')}</Text>
                <Text style={[styles.emptySubText, { color: subtle }]}>{t('favorites.emptySubtitle')}</Text>
              </View>
            ) : null
          }
        />

        <Toast {...toast} onHide={() => setToast((prev) => ({ ...prev, visible: false }))} />

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.modalBg, { backgroundColor: c.background }]}>
            {selectedRecipe && (
              <ScrollView contentContainerStyle={{ padding: 30, paddingBottom: 80 }}>
                <View style={styles.modalHeaderRow}>
                  <Text style={[styles.modalTitle, { color: c.text }]}>{selectedRecipe.nombre}</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={[styles.closeBtn, { backgroundColor: isDark ? '#FFF' : '#111827' }]}
                  >
                    <Ionicons name="close" size={24} color={isDark ? '#333' : '#fff'} />
                  </TouchableOpacity>
                </View>

                <View style={styles.tagsRow}>
                  <View style={[styles.tag, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB', borderColor: border }]}>
                    <Text style={[styles.tagText, { color: isDark ? '#CCC' : '#374151' }]}>🔥 {selectedRecipe.calorias}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB', borderColor: border }]}>
                    <Text style={[styles.tagText, { color: isDark ? '#CCC' : '#374151' }]}>⏱️ {selectedRecipe.tiempo}</Text>
                  </View>
                  {selectedRecipe.dificultad && (
                    <View style={[styles.tag, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB', borderColor: border }]}>
                      <Text style={[styles.tagText, { color: isDark ? '#CCC' : '#374151' }]}>📊 {selectedRecipe.dificultad}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.desc, { color: isDark ? '#AAA' : '#475569' }]}>"{selectedRecipe.descripcion}"</Text>

                <View style={[styles.divider, { backgroundColor: border }]} />

                <Text style={[styles.sectionHeader, { color: tint }]}>🛒 {t('favorites.ingredientsTitle')}</Text>
                <View style={[styles.ingList, { backgroundColor: isDark ? '#1A1A1A' : '#E5E7EB' }]}>
                  {selectedRecipe.ingredientes_necesarios.map((ing: string, i: number) => (
                    <View key={i} style={styles.ingRow}>
                      <Ionicons name="ellipse" size={6} color={tint} style={{ marginTop: 8 }} />
                      <Text style={[styles.li, { color: isDark ? '#EEE' : '#334155' }]}>{ing}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ height: 20 }} />

                <Text style={[styles.sectionHeader, { color: tint }]}>👨‍🍳 {t('favorites.instructionsTitle')}</Text>
                {selectedRecipe.pasos.map((paso: string, i: number) => (
                  <View key={i} style={styles.stepBox}>
                    <View style={[styles.stepCircle, { backgroundColor: tint }]}>
                      <Text style={[styles.stepNum, { color: '#fff' }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: isDark ? '#DDD' : '#334155' }]}>{paso}</Text>
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
  container: { flex: 1, paddingHorizontal: 20 },
  headerTitle: { fontSize: 34, fontWeight: '800', marginTop: 10, marginBottom: 20, letterSpacing: -1 },
  list: { paddingBottom: 100 },

  card: {
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },

  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  miniTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, fontWeight: '500' },
  cardDate: { fontSize: 11, marginTop: 4 },

  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '90%',
    borderRadius: 16,
    marginTop: 2,
    marginRight: 10,
  },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginTop: 4 },

  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.8 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold' },
  emptySubText: { marginTop: 8 },

  modalBg: { flex: 1 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  modalTitle: { fontSize: 28, fontWeight: '800', flex: 1, marginRight: 10 },
  closeBtn: { borderRadius: 20, padding: 5 },

  tagsRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  tagText: { fontWeight: '700', fontSize: 13 },

  desc: { fontStyle: 'italic', fontSize: 16, lineHeight: 24 },
  divider: { height: 1, marginVertical: 25 },

  sectionHeader: { fontSize: 20, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },

  ingList: { borderRadius: 16, padding: 15 },
  ingRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  li: { fontSize: 16, lineHeight: 22, flex: 1 },

  stepBox: { marginBottom: 20, flexDirection: 'row' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNum: { fontWeight: 'bold' },
  stepText: { fontSize: 16, lineHeight: 24, flex: 1 },
});
