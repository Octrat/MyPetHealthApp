//Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types';

// Базовый URL нашего бэкенда
// Базовый URL нашего бэкенда через ngrok
// /src/services/api.ts
const API_URL = 'http://192.168.0.59:3001/api';
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

// src/services/api.ts
export const petsAPI = {
  getPets: async (userId: number) => {
    // получаем питомцев
    const petsResponse = await api.get(`/pets?user_id=${userId}`);
    const pets = petsResponse.data; // массив Pet[]

    // получаем все породы для собак и кошек
    const dogBreeds = await api.get(`/pets/breeds?species=dog`);
    const catBreeds = await api.get(`/pets/breeds?species=cat`);
    const breeds = [...dogBreeds.data, ...catBreeds.data];

    // создаем словарь breed_id -> size_category
    const breedsMap: Record<number, string> = {};
    breeds.forEach((breed: any) => {
      breedsMap[breed.id] = breed.size_category; // 'toy' | 'small' | ...
    });

    // добавляем к каждому питомцу поле breed_size_category
    const petsWithSize = pets.map((pet: any) => ({
      ...pet,
      breed_size_category: breedsMap[pet.breed_id] ?? 'medium', // если нет данных — 'medium'
    }));

    return petsWithSize;
  },

  addPet: async (
    userId: number,
    name: string,
    species: 'dog' | 'cat',
    breedId: number,
    weight: number,
    height: number,
    age: number,
    sex: 'male' | 'female',
    neutered: boolean
  ) => {
    const response = await api.post('/pets', {
      user_id: userId,
      name,
      species,
      breed_id: breedId,
      weight,
      height,
      age,
      sex,
      neutered,
    });
  
    return response.data;
  },

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
