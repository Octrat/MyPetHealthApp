
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getClient } from '../config/database.js';

// Обычные пользователи сохраняют прежний срок действия токена — 7 дней.
const generateToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

// Демоаккаунт действует 24 часа.
const generateDemoToken = (userId, role) =>
  jwt.sign({ userId, role, demo: true }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

export const authController = {
  // Создание временного демоаккаунта
  async demo(req, res) {
    let client;
    let transactionStarted = false;

    try {
      client = await getClient();

      await client.query('BEGIN');
      transactionStarted = true;

      const email = `demo-${crypto.randomUUID()}@demo.healthypaws.local`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, avatar_path`,
        [
          email,
          'DEMO_ACCOUNT_NO_PASSWORD',
          'Демо-пользователь',
          'user',
        ]
      );

      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO demo_sessions (user_id, expires_at)
         VALUES ($1, $2)`,
        [user.id, expiresAt]
      );

      const petData = [
        {
          key: 'max',
          name: 'Макс',
          species: 'dog',
          breed: 'Yorkshire Terrier',
          breedId: 2,
          birthDate: '2022-04-18',
          weight: 3.2,
          height: 22,
          age: 4,
          sex: 'male',
          neutered: true,
          description: 'Демо-питомец: йоркширский терьер',
        },
        {
          key: 'luna',
          name: 'Луна',
          species: 'cat',
          breed: 'British Shorthair',
          breedId: 26,
          birthDate: '2024-01-12',
          weight: 4.6,
          height: 27,
          age: 2,
          sex: 'female',
          neutered: true,
          description: 'Демо-питомец: британская короткошёрстная кошка',
        },
        {
          key: 'archie',
          name: 'Арчи',
          species: 'dog',
          breed: 'Cavalier King Charles Spaniel',
          breedId: 39,
          birthDate: '2020-09-05',
          weight: 8.1,
          height: 34,
          age: 6,
          sex: 'male',
          neutered: false,
          description: 'Демо-питомец: кавалер-кинг-чарльз-спаниель',
        },
        {
          key: 'barney',
          name: 'Барни',
          species: 'dog',
          breed: 'Cavalier King Charles Spaniel',
          breedId: 39,
          birthDate: '2017-06-14',
          weight: 8.4,
          height: 35,
          age: 9,
          sex: 'male',
          neutered: false,
          description: 'Отец Арчи',
        },
        {
          key: 'daisy',
          name: 'Дейзи',
          species: 'dog',
          breed: 'Cavalier King Charles Spaniel',
          breedId: 39,
          birthDate: '2018-03-22',
          weight: 7.6,
          height: 32,
          age: 8,
          sex: 'female',
          neutered: false,
          description: 'Мать Арчи',
        },
      ];

      const petIds = {};

      for (const pet of petData) {
        const result = await client.query(
          `INSERT INTO pets (
             user_id, name, species, breed, breed_id, birth_date,
             weight, height, age, sex, neutered, description,
             created_at, updated_at
           )
           VALUES (
             $1, $2, $3, $4, $5, $6,
             $7, $8, $9, $10, $11, $12, NOW(), NOW()
           )
           RETURNING id`,
          [
            user.id,
            pet.name,
            pet.species,
            pet.breed,
            pet.breedId,
            pet.birthDate,
            pet.weight,
            pet.height,
            pet.age,
            pet.sex,
            pet.neutered,
            pet.description,
          ]
        );

        petIds[pet.key] = result.rows[0].id;
      }

      // Родословная Арчи
      for (const relative of [
        { key: 'barney', type: 'father' },
        { key: 'daisy', type: 'mother' },
      ]) {
        const pet = petData.find((item) => item.key === relative.key);

        await client.query(
          `INSERT INTO pet_pedigree (
             pet_id, user_id, relative_pet_id, relative_type,
             relative_name, species, breed, sex, birth_date,
             status, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            petIds.archie,
            user.id,
            petIds[relative.key],
            relative.type,
            pet.name,
            pet.species,
            pet.breed,
            pet.sex,
            pet.birthDate,
            'approved',
          ]
        );
      }

      // Демо-события календаря
      const events = [
        {
          title: 'Вакцинация Макса',
          description: 'Плановая вакцинация',
          date: '2026-11-12',
          time: '10:30',
          pets: ['max'],
        },
        {
          title: 'Обработка Макса от паразитов',
          description: 'Напоминание об обработке',
          date: '2026-10-20',
          time: '19:00',
          pets: ['max'],
        },
        {
          title: 'Осмотр Луны у ветеринара',
          description: 'Плановый осмотр',
          date: '2026-11-08',
          time: '16:00',
          pets: ['luna'],
        },
        {
          title: 'Обработка Луны от паразитов',
          description: 'Плановая обработка',
          date: '2026-10-25',
          time: '18:30',
          pets: ['luna'],
        },
        {
          title: 'Осмотр Арчи',
          description: 'Плановый осмотр',
          date: '2026-11-15',
          time: '12:00',
          pets: ['archie'],
        },
        {
          title: 'Семейная прогулка',
          description: 'Прогулка с питомцами',
          date: '2026-10-31',
          time: '11:00',
          pets: ['max', 'archie'],
        },
      ];

      for (const event of events) {
        const result = await client.query(
          `INSERT INTO calendar_events (
             user_id, title, description, event_date, event_time,
             type, reminder_minutes, synced_to_phone,
             created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING id`,
          [
            user.id,
            event.title,
            event.description,
            event.date,
            event.time,
            'reminder',
            30,
            false,
          ]
        );

        for (const petKey of event.pets) {
          await client.query(
            `INSERT INTO calendar_event_pets (event_id, pet_id)
             VALUES ($1, $2)`,
            [result.rows[0].id, petIds[petKey]]
          );
        }
      }

      // Примеры диалогов помощника
      const chats = [
        {
          title: 'Вопросы о здоровье питомцев',
          pet: null,
          messages: [
            {
              role: 'assistant',
              content: 'Привет! Я Доктор Хвост. Чем могу помочь?',
            },
          ],
        },
        ...petData.map((pet) => ({
          title: `Здоровье: ${pet.name}`,
          pet: pet.key,
          messages: [
            {
              role: 'assistant',
              content: `Здравствуйте! Давайте обсудим здоровье питомца ${pet.name}.`,
            },
          ],
        })),
      ];

      for (const chat of chats) {
        await client.query(
          `INSERT INTO assistant_chats (
             user_id, pet_id, title, messages, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
          [
            user.id,
            chat.pet ? petIds[chat.pet] : null,
            chat.title,
            JSON.stringify(chat.messages),
          ]
        );
      }

      await client.query('COMMIT');
      transactionStarted = false;

      const token = generateDemoToken(user.id, user.role);

      return res.status(201).json({
        message: 'Демоаккаунт создан',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar_path: user.avatar_path || '',
          role: user.role,
          isDemo: true,
          demoExpiresAt: expiresAt.toISOString(),
        },
      });
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(
            'Demo account rollback error:',
            rollbackError.message
          );
        }
      }

      console.error('Demo account creation error:', error.message);

      if (!res.headersSent) {
        return res.status(500).json({
          message: 'Не удалось создать демоаккаунт',
        });
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  // Регистрация обычного пользователя
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: 'Email и пароль обязательны для заполнения',
        });
      }

      const existingUser = await User.findByEmail(email);

      if (existingUser) {
        return res.status(409).json({
          message: 'Пользователь с таким email уже существует',
        });
      }

      const user = await User.create({
        email,
        password,
        name: name || null,
      });

      const token = generateToken(user.id, user.role);

      return res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar_path: user.avatar_path || '',
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error.message);

      return res.status(500).json({
        message: 'Ошибка при регистрации пользователя',
      });
    }
  },

  // Вход обычного пользователя
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          message: 'Неверный email или пароль',
        });
      }

      const isPasswordValid = await User.verifyPassword(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Неверный email или пароль',
        });
      }

      const token = generateToken(user.id, user.role);

      return res.status(200).json({
        message: 'Вход выполнен успешно',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar_path: user.avatar_path || '',
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);

      return res.status(500).json({
        message: 'Ошибка при входе',
      });
    }
  },

  // Получение текущего пользователя
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: 'Пользователь не найден',
        });
      }

      const responseUser = {
        id: user.id,
        email: user.email,
        name: user.name || '',
        avatar_path: user.avatar_path || '',
        role: user.role,
      };

      if (req.user.demo) {
        const client = await getClient();

        try {
          const session = await client.query(
            `SELECT expires_at
             FROM demo_sessions
             WHERE user_id = $1 AND expires_at > NOW()`,
            [user.id]
          );

          if (session.rows.length === 0) {
            return res.status(401).json({
              message: 'Срок действия демосессии истёк',
              demoExpired: true,
            });
          }

          responseUser.isDemo = true;
          responseUser.demoExpiresAt = session.rows[0].expires_at;
        } finally {
          client.release();
        }
      }

      return res.json({ user: responseUser });
    } catch (error) {
      console.error('Get current user error:', error.message);

      return res.status(500).json({
        message: 'Ошибка получения данных пользователя',
      });
    }
  },
};