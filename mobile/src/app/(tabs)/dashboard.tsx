import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // In a real app, fetch dashboard stats here
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.first_name}</Text>
        <Text style={styles.roleText}>{user?.role.name.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen Semanal</Text>
        <Text style={styles.cardText}>Entrenamientos completados: 0 / 5</Text>
        <Text style={styles.cardText}>TSS Acumulado: 0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Próximo Evento</Text>
        <Text style={styles.cardText}>Aún no estás registrado en eventos cercanos.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  roleText: {
    fontSize: 12,
    color: '#DFFF00',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  }
});
