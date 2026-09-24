// backend/src/routes/pets.js
import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getPets,
  addPet,
  getBreeds,
  updatePet,
  deletePet,
} from '../controllers/petsController.js';

const router = Router();

// Получить всех питомцев пользователя
router.get('/', authenticateToken, getPets);

// Добавить нового питомца
router.post('/', authenticateToken, addPet);

// Получить список пород по виду животного (для автокомплита)
router.get('/breeds', authenticateToken, getBreeds);

// ========== QR-КОД ЭНДПОИНТЫ ==========

// Получить QR-информацию питомца
router.get('/:id/qr-info', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT qr_phone, qr_address, qr_additional_info, qr_owner_name
       FROM pets
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    res.json({
      phone: result.rows[0].qr_phone,
      address: result.rows[0].qr_address,
      additionalInfo: result.rows[0].qr_additional_info,
      ownerName: result.rows[0].qr_owner_name,
    });
  } catch (error) {
    console.error('Ошибка получения QR-данных:', error);
    res.status(500).json({ message: 'Ошибка получения данных' });
  }
});

// Сохранить QR-информацию питомца
router.post('/:id/qr-info', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { phone, address, additionalInfo, ownerName } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pets
       SET qr_phone = $1,
           qr_address = $2,
           qr_additional_info = $3,
           qr_owner_name = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id`,
      [phone, address, additionalInfo, ownerName, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    res.json({ message: 'Данные сохранены' });
  } catch (error) {
    console.error('Ошибка сохранения QR-данных:', error);
    res.status(500).json({ message: 'Ошибка сохранения' });
  }
});

// ========== ПАСПОРТ ПИТОМЦА ЭНДПОИНТЫ ==========

// Получить паспорт питомца
router.get('/:id/passport', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT passport_number,
              passport_issued_by,
              passport_issued_date,
              passport_chip_number,
              passport_chip_location,
              passport_chip_date,
              passport_color,
              passport_character,
              passport_breeding_place,
              passport_owner_name,
              passport_owner_phone,
              passport_status,
              passport_review_comment
       FROM pets
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Ошибка получения паспорта:', error);
    res.status(500).json({ message: 'Ошибка получения паспорта' });
  }
});

// Сохранить/обновить паспорт питомца
router.post('/:id/passport', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const {
    number,
    issued_by,
    issued_date,
    chip_number,
    chip_location,
    chip_date,
    color,
    character,
    breeding_place,
    owner_name,
    owner_phone,
  } = req.body;

  const validateDate = (dateStr) => {
    if (!dateStr) return null;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return null;

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return null;

    return dateStr;
  };

  const validIssuedDate = validateDate(issued_date);
  const validChipDate = validateDate(chip_date);

  try {
    const result = await pool.query(
      `UPDATE pets
       SET passport_number = $1,
           passport_issued_by = $2,
           passport_issued_date = $3,
           passport_chip_number = $4,
           passport_chip_location = $5,
           passport_chip_date = $6,
           passport_color = $7,
           passport_character = $8,
           passport_breeding_place = $9,
           passport_owner_name = $10,
           passport_owner_phone = $11,
           passport_status = 'pending',
           passport_review_comment = NULL,
           passport_reviewed_by = NULL,
           passport_reviewed_at = NULL
       WHERE id = $12 AND user_id = $13
       RETURNING id`,
      [
        number || null,
        issued_by || null,
        validIssuedDate,
        chip_number || null,
        chip_location || null,
        validChipDate,
        color || null,
        character || null,
        breeding_place || null,
        owner_name || null,
        owner_phone || null,
        id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения паспорта:', error);
    res.status(500).json({ message: 'Ошибка сохранения паспорта' });
  }
});

// ========== РОДОСЛОВНАЯ ПИТОМЦА ЭНДПОИНТЫ ==========

// Получить родословную питомца
router.get('/:id/pedigree', authenticateToken, async (req, res) => {
  const { id } = req.params;

  console.log('PEDIGREE BACKEND REQUEST:', {
    petId: id,
    userId: req.user.userId,
  });

  try {
    const petCheck = await pool.query(
      `SELECT id
       FROM pets
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (petCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    const result = await pool.query(
      `SELECT
          pp.id,
          pp.pet_id,
          pp.user_id,
          pp.relative_pet_id,
          pp.relative_type,
          pp.relative_name,
          pp.species,
          pp.breed,
          pp.sex,
          pp.birth_date,
          pp.document_number,
          pp.breeder_name,
          pp.club_name,
          pp.notes,
          pp.created_at,
          pp.updated_at,

          rp.name AS linked_pet_name,
          rp.species AS linked_pet_species,
          rp.sex AS linked_pet_sex,
          rp.age AS linked_pet_age,
          rp.weight AS linked_pet_weight,
          rp.height AS linked_pet_height,
          rp.photo_url AS linked_pet_photo_url,
          rb.name AS linked_pet_breed,
          rb.name_ru AS linked_pet_breed_ru

       FROM pet_pedigree pp
       LEFT JOIN pets rp
         ON pp.relative_pet_id = rp.id
        AND rp.user_id = pp.user_id
       LEFT JOIN breeds rb
         ON rp.breed_id = rb.id
       WHERE pp.pet_id = $1 AND pp.user_id = $2
       ORDER BY
         CASE pp.relative_type
           WHEN 'father' THEN 1
           WHEN 'mother' THEN 2
           WHEN 'grandfather' THEN 3
           WHEN 'grandmother' THEN 4
           WHEN 'child' THEN 5
           ELSE 6
         END,
         pp.id ASC`,
      [id, req.user.userId]
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      pet_id: row.pet_id,
      user_id: row.user_id,
      relative_pet_id: row.relative_pet_id,
      relative_type: row.relative_type,
      relative_name: row.relative_name,
      species: row.species,
      breed: row.breed,
      sex: row.sex,
      birth_date: row.birth_date,
      document_number: row.document_number,
      breeder_name: row.breeder_name,
      club_name: row.club_name,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      relative_pet: row.relative_pet_id
        ? {
            id: row.relative_pet_id,
            name: row.linked_pet_name,
            species: row.linked_pet_species,
            sex: row.linked_pet_sex,
            age: row.linked_pet_age,
            weight: row.linked_pet_weight,
            height: row.linked_pet_height,
            photo_url: row.linked_pet_photo_url,
            breed_name: row.linked_pet_breed,
            breed_name_ru: row.linked_pet_breed_ru,
          }
        : null,
    }));

    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения родословной:', error);
    res.status(500).json({ message: 'Ошибка получения родословной' });
  }
});

// Добавить родственника в родословную
router.post('/:id/pedigree', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const {
    relative_pet_id,
    relative_type,
    relative_name,
    species,
    breed,
    sex,
    birth_date,
    document_number,
    breeder_name,
    club_name,
    notes,
  } = req.body;

  if (!relative_type) {
    return res.status(400).json({
      message: 'Тип родственника обязателен',
    });
  }

  if (!relative_pet_id && !relative_name) {
    return res.status(400).json({
      message: 'Выберите питомца или введите кличку родственника',
    });
  }

  if (relative_pet_id && Number(relative_pet_id) === Number(id)) {
    return res.status(400).json({
      message: 'Нельзя добавить самого питомца в его родословную',
    });
  }

  try {
    const petCheck = await pool.query(
      `SELECT id
       FROM pets
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (petCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    let linkedPet = null;

    if (relative_pet_id) {
      const linkedPetResult = await pool.query(
        `SELECT p.id,
                p.name,
                p.species,
                p.sex,
                b.name AS breed_name
         FROM pets p
         LEFT JOIN breeds b ON p.breed_id = b.id
         WHERE p.id = $1 AND p.user_id = $2`,
        [relative_pet_id, req.user.userId]
      );

      if (linkedPetResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Выбранный родственник не найден среди ваших питомцев',
        });
      }

      linkedPet = linkedPetResult.rows[0];
    }

    const finalName = linkedPet?.name || relative_name;
    const finalSpecies = linkedPet?.species || species || null;
    const finalBreed = linkedPet?.breed_name || breed || null;
    const finalSex = linkedPet?.sex || sex || null;

    const result = await pool.query(
      `INSERT INTO pet_pedigree (
          pet_id,
          user_id,
          relative_pet_id,
          relative_type,
          relative_name,
          species,
          breed,
          sex,
          birth_date,
          document_number,
          breeder_name,
          club_name,
          notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING
          id,
          pet_id,
          user_id,
          relative_pet_id,
          relative_type,
          relative_name,
          species,
          breed,
          sex,
          birth_date,
          document_number,
          breeder_name,
          club_name,
          notes,
          created_at,
          updated_at`,
      [
        id,
        req.user.userId,
        relative_pet_id || null,
        relative_type,
        finalName,
        finalSpecies,
        finalBreed,
        finalSex,
        birth_date || null,
        document_number || null,
        breeder_name || null,
        club_name || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления родственника:', error);
    res.status(500).json({ message: 'Ошибка добавления родственника' });
  }
});

// Обновить родственника в родословной
router.post('/:id/pedigree/:relativeId', authenticateToken, async (req, res) => {
  const { id, relativeId } = req.params;

  const {
    relative_pet_id,
    relative_type,
    relative_name,
    species,
    breed,
    sex,
    birth_date,
    document_number,
    breeder_name,
    club_name,
    notes,
  } = req.body;

  if (!relative_type) {
    return res.status(400).json({
      message: 'Тип родственника обязателен',
    });
  }

  if (!relative_pet_id && !relative_name) {
    return res.status(400).json({
      message: 'Выберите питомца или введите кличку родственника',
    });
  }

  if (relative_pet_id && Number(relative_pet_id) === Number(id)) {
    return res.status(400).json({
      message: 'Нельзя добавить самого питомца в его родословную',
    });
  }

  try {
    let linkedPet = null;

    if (relative_pet_id) {
      const linkedPetResult = await pool.query(
        `SELECT p.id,
                p.name,
                p.species,
                p.sex,
                b.name AS breed_name
         FROM pets p
         LEFT JOIN breeds b ON p.breed_id = b.id
         WHERE p.id = $1 AND p.user_id = $2`,
        [relative_pet_id, req.user.userId]
      );

      if (linkedPetResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Выбранный родственник не найден среди ваших питомцев',
        });
      }

      linkedPet = linkedPetResult.rows[0];
    }

    const finalName = linkedPet?.name || relative_name;
    const finalSpecies = linkedPet?.species || species || null;
    const finalBreed = linkedPet?.breed_name || breed || null;
    const finalSex = linkedPet?.sex || sex || null;

    const result = await pool.query(
      `UPDATE pet_pedigree
       SET relative_pet_id = $1,
           relative_type = $2,
           relative_name = $3,
           species = $4,
           breed = $5,
           sex = $6,
           birth_date = $7,
           document_number = $8,
           breeder_name = $9,
           club_name = $10,
           notes = $11,
           updated_at = NOW()
       WHERE id = $12 AND pet_id = $13 AND user_id = $14
       RETURNING
          id,
          pet_id,
          user_id,
          relative_pet_id,
          relative_type,
          relative_name,
          species,
          breed,
          sex,
          birth_date,
          document_number,
          breeder_name,
          club_name,
          notes,
          created_at,
          updated_at`,
      [
        relative_pet_id || null,
        relative_type,
        finalName,
        finalSpecies,
        finalBreed,
        finalSex,
        birth_date || null,
        document_number || null,
        breeder_name || null,
        club_name || null,
        notes || null,
        relativeId,
        id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления родственника:', error);
    res.status(500).json({ message: 'Ошибка обновления родственника' });
  }
});

// Удалить родственника из родословной
router.delete(
  '/:id/pedigree/:relativeId',
  authenticateToken,
  async (req, res) => {
    const { id, relativeId } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM pet_pedigree
         WHERE id = $1 AND pet_id = $2 AND user_id = $3
         RETURNING id`,
        [relativeId, id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Запись не найдена' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления родственника:', error);
      res.status(500).json({ message: 'Ошибка удаления родственника' });
    }
  }
);

// Обновить питомца (используем POST для обновления)
router.post('/:id', authenticateToken, updatePet);

// Удалить питомца
router.delete('/:id', authenticateToken, deletePet);

export default router;