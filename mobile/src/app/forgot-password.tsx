import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Theme } from '../constants/theme';
import api from '../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      setError('Por favor ingresa tu correo.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'Si el correo existe, recibirás instrucciones.');
    } catch (err: any) {
      console.log(err);
      setError('Ocurrió un error al procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.background, Theme.colors.surface, '#000000']}
        style={StyleSheet.absoluteFill}
      />
      <Image source={require('../../assets/images/logo.png')} style={styles.radialGlow} resizeMode="contain" />

      <BlurView intensity={30} tint="dark" style={styles.glassCard}>
        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subtitle}>Ingresa tu correo para recibir las instrucciones.</Text>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar correo</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
  },
  radialGlow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 300,
    height: 300,
    opacity: 0.15,
  },
  glassCard: {
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glassBg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.foreground,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Theme.spacing.xl,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: Theme.colors.foreground,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: Theme.colors.error,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
    fontSize: 14,
  },
  success: {
    color: Theme.colors.success,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
    fontSize: 14,
  },
  backButton: {
    marginTop: Theme.spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    color: Theme.colors.foreground,
    opacity: 0.7,
    fontSize: 14,
  }
});
