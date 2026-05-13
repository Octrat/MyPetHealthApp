// backend/src/routes/pets.js
import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getPets, 
  addPet, 
  getBreeds, 
  updatePet, 
  deletePet 
} from '../controllers/petsController.js';

const router = Router();

// Получить всех питомцев пользователя
router.get('/', authenticateToken, getPets);

// Добавить нового питомца
router.post('/', authenticateToken, addPet);

// Обновить питомца (используем POST для обновления)
router.post('/:id', authenticateToken, updatePet);

// Удалить питомца
router.delete('/:id', authenticateToken, deletePet);

// Получить список пород по виду животного (для автокомплита)
router.get('/breeds', authenticateToken, getBreeds);

// ========== QR-КОД ЭНДПОИНТЫ ==========

// Получить QR-информацию питомца
router.get('/:id/qr-info', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT qr_phone, qr_address, qr_additional_info, qr_owner_name 
       FROM pets WHERE id = $1 AND user_id = $2`,
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
    console.error(error);
    res.status(500).json({ message: 'Ошибка получения данных' });
  }
});

// Сохранить QR-информацию питомца
router.post('/:id/qr-info', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { phone, address, additionalInfo, ownerName } = req.body;
  try {
    await pool.query(
      `UPDATE pets 
       SET qr_phone = $1, qr_address = $2, qr_additional_info = $3, qr_owner_name = $4 
       WHERE id = $5 AND user_id = $6`,
      [phone, address, additionalInfo, ownerName, id, req.user.userId]
    );
    res.json({ message: 'Данные сохранены' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сохранения' });
  }
});

// ========== ПАСПОРТ ПИТОМЦА ЭНДПОИНТЫ ==========

// Получить паспорт питомца
router.get('/:id/passport', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT passport_number, passport_issued_by, passport_issued_date,
              passport_chip_number, passport_chip_location, passport_chip_date,
              passport_color, passport_character, passport_breeding_place,
              passport_owner_name, passport_owner_phone, passport_status, passport_review_comment
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
    number, issued_by, issued_date, chip_number, chip_location, chip_date,
    color, character, breeding_place, owner_name, owner_phone
  } = req.body;

  // Валидация дат
  const validateDate = (dateStr) => {
    if (!dateStr) return null;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return null;
    return dateStr;
  };

  const validIssuedDate = validateDate(issued_date);
  const validChipDate = validateDate(chip_date);

  try {
    await pool.query(
      `UPDATE pets SET 
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
        passport_reviewed_at = NULL
       WHERE id = $12 AND user_id = $13`,
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
        req.user.userId
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения паспорта:', error);
    res.status(500).json({ message: 'Ошибка сохранения паспорта' });
  }
});

export default router;