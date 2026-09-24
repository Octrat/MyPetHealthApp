// backend/src/routes/admin.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Статистика системы
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalPets, totalDogs, totalCats, totalAdmins] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM pets'),
      pool.query("SELECT COUNT(*) FROM pets WHERE species = 'dog'"),
      pool.query("SELECT COUNT(*) FROM pets WHERE species = 'cat'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
    ]);

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalPets: parseInt(totalPets.rows[0].count),
      totalDogs: parseInt(totalDogs.rows[0].count),
      totalCats: parseInt(totalCats.rows[0].count),
      totalAdmins: parseInt(totalAdmins.rows[0].count),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Ошибка получения статистики' });
  }
});

// Список всех пользователей
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, avatar_path, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
});

// Список всех питомцев
router.get('/pets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.email as owner_email, u.name as owner_name 
      FROM pets p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Admin pets error:', error);
    res.status(500).json({ message: 'Ошибка получения питомцев' });
  }
});

// Обновление роли пользователя
router.patch('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Некорректная роль' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ message: 'Ошибка обновления роли' });
  }
});

// Удаление питомца
router.delete('/pets/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM pets WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }
    
    res.json({ message: 'Питомец удалён' });
  } catch (error) {
    console.error('Admin delete pet error:', error);
    res.status(500).json({ message: 'Ошибка удаления питомца' });
  }
});

// Удаление пользователя
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Сначала удаляем питомцев пользователя
    await pool.query('DELETE FROM pets WHERE user_id = $1', [id]);
    // Затем удаляем пользователя
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
});

export default router;