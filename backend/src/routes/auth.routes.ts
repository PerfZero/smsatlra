import express from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Публичные роуты
router.post('/register', authController.register);
router.post('/login', authController.login);

// Защищенные роуты
router.use(authMiddleware);
router.get('/profile', authController.getCurrentUser);
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);

export default router; 