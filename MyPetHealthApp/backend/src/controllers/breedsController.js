import { query } from '../config/database.js';

export const getBreeds = async (req, res) => {
  const { type, search = '' } = req.query;

  if (!type || !['dog', 'cat'].includes(type)) {
    return res.status(400).json({ message: 'type должен быть dog или cat' });
  }

  const table = type === 'dog' ? 'dog_breeds' : 'cat_breeds';

  try {
    const result = await query(
      `SELECT id, name 
       FROM ${table}
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 10`,
      [`${search}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Breeds error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
