import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import userRoutes from './user.js';

const router = express.Router();

// Публичные маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);

// Защищенные маршруты
router.get('/me', authenticateToken, authController.getMe);
router.use('/user', userRoutes); // 🔹 новый маршрут

export default router;
