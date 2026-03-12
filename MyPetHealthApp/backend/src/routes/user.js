///Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/routes/user.js
import express from 'express';
import { userController } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Используем PATCH и базовый путь '/' для обновления текущего пользователя
router.patch('/', authenticateToken, userController.updateUser);

export default router;
