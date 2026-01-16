// app/(tabs)/profile.tsx
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
  TextInput,
  Keyboard,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Toast } from '@/components/ui/Toast';

import { useThemeContext } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { useI18n } from '@/context/I18nContext';

import { useUserPreferences } from '@/context/UserPreferencesContext';
import type { Diet, Allergen } from '@/lib/userPreferences';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  const { isDark, setTheme } = useThemeContext();
  const c = Colors[isDark ? 'dark' : 'light'];

  const { language, setLanguage, t } = useI18n();

  const tint = '#818CF8';
  const danger = '#FF4444';

  const surface = isDark ? '#1E1E1E' : '#F3F4F6';
  const surface2 = isDark ? '#2A2A2A' : '#E5E7EB';
  const border = isDark ? '#333' : '#E5E7EB';
  const muted = isDark ? '#888' : '#6B7280';
  const muted2 = isDark ? '#AAA' : '#475569';
  const shadowBorder = isDark ? '#121212' : '#ffffff';
  const inputBg = isDark ? '#161616' : '#ffffff';

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const [prefsModalVisible, setPrefsModalVisible] = useState(false);
  const [customAllergyInput, setCustomAllergyInput] = useState('');

  const { prefs, setDiet, toggleAllergen, addCustomAllergy, removeCustomAllergy, save, saving } =
    useUserPreferences();

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

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

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setToast({ visible: true, message: t('profile.photoUpdated'), type: 'success' });
    } catch (error: any) {
      setToast({ visible: true, message: t('profile.photoUploadError'), type: 'error' });
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
      setToast({ visible: true, message: t('profile.photoDeleted'), type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: t('profile.photoDeleteError'), type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setToast({ visible: true, message: t('profile.logoutError'), type: 'error' });
  };

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const currentLevel = Math.floor(favoritesCount / 3) + 1;

  const getRankKey = (count: number) => {
    if (count < 3) return 'profile.rankNovice';
    if (count < 10) return 'profile.rankApprentice';
    if (count < 20) return 'profile.rankCook';
    if (count < 50) return 'profile.rankChef';
    return 'profile.rankMaster';
  };

  const currentRank = t(getRankKey(favoritesCount));

  const languageLabel = language === 'es' ? t('profile.spanish') : t('profile.english');

  const chooseLanguage = (lng: 'es' | 'en') => {
    setLanguage(lng);
    setLanguageModalVisible(false);
  };

  const dietOptions: Diet[] = useMemo(
    () => [
      'none',
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'keto',
      'gluten_free',
      'lactose_free',
    ],
    []
  );

  const allergenOptions: Allergen[] = useMemo(
    () => ['gluten', 'dairy', 'eggs', 'peanuts', 'tree_nuts', 'soy', 'fish', 'shellfish', 'sesame'],
    []
  );

  const prefsSummary = useMemo(() => {
    const dietLabel = t(`diet.${prefs.diet}`);
    const allergiesLabel = prefs.allergies.length
      ? prefs.allergies.map((a) => t(`allergen.${a}`)).join(', ')
      : t('profile.none');

    const customLabel = prefs.customAllergies.length ? prefs.customAllergies.join(', ') : t('profile.none');

    return { dietLabel, allergiesLabel, customLabel };
  }, [prefs.diet, prefs.allergies, prefs.customAllergies, t]);

  const openPrefsModal = () => {
    setCustomAllergyInput('');
    setPrefsModalVisible(true);
  };

  const handleAddCustomAllergy = () => {
    const text = customAllergyInput.trim();
    if (!text) return;
    addCustomAllergy(text);
    setCustomAllergyInput('');
    Keyboard.dismiss();
  };

  const closePrefsModalAndSave = async () => {
    try {
      await save();
      setPrefsModalVisible(false);
      setToast({ visible: true, message: t('profile.prefsSaved'), type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: t('profile.prefsSaveError'), type: 'error' });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.avatarWrapper, { borderColor: border, backgroundColor: surface }]}
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
                style={[styles.editIconBadge, { backgroundColor: tint, borderColor: shadowBorder }]}
              >
                <Ionicons name="camera" size={14} color="white" />
              </TouchableOpacity>
            )}

            {!uploading && avatarUrl && (
              <TouchableOpacity
                onPress={handleRemoveImagePress}
                style={[styles.deleteIconBadge, { backgroundColor: danger, borderColor: shadowBorder }]}
              >
                <Ionicons name="trash" size={14} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.email, { color: c.text }]}>{userEmail}</Text>

          <View style={[styles.roleBadge, { backgroundColor: surface2 }]}>
            <Text style={[styles.roleText, { color: muted2 }]}>{currentRank}</Text>
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: c.text }]}>{favoritesCount}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>{t('profile.favorites')}</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: border }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: c.text }]}>{currentLevel}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>{t('profile.level')}</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: border }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: c.text }]}>{currentRank === t('profile.rankMaster') ? '👑' : '🔪'}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>{t('profile.rank')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: muted }]}>{t('profile.preferences')}</Text>

        <View style={[styles.cardContainer, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(129, 140, 248, 0.12)' }]}>
                <Ionicons name="moon" size={20} color={tint} />
              </View>
              <Text style={[styles.rowLabel, { color: c.text }]}>{t('profile.darkMode')}</Text>
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

          <TouchableOpacity style={styles.row} onPress={() => setLanguageModalVisible(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(74, 222, 128, 0.12)' }]}>
                <Ionicons name="language" size={20} color="#4ADE80" />
              </View>
              <Text style={[styles.rowLabel, { color: c.text }]}>{t('profile.language')}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ color: muted }}>{languageLabel}</Text>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <TouchableOpacity style={styles.row} onPress={openPrefsModal}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(129, 140, 248, 0.12)' }]}>
                <Ionicons name="nutrition-outline" size={20} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: c.text }]}>{t('profile.foodPrefsTitle')}</Text>
                <Text style={{ color: muted, marginTop: 2 }} numberOfLines={2}>
                  {t('profile.diet')}: {prefsSummary.dietLabel} · {t('profile.allergies')}: {prefsSummary.allergiesLabel}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={muted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { color: muted }]}>{t('profile.account')}</Text>

        <View style={[styles.cardContainer, { backgroundColor: surface, borderColor: border }]}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="log-out-outline" size={20} color={danger} />
              </View>
              <Text style={[styles.rowLabel, { color: danger }]}>{t('profile.logout')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: isDark ? '#444' : '#94A3B8' }]}>FridgeAI v1.1.0</Text>
      </ScrollView>

      {/* MODAL BORRAR FOTO */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="trash-outline" size={32} color={danger} />
            </View>

            <Text style={[styles.modalTitle, { color: c.text }]}>{t('profile.deletePhotoTitle')}</Text>
            <Text style={[styles.modalText, { color: muted2 }]}>{t('profile.deletePhotoText')}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.modalBtnCancel, { backgroundColor: surface2 }]}
              >
                <Text style={[styles.modalBtnTextCancel, { color: c.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmDeleteImage} style={[styles.modalBtnConfirm, { backgroundColor: danger }]}>
                <Text style={styles.modalBtnTextConfirm}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={languageModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.languageModalContent, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.languageTitle, { color: c.text }]}>{t('profile.language')}</Text>

            <TouchableOpacity
              style={[styles.languageOption, { borderColor: border, backgroundColor: surface2 }]}
              onPress={() => chooseLanguage('es')}
            >
              <Text style={[styles.languageOptionText, { color: c.text }]}>{t('profile.spanish')}</Text>
              {language === 'es' ? <Ionicons name="checkmark" size={20} color={tint} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, { borderColor: border, backgroundColor: surface2 }]}
              onPress={() => chooseLanguage('en')}
            >
              <Text style={[styles.languageOptionText, { color: c.text }]}>{t('profile.english')}</Text>
              {language === 'en' ? <Ionicons name="checkmark" size={20} color={tint} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageCancel, { backgroundColor: surface2 }]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={[styles.languageCancelText, { color: c.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PREFERENCIAS ALIMENTARIAS */}
      <Modal visible={prefsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.prefsModalContent, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.prefsHeader}>
              <Text style={[styles.prefsTitle, { color: c.text }]}>{t('profile.foodPrefsTitle')}</Text>

              <TouchableOpacity
                onPress={() => setPrefsModalVisible(false)}
                style={[styles.prefsCloseBtn, { backgroundColor: surface2, borderColor: border }]}
                disabled={saving}
              >
                <Ionicons name="close" size={18} color={muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* DIETA */}
              <Text style={[styles.prefsSectionTitle, { color: muted }]}>{t('profile.diet')}</Text>

              <View style={styles.prefsGrid}>
                {dietOptions.map((d) => {
                  const selected = prefs.diet === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDiet(d)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected ? 'rgba(129, 140, 248, 0.16)' : surface2,
                          borderColor: selected ? tint : border,
                        },
                      ]}
                      activeOpacity={0.9}
                    >
                      <Text style={{ color: selected ? tint : c.text, fontWeight: '700' }}>
                        {t(`diet.${d}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.prefsDivider, { backgroundColor: border }]} />

              {/* ALERGIAS */}
              <Text style={[styles.prefsSectionTitle, { color: muted }]}>{t('profile.allergies')}</Text>

              <View style={styles.prefsList}>
                {allergenOptions.map((a) => {
                  const checked = prefs.allergies.includes(a);
                  return (
                    <TouchableOpacity
                      key={a}
                      onPress={() => toggleAllergen(a)}
                      style={[
                        styles.allergenRow,
                        { backgroundColor: surface2, borderColor: border },
                      ]}
                      activeOpacity={0.9}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: checked ? tint : border, backgroundColor: checked ? tint : 'transparent' },
                          ]}
                        >
                          {checked ? <Ionicons name="checkmark" size={16} color="#000" /> : null}
                        </View>
                        <Text style={{ color: c.text, fontWeight: '700' }}>{t(`allergen.${a}`)}</Text>
                      </View>

                      {checked ? <Ionicons name="checkmark-circle" size={18} color={tint} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.prefsDivider, { backgroundColor: border }]} />

              {/* ALERGIAS CUSTOM */}
              <Text style={[styles.prefsSectionTitle, { color: muted }]}>{t('profile.customAllergies')}</Text>

              <View style={[styles.customInputRow, { borderColor: border, backgroundColor: inputBg }]}>
                <TextInput
                  value={customAllergyInput}
                  onChangeText={setCustomAllergyInput}
                  placeholder={t('profile.customAllergyPlaceholder')}
                  placeholderTextColor={isDark ? '#555' : '#9CA3AF'}
                  style={[styles.customInput, { color: c.text }]}
                  returnKeyType="done"
                  onSubmitEditing={handleAddCustomAllergy}
                />
                <TouchableOpacity
                  onPress={handleAddCustomAllergy}
                  style={[styles.addBtn, { backgroundColor: tint }]}
                  activeOpacity={0.9}
                >
                  <Ionicons name="add" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {prefs.customAllergies.length > 0 ? (
                <View style={styles.chipsWrap}>
                  {prefs.customAllergies.map((item) => (
                    <View
                      key={item}
                      style={[styles.chip, { backgroundColor: surface2, borderColor: border }]}
                    >
                      <Text style={{ color: c.text, fontWeight: '700' }} numberOfLines={1}>
                        {item}
                      </Text>
                      <TouchableOpacity onPress={() => removeCustomAllergy(item)} style={{ paddingLeft: 8 }}>
                        <Ionicons name="close" size={16} color={muted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: muted, marginTop: 8 }}>{t('profile.none')}</Text>
              )}
            </ScrollView>

            <View style={[styles.prefsFooter, { borderTopColor: border }]}>
              <TouchableOpacity
                onPress={() => setPrefsModalVisible(false)}
                style={[styles.prefsBtn, { backgroundColor: surface2 }]}
                disabled={saving}
              >
                <Text style={{ color: c.text, fontWeight: '800' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closePrefsModalAndSave}
                style={[styles.prefsBtn, { backgroundColor: tint, opacity: saving ? 0.6 : 1 }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={{ color: '#000', fontWeight: '900' }}>{t('common.save')}</Text>
                )}
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

  languageModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageCancel: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  languageCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },

  prefsModalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    maxHeight: '85%',
  },
  prefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prefsTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  prefsCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  prefsSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  prefsDivider: {
    height: 1,
    marginVertical: 16,
  },
  prefsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  prefsList: {
    gap: 10,
  },
  allergenRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  customInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  prefsFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  prefsBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
});
