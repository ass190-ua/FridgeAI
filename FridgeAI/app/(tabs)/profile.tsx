import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Toast } from '@/components/ui/Toast';

import { useThemeContext } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  const { isDark, setTheme } = useThemeContext();
  const c = Colors[isDark ? 'dark' : 'light'];

  const tint = '#818CF8';
  const danger = '#FF4444';

  const surface = isDark ? '#1E1E1E' : '#F3F4F6';
  const surface2 = isDark ? '#2A2A2A' : '#E5E7EB';
  const border = isDark ? '#333' : '#E5E7EB';
  const muted = isDark ? '#888' : '#6B7280';
  const muted2 = isDark ? '#AAA' : '#475569';
  const shadowBorder = isDark ? '#121212' : '#ffffff';

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || 'Chef');

        if (user.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
        else setAvatarUrl(null);

        const { count } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setFavoritesCount(count || 0);
      }
    } catch (e) {
      console.log('Error cargando perfil', e);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setUploading(true);
      const image = result.assets[0];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No usuario');

      const fileName = `${user.id}/${new Date().getTime()}.png`;
      const filePath = `${fileName}`;

      const response = await fetch(image.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setToast({ visible: true, message: 'Foto actualizada', type: 'success' });
    } catch (error: any) {
      setToast({ visible: true, message: 'Error al subir foto', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImagePress = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteImage = async () => {
    setDeleteModalVisible(false);
    setUploading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
      if (error) throw error;

      setAvatarUrl(null);
      setToast({ visible: true, message: 'Foto eliminada correctamente', type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: 'No se pudo eliminar', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setToast({ visible: true, message: 'Error al salir', type: 'error' });
  };

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const currentLevel = Math.floor(favoritesCount / 3) + 1;

  const getRankName = (count: number) => {
    if (count < 3) return 'Novato';
    if (count < 10) return 'Aprendiz';
    if (count < 20) return 'Cocinillas';
    if (count < 50) return 'Chef';
    return 'Maestro';
  };

  const currentRank = getRankName(favoritesCount);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[
                styles.avatarWrapper,
                { borderColor: border, backgroundColor: surface },
              ]}
              disabled={uploading}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: surface }]}>
                  <Text style={[styles.avatarText, { color: tint }]}>{getInitials(userEmail)}</Text>
                </View>
              )}

              {uploading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            {!uploading && (
              <TouchableOpacity
                onPress={handlePickImage}
                style={[
                  styles.editIconBadge,
                  { backgroundColor: tint, borderColor: shadowBorder },
                ]}
              >
                <Ionicons name="camera" size={14} color="white" />
              </TouchableOpacity>
            )}

            {!uploading && avatarUrl && (
              <TouchableOpacity
                onPress={handleRemoveImagePress}
                style={[
                  styles.deleteIconBadge,
                  { backgroundColor: danger, borderColor: shadowBorder },
                ]}
              >
                <Ionicons name="trash" size={14} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.email, { color: c.text }]}>{userEmail}</Text>

          <View style={[styles.roleBadge, { backgroundColor: surface2 }]}>
            <Text style={[styles.roleText, { color: muted2 }]}>{currentRank} 👨‍🍳</Text>
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: c.text }]}>{favoritesCount}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Favoritos</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: border }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: c.text }]}>{currentLevel}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Nivel</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: border }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: c.text }]}>{currentRank === 'Maestro' ? '👑' : '🔪'}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Rango</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: muted }]}>Preferencias</Text>

        <View style={[styles.cardContainer, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(129, 140, 248, 0.12)' }]}>
                <Ionicons name="moon" size={20} color={tint} />
              </View>
              <Text style={[styles.rowLabel, { color: c.text }]}>Modo Oscuro</Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={(enabled) => {
                const newTheme = enabled ? 'dark' : 'light';
                setTheme(newTheme);
              }}
              trackColor={{ false: isDark ? '#333' : '#CBD5E1', true: tint }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(74, 222, 128, 0.12)' }]}>
                <Ionicons name="language" size={20} color="#4ADE80" />
              </View>
              <Text style={[styles.rowLabel, { color: c.text }]}>Idioma</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ color: muted }}>Español</Text>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { color: muted }]}>Cuenta</Text>

        <View style={[styles.cardContainer, { backgroundColor: surface, borderColor: border }]}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="log-out-outline" size={20} color={danger} />
              </View>
              <Text style={[styles.rowLabel, { color: danger }]}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: isDark ? '#444' : '#94A3B8' }]}>FridgeAI v1.1.0</Text>
      </ScrollView>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="trash-outline" size={32} color={danger} />
            </View>
            <Text style={[styles.modalTitle, { color: c.text }]}>¿Eliminar foto?</Text>
            <Text style={[styles.modalText, { color: muted2 }]}>Volverás a ver tus iniciales en el perfil.</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.modalBtnCancel, { backgroundColor: surface2 }]}
              >
                <Text style={[styles.modalBtnTextCancel, { color: c.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDeleteImage}
                style={[styles.modalBtnConfirm, { backgroundColor: danger }]}
              >
                <Text style={styles.modalBtnTextConfirm}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={() => setToast((prev) => ({ ...prev, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },

  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },

  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: 'bold' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  deleteIconBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  email: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },

  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1 },

  sectionHeader: {
    marginBottom: 10,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 5,
  },

  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 1,
  },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginLeft: 65 },

  version: { textAlign: 'center', fontSize: 12, marginTop: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalText: { fontSize: 14, textAlign: 'center', marginBottom: 25 },

  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnTextCancel: { fontWeight: '600' },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnTextConfirm: { color: 'white', fontWeight: 'bold' },
});
