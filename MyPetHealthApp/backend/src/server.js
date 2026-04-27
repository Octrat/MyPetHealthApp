import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Определяем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import petsRoutes from './routes/pets.js';
import avatarRoutes from './routes/avatar.js';
import visionRoutes from './routes/vision.js';

import { authenticateToken } from './middleware/auth.js';
import { testConnection } from './config/database.js';

// ИМПОРТЫ ДЛЯ AI АССИСТЕНТА И РАСПОЗНАВАНИЯ ПОРОД
import { askGemini } from './services/geminiService.js';
import { recognizeBreedWithGemini, quickBreedRecognize } from './services/geminiVisionService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Проверка API ключей при запуске
console.log('\n🔐 API Keys Check:');
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`   GEMINI_API_KEY length: ${process.env.GEMINI_API_KEY?.length || 0}`);
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not set! Breed recognition will fail.');
}
console.log('');

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ✅ УВЕЛИЧИВАЕМ ЛИМИТ ДЛЯ БОЛЬШИХ ФАЙЛОВ (аватары, фото)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log('➡️', req.method, req.url);
  next();
});
app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/pets', authenticateToken, petsRoutes);
app.use('/api/user/avatar', authenticateToken, avatarRoutes);
app.use('/api/vision', authenticateToken, visionRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: '🐾 PetHealth Backend is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      pets: '/api/pets',
      vision: '/api/vision',
      assistant: '/api/assistant/ask',
      'vision-gemini': '/api/vision/gemini-recognize',
      'vision-quick': '/api/vision/quick-recognize',
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

// ============================================
// 🤖 ЭНДПОИНТ ДЛЯ AI АССИСТЕНТА (Доктор Хвост)
// ============================================
app.post('/api/assistant/ask', authenticateToken, async (req, res) => {
  const { question, history } = req.body;
  
  if (!question || question.trim().length === 0) {
    return res.status(400).json({ message: 'Напишите ваш вопрос' });
  }
  
  try {
    const answer = await askGemini(question, history || []);
    res.json({ answer });
  } catch (error) {
    console.error('Ошибка в /api/assistant/ask:', error);
    res.status(500).json({ message: 'Ошибка получения ответа' });
  }
});

// ============================================
// 🐕 ЭНДПОИНТЫ ДЛЯ РАСПОЗНАВАНИЯ ПОРОД ЧЕРЕЗ GEMINI
// ============================================

// Полное распознавание породы с детальными характеристиками
app.post('/api/vision/gemini-recognize', authenticateToken, async (req, res) => {
  try {
    const { image, species } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: 'Изображение не предоставлено' });
    }
    
    const targetSpecies = species === 'cat' ? 'cat' : 'dog';
    const result = await recognizeBreedWithGemini(image, targetSpecies);
    
    res.json(result);
    
  } catch (error) {
    console.error('Ошибка в /api/vision/gemini-recognize:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Быстрое распознавание (только порода, без деталей)
app.post('/api/vision/quick-recognize', authenticateToken, async (req, res) => {
  try {
    const { image, species } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: 'Изображение не предоставлено' });
    }
    
    const targetSpecies = species === 'cat' ? 'cat' : 'dog';
    const result = await quickBreedRecognize(image, targetSpecies);
    
    res.json(result);
    
  } catch (error) {
    console.error('Ошибка в /api/vision/quick-recognize:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 Main page: http://127.0.0.1:${PORT}`);
  console.log(`🤖 AI Assistant: http://127.0.0.1:${PORT}/api/assistant/ask`);
  console.log(`🐕 Breed Recognition (Gemini): http://127.0.0.1:${PORT}/api/vision/gemini-recognize`);
  console.log(`⚡ Quick Breed Recognition: http://127.0.0.1:${PORT}/api/vision/quick-recognize`);
  console.log(`👁️ Legacy Vision API: http://127.0.0.1:${PORT}/api/vision/test`);
});