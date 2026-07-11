// services/healthTracker.ts
export interface HealthData {
  distance: number;
  duration: number;
  heartRateAvg: number;
  source: 'STRAVA' | 'APPLE_HEALTH' | 'GOOGLE_FIT' | 'MANUAL';
}

/**
 * Módulo de planificación para ingesta de datos
 * En la versión final, este servicio:
 * 1. Conectará con @react-native-health para Apple Health.
 * 2. Conectará con google-fit para Android.
 * 3. Enviará los datos capturados al endpoint de Python (ej: /athletes/sync-workout).
 */
export const syncHealthData = async (userId: number): Promise<HealthData[]> => {
  // Simulación de extracción de datos del celular
  console.log("Extrayendo datos de Strava/Apple Health...");
  
  return [
    {
      distance: 5.2, // km
      duration: 1800, // segundos
      heartRateAvg: 145,
      source: 'APPLE_HEALTH'
    }
  ];
};
