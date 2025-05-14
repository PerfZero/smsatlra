import { Router } from 'express';
import { balanceController } from '../controllers/balance.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Получение баланса
router.get('/', authMiddleware, balanceController.getBalance);

// Пополнение баланса (общего)
router.post('/deposit', authMiddleware, balanceController.deposit);

// История транзакций
router.get('/transactions', authMiddleware, balanceController.getTransactions);

export default router; 