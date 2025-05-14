import express, { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { authMiddleware } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// Middleware для проверки токена в URL параметрах
const tokenFromQueryMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Если в запросе уже есть user, значит авторизация уже произошла
    if (req.user) {
      return next();
    }

    // Пробуем получить токен из URL параметров
    const token = req.query.token as string;
    if (!token) {
      return next(); // Переходим к следующему middleware
    }

    // Проверка токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded || typeof decoded !== 'object') {
      return res.status(401).json({ message: 'Недействительный токен' });
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) }
    });

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    // Добавляем пользователя к запросу
    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации через URL параметр:', error);
    next(); // Переходим к следующему middleware
  }
};

// Маршрут для подписки на уведомления (Server-Sent Events)
router.get('/subscribe', [tokenFromQueryMiddleware, authMiddleware], (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }
  
  const userId = req.user.id.toString();
  console.log(`Пользователь ${userId} подписался на уведомления`);
  NotificationService.addClient(userId, res);
});

export default router; 