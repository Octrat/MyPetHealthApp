///Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/controllers/userController.js
import { User } from '../models/User.js';

export const userController = {
  // 🔹 Обновление данных пользователя
  async updateUser(req, res) {
    try {
      const userId = req.user.userId;
      const { name, email, password } = req.body;

      // Проверяем существование пользователя
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Обновляем только переданные поля
      const updatedData = {};
      if (name !== undefined) updatedData.name = name;
      if (email !== undefined) updatedData.email = email;
      if (password !== undefined) updatedData.password = password; // убедись, что модель User хеширует пароль

      const updatedUser = await User.update(userId, updatedData);

      res.json({
        message: 'Профиль обновлен',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name || ''
        }
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Ошибка при обновлении профиля' });
    }
  }
};
