import express from 'express';
import { balanceController } from '../controllers/balance.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(authMiddleware);

// Получение баланса
router.get('/', balanceController.getBalance);

// Пополнение баланса
router.post('/deposit', balanceController.deposit);

// История транзакций
router.get('/transactions', balanceController.getTransactions);

export default router; 