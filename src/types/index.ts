// src/types/index.ts

// Типы для пользователя
export interface User {
  id: number;
  email: string;
  name?: string;       // имя опционально
  created_at?: string;
  avatar_path?: string;
  address?: string;
  role: 'user' | 'admin';  // ← добавляем role
}

// Типы для API ответов
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;  // имя можно передавать при регистрации
}

// Тип питомца
export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: 'dog' | 'cat';
  breed_id?: number;
  breed_name?: string;
  breed_name_ru?: string;
  birth_date?: string;
  weight: number;
  height?: number;
  age: number;
  photo_url?: string;
  sex?: 'male' | 'female';
  neutered?: boolean;
  breed_size_category?: 'toy' | 'small' | 'medium' | 'large' | 'giant';
  description?: string;
  created_at?: string;
}

// Тип для породы
export interface Breed {
  id: number;
  name: string;
  name_ru?: string;
  size_category?: 'toy' | 'small' | 'medium' | 'large' | 'giant';
}

// Тип медикамента
export interface Medication {
  id: number;
  name: string;
  species: 'dog' | 'cat';
  age_min: number;
  age_max: number;
  weight_min: number;
  weight_max: number;
  type: 'antiparasitic' | 'deworming' | 'vaccination';
  application_interval_days: number;
  notes: string;
}

// Ответ API для питомцев
export interface PetsResponse {
  pets: Pet[];
}