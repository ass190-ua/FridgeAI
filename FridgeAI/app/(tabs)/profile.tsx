import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Image, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Toast } from '@/components/ui/Toast';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // EEstado para el modal 
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' });

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
        if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
        } else {
            setAvatarUrl(null);
        }
        
        const { count } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        setFavoritesCount(count || 0);
      }
    } catch (e) {
      console.log("Error cargando perfil", e);
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
        if (!user) throw new Error("No usuario");

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
            data: { avatar_url: publicUrl }
        });

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        setToast({ visible: true, message: "¡Foto actualizada!", type: 'success' });

    } catch (error: any) {
        setToast({ visible: true, message: "Error al subir foto", type: 'error' });
    } finally {
        setUploading(false);
    }
  };

  // Abrimos el modal
  const handleRemoveImagePress = () => {
    setDeleteModalVisible(true);
  };

  // Función de borrado
  const confirmDeleteImage = async () => {
    setDeleteModalVisible(false); // Cerramos modal
    setUploading(true);
    try {
        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: null }
        });
        if (error) throw error;
        
        setAvatarUrl(null);
        setToast({ visible: true, message: "Foto eliminada correctamente", type: 'success' });
    } catch (e) {
        setToast({ visible: true, message: "No se pudo eliminar", type: 'error' });
    } finally {
        setUploading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setToast({ visible: true, message: "Error al salir", type: 'error' });
  };

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const currentLevel = Math.floor(favoritesCount / 3) + 1;
  const getRankName = (count: number) => {
    if (count < 3) return "Novato";
    if (count < 10) return "Aprendiz";
    if (count < 20) return "Cocinillas";
    if (count < 50) return "Chef";
    return "Maestro";
  };
  const currentRank = getRankName(favoritesCount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper} disabled={uploading}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{getInitials(userEmail)}</Text>
                    </View>
                )}
                
                {uploading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>

            {!uploading && (
                <TouchableOpacity onPress={handlePickImage} style={styles.editIconBadge}>
                    <Ionicons name="camera" size={14} color="white" />
                </TouchableOpacity>
            )}

            {!uploading && avatarUrl && (
                <TouchableOpacity onPress={handleRemoveImagePress} style={styles.deleteIconBadge}>
                    <Ionicons name="trash" size={14} color="white" />
                </TouchableOpacity>
            )}

          </View>
          
          <Text style={styles.email}>{userEmail}</Text>
          <View style={styles.roleBadge}>
             <Text style={styles.roleText}>{currentRank} 👨‍🍳</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={styles.statNumber}>{favoritesCount}</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentLevel}</Text>
              <Text style={styles.statLabel}>Nivel</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentRank === "Maestro" ? "👑" : "🔪"}</Text>
              <Text style={styles.statLabel}>Rango</Text>
           </View>
        </View>

        {/* Preferencias */}
        <Text style={styles.sectionHeader}>Preferencias</Text>
        <View style={styles.cardContainer}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, {backgroundColor: 'rgba(129, 140, 248, 0.1)'}]}>
                <Ionicons name="moon" size={20} color="#818CF8" />
              </View>
              <Text style={styles.rowLabel}>Modo Oscuro</Text>
            </View>
            <Switch value={true} disabled trackColor={{false: '#333', true: '#818CF8'}} />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, {backgroundColor: 'rgba(74, 222, 128, 0.1)'}]}>
                <Ionicons name="language" size={20} color="#4ADE80" />
              </View>
              <Text style={styles.rowLabel}>Idioma</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
               <Text style={{color:'#666'}}>Español</Text>
               <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Cuenta */}
        <Text style={styles.sectionHeader}>Cuenta</Text>
        <View style={styles.cardContainer}>
           <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, {backgroundColor: 'rgba(239, 68, 68, 0.1)'}]}>
                <Ionicons name="log-out-outline" size={20} color="#FF4444" />
              </View>
              <Text style={[styles.rowLabel, {color: '#FF4444'}]}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>FridgeAI v1.1.0</Text>
      </ScrollView>

      {/* Modal de confirmación */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalIconCircle}>
                    <Ionicons name="trash-outline" size={32} color="#FF4444" />
                </View>
                <Text style={styles.modalTitle}>¿Eliminar foto?</Text>
                <Text style={styles.modalText}>Volverás a ver tus iniciales en el perfil.</Text>
                
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.modalBtnCancel}>
                        <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={confirmDeleteImage} style={styles.modalBtnConfirm}>
                        <Text style={styles.modalBtnTextConfirm}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={() => setToast(prev => ({...prev, visible: false}))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll: { padding: 20 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarWrapper: {
    width: 100, height: 100, borderRadius: 50, 
    borderWidth: 2, borderColor: '#333', overflow: 'hidden',
    backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center'
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' },
  avatarText: { fontSize: 36, color: '#818CF8', fontWeight: 'bold' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  
  editIconBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#818CF8', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#121212'
  },
  deleteIconBadge: {
    position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#121212'
  },
  email: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  roleBadge: { backgroundColor: '#2A2A2A', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: '#AAA', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#333' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#666', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#333' },
  sectionHeader: { color: '#888', marginBottom: 10, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 5 },
  cardContainer: { backgroundColor: '#1E1E1E', borderRadius: 16, overflow: 'hidden', marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { color: 'white', fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#2A2A2A', marginLeft: 65 },
  version: { color: '#444', textAlign: 'center', fontSize: 12, marginTop: 10 },

  // Estilos del modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 320, backgroundColor: '#1E1E1E', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalText: { color: '#AAA', fontSize: 14, textAlign: 'center', marginBottom: 25 },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2A2A2A', alignItems: 'center' },
  modalBtnTextCancel: { color: 'white', fontWeight: '600' },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FF4444', alignItems: 'center' },
  modalBtnTextConfirm: { color: 'white', fontWeight: 'bold' }
});