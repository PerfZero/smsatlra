import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Публичные роуты
router.post('/register', authController.register);
router.post('/login', authController.login);

// Восстановление пароля
router.post('/forgot-password', authController.initiatePasswordReset);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Защищенные роуты
router.use(authMiddleware);
router.get('/profile', authController.getCurrentUser);
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);

export default router; 