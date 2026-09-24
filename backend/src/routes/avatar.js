import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import fs from 'fs';

const router = express.Router();

// Убедимся что папка существует
const uploadDir = 'src/uploads/avatars';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Убираем пробелы и спецсимволы из имени файла
    const cleanName = file.originalname.replace(/\s/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + cleanName);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый формат файла. Используйте JPEG, PNG или HEIC'), false);
  }
};

// Настройка multer с лимитами
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10 MB лимит
  },
  fileFilter
});

// POST /api/user/avatar
router.post('/', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Обновляем avatar_path в users
    await pool.query(
      'UPDATE users SET avatar_path = $1 WHERE id = $2',
      [avatarPath, req.user.userId]
    );

    res.json({ 
      avatar_url: avatarPath,
      message: 'Аватар успешно загружен'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Ошибка сервера при загрузке аватара' });
  }
});

export default router;