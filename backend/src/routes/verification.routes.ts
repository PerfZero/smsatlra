import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';

const router = Router();

router.post('/send-code', verificationController.sendVerificationCode);
router.post('/verify-code', verificationController.verifyCode);

export default router; 