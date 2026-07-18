import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [activeTab, setActiveTab] = useState('Personal');
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permiso Denegado", "Se requiere acceso a la galería para cambiar tu avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);

      const res = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.avatar_url) {
        setAvatarUrl(res.data.avatar_url);
        Alert.alert('Éxito', 'Avatar actualizado correctamente');
      }
    } catch (error) {
      console.log('Upload error', error);
      Alert.alert('Error', 'No se pudo actualizar el avatar');
    } finally {
      setUploading(false);
    }
  };

  const renderImageUrl = (itemUrl: string | null, fallbackUrl: string) => {
    if (!itemUrl) return fallbackUrl;
    if (itemUrl.startsWith('http') || itemUrl.startsWith('data:')) return itemUrl;
    const path = itemUrl.startsWith('/') ? itemUrl : `/${itemUrl}`;
    return `${api.defaults.baseURL}${path}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Avatar Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: renderImageUrl(avatarUrl, '') }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['Personal', 'Deportes', 'Ajustes'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={tab === 'Personal' ? 'person' : tab === 'Deportes' ? 'barbell' : 'settings'} 
              size={16} 
              color={activeTab === tab ? '#000' : '#888'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seguridad y Suscripción</Text>
        <Text style={styles.sectionDesc}>Gestiona tu acceso y contactos vitales.</Text>

        <View style={styles.subscriptionCard}>
          <View style={styles.subIconBadge}>
            <Ionicons name="shield-checkmark" size={20} color={Theme.colors.primary} />
          </View>
          <View style={styles.subContent}>
            <Text style={styles.subTitle}>Suscripción Activa</Text>
            <Text style={styles.subDesc}>Facturación automática configurada</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>CONTACTO DE EMERGENCIA (NOMBRE)</Text>
          <TextInput style={styles.input} placeholderTextColor="#666" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>CONTACTO DE EMERGENCIA (TELÉFONO)</Text>
          <TextInput style={styles.input} placeholderTextColor="#666" keyboardType="phone-pad" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>CAMBIAR CONTRASEÑA</Text>
          <TextInput style={styles.input} placeholderTextColor="#666" secureTextEntry />
        </View>
      </View>

      {/* Logout button at the very bottom */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out" size={20} color={Theme.colors.error} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.background,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: 6,
    borderRadius: 12,
    marginBottom: 30,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#000',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  subscriptionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  subIconBadge: {
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subContent: {
    flex: 1,
  },
  subTitle: {
    color: Theme.colors.foreground,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  subDesc: {
    color: '#888',
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.error,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: Theme.colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
