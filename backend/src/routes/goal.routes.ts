import express from 'express';
import { goalsController } from '../controllers/goals.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(authMiddleware);

// Создание цели для себя
router.post('/self', goalsController.createSelfGoal);

// Создание цели для близкого
router.post('/family', goalsController.createFamilyGoal);

// Получение всех целей пользователя
router.get('/', goalsController.getUserGoals);

// Пополнение конкретной цели
router.post('/:goalId/deposit', goalsController.deposit);

export default router; 