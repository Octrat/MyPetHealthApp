import pool from '../config/database.js';

// ===============================
// Получить питомцев пользователя
// ===============================
export const getPets = async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) return res.status(400).json({ message: 'user_id обязателен' });

  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.species,
        p.breed_id,
        b.name AS breed_name
      FROM pets p
      LEFT JOIN breeds b ON p.breed_id = b.id
      WHERE p.user_id = $1
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// ===============================
// Добавить питомца
// ===============================
export const addPet = async (req, res) => {
  const { user_id, name, species, breed_id } = req.body;

  if (!user_id || !name || !species || !breed_id) {
    return res.status(400).json({
      message: 'user_id, name, species и breed_id обязательны',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO pets (user_id, name, species, breed_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [user_id, name, species, breed_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// ===============================
// Получение списка пород (автокомплит)
// ===============================
export const getBreeds = async (req, res) => {
  const { species, search = '' } = req.query;

  if (!species || !['dog', 'cat'].includes(species)) {
    return res.status(400).json({
      message: 'species должен быть dog или cat',
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, name
      FROM breeds
      WHERE species = $1
      AND name ILIKE $2
      ORDER BY name
      LIMIT 20
      `,
      [species, `${search}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Breeds error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};