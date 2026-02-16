📱 Fullstack Authentication App — README
📖 Описание проекта
Приложение представляет собой full‑stack систему аутентификации пользователей с регистрацией, входом и хранением данных пользователя.
Проект состоит из:
•	Frontend — React Native (Expo)
•	Backend — Node.js + Express
•	Database — PostgreSQL
•	Контейнеризация — Docker + Docker Compose
 
🏗 Архитектура проекта
project/
│
├── frontend/        # React Native (Expo)
├── backend/         # Express API
├── docker-compose.yml
└── README.md
Backend
•	REST API
•	JWT аутентификация
•	bcrypt для хеширования паролей
•	PostgreSQL база данных
Frontend
•	React Native + Expo
•	Context API для авторизации
•	AsyncStorage для хранения токена
 
⚙️ Требования
Перед запуском убедитесь, что установлены:
•	Node.js >= 18
•	Docker
•	Docker Compose
•	npm или yarn
•	Expo CLI
 
🚀 Быстрый запуск (Docker)
1. Клонирование проекта
git clone <repo-url>
cd project
2. Запуск backend + database
docker compose up --build
После запуска API будет доступен по адресу:
http://localhost:3001
 
📱 Запуск Frontend
Перейдите в папку frontend:
cd frontend
npm install
npm start
Запуск откроет Expo Dev Tools.
Можно использовать:
•	Android Emulator
•	iOS Simulator
•	Expo Go на телефоне
 
🌐 Настройка API URL (ВАЖНО)
В файле:
src/config/api.ts
используется переключение адреса backend:
import { Platform } from 'react-native';

const HOST = Platform.OS === 'android'
  ? '10.0.2.2'
  : 'localhost';

export const BASE_URL = `http://${HOST}:3001/api`;
Почему это важно
Эмуляторы и реальные устройства работают в разных сетях:
Среда	HOST
iOS Simulator	localhost
Android Emulator	10.0.2.2
Physical device	IP компьютера
Если указан неправильный IP — запросы будут зависать (бесконечная загрузка).
 
🔐 API Endpoints
Регистрация
POST /api/auth/register
Body:
{
  "email": "user@mail.com",
  "password": "123456"
}
 
Вход
POST /api/auth/login
 
Получение пользователя
GET /api/user/me
Authorization: Bearer <token>
 
✅ Валидация
Backend проверяет:
•	корректность email
•	минимальную длину пароля (6 символов)
•	существование пользователя
Пример ошибок:
{
  "message": "Пароль должен быть минимум 6 символов"
}
 
🐳 Docker сервисы
В docker-compose запускаются:
•	backend (Node.js)
•	postgres (database)
Основные команды:
# запуск
docker compose up

# пересборка
docker compose up --build

# остановка
docker compose down
 
🧪 Типичные проблемы и решения
❌ Бесконечная загрузка при логине
Причина: frontend не может достучаться до backend.
Решение:
•	проверить BASE_URL
•	убедиться что контейнер backend запущен
•	проверить порт 3001
 
❌ Нет ошибок при неправильном пароле
Причина: отсутствует backend‑валидация.
Решение: добавить проверки email и длины пароля в authController.
 
❌ Network request failed
Проверьте:
•	Docker контейнеры
•	firewall
•	правильный HOST для платформы
 
🔒 Переменные окружения (backend)
Пример .env:
PORT=3001
JWT_SECRET=supersecret
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=authdb
DB_PORT=5432
 
📦 Технологии
•	React Native
•	Expo
•	Node.js
•	Express
•	PostgreSQL
•	JWT
•	Docker
 
📌 Рекомендации по разработке
•	Использовать единый API client вместо прямого fetch
•	Добавить timeout для запросов
•	Добавить refresh token
•	Использовать централизованную обработку ошибок
 
👨‍💻 Автор
Проект выполнен в учебных целях.
 
📄 Лицензия
MIT License
<img width="484" height="667" alt="image" src="https://github.com/user-attachments/assets/98b884b0-20c0-4844-8f17-fdb947ba957c" />
