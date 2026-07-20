import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme } from '../../../constants/theme';
import api from '../../../services/api';

export default function AthleteProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile form state
  const [maxHr, setMaxHr] = useState('');
  const [restHr, setRestHr] = useState('');
  const [ftp, setFtp] = useState('');
  const [hrZones, setHrZones] = useState({ z1: '', z2: '', z3: '', z4: '', z5: '' });
  const [injuries, setInjuries] = useState<any[]>([]);

  // Injury Modal State
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [currentInjury, setCurrentInjury] = useState<any>(null);

  useEffect(() => {
    fetchAthlete();
  }, [id]);

  const fetchAthlete = async () => {
    try {
      const res = await api.get('/workouts/athletes');
      const athletes = res.data;
      const found = athletes.find((a: any) => a.id.toString() === id);
      setAthlete(found);
      
      if (found && found.athlete_profile) {
        const p = found.athlete_profile;
        setMaxHr(p.max_hr ? p.max_hr.toString() : '');
        setRestHr(p.resting_hr ? p.resting_hr.toString() : '');
        setFtp(p.ftp ? p.ftp.toString() : '');
        
        if (p.heart_rate_zones) {
          try {
            setHrZones({ ...hrZones, ...JSON.parse(p.heart_rate_zones) });
          } catch (e) {}
        }
        
        if (p.injuries) {
          try {
            setInjuries(JSON.parse(p.injuries));
          } catch (e) {
            setInjuries([p.injuries]);
          }
        }
      }
    } catch (err) {
      console.log('Error fetching athlete profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updateData = {
        ftp: ftp ? parseInt(ftp) : null,
        injuries: JSON.stringify(injuries),
        heart_rate_zones: JSON.stringify(hrZones),
        max_hr: maxHr ? parseInt(maxHr) : null,
        resting_hr: restHr ? parseInt(restHr) : null,
      };

      await api.put(`/workouts/athletes/${id}`, updateData);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setIsEditing(false);
      fetchAthlete();
    } catch (err) {
      console.log('Error saving profile', err);
      Alert.alert('Error', 'No se pudo guardar la información');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!athlete) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color="#444" />
        <Text style={styles.errorText}>Atleta no encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expediente</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? "close" : "pencil"} size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          {athlete.avatar_url ? (
            <Image source={{ uri: `http://127.0.0.1:8001${athlete.avatar_url}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{athlete.first_name[0]}{athlete.last_name[0]}</Text>
            </View>
          )}
          <Text style={styles.name}>{athlete.first_name} {athlete.last_name}</Text>
          <Text style={styles.email}>{athlete.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Atleta</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas Base</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="water-outline" size={24} color={Theme.colors.primary} />
              <Text style={styles.metricLabel}>Max HR</Text>
              {isEditing ? (
                <TextInput style={styles.inputMini} value={maxHr} onChangeText={setMaxHr} keyboardType="numeric" placeholder="190" placeholderTextColor="#666" />
              ) : (
                <Text style={styles.metricValue}>{maxHr || '--'} bpm</Text>
              )}
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="heart-outline" size={24} color={Theme.colors.primary} />
              <Text style={styles.metricLabel}>Rest HR</Text>
              {isEditing ? (
                <TextInput style={styles.inputMini} value={restHr} onChangeText={setRestHr} keyboardType="numeric" placeholder="50" placeholderTextColor="#666" />
              ) : (
                <Text style={styles.metricValue}>{restHr || '--'} bpm</Text>
              )}
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="bicycle-outline" size={24} color={Theme.colors.primary} />
              <Text style={styles.metricLabel}>FTP</Text>
              {isEditing ? (
                <TextInput style={styles.inputMini} value={ftp} onChangeText={setFtp} keyboardType="numeric" placeholder="200" placeholderTextColor="#666" />
              ) : (
                <Text style={styles.metricValue}>{ftp || '--'} W</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zonas de Ritmo Cardíaco</Text>
          <View style={styles.card}>
            {Object.keys(hrZones).map((zone, i) => (
              <View key={zone} style={[styles.zoneRow, i !== 0 && styles.borderTop]}>
                <View style={styles.zoneBadge}>
                  <Text style={styles.zoneBadgeText}>{zone.toUpperCase()}</Text>
                </View>
                {isEditing ? (
                  <TextInput 
                    style={[styles.inputMini, {flex: 1, marginLeft: 16, textAlign: 'right'}]} 
                    value={hrZones[zone as keyof typeof hrZones]} 
                    onChangeText={(t) => setHrZones({...hrZones, [zone]: t})}
                    placeholder="Ej. 120-135" 
                    placeholderTextColor="#666" 
                  />
                ) : (
                  <Text style={styles.zoneValue}>{hrZones[zone as keyof typeof hrZones] || 'No definido'}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salud e Historial</Text>
          <View style={styles.card}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <Text style={[styles.label, {marginBottom: 0}]}>Lesiones / Condiciones Previas</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => { setCurrentInjury({ id: Date.now(), title: '', date: '', description: '', status: 'Activa' }); setShowInjuryModal(true); }}>
                  <Ionicons name="add-circle" size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {injuries.length > 0 ? (
              <View style={{ gap: 12 }}>
                {injuries.map((inj: any, i: number) => {
                  const isString = typeof inj === 'string';
                  const title = isString ? inj : inj.title;
                  const status = isString ? '' : inj.status;
                  const date = isString ? '' : inj.date;
                  const description = isString ? '' : inj.description;
                  
                  return (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.injuryCard}
                      onPress={() => {
                        if (!isString) {
                          setCurrentInjury(inj);
                          setShowInjuryModal(true);
                        }
                      }}
                    >
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <Text style={styles.injuryTitle}>{title}</Text>
                        {!isString && status && (
                          <View style={[styles.injuryBadge, {backgroundColor: status === 'Activa' ? 'rgba(239,68,68,0.2)' : status === 'Recuperada' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}]}>
                            <Text style={[styles.injuryBadgeText, {color: status === 'Activa' ? '#ef4444' : status === 'Recuperada' ? '#22c55e' : '#eab308'}]}>{status}</Text>
                          </View>
                        )}
                      </View>
                      {!isString && date ? <Text style={styles.injuryDate}>{date}</Text> : null}
                      {!isString && description ? <Text style={styles.injuryDesc}>{description}</Text> : null}
                      {isEditing && <Ionicons name="pencil" size={14} color="#ef4444" style={{position: 'absolute', right: 16, bottom: 16}} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Ninguna reportada</Text>
            )}
          </View>
        </View>

        {isEditing ? (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.plannerBtn}
            onPress={() => router.push(`/coach/planner?athleteId=${athlete.id}`)}
          >
            <Ionicons name="calendar" size={20} color="#000" />
            <Text style={styles.plannerBtnText}>Abrir Planificador</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
              
              <Text style={[styles.labelModal, {fontSize: 12}]}>TÍTULO</Text>
              {isEditing ? (
                <TextInput 
                  style={[styles.input, {marginBottom: 16}]} 
                  value={currentInjury.title} 
                  onChangeText={t => setCurrentInjury({...currentInjury, title: t})}
                  placeholder="Ej: Esguince" 
                  placeholderTextColor="#666"
                />
              ) : (
                <Text style={{color: '#fff', fontSize: 16, marginBottom: 16}}>{currentInjury.title}</Text>
              )}

              <Text style={[styles.labelModal, {fontSize: 12}]}>FECHA</Text>
              {isEditing ? (
                <TextInput 
                  style={[styles.input, {marginBottom: 16}]} 
                  value={currentInjury.date} 
                  onChangeText={t => setCurrentInjury({...currentInjury, date: t})}
                  placeholder="2023-05-10" 
                  placeholderTextColor="#666"
                />
              ) : (
                <Text style={{color: '#fff', fontSize: 16, marginBottom: 16}}>{currentInjury.date || 'No definida'}</Text>
              )}

              <Text style={[styles.labelModal, {fontSize: 12}]}>DESCRIPCIÓN</Text>
              {isEditing ? (
                <TextInput 
                  style={[styles.input, {marginBottom: 16, height: 80, textAlignVertical: 'top'}]} 
                  value={currentInjury.description} 
                  onChangeText={t => setCurrentInjury({...currentInjury, description: t})}
                  placeholder="Detalles..." 
                  placeholderTextColor="#666"
                  multiline
                />
              ) : (
                <Text style={{color: '#fff', fontSize: 16, marginBottom: 16, lineHeight: 22}}>{currentInjury.description || 'Sin detalles'}</Text>
              )}

              <Text style={[styles.labelModal, {fontSize: 12}]}>ESTADO</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 24}}>
                {['Activa', 'Observación', 'Recuperada'].map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.statusChip, currentInjury.status === s && styles.statusChipActive]}
                    onPress={() => isEditing && setCurrentInjury({...currentInjury, status: s})}
                    disabled={!isEditing}
                  >
                    <Text style={[styles.statusChipText, currentInjury.status === s && styles.statusChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isEditing && (
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
              )}
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#888', fontSize: 18, marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20, paddingBottom: 60 },
  
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, backgroundColor: '#333' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#aaa', marginBottom: 12 },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12, textTransform: 'uppercase', opacity: 0.7 },
  
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metricLabel: { fontSize: 12, color: '#888', marginTop: 8, marginBottom: 4 },
  metricValue: { fontSize: 16, color: '#fff', fontWeight: 'bold' },

  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  zoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  borderTop: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  zoneBadge: { backgroundColor: 'rgba(56, 189, 248, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  zoneBadgeText: { color: Theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
  zoneValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  label: { fontSize: 12, color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  text: { color: '#fff', fontSize: 15, lineHeight: 22 },
  emptyText: { color: '#555', fontSize: 15, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  
  injuryCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  injuryTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  injuryDate: { fontSize: 12, color: '#888', marginBottom: 8 },
  injuryDesc: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  injuryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  injuryBadgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  plannerBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginTop: 16, gap: 8 },
  plannerBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  saveBtn: { backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginTop: 16 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  
  // Edit Form Styles
  inputMini: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 8, borderRadius: 8, fontSize: 14, minWidth: 60, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  // Modal Specific
  labelModal: { fontSize: 12, fontWeight: 'bold', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  statusChipActive: { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: Theme.colors.primary },
  statusChipText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  statusChipTextActive: { color: Theme.colors.primary }
});
