import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function WorkoutsScreen() {
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const res = await api.get('/workouts/');
        setWorkouts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.date}>{new Date(item.scheduled_date).toLocaleDateString()}</Text>
      <Text style={[styles.status, item.is_completed ? styles.completed : styles.pending]}>
        {item.is_completed ? 'Completado' : 'Pendiente'}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, backgroundColor: '#09090b' }} color="#DFFF00" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        {user?.role.name === 'coach' ? 'Rutinas Asignadas' : 'Tus Rutinas'}
      </Text>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  status: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 12,
  },
  completed: {
    color: '#10b981',
  },
  pending: {
    color: '#f59e0b',
  }
});
