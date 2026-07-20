import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';
import api from '../../services/api';

export default function CoachPlannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialAthleteId = params.athleteId ? parseInt(params.athleteId as string) : null;

  const [athletes, setAthletes] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown state
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(initialAthleteId);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');

  // Calendar State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Workout Form Modal State
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discipline, setDiscipline] = useState('ciclismo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAthletes, resWorkouts] = await Promise.all([
        api.get('/workouts/athletes'),
        api.get('/workouts/')
      ]);
      setAthletes(resAthletes.data);
      setWorkouts(resWorkouts.data);
    } catch (err) {
      console.log('Error fetching planner data', err);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const filteredAthletes = athletes.filter(a => {
    const str = `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase();
    return str.includes(athleteSearchQuery.toLowerCase());
  });

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  // Workouts for the selected day and athlete
  const dayWorkouts = workouts.filter(w => {
    if (w.athlete_id !== selectedAthleteId) return false;
    const wDate = new Date(w.scheduled_date);
    return wDate.toDateString() === selectedDate.toDateString();
  });

  // Mock function for future push notifications
  const sendPushNotification = async (athleteId: number, title: string) => {
    console.log(`[PUSH NOTIFICATION MOCK] Enviando notificación a atleta ${athleteId}: Se ha programado la rutina "${title}".`);
    // TODO: Implementar módulo genérico de notificaciones push (Expo Push Tokens).
  };

  const handleSaveWorkout = async () => {
    if (!selectedAthleteId || !selectedDate || !title) {
      Alert.alert('Error', 'El título y el atleta son requeridos');
      return;
    }
    setIsSubmitting(true);
    const payload = {
      title,
      description,
      scheduled_date: selectedDate.toISOString(),
      discipline,
      athlete_id: selectedAthleteId
    };

    try {
      if (modalMode === 'create') {
        await api.post('/workouts/', payload);
        // Generar notificación simulada
        sendPushNotification(selectedAthleteId, title);
        Alert.alert('Éxito', 'Rutina asignada correctamente');
      } else {
        await api.put(`/workouts/${editingWorkoutId}`, payload);
        Alert.alert('Éxito', 'Rutina actualizada');
      }
      setShowWorkoutModal(false);
      fetchData();
    } catch (err) {
      console.log('Error guardando rutina', err);
      Alert.alert('Error', 'No se pudo guardar la rutina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (id: number) => {
    Alert.alert('Eliminar', '¿Estás seguro de eliminar esta rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/workouts/${id}`);
            Alert.alert('Éxito', 'Rutina eliminada');
            fetchData();
          } catch (err) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

  const openCreateModal = () => {
    if (!selectedAthleteId) {
      Alert.alert('Atención', 'Selecciona un atleta primero');
      return;
    }
    setTitle('');
    setDescription('');
    setDiscipline('ciclismo');
    setModalMode('create');
    setShowWorkoutModal(true);
  };

  const openEditModal = (w: any) => {
    setEditingWorkoutId(w.id);
    setTitle(w.title);
    setDescription(w.description);
    setDiscipline(w.discipline || 'ciclismo');
    setModalMode('edit');
    setShowWorkoutModal(true);
  };

  const renderAthleteModal = () => (
    <Modal visible={showAthleteModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Seleccionar Atleta</Text>
          <TouchableOpacity onPress={() => setShowAthleteModal(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor="#888"
            value={athleteSearchQuery}
            onChangeText={setAthleteSearchQuery}
          />
        </View>
        <FlatList
          data={filteredAthletes}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.athleteRow} 
              onPress={() => {
                setSelectedAthleteId(item.id);
                setShowAthleteModal(false);
              }}
            >
              <Text style={styles.athleteRowText}>{item.first_name} {item.last_name}</Text>
              {selectedAthleteId === item.id && <Ionicons name="checkmark" size={20} color={Theme.colors.primary} />}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderWorkoutModal = () => (
    <Modal visible={showWorkoutModal} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{modalMode === 'create' ? 'Nueva Rutina' : 'Editar Rutina'}</Text>
          <TouchableOpacity onPress={() => setShowWorkoutModal(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Series de Fuerza..."
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
          
          <Text style={styles.label}>Disciplina</Text>
          <View style={styles.disciplineRow}>
            {['ciclismo', 'carrera', 'natacion', 'fuerza'].map(d => (
              <TouchableOpacity 
                key={d} 
                style={[styles.discBadge, discipline === d && styles.discBadgeActive]}
                onPress={() => setDiscipline(d)}
              >
                <Text style={[styles.discBadgeText, discipline === d && styles.discBadgeTextActive]}>{d.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalles de la sesión..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveWorkout} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading && athletes.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Athlete Selector */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowAthleteModal(true)}>
          <View>
            <Text style={styles.selectorLabel}>Atleta Seleccionado</Text>
            <Text style={styles.selectorValue}>
              {selectedAthlete ? `${selectedAthlete.first_name} ${selectedAthlete.last_name}` : 'Seleccionar...'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Calendar */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={prevWeek} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.calMonth}>{currentWeekStart.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={nextWeek} style={styles.calNavBtn}>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekContainer}>
        {getWeekDays().map((d, i) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          const hasWorkout = workouts.some(w => w.athlete_id === selectedAthleteId && new Date(w.scheduled_date).toDateString() === d.toDateString());
          return (
            <TouchableOpacity 
              key={i} 
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                {d.toLocaleDateString('es-CR', { weekday: 'short' }).substring(0,3)}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                {d.getDate()}
              </Text>
              {hasWorkout && <View style={[styles.workoutDot, isSelected && { backgroundColor: '#000' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Content */}
      <ScrollView style={styles.dayContent}>
        <Text style={styles.dayContentTitle}>
          Rutinas del {selectedDate.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        
        {!selectedAthleteId ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={48} color="#444" />
            <Text style={styles.emptyStateText}>Selecciona un atleta para ver sus rutinas.</Text>
          </View>
        ) : dayWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#444" />
            <Text style={styles.emptyStateText}>Día libre.</Text>
          </View>
        ) : (
          dayWorkouts.map(w => (
            <View key={w.id} style={[styles.workoutCard, w.is_completed && styles.workoutCardCompleted]}>
              <View style={styles.workoutCardHeader}>
                <View style={styles.workoutDiscipline}>
                  <Text style={styles.workoutDisciplineText}>{w.discipline}</Text>
                </View>
                <View style={styles.workoutActions}>
                  <TouchableOpacity onPress={() => openEditModal(w)} style={styles.iconBtn}>
                    <Ionicons name="pencil" size={18} color="#ccc" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteWorkout(w.id)} style={styles.iconBtn}>
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.workoutCardTitle, w.is_completed && styles.textCompleted]}>{w.title}</Text>
              <Text style={[styles.workoutCardDesc, w.is_completed && styles.textCompleted]}>{w.description}</Text>
              {w.is_completed && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.completedBadgeText}>Completado</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      {selectedAthleteId && (
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <Ionicons name="add" size={32} color="#000" />
        </TouchableOpacity>
      )}

      {renderAthleteModal()}
      {renderWorkoutModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { padding: 8, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  selectorBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 },
  selectorLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  selectorValue: { fontSize: 16, color: Theme.colors.primary, fontWeight: 'bold' },
  
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  calMonth: { fontSize: 16, color: '#fff', fontWeight: 'bold', textTransform: 'capitalize' },
  calNavBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  
  weekContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  dayItem: { alignItems: 'center', justifyContent: 'center', width: 44, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  dayItemSelected: { backgroundColor: Theme.colors.primary },
  dayName: { fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  dayNumber: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  dayTextSelected: { color: '#000' },
  workoutDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Theme.colors.primary, marginTop: 4 },
  
  dayContent: { flex: 1, padding: 16 },
  dayContentTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 16, textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { color: '#888', marginTop: 12, fontSize: 15 },
  
  workoutCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  workoutCardCompleted: { opacity: 0.7, borderColor: 'rgba(34, 197, 94, 0.3)' },
  workoutCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  workoutDiscipline: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  workoutDisciplineText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  workoutActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  workoutCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  workoutCardDesc: { fontSize: 14, color: '#aaa', lineHeight: 20 },
  textCompleted: { color: '#888', textDecorationLine: 'line-through' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  completedBadgeText: { color: '#22c55e', fontSize: 12, fontWeight: 'bold' },
  
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4 },

  modalContainer: { flex: 1, backgroundColor: Theme.colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  closeBtn: { padding: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', margin: 16, paddingHorizontal: 12, borderRadius: 12, height: 44 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
  athleteRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  athleteRowText: { fontSize: 16, color: '#fff' },

  formContainer: { padding: 20 },
  label: { fontSize: 13, color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { height: 120 },
  disciplineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  discBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  discBadgeActive: { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: Theme.colors.primary },
  discBadgeText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  discBadgeTextActive: { color: Theme.colors.primary },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});
