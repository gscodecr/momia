import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Modal, Platform, Switch } from 'react-native';
import { useFocusEffect } from 'expo-router';
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
  const [subscriptionStatus, setSubscriptionStatus] = useState(user?.subscription_status || 'Activo');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergency_contact_name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergency_contact_phone || '');
  
  // Payment State
  const [autoPay, setAutoPay] = useState(false);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [sinpeFile, setSinpeFile] = useState<any>(null);
  const [uploadingSinpe, setUploadingSinpe] = useState(false);
  const [loadingAutoPay, setLoadingAutoPay] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [sinpeAmount, setSinpeAmount] = useState('40000');
  const [sinpeDescription, setSinpeDescription] = useState(`Mensualidad ${new Date().toLocaleString('es-CR', { month: 'long', year: 'numeric' })}`);

  useFocusEffect(
    useCallback(() => {
      fetchBilling();
      fetchSettings();
    }, [])
  );

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/');
      if (res.data) setSettings(res.data);
    } catch (e) {}
  };

  const fetchBilling = async () => {
    try {
      const res = await api.get('/payments/me');
      if (res.data) {
        setBillingInfo(res.data);
        setAutoPay(res.data.auto_pay || false);
      }
    } catch (e) {
      console.log('Error fetching billing info', e);
    }
  };

  const handleTiloPaySimulate = async () => {
    setSimulatingPayment(true);
    try {
      const amount = "40000";
      const desc = `Mensualidad ${new Date().toLocaleString('es-CR', { month: 'long', year: 'numeric' })}`;
      const res = await api.post(`/payments/tilopay/simulate?amount=${amount}&description=${desc}`);
      if (res.data) {
        Alert.alert('Éxito', 'Pago exitoso simulado. Fecha de corte actualizada.');
        fetchBilling();
      }
    } catch (err) {
      Alert.alert('Error', 'Error al procesar el pago');
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleSinpePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso Denegado", "Se requiere acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSinpeFile(result.assets[0]);
    }
  };

  const handleSinpeSubmit = async () => {
    if (!sinpeFile) {
      Alert.alert('Aviso', 'Selecciona un comprobante primero');
      return;
    }
    
    setUploadingSinpe(true);
    const amount = sinpeAmount || "40000";
    const desc = sinpeDescription || `Mensualidad ${new Date().toLocaleString('es-CR', { month: 'long', year: 'numeric' })}`;
    
    const formData = new FormData();
    const filename = sinpeFile.uri.split('/').pop() || 'comprobante.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    formData.append('file', { uri: sinpeFile.uri, name: filename, type } as any);

    try {
      const res = await api.post(`/payments/report-sinpe?amount=${amount}&description=${desc}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data) {
        Alert.alert('Éxito', 'Comprobante enviado exitosamente');
        setSinpeFile(null);
        fetchBilling();
      }
    } catch (err) {
      Alert.alert('Error', 'Error al enviar comprobante');
    } finally {
      setUploadingSinpe(false);
    }
  };

  const handleToggleAutoPay = async (val: boolean) => {
    setAutoPay(val);
    setLoadingAutoPay(true);
    try {
      await api.put(`/payments/auto-pay?auto_pay=${val}`);
      Alert.alert('Cobro Automático', val ? 'Se ha activado el cobro automático.' : 'Se ha desactivado el cobro automático.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar preferencia de pago');
      setAutoPay(!val);
    } finally {
      setLoadingAutoPay(false);
    }
  };
  const [address, setAddress] = useState(user?.address || '');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [saving, setSaving] = useState(false);
  
  // Expediente State
  const [discipline, setDiscipline] = useState(user?.athlete_profile?.discipline || '');
  const [weight, setWeight] = useState(user?.athlete_profile?.weight || '');
  const [bodyFat, setBodyFat] = useState(user?.athlete_profile?.body_fat || '');
  const [ftp, setFtp] = useState(user?.athlete_profile?.ftp ? String(user.athlete_profile.ftp) : '');
  const [hrZones, setHrZones] = useState<Record<string, string>>(() => {
    try { return JSON.parse(user?.athlete_profile?.heart_rate_zones || ''); } 
    catch(e) { return {z1:'', z2:'', z3:'', z4:'', z5:''}; }
  });
  const [injuries, setInjuries] = useState<any[]>(() => {
    try { return JSON.parse(user?.athlete_profile?.injuries || ''); } 
    catch(e) { return []; }
  });
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [currentInjury, setCurrentInjury] = useState<any>(null);

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
      if (subscriptionStatus !== (user?.subscription_status || 'Activo')) payload.subscription_status = subscriptionStatus;
      if (emergencyContactName !== (user?.emergency_contact_name || '')) payload.emergency_contact_name = emergencyContactName;
      if (emergencyContactPhone !== (user?.emergency_contact_phone || '')) payload.emergency_contact_phone = emergencyContactPhone;
      if (address !== (user?.address || '')) payload.address = address;
      if (discipline !== (user?.athlete_profile?.discipline || '')) payload.discipline = discipline;
      if (weight !== (user?.athlete_profile?.weight || '')) payload.weight = weight;
      if (bodyFat !== (user?.athlete_profile?.body_fat || '')) payload.body_fat = bodyFat;
      
      const currentFtp = user?.athlete_profile?.ftp || '';
      if (String(ftp) !== String(currentFtp)) payload.ftp = ftp ? Number(ftp) : null;
      
      const newZonesStr = JSON.stringify(hrZones);
      if (newZonesStr !== (user?.athlete_profile?.heart_rate_zones || '{}')) payload.heart_rate_zones = newZonesStr;
      
      const newInjuriesStr = injuries.length > 0 ? JSON.stringify(injuries) : '';
      if (newInjuriesStr !== (user?.athlete_profile?.injuries || '')) payload.injuries = newInjuriesStr;

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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={{ flexGrow: 0, marginBottom: 30 }} 
        contentContainerStyle={[styles.tabsContainer, { marginBottom: 0 }]}
      >
        {['Personal', 'Expediente', 'Ajustes', 'Facturación'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, {paddingVertical: 12, paddingHorizontal: 16, flex: undefined}, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={tab === 'Personal' ? 'person' : tab === 'Expediente' ? 'pulse' : tab === 'Facturación' ? 'card' : 'settings'} 
              size={16} 
              color={activeTab === tab ? '#000' : '#888'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          
                    <Text style={[styles.sectionTitle, {marginTop: 24}]}>Contacto de Emergencia</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput style={styles.input} value={emergencyContactName} onChangeText={setEmergencyContactName} placeholder="Nombre completo" placeholderTextColor="#666" />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>TELÉFONO</Text>
            <TextInput style={styles.input} value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} placeholder="Número de teléfono" placeholderTextColor="#666" keyboardType="phone-pad" />
          </View>
          
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'Expediente' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expediente Deportivo</Text>
          <Text style={styles.sectionDesc}>Métricas, zonas e historial clínico.</Text>

          {/* Disciplinas */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>DISCIPLINA(S) PRINCIPAL(ES)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10, paddingRight: 20}}>

              {['triatlon', 'ciclismo', 'running', 'natacion'].map(d => {
                const isSelected = discipline.split(',').includes(d);
                return (
                  <TouchableOpacity 
                    key={d}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      let current = discipline ? discipline.split(',').filter(Boolean) : [];
                      if (isSelected) current = current.filter(item => item !== d);
                      else current.push(d);
                      setDiscipline(current.join(','));
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Métricas */}
          <View style={{flexDirection: 'row', gap: 12}}>
            <View style={[styles.formGroup, {flex: 1}]}>
              <Text style={styles.label}>PESO (kg)</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="70.5" placeholderTextColor="#666" />
            </View>
            <View style={[styles.formGroup, {flex: 1}]}>
              <Text style={styles.label}>% GRASA</Text>
              <TextInput style={styles.input} value={bodyFat} onChangeText={setBodyFat} keyboardType="numeric" placeholder="15" placeholderTextColor="#666" />
            </View>
            <View style={[styles.formGroup, {flex: 1}]}>
              <Text style={styles.label}>FTP (W)</Text>
              <TextInput style={styles.input} value={ftp} onChangeText={setFtp} keyboardType="numeric" placeholder="250" placeholderTextColor="#666" />
            </View>
          </View>

          {/* Zonas Cardíacas */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>ZONAS DE FRECUENCIA CARDÍACA (PPM)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12, marginTop: 8}}>
              {['z1', 'z2', 'z3', 'z4', 'z5'].map((z, idx) => (
                <View key={z} style={styles.zoneBox}>
                  <Text style={styles.zoneLabel}>Z{idx + 1}</Text>
                  <TextInput 
                    style={styles.zoneInput}
                    value={hrZones[z]}
                    onChangeText={(val) => setHrZones({...hrZones, [z]: val})}
                    placeholder="120-135"
                    placeholderTextColor="#666"
                    keyboardType="default"
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Lesiones */}
          <View style={styles.formGroup}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <Text style={[styles.label, {marginBottom: 0}]}>HISTORIAL DE LESIONES</Text>
              <TouchableOpacity onPress={() => {
                setCurrentInjury({ id: Date.now(), title: '', date: '', description: '', status: 'Activa' });
                setShowInjuryModal(true);
              }}>
                <Text style={{color: Theme.colors.primary, fontWeight: 'bold', fontSize: 12}}>+ AÑADIR LESIÓN</Text>
              </TouchableOpacity>
            </View>

            {injuries.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="pulse" size={32} color="#444" style={{marginBottom: 8}} />
                <Text style={{color: '#888', fontWeight: 'bold'}}>Sin lesiones registradas.</Text>
                <Text style={{color: '#666', fontSize: 12}}>¡Excelente trabajo manteniéndote sano!</Text>
              </View>
            ) : (
              <View style={{gap: 12}}>
                {injuries.map(injury => (
                  <TouchableOpacity 
                    key={injury.id} 
                    style={styles.injuryCard}
                    onPress={() => { setCurrentInjury(injury); setShowInjuryModal(true); }}
                  >
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <Text style={styles.injuryTitle}>{injury.title}</Text>
                      <View style={[styles.injuryBadge, {backgroundColor: injury.status === 'Activa' ? 'rgba(239,68,68,0.2)' : injury.status === 'Recuperada' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}]}>
                        <Text style={[styles.injuryBadgeText, {color: injury.status === 'Activa' ? '#ef4444' : injury.status === 'Recuperada' ? '#22c55e' : '#eab308'}]}>{injury.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.injuryDate}>{injury.date}</Text>
                    <Text style={styles.injuryDesc}>{injury.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'Facturación' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facturación y Pagos</Text>
          <Text style={styles.sectionDesc}>Gestiona tu mensualidad y pagos.</Text>

          {/* Estado Actual */}
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Estado Actual</Text>
          <View style={[styles.formGroup, {backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: billingInfo?.subscription_status === 'Activo' ? '#4ade80' : billingInfo?.subscription_status === 'Pausada' ? '#facc15' : '#f87171'}]}>
            <Text style={{color: billingInfo?.subscription_status === 'Activo' ? '#4ade80' : billingInfo?.subscription_status === 'Pausada' ? '#facc15' : '#f87171', fontSize: 18, fontWeight: 'bold'}}>
              {billingInfo?.subscription_status === 'Activo' ? '¡Suscripción Activa!' : billingInfo?.subscription_status === 'Pausada' ? 'Suscripción Pausada' : 'Pago Vencido'}
            </Text>
            <Text style={{color: '#888', marginTop: 4}}>Próximo corte: {billingInfo?.next_payment_date ? new Date(billingInfo.next_payment_date).toLocaleDateString('es-CR') : 'No definido'}</Text>
            <Text style={{color: '#fff', marginTop: 12, fontSize: 16, fontWeight: 'bold'}}>Suscripción {billingInfo?.subscription_type || 'No definido'}</Text>
          </View>

          {/* Métodos de Pago */}
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Métodos de Pago</Text>
          {billingInfo?.payment_preference === 'Tarjeta' ? (
            <View style={[styles.formGroup, {backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12}]}>
              <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4}}>Pago con Tarjeta</Text>
              <Text style={{color: '#888', marginBottom: 16}}>Genera tu pago seguro de forma manual a través de Tilopay.</Text>
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleTiloPaySimulate} disabled={simulatingPayment}>
                {simulatingPayment ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Ir a Tilopay</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.formGroup, {backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12}]}>
              <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4}}>Reportar SINPE / Transf.</Text>
              <Text style={{color: '#888', marginBottom: 16, lineHeight: 22}}>Por favor realiza el pago y adjunta el comprobante a continuación.{"\n"}• SINPE Móvil: {settings.sinpe_phone?.value || '8888-8888'}{"\n"}• Cuenta IBAN: {settings.bank_account?.value || 'CR120152010010XXXXXXX'}</Text>
              
              <TouchableOpacity style={[styles.selectBtn, {height: 80, justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#444'}]} onPress={handleSinpePick}>
                <Ionicons name={sinpeFile ? "image" : "cloud-upload-outline"} size={24} color={sinpeFile ? "#00b4d8" : "#888"} />
                <Text style={{color: sinpeFile ? '#00b4d8' : '#888', marginTop: 8}}>{sinpeFile ? 'Comprobante seleccionado' : 'Seleccionar Imagen'}</Text>
              </TouchableOpacity>

              <Text style={{color: '#888', marginBottom: 4, fontSize: 12, fontWeight: 'bold'}}>Concepto del Pago</Text>
              <TextInput
                style={[styles.input, {marginBottom: 12}]}
                value={sinpeDescription}
                onChangeText={setSinpeDescription}
                placeholder="Ej. Mensualidad Agosto"
                placeholderTextColor="#666"
              />

              <Text style={{color: '#888', marginBottom: 4, fontSize: 12, fontWeight: 'bold'}}>Monto (CRC)</Text>
              <TextInput
                style={[styles.input, {marginBottom: 16}]}
                value={sinpeAmount}
                onChangeText={setSinpeAmount}
                keyboardType="numeric"
                placeholder="40000"
                placeholderTextColor="#666"
              />

              {sinpeFile && (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSinpeSubmit} disabled={uploadingSinpe}>
                  {uploadingSinpe ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Enviar Comprobante</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Historial de Pagos */}
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Historial de Pagos</Text>
          <View style={{gap: 12}}>
            {!billingInfo?.payments || billingInfo.payments.length === 0 ? (
              <Text style={{color: '#888', textAlign: 'center', paddingVertical: 16}}>No hay pagos registrados aún.</Text>
            ) : (
              billingInfo.payments.map((payment: any) => (
                <View key={payment.id} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 12}}>
                      <Ionicons name="card" size={20} color={payment.status === 'APPROVED' ? '#4ade80' : '#facc15'} />
                    </View>
                    <View style={{flex: 1, marginRight: 8}}>
                      <Text style={{color: '#fff', fontWeight: 'bold'}}>{payment.description || 'Pago'}</Text>
                      <Text style={{color: '#888', fontSize: 12}}>{new Date(payment.created_at).toLocaleDateString('es-CR')} • {payment.payment_method}</Text>
                      {payment.status === 'PENDING' && <Text style={{color: '#facc15', fontSize: 10}}>En Revisión</Text>}
                    </View>
                  </View>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>₡{Number(payment.amount).toLocaleString('es-CR')}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {activeTab === 'Ajustes' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad y Suscripción</Text>
          <Text style={styles.sectionDesc}>Gestiona tu acceso, métodos de pago y suscripción.</Text>

          {/* Tipo de Suscripción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>TIPO DE SUSCRIPCIÓN</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setSelectOptions({
              title: 'Tipo de Suscripción',
              options: ['Mensual', 'Trimestral', 'Semestral', 'Anual'],
              onSelect: setSubscriptionType
            })}>
              <Text style={styles.selectBtnText}>{subscriptionType || 'Selecciona un plan'}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Estado de Suscripción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>ESTADO DE SUSCRIPCIÓN</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setSelectOptions({
              title: 'Estado de Suscripción',
              options: ['Activo', 'Pausado', 'Inactivo'],
              onSelect: setSubscriptionStatus
            })}>
              <Text style={styles.selectBtnText}>{subscriptionStatus || 'Activo'}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Pago Automático (Solo si es Tarjeta) */}
          {paymentPreference === 'Tarjeta' && (
            <View style={[styles.formGroup, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12}]}>
              <View style={{flex: 1, paddingRight: 16}}>
                <Text style={[styles.label, {marginBottom: 4, color: '#fff'}]}>COBRO AUTOMÁTICO</Text>
                <Text style={{color: '#888', fontSize: 12}}>Autorizar el cargo automático a mi tarjeta cada ciclo de facturación.</Text>
              </View>
              {loadingAutoPay ? (
                <ActivityIndicator color="#00b4d8" />
              ) : (
                <Switch 
                  value={autoPay} 
                  onValueChange={handleToggleAutoPay} 
                  trackColor={{ false: '#333', true: 'rgba(0,180,216,0.5)' }}
                  thumbColor={autoPay ? '#00b4d8' : '#666'}
                />
              )}
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}


    
      
      {/* Injury Modal */}
      {showInjuryModal && currentInjury && (
        <Modal transparent visible animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#111', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '60%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Detalle de Lesión</Text>
                <TouchableOpacity onPress={() => setShowInjuryModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.label, {fontSize: 12}]}>TÍTULO</Text>
              <TextInput 
                style={[styles.input, {marginBottom: 16}]} 
                value={currentInjury.title} 
                onChangeText={t => setCurrentInjury({...currentInjury, title: t})}
                placeholder="Ej: Esguince" 
                placeholderTextColor="#666"
              />

              <Text style={[styles.label, {fontSize: 12}]}>FECHA (YYYY-MM-DD)</Text>
              <TextInput 
                style={[styles.input, {marginBottom: 16}]} 
                value={currentInjury.date} 
                onChangeText={t => setCurrentInjury({...currentInjury, date: t})}
                placeholder="2023-05-10" 
                placeholderTextColor="#666"
              />

              <Text style={[styles.label, {fontSize: 12}]}>DESCRIPCIÓN</Text>
              <TextInput 
                style={[styles.input, {marginBottom: 16, height: 80, textAlignVertical: 'top'}]} 
                value={currentInjury.description} 
                onChangeText={t => setCurrentInjury({...currentInjury, description: t})}
                placeholder="Detalles..." 
                placeholderTextColor="#666"
                multiline
              />

              <Text style={[styles.label, {fontSize: 12}]}>ESTADO</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 24}}>
                {['Activa', 'Observación', 'Recuperada'].map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.chip, currentInjury.status === s && styles.chipActive]}
                    onPress={() => setCurrentInjury({...currentInjury, status: s})}
                  >
                    <Text style={[styles.chipText, currentInjury.status === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{flexDirection: 'row', gap: 12}}>
                <TouchableOpacity 
                  style={[styles.saveBtn, {flex: 1, backgroundColor: '#333'}]}
                  onPress={() => {
                    const newInjuries = injuries.filter(i => i.id !== currentInjury.id);
                    setInjuries(newInjuries);
                    setShowInjuryModal(false);
                  }}
                >
                  <Text style={[styles.saveBtnText, {color: '#ff4444'}]}>Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, {flex: 1}]}
                  onPress={() => {
                    const exists = injuries.find(i => i.id === currentInjury.id);
                    if (exists) {
                      setInjuries(injuries.map(i => i.id === currentInjury.id ? currentInjury : i));
                    } else {
                      setInjuries([...injuries, currentInjury]);
                    }
                    setShowInjuryModal(false);
                  }}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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

  chip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipActive: {
    backgroundColor: 'rgba(0,180,216,0.15)',
    borderColor: '#00b4d8',
  },
  chipText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#00b4d8',
  },
  zoneBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
    width: 80,
    alignItems: 'center',
  },
  zoneLabel: {
    color: '#00b4d8',
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 6,
  },
  zoneInput: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
  },
  emptyBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  injuryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  injuryTitle: {
    color: '#00b4d8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  injuryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  injuryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  injuryDate: {
    color: '#666',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    marginBottom: 8,
  },
  injuryDesc: {
    color: '#ccc',
    fontSize: 14,
  },
});