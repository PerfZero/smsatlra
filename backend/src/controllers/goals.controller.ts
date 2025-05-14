import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { balanceService } from '../services/balanceService';

export const goalsController = {
  // Создание цели для себя
  async createSelfGoal(req: Request, res: Response) {
    try {
      const { type, packageType, targetAmount, monthlyTarget } = req.body;
      const userId = req.user!.id;

      const goal = await prisma.goal.create({
        data: {
          userId,
          type,
          packageType,
          targetAmount,
          monthlyTarget
        }
      });

      res.json(goal);
    } catch (error) {
      console.error('Error creating self goal:', error);
      res.status(500).json({ error: 'Не удалось создать цель' });
    }
  },

  // Создание цели для близкого
  async createFamilyGoal(req: Request, res: Response) {
    try {
      const { fullName, iin, type, packageType, targetAmount, monthlyTarget } = req.body;
      const userId = req.user!.id;

      // Транзакция для создания родственника и цели
      const result = await prisma.$transaction(async (prisma) => {
        // Проверяем, существует ли уже родственник с таким ИИН
        let relative = await prisma.relative.findUnique({
          where: { iin }
        });

        // Если родственника нет, создаем его
        if (!relative) {
          relative = await prisma.relative.create({
            data: {
              userId,
              fullName,
              iin
            }
          });
        }

        // Создаем цель для родственника
        const goal = await prisma.goal.create({
          data: {
            userId,
            relativeId: relative.id,
            type,
            packageType,
            targetAmount,
            monthlyTarget
          }
        });

        return goal;
      });

      res.json(result);
    } catch (error) {
      console.error('Error creating family goal:', error);
      res.status(500).json({ error: 'Не удалось создать цель для близкого' });
    }
  },

  // Получение всех целей пользователя
  async getUserGoals(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const goals = await prisma.goal.findMany({
        where: { userId },
        include: {
          relative: true
        }
      });

      res.json(goals);
    } catch (error) {
      console.error('Error fetching user goals:', error);
      res.status(500).json({ error: 'Не удалось получить цели' });
    }
  },

  // Пополнение цели
  async deposit(req: Request, res: Response) {
    try {
      const goalId = parseInt(req.params.goalId);
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Некорректная сумма' });
      }

      // Проверяем существование цели и права доступа
      const goal = await prisma.goal.findFirst({
        where: {
          id: goalId,
          userId: req.user!.id
        }
      });

      if (!goal) {
        return res.status(404).json({ error: 'Цель не найдена или нет прав доступа' });
      }

      const result = await balanceService.deposit(req.user!.id, amount, goalId);
      res.json(result);
    } catch (error) {
      console.error('Error depositing to goal:', error);
      res.status(500).json({ error: 'Ошибка при пополнении цели' });
    }
  }
}; 