// backend/src/server.js
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

// Определяем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import petsRoutes from './routes/pets.js';
import avatarRoutes from './routes/avatar.js';
import visionRoutes from './routes/vision.js';
import adminRoutes from './routes/admin.js';
import calendarRoutes from './routes/calendar.js';

import { authenticateToken, requireAdmin } from './middleware/auth.js';
import { testConnection } from './config/database.js';
import pool from './config/database.js';

// ИМПОРТЫ ДЛЯ AI АССИСТЕНТА И РАСПОЗНАВАНИЯ ПОРОД
import { askGemini, askGeminiWithContext } from './services/geminiService.js';
import {
  recognizeBreedWithGemini,
  quickBreedRecognize,
} from './services/geminiVisionService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// 📧 НАСТРОЙКА EMAIL
// ============================================

let transporter;
let emailConfigured = false;

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport(smtpConfig);
    emailConfigured = true;
    console.log(
      '📧 Email transporter configured with SMTP:',
      process.env.SMTP_HOST
    );
  } catch (error) {
    console.warn('⚠️ Failed to configure email transporter:', error.message);
  }
} else {
  console.log(
    '📧 Email notifications disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.'
  );
}

// Проверка API ключей при запуске
console.log('\n🔐 API Keys Check:');
console.log(
  `   GEMINI_API_KEY: ${
    process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'
  }`
);
console.log(`   GEMINI_API_KEY length: ${process.env.GEMINI_API_KEY?.length || 0}`);

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    '⚠️  WARNING: GEMINI_API_KEY is not set! Breed recognition will fail.'
  );
}

console.log('');

// ============================================
// MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Увеличенный лимит для аватаров, фото питомцев и изображений для распознавания
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Статические файлы для веб-страницы поиска питомца
app.use(express.static(path.join(__dirname, '../../web')));

// Логирование запросов
app.use((req, res, next) => {
  console.log('➡️', req.method, req.url);
  next();
});

// Статические загруженные файлы
app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/pets', authenticateToken, petsRoutes);
app.use('/api/user/avatar', authenticateToken, avatarRoutes);
app.use('/api/vision', authenticateToken, visionRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);

// ============================================
// BASIC ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: '🐾 PetHealth Backend is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      pets: '/api/pets',
      vision: '/api/vision',
      calendar: '/api/calendar/events',
      assistant: '/api/assistant/ask',
      'assistant-pet': '/api/assistant/pet/:petId/ask',
      'assistant-chats': '/api/assistant/chats',
      'vision-gemini': '/api/vision/gemini-recognize',
      'vision-quick': '/api/vision/quick-recognize',
      'public-pet': '/api/public/pet/:id',
      'report-location': '/api/report-location',
      'pet-reports': '/api/pets/:id/reports',
      'admin-stats': '/api/admin/stats',
      'admin-passports': '/api/admin/passports',
    },
  });
});

app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();

  res.json({
    status: 'OK',
    database: dbStatus ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// 🤖 ЭНДПОИНТЫ ДЛЯ AI АССИСТЕНТА
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

app.post('/api/assistant/pet/:petId/ask', authenticateToken, async (req, res) => {
  const { petId } = req.params;
  const { question, history } = req.body;

  console.log('\n🐾 ========== AI ЗАПРОС ДЛЯ ПИТОМЦА ==========');
  console.log('📌 petId:', petId);
  console.log('❓ Вопрос:', question);
  console.log('👤 userId:', req.user?.userId);

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ message: 'Напишите ваш вопрос' });
  }

  try {
    const petResult = await pool.query(
      `SELECT p.*, 
              b.name as breed_name, 
              b.size_category as breed_size,
              b.name_ru as breed_name_ru
       FROM pets p
       LEFT JOIN breeds b ON p.breed_id = b.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [petId, req.user.userId]
    );

    if (petResult.rows.length === 0) {
      console.log('❌ Питомец не найден!');
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    const pet = petResult.rows[0];

    console.log('🐕 Найден питомец:', pet.name, 'вид:', pet.species);
    console.log(
      '📊 Вес:',
      pet.weight,
      'Возраст:',
      pet.age,
      'Порода:',
      pet.breed_name
    );

    const petContext = `
📋 ИНФОРМАЦИЯ О ПИТОМЦЕ:

🐱 Имя: ${pet.name}
📏 Вид: ${pet.species === 'dog' ? 'Собака 🐶' : 'Кошка 🐱'}
🎀 Порода: ${pet.breed_name || 'Не указана'} ${
      pet.breed_name_ru ? `(${pet.breed_name_ru})` : ''
    }
🎂 Возраст: ${pet.age || 'Не указан'} лет
⚖️ Вес: ${pet.weight || 'Не указан'} кг
📐 Рост: ${pet.height || 'Не указан'} см
🚻 Пол: ${pet.sex === 'male' ? 'Мужской ♂' : 'Женский ♀'}
💊 Стерилизован(а): ${pet.neutered ? 'Да ✅' : 'Нет ❌'}
${pet.description ? `📝 Особенности: ${pet.description}` : ''}

⚠️ ВАЖНО: Это реальные данные питомца. Отвечай, ОБЯЗАТЕЛЬНО учитывая их!`;

    console.log('📋 Контекст питомца создан, длина:', petContext.length);

    const answer = await askGeminiWithContext(
      question,
      petContext,
      history || []
    );

    console.log('💬 Ответ ассистента:', answer?.substring(0, 300));
    console.log('=====================================\n');

    res.json({
      answer,
      petInfo: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed_name,
      },
    });
  } catch (error) {
    console.error('Ошибка в /api/assistant/pet/:petId/ask:', error);
    res.status(500).json({ message: 'Ошибка получения ответа' });
  }
});

// ============================================
// 💬 ЭНДПОИНТЫ ДЛЯ РАБОТЫ С ЧАТАМИ
// ============================================

app.get('/api/assistant/chats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.name as pet_name, p.species as pet_species
       FROM assistant_chats c
       LEFT JOIN pets p ON c.pet_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Ошибка получения чатов' });
  }
});

app.post('/api/assistant/chats', authenticateToken, async (req, res) => {
  const { petId, title } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO assistant_chats (user_id, pet_id, title, messages)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.userId, petId || null, title || 'Новый чат', '[]']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Ошибка создания чата' });
  }
});

app.get(
  '/api/assistant/chats/:chatId/messages',
  authenticateToken,
  async (req, res) => {
    const { chatId } = req.params;

    try {
      const result = await pool.query(
        `SELECT messages FROM assistant_chats 
         WHERE id = $1 AND user_id = $2`,
        [chatId, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Чат не найден' });
      }

      res.json({ messages: result.rows[0].messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Ошибка получения сообщений' });
    }
  }
);

app.post(
  '/api/assistant/chats/:chatId/messages',
  authenticateToken,
  async (req, res) => {
    const { chatId } = req.params;
    const { messages } = req.body;

    try {
      await pool.query(
        `UPDATE assistant_chats 
         SET messages = $1, updated_at = NOW() 
         WHERE id = $2 AND user_id = $3`,
        [JSON.stringify(messages), chatId, req.user.userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Save messages error:', error);
      res.status(500).json({ message: 'Ошибка сохранения' });
    }
  }
);

app.delete(
  '/api/assistant/chats/:chatId',
  authenticateToken,
  async (req, res) => {
    const { chatId } = req.params;

    try {
      await pool.query(
        `DELETE FROM assistant_chats WHERE id = $1 AND user_id = $2`,
        [chatId, req.user.userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Delete chat error:', error);
      res.status(500).json({ message: 'Ошибка удаления чата' });
    }
  }
);

app.patch(
  '/api/assistant/chats/:chatId',
  authenticateToken,
  async (req, res) => {
    const { chatId } = req.params;
    const { title } = req.body;

    try {
      const result = await pool.query(
        `UPDATE assistant_chats 
         SET title = $1, updated_at = NOW() 
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [title, chatId, req.user.userId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update chat error:', error);
      res.status(500).json({ message: 'Ошибка обновления чата' });
    }
  }
);

// ============================================
// 🐕 ЭНДПОИНТЫ ДЛЯ РАСПОЗНАВАНИЯ ПОРОД ЧЕРЕЗ GEMINI
// ============================================

app.post('/api/vision/gemini-recognize', authenticateToken, async (req, res) => {
  try {
    const { image, species } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Изображение не предоставлено',
      });
    }

    const targetSpecies = species === 'cat' ? 'cat' : 'dog';
    const result = await recognizeBreedWithGemini(image, targetSpecies);

    res.json(result);
  } catch (error) {
    console.error('Ошибка в /api/vision/gemini-recognize:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/vision/quick-recognize', authenticateToken, async (req, res) => {
  try {
    const { image, species } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Изображение не предоставлено',
      });
    }

    const targetSpecies = species === 'cat' ? 'cat' : 'dog';
    const result = await quickBreedRecognize(image, targetSpecies);

    res.json(result);
  } catch (error) {
    console.error('Ошибка в /api/vision/quick-recognize:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// 🔍 ПУБЛИЧНЫЕ ЭНДПОИНТЫ ДЛЯ ПОИСКА ПОТЕРЯННЫХ ПИТОМЦЕВ
// ============================================

app.get('/api/public/pet/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const petResult = await pool.query(
      `SELECT p.*, 
              b.name as breed_name, 
              u.email as owner_email, 
              u.name as owner_name,
              p.qr_phone as contact_phone,
              p.qr_address as contact_address,
              p.qr_owner_name as contact_owner_name
       FROM pets p
       LEFT JOIN breeds b ON p.breed_id = b.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (petResult.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    const pet = petResult.rows[0];

    res.json({
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed_name: pet.breed_name,
        weight: pet.weight,
        age: pet.age,
        description: pet.description,
      },
      contact: {
        ownerName: pet.contact_owner_name,
        phone: pet.contact_phone,
        address: pet.contact_address,
        email: pet.owner_email,
      },
    });
  } catch (error) {
    console.error('Public pet info error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/report-location', async (req, res) => {
  const { petId, latitude, longitude, timestamp } = req.body;

  if (!petId || !latitude || !longitude) {
    return res.status(400).json({ message: 'Недостаточно данных' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pet_reports (pet_id, latitude, longitude, reported_at, is_notified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [petId, latitude, longitude, timestamp || new Date(), false]
    );

    const petOwner = await pool.query(
      `SELECT u.id, u.email, u.name as owner_name, p.name as pet_name, p.qr_phone
       FROM pets p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [petId]
    );

    if (petOwner.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'Питомец или владелец не найден' });
    }

    const owner = petOwner.rows[0];

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const yandexMapsLink = `https://yandex.ru/maps/?pt=${longitude},${latitude}&z=15&l=map`;

    let emailSent = false;
    let emailError = null;

    if (emailConfigured && transporter && owner.email) {
      try {
        const mailOptions = {
          from: `"${process.env.EMAIL_FROM_NAME || 'HealthyPaws'}" <${
            process.env.EMAIL_FROM_ADDRESS || 'noreply@healthypaws.com'
          }>`,
          to: owner.email,
          subject: `📍 ВАЖНО: Ваш питомец ${owner.pet_name} был найден!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7BC9A8;">🐾 Ваш питомец найден!</h1>
              <p>Здравствуйте, ${owner.owner_name || 'владелец'}!</p>
              <p>Кто-то отсканировал QR-код вашего питомца <strong>${owner.pet_name}</strong> и отправил своё местоположение.</p>
              <h2>📍 Местоположение:</h2>
              <p>
                <strong>Широта:</strong> ${latitude}<br>
                <strong>Долгота:</strong> ${longitude}<br>
                <strong>Время:</strong> ${new Date().toLocaleString()}
              </p>
              <p>
                <a href="${googleMapsLink}" style="background-color: #7BC9A8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-right: 10px;">
                  🗺️ Google Maps
                </a>
                <a href="${yandexMapsLink}" style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  🗺️ Яндекс.Карты
                </a>
              </p>
              <p><strong>⚠️ Важно:</strong> Поторопитесь! Питомец может уйти с этого места.</p>
              <hr style="margin: 20px 0;">
              <p style="color: #888; font-size: 12px;">Это письмо отправлено автоматически из приложения HealthyPaws.</p>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        emailSent = true;

        console.log(`📧 Уведомление отправлено владельцу на ${owner.email}`);

        if (process.env.SMTP_HOST?.includes('ethereal')) {
          console.log(`   📬 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
      } catch (error) {
        emailError = error.message;
        console.error('Email sending error:', emailError);
      }
    } else {
      console.log(
        `⚠️ Email не отправлен (настроен: ${emailConfigured}, email: ${owner.email})`
      );
    }

    await pool.query(
      `UPDATE pet_reports SET is_notified = $1 WHERE id = $2`,
      [emailSent, result.rows[0].id]
    );

    res.json({
      success: true,
      message: emailSent
        ? 'Локация получена, владелец уведомлён'
        : 'Локация получена',
      reportId: result.rows[0].id,
      emailSent,
      emailError: emailError || undefined,
    });
  } catch (error) {
    console.error('Report location error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/pets/:id/reports', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, latitude, longitude, reported_at, is_notified
       FROM pet_reports
       WHERE pet_id = $1
       ORDER BY reported_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ============================================
// 👑 АДМИН ЭНДПОИНТЫ
// ============================================

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalPets, totalDogs, totalCats] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM pets'),
      pool.query("SELECT COUNT(*) FROM pets WHERE species = 'dog'"),
      pool.query("SELECT COUNT(*) FROM pets WHERE species = 'cat'"),
    ]);

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalPets: parseInt(totalPets.rows[0].count),
      totalDogs: parseInt(totalDogs.rows[0].count),
      totalCats: parseInt(totalCats.rows[0].count),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Ошибка получения статистики' });
  }
});

app.get(
  '/api/admin/passports',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.id, p.name, p.species, p.breed_id,
                b.name as breed_name,
                u.email as owner_email, u.name as owner_name,
                p.passport_number, p.passport_issued_by,
                p.passport_chip_number, p.passport_color,
                p.passport_character, p.passport_breeding_place,
                p.passport_owner_name, p.passport_owner_phone,
                p.passport_status
         FROM pets p
         LEFT JOIN breeds b ON p.breed_id = b.id
         JOIN users u ON p.user_id = u.id
         WHERE p.passport_status = 'pending'
         ORDER BY p.id DESC`,
        []
      );

      console.log('📋 Заявок в БД:', result.rows.length);

      if (result.rows.length > 0) {
        console.log('📋 Первая заявка:', result.rows[0]);
      }

      res.json(result.rows);
    } catch (error) {
      console.error('Admin passports error:', error);
      res.status(500).json({ message: 'Ошибка получения заявок' });
    }
  }
);

app.post(
  '/api/admin/passports/:petId/review',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { petId } = req.params;
    const { status, comment } = req.body;

    console.log('📋 Обработка заявки для petId:', petId);

    if (!petId || petId === 'undefined') {
      console.error('❌ petId не передан или равен undefined');
      return res.status(400).json({ message: 'Не указан ID питомца' });
    }

    try {
      const result = await pool.query(
        `UPDATE pets 
         SET passport_status = $1, 
             passport_review_comment = $2,
             passport_reviewed_by = $3,
             passport_reviewed_at = NOW()
         WHERE id = $4
         RETURNING id`,
        [status, comment, req.user.userId, parseInt(petId)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Питомец не найден' });
      }

      console.log(
        `✅ Паспорт для питомца ID ${petId} ${
          status === 'approved' ? 'одобрен' : 'отклонён'
        }`
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Review passport error:', error);
      res.status(500).json({ message: 'Ошибка обработки заявки' });
    }
  }
);

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 Main page: http://127.0.0.1:${PORT}`);
  console.log(`🤖 AI Assistant: http://127.0.0.1:${PORT}/api/assistant/ask`);
  console.log(
    `🎯 AI Assistant for Pet: http://127.0.0.1:${PORT}/api/assistant/pet/:petId/ask`
  );
  console.log(`💬 Assistant Chats: http://127.0.0.1:${PORT}/api/assistant/chats`);
  console.log(
    `🐕 Breed Recognition (Gemini): http://127.0.0.1:${PORT}/api/vision/gemini-recognize`
  );
  console.log(
    `⚡ Quick Breed Recognition: http://127.0.0.1:${PORT}/api/vision/quick-recognize`
  );
  console.log(`👁️ Legacy Vision API: http://127.0.0.1:${PORT}/api/vision/test`);
  console.log(`📅 Calendar Events: http://127.0.0.1:${PORT}/api/calendar/events`);
  console.log(`🔍 Public Pet API: http://127.0.0.1:${PORT}/api/public/pet/:id`);
  console.log(`📍 Report Location: http://127.0.0.1:${PORT}/api/report-location`);
  console.log(`📊 Admin Stats: http://127.0.0.1:${PORT}/api/admin/stats`);
  console.log(`📋 Admin Passports: http://127.0.0.1:${PORT}/api/admin/passports`);
  console.log(
    `📧 Email notifications: ${emailConfigured ? '✅ Active' : '❌ Disabled'}`
  );
});