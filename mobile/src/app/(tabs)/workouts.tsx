import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function WorkoutsScreen() {
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);

  // Date Logic for Week Navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  });

  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      
      const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
      
      days.push({
        date: d,
        name: dayNames[d.getDay()],
        dayNumber: d.getDate(),
        fullDateStr: d.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const prevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const fetchWorkouts = async () => {
    try {
      const res = await api.get('/workouts/');
      const data = res.data;
      data.sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      setWorkouts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [currentWeekStart]);

  const handleToggleComplete = async (workout: any) => {
    try {
      const res = await api.put(`/workouts/${workout.id}`, {
        is_completed: !workout.is_completed
      });
      if (res.status === 200) {
        fetchWorkouts();
        setSelectedWorkout(null);
      }
    } catch (err) {
      console.log('Error', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const workoutsForSelectedDay = workouts.filter(w => w.scheduled_date.startsWith(selectedDay));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi Plan</Text>
          <Text style={styles.subtitle}>Sigue tus rutinas diarias</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: Theme.colors.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textTransform: 'capitalize' }}>
            {currentWeekStart.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={Theme.colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Week Slider */}
      <View style={styles.sliderContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={weekDays}
          keyExtractor={(item) => item.fullDateStr}
          renderItem={({ item }) => {
            const isSelected = item.fullDateStr === selectedDay;
            const isToday = item.fullDateStr === new Date().toISOString().split('T')[0];
            const hasWorkouts = workouts.some(w => w.scheduled_date.startsWith(item.fullDateStr));

            return (
              <TouchableOpacity 
                style={[
                  styles.dayCard, 
                  isSelected && styles.dayCardSelected
                ]}
                onPress={() => setSelectedDay(item.fullDateStr)}
              >
                <Text style={[styles.dayName, isSelected && { color: '#000' }]}>{item.name}</Text>
                <View style={[
                  styles.dayNumberCircle, 
                  isToday && !isSelected && { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.primary, borderWidth: 1 }
                ]}>
                  <Text style={[styles.dayNumber, isSelected && { color: '#fff' }, isToday && !isSelected && { color: Theme.colors.primary }]}>
                    {item.dayNumber}
                  </Text>
                </View>
                {hasWorkouts && (
                  <View style={[styles.workoutDot, isSelected && { backgroundColor: '#000' }]} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Workouts List for Selected Day */}
      <ScrollView contentContainerStyle={styles.workoutsList}>
        {workoutsForSelectedDay.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cafe-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyStateText}>Día Libre</Text>
          </View>
        ) : (
          workoutsForSelectedDay.map((w) => (
            <TouchableOpacity 
              key={w.id} 
              style={[
                styles.workoutCard,
                w.is_completed && styles.workoutCardCompleted
              ]}
              onPress={() => setSelectedWorkout(w)}
            >
              <View style={styles.workoutCardHeader}>
                <Text style={[styles.disciplineBadge, w.is_completed && { color: Theme.colors.success }]}>
                  {w.discipline}
                </Text>
                {w.is_completed && <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />}
              </View>
              <Text style={[styles.workoutTitle, w.is_completed && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                {w.title}
              </Text>
              
              <View style={styles.workoutFooter}>
                <View style={styles.timeWrapper}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.timeText}>
                    {new Date(w.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {w.tss_score && (
                  <Text style={styles.tssText}>TSS: {w.tss_score}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Workout Detail Modal */}
      <Modal visible={!!selectedWorkout} animationType="slide" transparent={true}>
        {selectedWorkout && (
          <View style={styles.modalOverlay}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalDiscipline}>{selectedWorkout.discipline}</Text>
                  <Text style={styles.modalTitle}>{selectedWorkout.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedWorkout(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionTitle}>Instrucciones del Plan</Text>
                  <Text style={styles.instructionText}>{selectedWorkout.description}</Text>
                </View>

                {selectedWorkout.event_id && (
                  <View style={styles.eventCard}>
                    <Ionicons name="calendar" size={20} color={Theme.colors.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.eventCardTitle}>Parte de un Evento</Text>
                      <Text style={styles.eventCardText}>Rutina asignada en base a tu calendario.</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.actionBtn, selectedWorkout.is_completed ? styles.actionBtnDanger : styles.actionBtnPrimary]}
                  onPress={() => handleToggleComplete(selectedWorkout)}
                >
                  <Ionicons 
                    name={selectedWorkout.is_completed ? "close-circle-outline" : "checkmark-circle-outline"} 
                    size={24} 
                    color={selectedWorkout.is_completed ? Theme.colors.error : "#fff"} 
                  />
                  <Text style={[styles.actionBtnText, selectedWorkout.is_completed && { color: Theme.colors.error }]}>
                    {selectedWorkout.is_completed ? 'Marcar como Pendiente' : '¡Completar Rutina!'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl, // Safe area roughly
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.foreground,
    opacity: 0.7,
  },
  weekNav: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  navBtn: {
    padding: 8,
  },
  sliderContainer: {
    paddingLeft: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  dayCard: {
    width: 65,
    height: 90,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    position: 'relative',
  },
  dayCardSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  dayName: {
    fontSize: 10,
    color: Theme.colors.foreground,
    opacity: 0.6,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  dayNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  workoutDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    position: 'absolute',
    bottom: 8,
  },
  workoutsList: {
    padding: Theme.spacing.lg,
    paddingBottom: 100, // Tabs padding
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    opacity: 0.8,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutCard: {
    backgroundColor: 'rgba(13, 131, 177, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(13, 131, 177, 0.3)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  workoutCardCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disciplineBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Theme.colors.primary,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginBottom: 12,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 4,
  },
  tssText: {
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    color: '#fff',
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    height: '85%',
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Theme.colors.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xl,
  },
  modalDiscipline: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  closeBtn: {
    backgroundColor: Theme.colors.surface,
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
  },
  instructionCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  instructionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    color: Theme.colors.foreground,
    lineHeight: 22,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 131, 177, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(13, 131, 177, 0.3)',
    alignItems: 'center',
  },
  eventCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  eventCardText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  modalFooter: {
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
  },
  actionBtnPrimary: {
    backgroundColor: Theme.colors.primary,
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.error,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  }
});
