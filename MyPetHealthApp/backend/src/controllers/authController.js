///Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/controllers/authController.js
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const authController = {
  // Регистрация пользователя
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Проверяем обязательные поля только email и password
      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email и пароль обязательны для заполнения' 
        });
      }

      // Проверяем существует ли пользователь
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Пользователь с таким email уже существует' 
        });
      }

      // Если name не передан, сохраняем как null
      const userName = name || null;

      // Создаем пользователя
      const user = await User.create({ email, password, name: userName });

      // Генерируем токен
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar_path: user.avatar_path || '' // 🔹 добавляем
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Ошибка при регистрации пользователя' 
      });
    }
  },

  // Вход пользователя
  async login(req, res) {
    try {
      console.log("LOGIN START");
  
      const { email, password } = req.body;
  
      // Ищем пользователя
      const user = await User.findByEmail(email);
      console.log("USER FOUND:", user);
  
      if (!user) {
        return res.status(401).json({
          message: 'Неверный email или пароль'
        });
      }
  
      // Проверяем пароль
      const isPasswordValid = await User.verifyPassword(
        password,
        user.password_hash
      );
  
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Неверный email или пароль'
        });
      }
  
      // Генерируем токен
      const token = generateToken(user.id);
  
      res.json({
        message: 'Вход выполнен успешно',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar_path: user.avatar_path || '' // 🔹 добавляем
        }
      });
  
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Ошибка при входе в систему'
      });
    }
  }
,  

  // Получение данных текущего пользователя
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar_path: user.avatar_path || '' // 🔹 добавляем
        } 
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Ошибка при получении данных пользователя' });
    }
  }
};
