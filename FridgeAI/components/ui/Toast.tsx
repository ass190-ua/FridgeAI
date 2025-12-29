import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
}

export const Toast = ({ message, type, visible, onHide }: ToastProps) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColors = {
    success: '#10B981', // Verde esmeralda
    error: '#EF4444',   // Rojo suave
    info: '#3B82F6'     // Azul
  };

  const icons: Record<ToastType, any> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle'
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.toast, { opacity, backgroundColor: bgColors[type] }]}>
        <Ionicons name={icons[type]} size={24} color="white" />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, 
    alignItems: 'center', zIndex: 9999, paddingTop: Platform.OS === 'android' ? 40 : 10
  },
  toast: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 6
  },
  text: { color: 'white', fontWeight: '600', fontSize: 14 }
});