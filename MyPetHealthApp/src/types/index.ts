// Типы для пользователя
export interface User {
  id: number;
  email: string;
  name?: string;       // имя опционально
  created_at?: string;
  avatar_path?: string; // ✅ добавляем поле

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
  // name больше не передаем
}
// Тип питомца
// Тип питомца
export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: 'dog' | 'cat';
  breed_id?: number;
  breed_name?: string;
  birth_date?: string;
  weight?: number;
  height?: number;
  age?: number;
  photo_url?: string;

  // Новые свойства
  sex?: 'male' | 'female';
  neutered?: boolean;

  // Добавляем breed_size_category
  breed_size_category?: 'toy' | 'small' | 'medium' | 'large' | 'giant';

  created_at?: string;
}
// Тип для породы
export interface Breed {
  id: number;
  name: string;
  name_ru?: string;
  size_category?: 'toy' | 'small' | 'medium' | 'large' | 'giant';
}


// Ответ API для питомцев
export interface PetsResponse {
  pets: Pet[];
}
