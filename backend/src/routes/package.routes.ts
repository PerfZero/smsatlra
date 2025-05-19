import express from 'express';
import { packageController } from '../controllers/package.controller';
import { authMiddleware } from '../middleware/auth';
import { Role } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

router.use(authMiddleware);

const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'Требуется авторизация' });
  if (req.user.role !== Role.ADMIN) return res.status(403).json({ message: 'Доступ запрещен' });
  next();
};

router.get('/', packageController.getAll); // Все могут смотреть
router.get('/:id', packageController.getOne); // Все могут смотреть
router.post('/', adminMiddleware, packageController.create);
router.put('/:id', adminMiddleware, packageController.update);
router.delete('/:id', adminMiddleware, packageController.remove);

export default router; 