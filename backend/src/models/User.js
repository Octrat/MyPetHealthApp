// backend/src/models/User.js
import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = {
  // Создание нового пользователя (роль по умолчанию 'user')
  async create(userData) {
    const { email, password, name } = userData;

    // Хешируем пароль
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, avatar_path, role, created_at',
      [email, passwordHash, name, 'user']  // роль по умолчанию 'user'
    );

    return result.rows[0];
  },

  // Поиск пользователя по email
  async findByEmail(email) {
    const result = await query(
      'SELECT id, email, name, avatar_path, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0];
  },

  // Поиск пользователя по ID
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, avatar_path, role, created_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0];
  },

  // Проверка пароля
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Обновление данных пользователя
  async update(id, updatedData) {
    const fields = [];
    const values = [];
    let i = 1;

    if (updatedData.name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(updatedData.name);
    }

    if (updatedData.email !== undefined) {
      fields.push(`email = $${i++}`);
      values.push(updatedData.email);
    }

    if (updatedData.password !== undefined) {
      const passwordHash = await bcrypt.hash(updatedData.password, 10);
      fields.push(`password_hash = $${i++}`);
      values.push(passwordHash);
    }

    if (updatedData.avatar_path !== undefined) {
      fields.push(`avatar_path = $${i++}`);
      values.push(updatedData.avatar_path);
    }

    if (updatedData.role !== undefined) {
      fields.push(`role = $${i++}`);
      values.push(updatedData.role);
    }

    if (fields.length === 0) return this.findById(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, email, name, avatar_path, role`,
      [...values, id]
    );

    return result.rows[0];
  },

  // Получить всех пользователей (для админа)
  async findAll() {
    const result = await query(
      'SELECT id, email, name, avatar_path, role, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },

  // Обновить роль пользователя (для админа)
  async updateRole(id, role) {
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, id]
    );
    return result.rows[0];
  }
};