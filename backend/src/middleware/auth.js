
import jwt from 'jsonwebtoken';
import { getClient } from '../config/database.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Требуется авторизация',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      // Если истёк JWT демопользователя, сообщаем об окончании демосессии.
      const tokenData = jwt.decode(token);

      if (err.name === 'TokenExpiredError' && tokenData?.demo === true) {
        return res.status(401).json({
          message: 'Срок действия демосессии истёк',
          demoExpired: true,
        });
      }

      return res.status(403).json({
        message: 'Недействительный токен',
      });
    }

    try {
      if (decoded.demo === true) {
        const client = await getClient();

        try {
          const result = await client.query(
            `SELECT id
             FROM demo_sessions
             WHERE user_id = $1
               AND expires_at > NOW()`,
            [decoded.userId]
          );

          if (result.rows.length === 0) {
            return res.status(401).json({
              message: 'Срок действия демосессии истёк',
              demoExpired: true,
            });
          }
        } finally {
          client.release();
        }
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        demo: decoded.demo === true,
      };

      return next();
    } catch (error) {
      console.error('Authentication error:', error.message);

      return res.status(500).json({
        message: 'Ошибка проверки авторизации',
      });
    }
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      message: 'Доступ запрещён. Требуются права администратора',
    });
  }

  next();
};
