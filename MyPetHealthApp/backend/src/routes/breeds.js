import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Получить список пород по виду
router.get('/', async (req, res) => {
  const { species, q } = req.query; // q — строка поиска
  if (!species) return res.status(400).json({ message: 'species обязателен' });

  const table = species === 'dog' ? 'dog_breeds' : 'cat_breeds';
  const searchQuery = q ? `%${q}%` : '%';

  try {
    const result = await pool.query(
      `SELECT id, name FROM ${table} WHERE name ILIKE $1 ORDER BY name LIMIT 20`,
      [searchQuery]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
