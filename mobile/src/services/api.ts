import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Dynamically determine the backend URL based on the platform and environment
const getBaseUrl = () => {
  // If running on an Android emulator, localhost is 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8001';
  }
  // For iOS Simulator or web
  return 'http://127.0.0.1:8001';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      let token: string | null = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('token');
      } else {
        token = await SecureStore.getItemAsync('token');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
