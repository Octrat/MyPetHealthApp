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

// =====================================================
// ПИТОМЦЫ
// =====================================================

// Получить всех питомцев пользователя
router.get('/', authenticateToken, getPets);

// Добавить нового питомца
router.post('/', authenticateToken, addPet);

// Получить список пород по виду животного
router.get('/breeds', authenticateToken, getBreeds);

// =====================================================
// QR-КОД
// =====================================================

// Получить QR-информацию питомца
router.get('/:id/qr-info', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        qr_phone,
        qr_address,
        qr_additional_info,
        qr_owner_name
      FROM pets
      WHERE id = $1
        AND user_id = $2
      `,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    res.json({
      phone: result.rows[0].qr_phone,
      address: result.rows[0].qr_address,
      additionalInfo: result.rows[0].qr_additional_info,
      ownerName: result.rows[0].qr_owner_name,
    });
  } catch (error) {
    console.error('Ошибка получения QR-данных:', error);

    res.status(500).json({
      message: 'Ошибка получения данных',
    });
  }
});

// Сохранить QR-информацию питомца
router.post('/:id/qr-info', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const {
    phone,
    address,
    additionalInfo,
    ownerName,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE pets
      SET
        qr_phone = $1,
        qr_address = $2,
        qr_additional_info = $3,
        qr_owner_name = $4
      WHERE id = $5
        AND user_id = $6
      RETURNING id
      `,
      [
        phone || null,
        address || null,
        additionalInfo || null,
        ownerName || null,
        id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    res.json({
      success: true,
      message: 'Данные сохранены',
    });
  } catch (error) {
    console.error('Ошибка сохранения QR-данных:', error);

    res.status(500).json({
      message: 'Ошибка сохранения',
    });
  }
});

// =====================================================
// ПАСПОРТ ПИТОМЦА
// =====================================================

// Получить паспорт питомца
router.get('/:id/passport', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        passport_number,
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
      WHERE id = $1
        AND user_id = $2
      `,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    const passport = result.rows[0];

    const hasPassportData =
      passport.passport_number ||
      passport.passport_issued_by ||
      passport.passport_issued_date ||
      passport.passport_chip_number ||
      passport.passport_chip_location ||
      passport.passport_chip_date ||
      passport.passport_color ||
      passport.passport_character ||
      passport.passport_breeding_place ||
      passport.passport_owner_name ||
      passport.passport_owner_phone;

    if (!hasPassportData) {
      return res.json({
        passport_status: 'not_submitted',
        passport_review_comment: null,
      });
    }

    res.json(passport);
  } catch (error) {
    console.error('Ошибка получения паспорта:', error);

    res.status(500).json({
      message: 'Ошибка получения паспорта',
    });
  }
});

// Сохранить / отправить паспорт на проверку
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

  try {
    const petResult = await pool.query(
      `
      SELECT
        id,
        passport_status,
        passport_number,
        passport_issued_by,
        passport_issued_date,
        passport_chip_number,
        passport_chip_location,
        passport_chip_date,
        passport_color,
        passport_character,
        passport_breeding_place,
        passport_owner_name,
        passport_owner_phone
      FROM pets
      WHERE id = $1
        AND user_id = $2
      `,
      [id, req.user.userId]
    );

    if (petResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    const pet = petResult.rows[0];

    const hasExistingPassport =
      pet.passport_number ||
      pet.passport_issued_by ||
      pet.passport_issued_date ||
      pet.passport_chip_number ||
      pet.passport_chip_location ||
      pet.passport_chip_date ||
      pet.passport_color ||
      pet.passport_character ||
      pet.passport_breeding_place ||
      pet.passport_owner_name ||
      pet.passport_owner_phone;

    const currentStatus =
      pet.passport_status || 'not_submitted';

    if (
      hasExistingPassport &&
      currentStatus === 'pending'
    ) {
      return res.status(400).json({
        message:
          'Паспорт уже находится на проверке. Дождитесь решения администратора.',
      });
    }

    if (
      hasExistingPassport &&
      currentStatus === 'approved'
    ) {
      return res.status(400).json({
        message:
          'Паспорт уже одобрен и не может быть изменён.',
      });
    }

    const validateDate = (dateStr) => {
      if (!dateStr) {
        return null;
      }

      if (typeof dateStr !== 'string') {
        return null;
      }

      const regex = /^\d{4}-\d{2}-\d{2}$/;

      if (!regex.test(dateStr)) {
        return null;
      }

      const [year, month, day] = dateStr
        .split('-')
        .map(Number);

      if (
        year < 1900 ||
        year > 2100 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        return null;
      }

      const date = new Date(
        year,
        month - 1,
        day
      );

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }

      return dateStr;
    };

    const validIssuedDate =
      validateDate(issued_date);

    const validChipDate =
      validateDate(chip_date);

    if (
      issued_date &&
      !validIssuedDate
    ) {
      return res.status(400).json({
        message:
          'Неверная дата выдачи. Используйте формат ГГГГ-ММ-ДД.',
      });
    }

    if (
      chip_date &&
      !validChipDate
    ) {
      return res.status(400).json({
        message:
          'Неверная дата чипирования. Используйте формат ГГГГ-ММ-ДД.',
      });
    }

    const result = await pool.query(
      `
      UPDATE pets
      SET
        passport_number = $1,
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
        passport_reviewed_at = NULL,

        updated_at = NOW()

      WHERE id = $12
        AND user_id = $13

      RETURNING id, passport_status
      `,
      [
        number?.trim() || null,
        issued_by?.trim() || null,
        validIssuedDate,

        chip_number?.trim() || null,
        chip_location?.trim() || null,
        validChipDate,

        color?.trim() || null,
        character?.trim() || null,

        breeding_place?.trim() || null,

        owner_name?.trim() || null,
        owner_phone?.trim() || null,

        id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Питомец не найден',
      });
    }

    console.log(
      `Паспорт питомца ${id} отправлен на проверку пользователем ${req.user.userId}`
    );

    res.json({
      success: true,
      message:
        'Данные паспорта отправлены на проверку',
      passport_status:
        result.rows[0].passport_status,
    });
  } catch (error) {
    console.error(
      'Ошибка сохранения паспорта:',
      error
    );

    res.status(500).json({
      message: 'Ошибка сохранения паспорта',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
});

// =====================================================
// РОДОСЛОВНАЯ ПИТОМЦА
// =====================================================

// Получить питомцев текущего пользователя,
// которых можно добавить в родословную
router.get(
  '/:id/pedigree/available-pets',
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    try {
      // Проверяем, что основной питомец принадлежит
      // текущему пользователю
      const petCheck = await pool.query(
        `
        SELECT id
        FROM pets
        WHERE id = $1
          AND user_id = $2
        `,
        [id, req.user.userId]
      );

      if (petCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Питомец не найден',
        });
      }

      // Получаем всех питомцев пользователя,
      // кроме текущего
      const result = await pool.query(
        `
        SELECT
          p.id,
          p.name,
          p.species,
          p.sex,
          p.birth_date,
          p.age,
          p.weight,
          p.height,
          p.photo_url,

          b.name AS breed_name,
          b.name_ru AS breed_name_ru

        FROM pets p

        LEFT JOIN breeds b
          ON p.breed_id = b.id

        WHERE p.user_id = $1
          AND p.id <> $2

        ORDER BY p.name ASC
        `,
        [req.user.userId, id]
      );

      const pets = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        species: row.species,
        sex: row.sex,
        birth_date: row.birth_date,
        age: row.age,
        weight: row.weight,
        height: row.height,
        photo_url: row.photo_url,

        breed_name:
          row.breed_name_ru ||
          row.breed_name ||
          null,
      }));

      res.json(pets);
    } catch (error) {
      console.error(
        'Ошибка получения питомцев для родословной:',
        error
      );

      res.status(500).json({
        message:
          'Ошибка получения списка питомцев',
      });
    }
  }
);

// Получить родословную питомца
router.get(
  '/:id/pedigree',
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    console.log(
      'PEDIGREE BACKEND REQUEST:',
      {
        petId: id,
        userId: req.user.userId,
      }
    );

    try {
      // Проверяем основного питомца
      const petCheck = await pool.query(
        `
        SELECT id
        FROM pets
        WHERE id = $1
          AND user_id = $2
        `,
        [id, req.user.userId]
      );

      if (petCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Питомец не найден',
        });
      }

      const result = await pool.query(
        `
        SELECT
          pp.id,
          pp.pet_id,
          pp.user_id,
          pp.relative_pet_id,
          pp.relative_type,
          pp.status,
          pp.review_comment,
          pp.reviewed_by,
          pp.reviewed_at,
          pp.created_at,
          pp.updated_at,

          rp.id AS linked_pet_id,
          rp.name AS linked_pet_name,
          rp.species AS linked_pet_species,
          rp.sex AS linked_pet_sex,
          rp.birth_date AS linked_pet_birth_date,
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

        WHERE pp.pet_id = $1
          AND pp.user_id = $2

        ORDER BY
          CASE pp.relative_type
            WHEN 'father' THEN 1
            WHEN 'mother' THEN 2
            WHEN 'grandfather' THEN 3
            WHEN 'grandmother' THEN 4
            WHEN 'son' THEN 5
            WHEN 'daughter' THEN 6
            WHEN 'brother' THEN 7
            WHEN 'sister' THEN 8
            ELSE 9
          END,
          pp.id ASC
        `,
        [id, req.user.userId]
      );

      const rows = result.rows.map((row) => ({
        id: row.id,
        pet_id: row.pet_id,
        user_id: row.user_id,

        relative_pet_id:
          row.relative_pet_id,

        relative_type:
          row.relative_type,

        status:
          row.status || 'not_submitted',

        review_comment:
          row.review_comment || null,

        reviewed_by:
          row.reviewed_by || null,

        reviewed_at:
          row.reviewed_at || null,

        created_at:
          row.created_at,

        updated_at:
          row.updated_at,

        relative_pet:
          row.relative_pet_id
            ? {
                id: row.linked_pet_id,
                name: row.linked_pet_name,

                species:
                  row.linked_pet_species,

                sex:
                  row.linked_pet_sex,

                birth_date:
                  row.linked_pet_birth_date,

                age:
                  row.linked_pet_age,

                weight:
                  row.linked_pet_weight,

                height:
                  row.linked_pet_height,

                photo_url:
                  row.linked_pet_photo_url,

                breed_name:
                  row.linked_pet_breed,

                breed_name_ru:
                  row.linked_pet_breed_ru,
              }
            : null,
      }));

      res.json(rows);
    } catch (error) {
      console.error(
        'Ошибка получения родословной:',
        error
      );

      res.status(500).json({
        message:
          'Ошибка получения родословной',
      });
    }
  }
);

// =====================================================
// ДОБАВИТЬ РОДСТВЕННИКА
// =====================================================

router.post(
  '/:id/pedigree',
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    const {
      relative_pet_id,
      relative_type,
    } = req.body;

    console.log('🐾 ADD PEDIGREE REQUEST:', {
      petId: id,
      userId: req.user?.userId,
      relativePetId: relative_pet_id,
      relativeType: relative_type,
    });

    // ================================================
    // Проверяем обязательные поля
    // ================================================

    if (!relative_pet_id) {
      return res.status(400).json({
        message:
          'Необходимо выбрать питомца-родственника',
      });
    }

    if (!relative_type) {
      return res.status(400).json({
        message:
          'Тип родства обязателен',
      });
    }

    // ================================================
    // Приводим ID к числу
    // ================================================

    const relativePetId = Number(relative_pet_id);
    const petId = Number(id);

    if (
      !Number.isInteger(relativePetId) ||
      relativePetId <= 0
    ) {
      return res.status(400).json({
        message:
          'Некорректный идентификатор питомца-родственника',
      });
    }

    if (
      !Number.isInteger(petId) ||
      petId <= 0
    ) {
      return res.status(400).json({
        message:
          'Некорректный идентификатор питомца',
      });
    }

    // ================================================
    // Проверяем, что питомец не добавляет сам себя
    // ================================================

    if (relativePetId === petId) {
      return res.status(400).json({
        message:
          'Нельзя добавить самого питомца в его родословную',
      });
    }

    const allowedTypes = [
      'mother',
      'father',
      'grandmother',
      'grandfather',
      'daughter',
      'son',
      'sister',
      'brother',
    ];

    if (!allowedTypes.includes(relative_type)) {
      return res.status(400).json({
        message:
          'Недопустимый тип родства',
      });
    }

    try {
      // ==============================================
      // 1. Проверяем основного питомца
      // ==============================================

      const petCheck = await pool.query(
        `
        SELECT id
        FROM pets
        WHERE id = $1
          AND user_id = $2
        `,
        [petId, req.user.userId]
      );

      console.log(
        '🐾 MAIN PET CHECK:',
        petCheck.rows.length
      );

      if (petCheck.rows.length === 0) {
        return res.status(404).json({
          message:
            'Основной питомец не найден',
        });
      }

      // ==============================================
      // 2. Проверяем родственника
      // ==============================================

      const relativePetCheck =
        await pool.query(
          `
          SELECT
            id,
            name,
            species,
            sex,
            birth_date,
            age,
            weight,
            height,
            photo_url,
            breed_id
          FROM pets
          WHERE id = $1
            AND user_id = $2
          `,
          [
            relativePetId,
            req.user.userId,
          ]
        );

      console.log(
        '🐾 RELATIVE PET CHECK:',
        relativePetCheck.rows.length
      );

      if (
        relativePetCheck.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            'Выбранный питомец не найден среди ваших питомцев',
        });
      }

      // ==============================================
      // 3. Проверяем существующую связь
      // ==============================================

      const duplicateCheck =
        await pool.query(
          `
          SELECT
            id,
            status
          FROM pet_pedigree
          WHERE pet_id = $1
            AND relative_pet_id = $2
            AND relative_type = $3
            AND user_id = $4
          `,
          [
            petId,
            relativePetId,
            relative_type,
            req.user.userId,
          ]
        );

      console.log(
        '🐾 DUPLICATE CHECK:',
        duplicateCheck.rows
      );

      if (duplicateCheck.rows.length > 0) {
        const existing =
          duplicateCheck.rows[0];

        if (
          existing.status === 'pending'
        ) {
          return res.status(400).json({
            message:
              'Такая связь уже отправлена на рассмотрение',
          });
        }

        if (
          existing.status === 'approved'
        ) {
          return res.status(400).json({
            message:
              'Такая связь уже подтверждена',
          });
        }

        if (
          existing.status === 'rejected'
        ) {
          return res.status(400).json({
            message:
              'Такая связь уже существует. Исправьте существующую заявку.',
          });
        }
      }

      // ==============================================
      // 4. Создаём заявку
      // ==============================================

      console.log(
        '🐾 INSERT INTO PET_PEDIGREE:',
        {
          petId,
          userId: req.user.userId,
          relativePetId,
          relativeType: relative_type,
        }
      );

      const result = await pool.query(
        `
        INSERT INTO pet_pedigree (
          pet_id,
          user_id,
          relative_pet_id,
          relative_type,
          status,
          review_comment,
          reviewed_by,
          reviewed_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'pending',
          NULL,
          NULL,
          NULL,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          pet_id,
          user_id,
          relative_pet_id,
          relative_type,
          status,
          review_comment,
          reviewed_by,
          reviewed_at,
          created_at,
          updated_at
        `,
        [
          petId,
          req.user.userId,
          relativePetId,
          relative_type,
        ]
      );

      console.log(
        '✅ PEDIGREE CREATED:',
        {
          id: result.rows[0].id,
          petId: result.rows[0].pet_id,
          relativePetId:
            result.rows[0].relative_pet_id,
          relativeType:
            result.rows[0].relative_type,
          status:
            result.rows[0].status,
        }
      );

      return res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      // ==============================================
      // ПОДРОБНОЕ ЛОГИРОВАНИЕ ОШИБКИ POSTGRESQL
      // ==============================================

      console.error(
        '❌❌❌ ОШИБКА ДОБАВЛЕНИЯ РОДСТВЕННИКА ❌❌❌'
      );

      console.error(
        'message:',
        error?.message
      );

      console.error(
        'code:',
        error?.code
      );

      console.error(
        'detail:',
        error?.detail
      );

      console.error(
        'hint:',
        error?.hint
      );

      console.error(
        'constraint:',
        error?.constraint
      );

      console.error(
        'table:',
        error?.table
      );

      console.error(
        'column:',
        error?.column
      );

      console.error(
        'dataType:',
        error?.dataType
      );

      console.error(
        'where:',
        error?.where
      );

      console.error(
        'schema:',
        error?.schema
      );

      console.error(
        'stack:',
        error?.stack
      );

      console.error(
        'REQUEST DATA:',
        {
          petId,
          userId: req.user?.userId,
          relativePetId,
          relativeType: relative_type,
        }
      );

      return res.status(500).json({
        message:
          'Ошибка добавления родственника',

        error:
          process.env.NODE_ENV === 'development'
            ? error?.message
            : undefined,
      });
    }
  }
);

// =====================================================
// ПОВТОРНАЯ ОТПРАВКА ОТКЛОНЁННОЙ СВЯЗИ
// =====================================================

router.post(
  '/:id/pedigree/:relativeId/resubmit',
  authenticateToken,
  async (req, res) => {
    const {
      id,
      relativeId,
    } = req.params;

    const {
      relative_pet_id,
      relative_type,
    } = req.body;

    if (!relative_pet_id) {
      return res.status(400).json({
        message:
          'Необходимо выбрать питомца-родственника',
      });
    }

    if (!relative_type) {
      return res.status(400).json({
        message:
          'Тип родства обязателен',
      });
    }

    if (
      Number(relative_pet_id) === Number(id)
    ) {
      return res.status(400).json({
        message:
          'Нельзя добавить самого питомца в его родословную',
      });
    }

    try {
      // Проверяем основного питомца
      const petCheck = await pool.query(
        `
        SELECT id
        FROM pets
        WHERE id = $1
          AND user_id = $2
        `,
        [id, req.user.userId]
      );

      if (petCheck.rows.length === 0) {
        return res.status(404).json({
          message:
            'Питомец не найден',
        });
      }

      // Проверяем выбранного родственника
      const relativePetCheck =
        await pool.query(
          `
          SELECT id
          FROM pets
          WHERE id = $1
            AND user_id = $2
          `,
          [
            relative_pet_id,
            req.user.userId,
          ]
        );

      if (
        relativePetCheck.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            'Выбранный питомец не найден среди ваших питомцев',
        });
      }

      // Обновляем только отклонённую заявку
      const result = await pool.query(
        `
        UPDATE pet_pedigree
        SET
          relative_pet_id = $1,
          relative_type = $2,

          status = 'pending',

          review_comment = NULL,
          reviewed_by = NULL,
          reviewed_at = NULL,

          updated_at = NOW()

        WHERE id = $3
          AND pet_id = $4
          AND user_id = $5
          AND status = 'rejected'

        RETURNING
          id,
          pet_id,
          user_id,
          relative_pet_id,
          relative_type,
          status,
          review_comment,
          reviewed_by,
          reviewed_at,
          created_at,
          updated_at
        `,
        [
          relative_pet_id,
          relative_type,
          relativeId,
          id,
          req.user.userId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          message:
            'Можно повторно отправить только отклонённую связь',
        });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(
        '❌ Ошибка повторной отправки родословной'
      );

      console.error(
        'message:',
        error?.message
      );

      console.error(
        'code:',
        error?.code
      );

      console.error(
        'detail:',
        error?.detail
      );

      console.error(
        'hint:',
        error?.hint
      );

      console.error(
        'constraint:',
        error?.constraint
      );

      console.error(
        'stack:',
        error?.stack
      );

      res.status(500).json({
        message:
          'Ошибка повторной отправки связи',
      });
    }
  }
);

// =====================================================
// УДАЛИТЬ РОДСТВЕННИКА
// =====================================================

router.delete(
  '/:id/pedigree/:relativeId',
  authenticateToken,
  async (req, res) => {
    const {
      id,
      relativeId,
    } = req.params;

    try {
      // Получаем запись
      const existing = await pool.query(
        `
        SELECT
          id,
          status
        FROM pet_pedigree
        WHERE id = $1
          AND pet_id = $2
          AND user_id = $3
        `,
        [
          relativeId,
          id,
          req.user.userId,
        ]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          message:
            'Запись родословной не найдена',
        });
      }

      const status =
        existing.rows[0].status;

      // Pending и approved блокируем
      if (
        status === 'pending'
      ) {
        return res.status(400).json({
          message:
            'Нельзя удалить связь, которая находится на рассмотрении',
        });
      }

      if (
        status === 'approved'
      ) {
        return res.status(400).json({
          message:
            'Нельзя удалить подтверждённую связь',
        });
      }

      // rejected / not_submitted можно удалить
      await pool.query(
        `
        DELETE FROM pet_pedigree
        WHERE id = $1
          AND pet_id = $2
          AND user_id = $3
        `,
        [
          relativeId,
          id,
          req.user.userId,
        ]
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        'Ошибка удаления родственника:',
        error
      );

      res.status(500).json({
        message:
          'Ошибка удаления родственника',
      });
    }
  }
);

// =====================================================
// ОБНОВЛЕНИЕ ПИТОМЦА
// =====================================================

router.post(
  '/:id',
  authenticateToken,
  updatePet
);

// =====================================================
// УДАЛЕНИЕ ПИТОМЦА
// =====================================================

router.delete(
  '/:id',
  authenticateToken,
  deletePet
);

export default router;
