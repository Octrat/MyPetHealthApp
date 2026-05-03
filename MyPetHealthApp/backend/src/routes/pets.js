// /Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/routes/pets.js
import { Router } from 'express';
import pool from '../config/database.js';
import { 
  getPets, 
  addPet, 
  getBreeds, 
  updatePet, 
  deletePet 
} from '../controllers/petsController.js';

const router = Router();

// Получить всех питомцев пользователя
router.get('/', getPets);

// Добавить нового питомца
router.post('/', addPet);

// Обновить питомца (используем POST для обновления)
router.post('/:id', updatePet);

// Удалить питомца
router.delete('/:id', deletePet);

// Получить список пород по виду животного (для автокомплита)
router.get('/breeds', getBreeds);

// ========== QR-КОД ЭНДПОИНТЫ ==========

// Получить QR-информацию питомца
router.get('/:id/qr-info', async (req, res) => {
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
router.post('/:id/qr-info', async (req, res) => {
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

export default router;