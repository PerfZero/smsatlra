import { Request, Response } from 'express';
import { parseEmails } from '../scripts/parse-emails';
import { prisma } from '../lib/prisma';

export const gmailController = {
  async processEmails(req: Request, res: Response) {
    try {
      // Запускаем парсинг писем напрямую
      await parseEmails();
      
      res.json({ success: true, message: 'Email processing started' });
    } catch (error) {
      console.error('Error in processEmails:', error);
      res.status(500).json({ error: 'Failed to process emails' });
    }
  }
};