import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types';

// Базовый URL нашего бэкенда
// Базовый URL нашего бэкенда через ngrok
// /src/services/api.ts
const API_URL = 'http://192.168.0.98:3001/api';
console.log('API URL:', API_URL);  // должно выводиться в консоли Expo



const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const petsAPI = {
  // Получить питомцев пользователя
  getPets: async (userId: number) => {
    const response = await api.get(`/pets?user_id=${userId}`);
    return response.data;
  },

  // Добавить нового питомца
  addPet: async (
    userId: number,
    name: string,
    species: 'dog' | 'cat',
    breedId: number,
    weight: number,
    height: number,
    age: number
  ) => {
    const response = await api.post('/pets', {
      user_id: userId,
      name,
      species,
      breed_id: breedId,
      weight,
      height,
      age,
    });
  
    return response.data;
  },

  // 🔹 Новый метод: получить список пород по виду
  getBreeds: async (species: 'dog' | 'cat', search: string = '') => {
    const response = await api.get(`/pets/breeds?species=${species}&search=${search}`);
    return response.data;
  },
};

export const authAPI = {
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;
