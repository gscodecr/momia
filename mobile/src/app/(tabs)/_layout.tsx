import { Tabs } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function TabsLayout() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#DFFF00" />
      </View>
    );
  }

  // Si no hay usuario (redireccionado por AuthContext), no renderizar tabs
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#09090b' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#09090b', borderTopColor: '#333' },
        tabBarActiveTintColor: '#DFFF00',
        tabBarInactiveTintColor: '#888',
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Rutinas',
          tabBarLabel: 'Rutinas',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
        }}
      />
    </Tabs>
  );
}
