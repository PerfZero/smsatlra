import express from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import balanceRoutes from './balance.routes';
import goalRoutes from './goal.routes';
import emailMonitorRoutes from './email-monitor.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/balance', balanceRoutes);
router.use('/goals', goalRoutes);
router.use('/email-monitor', emailMonitorRoutes);

export default router; 