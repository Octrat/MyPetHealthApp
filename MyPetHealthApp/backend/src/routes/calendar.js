
// backend/src/routes/calendar.js
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

const getUserId = (req) =>
  req.user?.userId || req.user?.id || req.user?.user_id;

// ======================================================
// GET /api/calendar/events
// Получение событий календаря
// ======================================================
router.get('/events', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { petId } = req.query;

    if (!userId) {
      return res.status(401).json({
        message: 'Пользователь не авторизован',
      });
    }

    let query = `
      SELECT
        ce.id,
        ce.user_id,
        ce.title,
        ce.description,
        ce.event_date AS date,
        ce.event_time AS time,
        ce.type,
        ce.reminder_minutes AS "reminderMinutes",
        ce.synced_to_phone AS "syncedToPhone",

        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'species', p.species
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS pets

      FROM calendar_events ce

      LEFT JOIN calendar_event_pets cep
        ON ce.id = cep.event_id

      LEFT JOIN pets p
        ON cep.pet_id = p.id

      WHERE ce.user_id = $1
    `;

    const params = [userId];

    if (petId && petId !== 'all') {
      if (petId === 'general') {
        query += `
          AND ce.id NOT IN (
            SELECT event_id
            FROM calendar_event_pets
          )
        `;
      } else {
        const numericPetId = Number(petId);

        if (!Number.isInteger(numericPetId)) {
          return res.status(400).json({
            message: 'Некорректный ID питомца',
          });
        }

        params.push(numericPetId);

        query += `
          AND ce.id IN (
            SELECT event_id
            FROM calendar_event_pets
            WHERE pet_id = $2
          )
        `;
      }
    }

    query += `
      GROUP BY ce.id
      ORDER BY ce.event_date ASC, ce.event_time ASC
    `;

    const result = await pool.query(query, params);

    const events = result.rows.map((event) => {
      const pets = event.pets || [];

      return {
        id: String(event.id),

        title: event.title,

        description: event.description || '',

        date:
          event.date instanceof Date
            ? event.date.toISOString().split('T')[0]
            : String(event.date).split('T')[0],

        time: event.time || '',

        type: event.type,

        reminderMinutes: event.reminderMinutes,

        syncedToPhone: event.syncedToPhone,

        pets,

        petIds: pets.map((pet) => pet.id),

        petId: pets[0]?.id || null,

        petName: pets[0]?.name || null,
      };
    });

    res.json(events);
  } catch (error) {
    console.error('❌ CALENDAR EVENTS LOAD ERROR');
    console.error('message:', error.message);
    console.error('code:', error.code);
    console.error('detail:', error.detail);

    res.status(500).json({
      message: 'Ошибка загрузки событий календаря',
    });
  }
});

// ======================================================
// POST /api/calendar/events
// Добавление события
// ======================================================
router.post('/events', async (req, res) => {
  let client;

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Пользователь не авторизован',
      });
    }

    const {
      petId,
      petIds,
      title,
      description,
      date,
      time,
      type = 'reminder',
      reminderMinutes,
      syncedToPhone = false,
    } = req.body;

    console.log('📅 CREATE CALENDAR EVENT');
    console.log('userId:', userId);
    console.log('body:', req.body);

    // --------------------------------------------------
    // Проверяем обязательные поля
    // --------------------------------------------------
    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: 'Название события обязательно',
      });
    }

    if (!date) {
      return res.status(400).json({
        message: 'Дата события обязательна',
      });
    }

    // --------------------------------------------------
    // Нормализуем список питомцев
    // --------------------------------------------------
    let normalizedPetIds = [];

    if (Array.isArray(petIds)) {
      normalizedPetIds = petIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id));
    } else if (petId !== undefined && petId !== null && petId !== '') {
      const numericPetId = Number(petId);

      if (Number.isInteger(numericPetId)) {
        normalizedPetIds = [numericPetId];
      }
    }

    // Убираем дубликаты
    normalizedPetIds = [...new Set(normalizedPetIds)];

    console.log('🐾 normalizedPetIds:', normalizedPetIds);

    // --------------------------------------------------
    // Получаем соединение только после валидации
    // --------------------------------------------------
    client = await pool.connect();

    await client.query('BEGIN');

    // --------------------------------------------------
    // Проверяем, что питомцы принадлежат пользователю
    // --------------------------------------------------
    if (normalizedPetIds.length > 0) {
      const petsResult = await client.query(
        `
        SELECT id
        FROM pets
        WHERE user_id = $1
          AND id = ANY($2::int[])
        `,
        [userId, normalizedPetIds]
      );

      const existingPetIds = petsResult.rows.map((row) => Number(row.id));

      const invalidPetIds = normalizedPetIds.filter(
        (id) => !existingPetIds.includes(id)
      );

      if (invalidPetIds.length > 0) {
        await client.query('ROLLBACK');

        return res.status(403).json({
          message: 'Один или несколько питомцев не принадлежат пользователю',
          invalidPetIds,
        });
      }
    }

    // --------------------------------------------------
    // Создаём событие
    // --------------------------------------------------
    const eventResult = await client.query(
      `
      INSERT INTO calendar_events
        (
          user_id,
          title,
          description,
          event_date,
          event_time,
          type,
          reminder_minutes,
          synced_to_phone
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        title,
        description,
        event_date AS date,
        event_time AS time,
        type,
        reminder_minutes AS "reminderMinutes",
        synced_to_phone AS "syncedToPhone"
      `,
      [
        userId,
        String(title).trim(),
        description || '',
        date,
        time || null,
        type,
        reminderMinutes ?? null,
        Boolean(syncedToPhone),
      ]
    );

    const event = eventResult.rows[0];

    console.log('✅ EVENT CREATED:', event);

    // --------------------------------------------------
    // Привязываем питомцев
    // --------------------------------------------------
    for (const currentPetId of normalizedPetIds) {
      await client.query(
        `
        INSERT INTO calendar_event_pets
          (event_id, pet_id)
        VALUES
          ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [event.id, currentPetId]
      );
    }

    await client.query('COMMIT');

    console.log('✅ CALENDAR TRANSACTION COMMITTED');

    // --------------------------------------------------
    // Ответ клиенту
    // --------------------------------------------------
    res.status(201).json({
      id: String(event.id),

      title: event.title,

      description: event.description || '',

      date:
        event.date instanceof Date
          ? event.date.toISOString().split('T')[0]
          : String(event.date).split('T')[0],

      time: event.time || '',

      type: event.type,

      reminderMinutes: event.reminderMinutes,

      syncedToPhone: event.syncedToPhone,

      petIds: normalizedPetIds,

      petId: normalizedPetIds[0] || null,

      pets: [],
    });
  } catch (error) {
    // --------------------------------------------------
    // Откатываем транзакцию
    // --------------------------------------------------
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          '❌ CALENDAR ROLLBACK ERROR:',
          rollbackError.message
        );
      }
    }

    // --------------------------------------------------
    // ВАЖНО: выводим настоящую ошибку PostgreSQL
    // --------------------------------------------------
    console.error('❌❌❌ CALENDAR EVENT CREATE ERROR ❌❌❌');
    console.error('message:', error.message);
    console.error('code:', error.code);
    console.error('detail:', error.detail);
    console.error('constraint:', error.constraint);
    console.error('table:', error.table);
    console.error('column:', error.column);
    console.error('where:', error.where);
    console.error('schema:', error.schema);
    console.error('stack:', error.stack);

    // Если это ошибка ограничения PostgreSQL,
    // отдаём полезное сообщение клиенту.
    let message = 'Ошибка создания события календаря';

    if (error.code === '23505') {
      message =
        'Такое событие уже существует. Возможно, в календаре уже есть событие с такими данными.';
    } else if (error.code === '23503') {
      message =
        'Не удалось привязать событие к питомцу. Проверьте выбранного питомца.';
    } else if (error.code === '23502') {
      message =
        'Не заполнено обязательное поле события.';
    } else if (error.code === '22P02') {
      message =
        'Некорректные данные события.';
    }

    res.status(500).json({
      message,
      code: error.code || null,
      detail: error.detail || null,
      constraint: error.constraint || null,
    });
  } finally {
    // --------------------------------------------------
    // Освобождаем соединение
    // --------------------------------------------------
    if (client) {
      client.release();
    }
  }
});

// ======================================================
// DELETE /api/calendar/events/:id
// Удаление события
// ======================================================
router.delete('/events/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const eventId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Пользователь не авторизован',
      });
    }

    const result = await pool.query(
      `
      DELETE FROM calendar_events
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [eventId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Событие не найдено',
      });
    }

    res.json({
      message: 'Событие удалено',
    });
  } catch (error) {
    console.error('❌ CALENDAR EVENT DELETE ERROR');
    console.error('message:', error.message);
    console.error('code:', error.code);
    console.error('detail:', error.detail);

    res.status(500).json({
      message: 'Ошибка удаления события',
    });
  }
});

export default router;