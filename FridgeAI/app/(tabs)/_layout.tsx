import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

export default function TabLayout() {
  const theme = useTheme(); // Para detectar si es modo oscuro

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212', // Fondo oscuro
          borderTopColor: '#333',     // Borde sutil
          height: 60,                 // Altura cómoda
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#818CF8', // Color activo (morado)
        tabBarInactiveTintColor: '#666',  // Color inactivo (gris)
      }}
    >
      {/* TAB 1: HOME (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cocina',
          tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={24} color={color} />,
        }}
      />
      
      {/* TAB 2: FAVORITOS (favorites.tsx) */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={24} color={color} />,
        }}
      />

      {/* TAB 3: PERFIL (profile.tsx) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}