// Типы для пользователя
export interface User {
  id: number;
  email: string;
  name?: string;       // имя опционально
  created_at?: string;
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
  breed_id?: number;       // id породы
  breed_name?: string;     // 🔹 добавляем это
  birth_date?: string;
  weight?: number;
  photo_url?: string;
  created_at?: string;
}
// Тип для породы
export interface Breed {
  id: number;
  name: string;
}


// Ответ API для питомцев
export interface PetsResponse {
  pets: Pet[];
}
