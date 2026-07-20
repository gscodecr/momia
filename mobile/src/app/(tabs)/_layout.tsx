import { Tabs } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { BlurView } from 'expo-blur';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function TabsLayout() {
  const { user, isLoading } = useContext(AuthContext);
  
  // Registrar el dispositivo para notificaciones push cuando el usuario está logueado
  usePushNotifications(user);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  // Si no hay usuario (redireccionado por AuthContext), no renderizar tabs
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: Theme.colors.background,
        },
        headerTitleStyle: { color: Theme.colors.foreground, fontWeight: 'bold' },
        headerShadowVisible: false,
        tabBarStyle: { 
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={80} style={{ flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.7)' }} />
        ),
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: '#888',
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Rutinas',
          tabBarLabel: 'Rutinas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarLabel: 'Coach',
          href: (user.role?.name === 'admin' || user.role?.name === 'coach') ? '/coach' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
