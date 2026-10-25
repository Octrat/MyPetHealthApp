// backend/src/controllers/userController.js
import { User } from '../models/User.js';

export const userController = {
  // Обновление данных пользователя
  async updateUser(req, res) {
    try {
      const userId = req.user.userId;
      const { name, email, password } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const updatedData = {};
      if (name !== undefined) updatedData.name = name;
      if (email !== undefined) updatedData.email = email;
      if (password !== undefined) updatedData.password = password;

      const updatedUser = await User.update(userId, updatedData);

      res.json({
        message: 'Профиль обновлен',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name || '',
          avatar_path: updatedUser.avatar_path || '',
          role: updatedUser.role
        }
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Ошибка при обновлении профиля' });
    }
  },

  // Загрузка аватара
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не загружен' });
      }

      const userId = req.user.userId;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      
      const updatedUser = await User.update(userId, { avatar_path: avatarPath });

      res.json({
        message: 'Аватар загружен',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name || '',
          avatar_path: updatedUser.avatar_path
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ message: 'Ошибка загрузки аватара' });
    }
  }
};