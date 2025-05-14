import express from 'express';
import { emailMonitorController } from '../controllers/email-monitor.controller';
import { authMiddleware } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// Middleware для проверки прав администратора
const adminRequired = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  if (req.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
  }

  next();
};

// Защита всех маршрутов
router.use(authMiddleware, adminRequired);

// Маршруты для управления мониторингом почты
router.post('/start', emailMonitorController.startMonitoring);
router.post('/stop', emailMonitorController.stopMonitoring);
router.post('/change-interval', emailMonitorController.changeInterval);
router.get('/status', emailMonitorController.getStatus);
router.post('/run-now', emailMonitorController.runNow);

export default router; 