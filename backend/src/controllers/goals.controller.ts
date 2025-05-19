import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { balanceService, generateTransactionNumber } from '../services/balanceService';
import { Prisma } from '@prisma/client';

export const goalsController = {
  // Создание цели для себя
  async createSelfGoal(req: Request, res: Response) {
    try {
      const { type, packageType, targetAmount, monthlyTarget, packageId } = req.body;
      const userId = req.user!.id;

      const goal = await prisma.goal.create({
        data: {
          userId,
          type,
          packageType,
          targetAmount,
          monthlyTarget,
          packageId
        }
      });

      // --- АВТОМАТИЧЕСКИЙ ПЕРЕВОД С БАЛАНСА НА ЦЕЛЬ ---
      const userBalance = await prisma.balance.findUnique({ where: { userId } });
      if (userBalance && userBalance.amount > 0) {
        const transactionNumber = await generateTransactionNumber();
        await (prisma as any).$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.balance.update({
            where: { userId },
            data: { amount: 0 }
          });
          await tx.goal.update({
            where: { id: goal.id },
            data: { currentAmount: { increment: userBalance.amount } }
          });
          await tx.transaction.create({
            data: {
              userId,
              amount: userBalance.amount,
              type: 'DEPOSIT',
              status: 'COMPLETED',
              description: 'Автоматический перевод средств с баланса на новую цель',
              goalId: goal.id,
              transactionNumber
            }
          });
        });
      }
      // --- КОНЕЦ БЛОКА ---

      res.json(goal);
    } catch (error) {
      console.error('Error creating self goal:', error);
      res.status(500).json({ error: 'Не удалось создать цель' });
    }
  },

  // Создание цели для близкого
  async createFamilyGoal(req: Request, res: Response) {
    try {
      const { fullName, iin, type, packageType, targetAmount, monthlyTarget, packageId } = req.body;
      const userId = req.user!.id;

      // Транзакция для создания родственника и цели
      const result = await prisma.$transaction(async (tx) => {
        // Проверяем, существует ли уже родственник с таким ИИН
        let relative = await tx.relative.findUnique({
          where: { iin }
        });

        // Если родственника нет, создаем его
        if (!relative) {
          relative = await tx.relative.create({
            data: {
              userId,
              fullName,
              iin
            }
          });
        }

        // Создаем цель для родственника
        const goal = await tx.goal.create({
          data: {
            userId,
            relativeId: relative.id,
            type,
            packageType,
            targetAmount,
            monthlyTarget,
            packageId
          }
        });

        // --- АВТОМАТИЧЕСКИЙ ПЕРЕВОД С БАЛАНСА НА ЦЕЛЬ ДЛЯ РОДСТВЕННИКА ---
        const userBalance = await tx.balance.findUnique({ where: { userId } });
        if (userBalance && userBalance.amount > 0) {
          const transactionNumber = await generateTransactionNumber();
          await tx.balance.update({
            where: { userId },
            data: { amount: 0 }
          });
          await tx.goal.update({
            where: { id: goal.id },
            data: { currentAmount: { increment: userBalance.amount } }
          });
          await tx.transaction.create({
            data: {
              userId,
              amount: userBalance.amount,
              type: 'DEPOSIT',
              status: 'COMPLETED',
              description: 'Автоматический перевод средств с баланса на новую цель родственника',
              goalId: goal.id,
              transactionNumber
            }
          });
        }
        // --- КОНЕЦ БЛОКА ---

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