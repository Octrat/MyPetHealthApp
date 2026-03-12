///Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/routes/avatar.js
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/avatars'); // путь относительно backend
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// POST /api/user/avatar
router.post('/', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Обновляем avatar_path в users
    await pool.query(
        'UPDATE users SET avatar_path = $1 WHERE id = $2',
        [avatarPath, req.user.userId] // ✅ используем userId из токена
      );

    res.json({ avatar_url: avatarPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при загрузке аватара' });
  }
});

export default router;