import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parseEmails } from './scripts/parse-emails';
import { startEmailMonitoring } from './services/email-monitor.service';

// Импорт роутов
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import balanceRoutes from './routes/balance.routes';
import goalRoutes from './routes/goal.routes';
import notificationRoutes from './routes/notification.routes';
import verificationRoutes from './routes/verification.routes';
import packageRoutes from './routes/package.routes';
import uploadRoutes from './routes/upload.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- /api/auth/*');
  console.log('- /api/admin/*');
  console.log('- /api/balance/*');
  console.log('- /api/goals/*');
  
  // Обновляем временную метку при запуске сервера
  const LAST_CHECK_PATH = path.join(process.cwd(), 'last_email_check.json');
  // Устанавливаем метку на 1 час назад, чтобы не пропустить недавние письма
  const currentTime = Date.now() - (60 * 60 * 1000); // 1 час назад
  fs.writeFileSync(LAST_CHECK_PATH, JSON.stringify({ lastCheck: currentTime }));
  console.log(`Установлена начальная временная метка (1 час назад): ${new Date(currentTime).toLocaleString()}`);

  // Запускаем мониторинг почты (проверка каждые 3 секунды)
  startEmailMonitoring(3);
}); 