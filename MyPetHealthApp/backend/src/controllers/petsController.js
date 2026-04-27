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
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// ===============================
// Добавить питомца
// ===============================
export const addPet = async (req, res) => {
  try {
    const { 
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
      photo_url 
    } = req.body;

    if (!user_id || !name || !species || !breed_id) {
      return res.status(400).json({
        message: 'user_id, name, species и breed_id обязательны',
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
      [user_id, name, species, breed_id, weight, height, age, sex, neutered, description, photo_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка добавления питомца' });
  }
};

// ===============================
// Обновить питомца
// ===============================
// ===============================
// Обновить питомца
// ===============================
export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
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
      _method
    } = req.body;

    console.log('Updating pet ID:', id);
    console.log('Received data:', { name, species, breed_id, weight, height, age, sex, neutered, description });

    // Проверяем, существует ли питомец
    const checkResult = await pool.query(
      'SELECT * FROM pets WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    // Формируем запрос для обновления только переданных полей
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

    // Всегда обновляем updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    values.push(id);
    const query = `
      UPDATE pets 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log('SQL Query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);
    
    console.log('Update successful:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'Питомец успешно обновлен',
      pet: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating pet:', err);
    console.error('Error message:', err.message);
    res.status(500).json({ 
      message: 'Ошибка обновления питомца', 
      error: err.message 
    });
  }
};

// ===============================
// Удалить питомца
// ===============================
export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, существует ли питомец
    const checkQuery = 'SELECT * FROM pets WHERE id = $1';
    const existingPet = await pool.query(checkQuery, [id]);

    if (existingPet.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    // Удаляем питомца
    const deleteQuery = 'DELETE FROM pets WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Питомец успешно удален',
      pet: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting pet:', err);
    res.status(500).json({ message: 'Ошибка удаления питомца' });
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
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};