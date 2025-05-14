import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Расширяем интерфейс Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; iin: string; role: Role };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Получаем токен из заголовков запроса
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
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
    console.error('Ошибка аутентификации:', error);
    return res.status(401).json({ message: 'Ошибка аутентификации' });
  }
}; 