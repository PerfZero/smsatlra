import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        iin: string;
        role: Role;
      }
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== Auth Middleware Start ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found or invalid format');
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token:', token);

    if (!token) {
      console.log('No token found after split');
      return res.status(401).json({ error: 'Неверный формат токена' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
    }

    try {
      console.log('Attempting to verify token with secret:', process.env.JWT_SECRET.substring(0, 3) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number; iin: string; role: Role };
      console.log('Successfully decoded token:', decoded);
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      if (jwtError instanceof Error) {
        return res.status(401).json({ 
          error: 'Недействительный токен', 
          details: jwtError.message 
        });
      }
      return res.status(401).json({ error: 'Недействительный токен' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Недействительный токен' });
  }
}; 