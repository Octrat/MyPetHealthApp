// /Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/controllers/petsController.js
import pool from '../config/database.js';

// ===============================
// Получить питомцев пользователя
// ===============================
export const getPets = async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) return res.status(400).json({ message: 'user_id обязателен' });

  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.species,
        p.breed_id,
        CASE
          WHEN p.species = 'dog' THEN db.name
          WHEN p.species = 'cat' THEN cb.name
        END AS breed_name
      FROM pets p
      LEFT JOIN dog_breeds db ON p.breed_id = db.id AND p.species = 'dog'
      LEFT JOIN cat_breeds cb ON p.breed_id = cb.id AND p.species = 'cat'
      WHERE p.user_id = $1
    `, [userId]);

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
    return res.status(400).json({ message: 'user_id, name, species и breed_id обязательны' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO pets (user_id, name, species, breed_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, name, species, breed_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// ===============================
// Получение списка пород по виду животного (для автокомплита)
// ===============================
export const getBreeds = async (req, res) => {
  const { species } = req.query; // 'dog' или 'cat'

  if (!species || !['dog', 'cat'].includes(species)) {
    return res.status(400).json({ message: 'species должен быть dog или cat' });
  }

  const table = species === 'dog' ? 'dog_breeds' : 'cat_breeds';

  try {
    const result = await pool.query(`SELECT id, name FROM ${table} ORDER BY name`);
    res.json(result.rows); // [{id:1,name:'Лабрадор'}, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
