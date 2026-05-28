// /src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types';
import { BASE_URL } from '../config/api';

// Базовый URL нашего бэкенда
const API_URL = `${BASE_URL}/api`;
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// 🔵 ИНТЕРСЕПТОР ДЛЯ ЗАПРОСОВ (логируем все запросы)
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Логируем запрос - безопасно проверяем наличие baseURL
      const fullUrl = config.baseURL 
        ? `${config.baseURL}${config.url}` 
        : config.url || 'unknown URL';
      console.log('📤 REQUEST:', config.method?.toUpperCase(), fullUrl);
      console.log('📦 DATA:', config.data);
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🟢 ИНТЕРСЕПТОР ДЛЯ ОТВЕТОВ (логируем ответы и ошибки)
api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Безопасно получаем URL запроса
    const requestUrl = error.response?.config?.url || error.config?.url || 'unknown URL';
    console.log('❌ ERROR:', error.response?.status, requestUrl);
    console.log('❌ ERROR DATA:', error.response?.data);
    return Promise.reject(error);
  }
);

export const petsAPI = {
  getPets: async (userId: number) => {
    const petsResponse = await api.get(`/pets?user_id=${userId}`);
    const pets = petsResponse.data;

    const dogBreeds = await api.get(`/pets/breeds?species=dog`);
    const catBreeds = await api.get(`/pets/breeds?species=cat`);
    const breeds = [...dogBreeds.data, ...catBreeds.data];

    const breedsMap: Record<number, { name: string; name_ru?: string; size_category?: string }> = {};
    breeds.forEach((breed: any) => {
      breedsMap[breed.id] = {
        name: breed.name,
        name_ru: breed.name_ru,
        size_category: breed.size_category,
      };
    });

    const petsWithBreedInfo = pets.map((pet: any) => ({
      ...pet,
      breed_name: breedsMap[pet.breed_id]?.name,
      breed_name_ru: breedsMap[pet.breed_id]?.name_ru,
      breed_size_category: breedsMap[pet.breed_id]?.size_category ?? 'medium',
    }));

    return petsWithBreedInfo;
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
    neutered: boolean,
    description?: string,
    photoBase64?: string
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
      description,
      photo_url: photoBase64,
    });
  
    return response.data;
  },

  updatePet: async (
    petId: number,
    name: string,
    species: 'dog' | 'cat',
    breedId: number,
    weight: number,
    height: number,
    age: number,
    sex: 'male' | 'female',
    neutered: boolean,
    description?: string,
    photoBase64?: string
  ) => {
    // Используем POST вместо PUT
    const response = await api.post(`/pets/${petId}`, {
      name,
      species,
      breed_id: breedId,
      weight,
      height,
      age,
      sex,
      neutered,
      description,
      photo_url: photoBase64,
      _method: 'PUT' // Для совместимости, если бэкенд использует это
    });
  
    return response.data;
  },

  deletePet: async (petId: number) => {
    const response = await api.delete(`/pets/${petId}`);
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