import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MONTHS = ['Todos', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [events, setEvents] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, regRes] = await Promise.all([
          api.get('/events/'),
          api.get('/events/my_registrations')
        ]);
        setEvents(eventsRes.data);
        setMyRegistrations(regRes.data);
      } catch (err) {
        console.log('Error fetching events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isRegistered = (eventId: number) => myRegistrations.some(r => r.event_id === eventId);

  const toggleRegistration = async (eventId: number) => {
    try {
      if (isRegistered(eventId)) {
        await api.delete(`/events/${eventId}/register`);
        setMyRegistrations(prev => prev.filter(r => r.event_id !== eventId));
        Alert.alert('Éxito', 'Te has desinscrito del evento');
      } else {
        const res = await api.post(`/events/${eventId}/register`);
        setMyRegistrations(prev => [...prev, res.data]);
        Alert.alert('Éxito', '¡Te has inscrito al evento!');
      }
      setSelectedEvent(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al procesar inscripción');
    }
  };

  const renderImageUrl = (itemUrl: string | undefined, defaultImg: string) => {
    if (!itemUrl || itemUrl === 'null' || itemUrl === 'undefined' || itemUrl === '') return defaultImg;
    if (itemUrl.startsWith('http') || itemUrl.startsWith('data:')) return itemUrl;
    const path = itemUrl.startsWith('/') ? itemUrl : `/${itemUrl}`;
    return `${api.defaults.baseURL}${path}`;
  };

  const filteredEvents = events.filter(e => {
    if (selectedMonth === 'Todos') return true;
    const date = new Date(e.date);
    // JS getMonth is 0-indexed, our array 'Todos' is 0, 'Enero' is 1
    const monthIndex = MONTHS.indexOf(selectedMonth) - 1;
    return date.getMonth() === monthIndex;
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eventos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {MONTHS.map(month => (
            <TouchableOpacity 
              key={month} 
              style={[styles.filterChip, selectedMonth === month && styles.filterChipActive]}
              onPress={() => setSelectedMonth(month)}
            >
              <Text style={[styles.filterText, selectedMonth === month && styles.filterTextActive]}>{month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const imageUrl = renderImageUrl(item.image_url, 'https://images.unsplash.com/photo-1552674605-15cff24f3c88?auto=format&fit=crop&q=80&w=400');
          const registered = isRegistered(item.id);
          return (
            <TouchableOpacity style={styles.eventCardFull} onPress={() => setSelectedEvent(item)}>
              <Image source={{ uri: imageUrl }} style={styles.eventImageFull} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,1)']} style={styles.eventOverlay} />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="calendar-outline" size={14} color={Theme.colors.primary} />
                  <Text style={styles.eventDetailText}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location-outline" size={14} color={Theme.colors.primary} />
                  <Text style={styles.eventDetailText}>{item.location || 'Virtual / Por definir'}</Text>
                </View>
                {registered && (
                  <View style={styles.registeredBadge}>
                    <Text style={styles.registeredBadgeText}>Inscrito</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay eventos para el mes de {selectedMonth}</Text>
          </View>
        }
      />

      <Modal visible={!!selectedEvent} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalContainer}>
          {selectedEvent && (() => {
            const imageUrl = renderImageUrl(selectedEvent.image_url, 'https://images.unsplash.com/photo-1552674605-15cff24f3c88?auto=format&fit=crop&q=80&w=400');
            const registered = isRegistered(selectedEvent.id);
            return (
              <>
                <Image source={{ uri: imageUrl }} style={styles.modalImage} />
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedEvent(null)}>
                  <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.modalDesc}>{selectedEvent.description}</Text>
                  
                  <View style={styles.eventDetailRowLarge}>
                    <Ionicons name="calendar" size={20} color={Theme.colors.primary} />
                    <Text style={styles.eventDetailTextLarge}>{new Date(selectedEvent.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.eventDetailRowLarge}>
                    <Ionicons name="location" size={20} color={Theme.colors.primary} />
                    <Text style={styles.eventDetailTextLarge}>{selectedEvent.location || 'Ubicación Virtual / Por definir'}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.actionBtn, registered ? styles.cancelBtn : null]} 
                    onPress={() => toggleRegistration(selectedEvent.id)}
                  >
                    <Ionicons name={registered ? "close-circle" : "checkmark-circle"} size={20} color={registered ? "#fff" : "#000"} />
                    <Text style={[styles.actionBtnText, registered ? { color: '#fff' } : null]}>
                      {registered ? 'Cancelar Inscripción' : 'Inscribirse al Evento'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    padding: Theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  filtersContainer: {
    paddingVertical: Theme.spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: Theme.spacing.md,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterText: {
    color: Theme.colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
    gap: 16,
  },
  eventCardFull: {
    width: '100%',
    height: 200,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Theme.colors.surface,
  },
  eventImageFull: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  eventContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing.md,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },
  registeredBadge: {
    backgroundColor: Theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  registeredBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.foreground,
    opacity: 0.5,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  modalContent: {
    padding: 24,
    flex: 1,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 24,
  },
  eventDetailRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailTextLarge: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  actionBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: Theme.borderRadius.lg,
    marginTop: 30,
  },
  cancelBtn: {
    backgroundColor: Theme.colors.error,
  },
  actionBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
