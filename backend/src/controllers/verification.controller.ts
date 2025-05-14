import { Request, Response } from 'express';
import { SmsService } from '../services/sms.service';
import { prisma } from '../lib/prisma';

const smsService = new SmsService();

// Хранилище кодов верификации (в реальном приложении лучше использовать Redis)
const verificationCodes: { [key: string]: { code: string; timestamp: number } } = {};

export const verificationController = {
  async sendVerificationCode(req: Request, res: Response) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Генерируем 4-значный код
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Сохраняем код и время его создания
      verificationCodes[phone] = {
        code,
        timestamp: Date.now()
      };

      // Формируем текст SMS
      const message = `${code} - код подтверждения Atlas Save`;

      // Отправляем SMS через smsc.kz
      const smsSent = await smsService.sendSms(phone, message);

      if (!smsSent) {
        return res.status(500).json({ error: 'Failed to send SMS' });
      }

      // В ответе НЕ отправляем код, только статус успеха
      res.json({ 
        success: true, 
        message: 'Verification code sent',
        expiresIn: '10 minutes'
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verifyCode(req: Request, res: Response) {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({ error: 'Phone and code are required' });
      }

      const storedData = verificationCodes[phone];

      if (!storedData) {
        return res.status(400).json({ error: 'Код не найден. Запросите новый код.' });
      }

      // Проверяем не истек ли код (10 минут)
      if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
        delete verificationCodes[phone];
        return res.status(400).json({ error: 'Срок действия кода истек. Запросите новый код.' });
      }

      if (storedData.code !== code) {
        return res.status(400).json({ error: 'Неверный код подтверждения' });
      }

      // Удаляем использованный код
      delete verificationCodes[phone];

      res.json({ 
        success: true, 
        message: 'Код подтвержден успешно' 
      });
    } catch (error) {
      console.error('Error verifying code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 