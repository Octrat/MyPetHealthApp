
import pool from '../config/database.js';

// ===============================
// Получить питомцев пользователя
// ===============================
export const getPets = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.species,
        p.breed_id,
        p.weight,
        p.height,
        p.age,
        p.sex,
        p.neutered,
        p.description,
        p.photo_url,
        b.name AS breed_name,
        b.name_ru AS breed_name_ru,
        b.size_category AS breed_size_category
      FROM pets p
      LEFT JOIN breeds b ON p.breed_id = b.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pets:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// ===============================
// Добавить питомца
// ===============================
export const addPet = async (req, res) => {
  try {
    // Владельца определяем по проверенному JWT,
    // а не по user_id из тела запроса.
    const userId = req.user.userId;

    const {
      name,
      species,
      breed_id,
      weight,
      height,
      age,
      sex,
      neutered,
      description,
      photo_url,
    } = req.body;

    if (!name || !species || !breed_id) {
      return res.status(400).json({
        message: 'name, species и breed_id обязательны',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO pets (
        user_id,
        name,
        species,
        breed_id,
        weight,
        height,
        age,
        sex,
        neutered,
        description,
        photo_url,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
      `,
      [
        userId,
        name,
        species,
        breed_id,
        weight,
        height,
        age,
        sex,
        neutered,
        description,
        photo_url,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding pet:', err);
    res.status(500).json({
      message: 'Ошибка добавления питомца',
    });
  }
};

// ===============================
// Обновить питомца
// ===============================
export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const {
      name,
      species,
      breed_id,
      weight,
      height,
      age,
      sex,
      neutered,
      description,
      photo_url,
    } = req.body;

    // Формируем запрос только из разрешённых полей.
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (species !== undefined) {
      updates.push(`species = $${paramCount++}`);
      values.push(species);
    }

    if (breed_id !== undefined) {
      updates.push(`breed_id = $${paramCount++}`);
      values.push(breed_id);
    }

    if (weight !== undefined) {
      updates.push(`weight = $${paramCount++}`);
      values.push(weight);
    }

    if (height !== undefined) {
      updates.push(`height = $${paramCount++}`);
      values.push(height);
    }

    if (age !== undefined) {
      updates.push(`age = $${paramCount++}`);
      values.push(age);
    }

    if (sex !== undefined) {
      updates.push(`sex = $${paramCount++}`);
      values.push(sex);
    }

    if (neutered !== undefined) {
      updates.push(`neutered = $${paramCount++}`);
      values.push(neutered);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (photo_url !== undefined) {
      updates.push(`photo_url = $${paramCount++}`);
      values.push(photo_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: 'Нет данных для обновления',
      });
    }

    updates.push('updated_at = NOW()');

    // В запросе проверяем одновременно ID питомца
    // и ID владельца из авторизованной сессии.
    const idParam = paramCount++;
    values.push(id);

    const userIdParam = paramCount++;
    values.push(userId);

    const query = `
      UPDATE pets
      SET ${updates.join(', ')}
      WHERE id = $${idParam}
        AND user_id = $${userIdParam}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    res.json({
      success: true,
      message: 'Питомец успешно обновлен',
      pet: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating pet:', err);
    res.status(500).json({
      message: 'Ошибка обновления питомца',
    });
  }
};

// ===============================
// Удалить питомца
// ===============================
export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Удаляем только питомца текущего пользователя.
    const result = await pool.query(
      `
      DELETE FROM pets
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    res.json({
      success: true,
      message: 'Питомец успешно удален',
      pet: result.rows[0],
    });
  } catch (err) {
    console.error('Error deleting pet:', err);
    res.status(500).json({
      message: 'Ошибка удаления питомца',
    });
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
      SELECT
        id,
        name,
        name_ru,
        size_category
      FROM breeds
      WHERE species = $1
        AND (
          name ILIKE $2
          OR name_ru ILIKE $2
        )
      ORDER BY name
      LIMIT 20
      `,
      [species, `${search}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Breeds error:', error);
    res.status(500).json({
      message: 'Ошибка сервера',
    });
  }
};