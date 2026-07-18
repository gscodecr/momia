import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [activeTab, setActiveTab] = useState('Personal');
  const [uploading, setUploading] = useState(false);
  
  // Personal Data State
  const { refreshUser } = useContext(AuthContext);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [paymentPreference, setPaymentPreference] = useState(user?.payment_preference || '');
  const [subscriptionType, setSubscriptionType] = useState(user?.subscription_type || '');
  const [address, setAddress] = useState(user?.address || '');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [saving, setSaving] = useState(false);
  
  // Custom Select Modal State
  const [selectOptions, setSelectOptions] = useState<{title: string, options: string[], onSelect: (val: string) => void} | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (firstName !== (user?.first_name || '')) payload.first_name = firstName;
      if (lastName !== (user?.last_name || '')) payload.last_name = lastName;
      if (phone !== (user?.phone || '')) payload.phone = phone;
      if (birthDate !== (user?.birth_date || '')) payload.birth_date = birthDate;
      if (gender !== (user?.gender || '')) payload.gender = gender;
      if (paymentPreference !== (user?.payment_preference || '')) payload.payment_preference = paymentPreference;
      if (subscriptionType !== (user?.subscription_type || '')) payload.subscription_type = subscriptionType;
      if (address !== (user?.address || '')) payload.address = address;

      if (Object.keys(payload).length === 0) {
        Alert.alert('Aviso', 'No hay cambios para guardar');
        setSaving(false);
        return;
      }

      const res = await api.put('/auth/me', payload);
      if (res.data) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        await refreshUser();
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

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

      {/* Tab Content */}
      {activeTab === 'Personal' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          <Text style={styles.sectionDesc}>Información básica de tu cuenta.</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Tu nombre" placeholderTextColor="#666" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>APELLIDO</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Tu apellido" placeholderTextColor="#666" />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>CORREO ELECTRÓNICO (LOGIN)</Text>
            <TextInput style={[styles.input, { opacity: 0.5 }]} value={user?.email || ''} editable={false} placeholderTextColor="#666" />
            <Text style={{color: '#666', fontSize: 12, marginTop: 4}}>No modificable por seguridad.</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CELULAR</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+506 8888-8888" placeholderTextColor="#666" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>FECHA DE NACIMIENTO (YYYY-MM-DD)</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.selectBtnText}>{birthDate || 'Ej. 1990-05-20'}</Text>
              <Ionicons name="calendar" size={16} color="#666" />
            </TouchableOpacity>
            {showDatePicker && (
              Platform.OS === 'ios' ? (
                <Modal transparent visible animationType="fade">
                  <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: '#fff', paddingBottom: 20 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Hecho</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={birthDate ? new Date(birthDate + 'T12:00:00Z') : new Date(1990, 0, 1)}
                        mode="date"
                        display="spinner"
                        textColor="#000"
                        onChange={(event, date) => {
                          if (date) {
                            setBirthDate(date.toISOString().split('T')[0]);
                          }
                        }}
                      />
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={birthDate ? new Date(birthDate + 'T12:00:00Z') : new Date(1990, 0, 1)}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setBirthDate(date.toISOString().split('T')[0]);
                    }
                  }}
                />
              )
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>GÉNERO</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setSelectOptions({
              title: 'Selecciona tu género',
              options: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'],
              onSelect: setGender
            })}>
              <Text style={styles.selectBtnText}>{gender || 'Selecciona tu género'}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>PREFERENCIA DE PAGO</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setSelectOptions({
              title: 'Selecciona método',
              options: ['Tarjeta', 'Transferencia', 'Sinpe'],
              onSelect: setPaymentPreference
            })}>
              <Text style={styles.selectBtnText}>{paymentPreference || 'Selecciona un método'}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>TIPO DE SUSCRIPCIÓN</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setSelectOptions({
              title: 'Tipo de Suscripción',
              options: ['Mensual', 'Trimestral', 'Semestral', 'Anual'],
              onSelect: setSubscriptionType
            })}>
              <Text style={styles.selectBtnText}>{subscriptionType || 'Selecciona un tipo'}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>DIRECCIÓN</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              value={address} 
              onChangeText={setAddress} 
              multiline 
              placeholder="Provincia, Cantón, Distrito..." 
              placeholderTextColor="#666" 
            />
          </View>
          
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'Ajustes' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad y Suscripción</Text>
          <Text style={styles.sectionDesc}>Gestiona tu acceso y contactos vitales.</Text>

          <View style={styles.subscriptionCard}>
            <View style={styles.subIconBadge}>
              <Ionicons name="shield-checkmark" size={20} color={'#00b4d8'} />
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
      )}

      {/* Logout button at the very bottom */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out" size={20} color={Theme.colors.error} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    
      {/* Custom Select Modal */}
      {selectOptions && (
        <Modal transparent visible animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#1a1a1a', width: '80%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{selectOptions.title}</Text>
            {selectOptions.options.map(opt => (
              <TouchableOpacity key={opt} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' }} onPress={() => {
                selectOptions.onSelect(opt);
                setSelectOptions(null);
              }}>
                <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setSelectOptions(null)}>
              <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          </View>
        </Modal>
      )}
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
    paddingBottom: 120,
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
  },

  selectBtn: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});