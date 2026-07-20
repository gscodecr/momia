import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [athletesData, setAthletesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'MY_ATHLETES' | 'ALL'>('MY_ATHLETES');

  const fetchDashboardData = async () => {
    try {
      const [resAthletes, resWorkouts] = await Promise.all([
        api.get('/workouts/athletes'),
        api.get('/workouts/')
      ]);

      const athletes = resAthletes.data;
      const workouts = resWorkouts.data;
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const day = now.getDay();
      const diffMon = now.getDate() - day + (day === 0 ? -6 : 1);
      
      const startOfWeek = new Date(now.setDate(diffMon));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const processedAthletes = athletes.map((athlete: any) => {
        const athWorkouts = workouts.filter((w: any) => w.athlete_id === athlete.id);
        const weekWorkouts = athWorkouts.filter((w: any) => {
          const d = new Date(w.scheduled_date);
          return d >= startOfWeek && d <= endOfWeek;
        });

        const totalWeek = weekWorkouts.length;
        const completedWeek = weekWorkouts.filter((w: any) => w.is_completed).length;
        
        let compliance = 0;
        let colorClass = '#71717a'; // zinc-500

        if (totalWeek > 0) {
          compliance = Math.round((completedWeek / totalWeek) * 100);
          if (compliance === 100) {
            colorClass = '#22c55e'; // green-500
          } else if (compliance > 0) {
            colorClass = '#eab308'; // yellow-500
          } else {
            colorClass = '#ef4444'; // red-500
          }
        }

        const completedWorkouts = athWorkouts.filter((w: any) => w.is_completed);
        completedWorkouts.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
        const lastWorkout = completedWorkouts.length > 0 ? new Date(completedWorkouts[0].scheduled_date) : null;

        return {
          ...athlete,
          totalWeek,
          completedWeek,
          compliance,
          colorClass,
          lastWorkout
        };
      });

      processedAthletes.sort((a: any, b: any) => a.compliance - b.compliance);
      setAthletesData(processedAthletes);
    } catch (err) {
      console.log('Error fetching dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatLastWorkout = (date: Date | null) => {
    if (!date) return 'Sin actividad';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-CR', { month: 'short', day: 'numeric' });
  };

  const filteredAthletes = athletesData.filter(athlete => {
    const searchStr = `${athlete.first_name} ${athlete.last_name} ${athlete.email}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'MY_ATHLETES') {
      matchesTab = athlete.athlete_profile?.coach_id === user?.id;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Atletas</Text>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'MY_ATHLETES' && styles.tabButtonActive]}
            onPress={() => setActiveTab('MY_ATHLETES')}
          >
            <Ionicons name="people" size={16} color={activeTab === 'MY_ATHLETES' ? Theme.colors.primary : '#888'} />
            <Text style={[styles.tabText, activeTab === 'MY_ATHLETES' && styles.tabTextActive]}>Mis Atletas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <Ionicons name="earth" size={16} color={activeTab === 'ALL' ? Theme.colors.primary : '#888'} />
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>Todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAthletes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="body-outline" size={48} color="#444" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>No se encontraron atletas</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.athleteInfo}>
                  {item.avatar_url ? (
                    <Image source={{ uri: `http://127.0.0.1:8001${item.avatar_url}` }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{item.first_name[0]}{item.last_name[0]}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.nameText}>{item.first_name} {item.last_name}</Text>
                    <View style={styles.lastActivityRow}>
                      <Ionicons name="time-outline" size={12} color="#aaa" />
                      <Text style={styles.emailText}> Última act: {formatLastWorkout(item.lastWorkout)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.complianceBox}>
                  <Text style={[styles.complianceValue, { color: item.colorClass }]}>{item.compliance}%</Text>
                  <Text style={styles.complianceSessions}>{item.completedWeek}/{item.totalWeek} ses</Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${item.compliance}%`, backgroundColor: item.colorClass }]} />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={styles.actionBtnOutline}
                  onPress={() => router.push(`/coach/athlete/${item.id}`)}
                >
                  <Ionicons name="folder-open" size={16} color={Theme.colors.primary} />
                  <Text style={styles.actionBtnOutlineText}>Expediente</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => router.push(`/coach/planner?athleteId=${item.id}`)}
                >
                  <Ionicons name="calendar" size={16} color="#000" />
                  <Text style={styles.actionBtnText}>Planificador</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.primary, marginBottom: 16 },
  tabsContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  tabButtonActive: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: Theme.colors.primary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, height: '100%' },
  listContainer: { padding: 20, paddingTop: 10, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#888', fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  athleteInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  nameText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  lastActivityRow: { flexDirection: 'row', alignItems: 'center' },
  emailText: { color: '#aaa', fontSize: 12 },
  complianceBox: { alignItems: 'flex-end' },
  complianceValue: { fontSize: 20, fontWeight: '900' },
  complianceSessions: { color: '#888', fontSize: 11, marginTop: 2 },
  progressBarContainer: { height: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  progressBar: { height: '100%', borderRadius: 3 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  actionBtnOutline: { flex: 1, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.primary },
  actionBtnOutlineText: { color: Theme.colors.primary, fontWeight: 'bold', fontSize: 13 },
});
