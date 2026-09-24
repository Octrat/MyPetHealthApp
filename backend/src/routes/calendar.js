// backend/src/routes/calendar.js
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

const getUserId = (req) => req.user?.userId || req.user?.id || req.user?.user_id;

// Получение событий календаря
router.get('/events', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { petId } = req.query;

    let query = `
      SELECT
        ce.id,
        ce.user_id,
        ce.title,
        ce.description,
        TO_CHAR(ce.event_date, 'YYYY-MM-DD') AS date,
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
      LEFT JOIN calendar_event_pets cep ON ce.id = cep.event_id
      LEFT JOIN pets p ON cep.pet_id = p.id
      WHERE ce.user_id = $1
    `;

    const params = [userId];

    if (petId && petId !== 'all') {
      if (petId === 'general') {
        query += `
          AND ce.id NOT IN (
            SELECT event_id FROM calendar_event_pets
          )
        `;
      } else {
        params.push(Number(petId));
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
        date: event.date,
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
    console.error('Calendar events load error:', error);
    res.status(500).json({ message: 'Ошибка загрузки событий календаря' });
  }
});

// Добавление события
router.post('/events', async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);

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

    console.log('CALENDAR CREATE BODY:', req.body);

    if (!title || !date) {
      return res.status(400).json({
        message: 'Название и дата события обязательны',
      });
    }

    const normalizedPetIds = Array.isArray(petIds)
      ? petIds
      : petId
        ? [petId]
        : [];

    await client.query('BEGIN');

    const eventResult = await client.query(
      `
      INSERT INTO calendar_events
        (user_id, title, description, event_date, event_time, type, reminder_minutes, synced_to_phone)
      VALUES
        ($1, $2, $3, $4::date, $5, $6, $7, $8)
      RETURNING
        id,
        title,
        description,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
        event_time AS time,
        type,
        reminder_minutes AS "reminderMinutes",
        synced_to_phone AS "syncedToPhone"
      `,
      [
        userId,
        title,
        description || '',
        date,
        time || null,
        type,
        reminderMinutes || null,
        syncedToPhone,
      ]
    );

    const event = eventResult.rows[0];

    for (const currentPetId of normalizedPetIds) {
      await client.query(
        `
        INSERT INTO calendar_event_pets (event_id, pet_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [event.id, currentPetId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: String(event.id),
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      type: event.type,
      reminderMinutes: event.reminderMinutes,
      syncedToPhone: event.syncedToPhone,
      petIds: normalizedPetIds,
      petId: normalizedPetIds[0] || null,
      pets: [],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Calendar event create error:', error);
    res.status(500).json({ message: 'Ошибка создания события календаря' });
  } finally {
    client.release();
  }
});

// Удаление события
router.delete('/events/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const eventId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM calendar_events
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [eventId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    res.json({ message: 'Событие удалено' });
  } catch (error) {
    console.error('Calendar event delete error:', error);
    res.status(500).json({ message: 'Ошибка удаления события' });
  }
});

export default router;