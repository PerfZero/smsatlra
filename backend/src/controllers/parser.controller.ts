import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface PersonData {
  name: string;
  iin: string;
}

export const parserController = {
  async parseEmail(req: Request, res: Response) {
    try {
      const { emailText } = req.body;

      if (!emailText) {
        return res.status(400).json({ error: 'Email text is required' });
      }

      // Извлекаем ФИО и ИИН
      const nameMatch = emailText.match(/ФИО отдыхающего: ([^\n]+)/);
      const iinMatch = emailText.match(/ИИН отдыхающего: (\d{12})/);

      if (!nameMatch || !iinMatch) {
        return res.status(400).json({ error: 'Could not extract name or IIN from email' });
      }

      const personData: PersonData = {
        name: nameMatch[1].trim(),
        iin: iinMatch[1],
      };

      // Сохраняем в базу
      const user = await prisma.user.upsert({
        where: { iin: personData.iin },
        update: { name: personData.name },
        create: {
          iin: personData.iin,
          name: personData.name,
          phone: '',
          password: '',
          role: 'USER',
          balance: {
            create: {
              amount: 0,
              bonusAmount: 0
            }
          }
        }
      });

      res.json({ 
        success: true, 
        user: {
          name: user.name,
          iin: user.iin
        }
      });
    } catch (error) {
      console.error('Error parsing email:', error);
      res.status(500).json({ error: 'Failed to parse email and save data' });
    }
  }
}; 