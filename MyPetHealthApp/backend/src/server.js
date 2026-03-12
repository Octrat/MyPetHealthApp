// /Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/server.js
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import petsRoutes from './routes/pets.js';
import avatarRoutes from './routes/avatar.js';

import { authenticateToken } from './middleware/auth.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
}));

app.use(express.json());
app.use((req, res, next) => {
  console.log('➡️', req.method, req.url);
  next();
});
app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/pets', authenticateToken, petsRoutes);
app.use('/api/user/avatar', authenticateToken, avatarRoutes); // ✅ загрузка аватара

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: '🐾 PetHealth Backend is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      pets: '/api/pets',
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'OK',
    database: dbStatus ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 Main page: http://127.0.0.1:${PORT}`);
});