import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { balanceService } from '../services/balanceService';

export const balanceController = {
  async getBalance(req: Request, res: Response) {
    try {
      const balance = await balanceService.getBalance(req.user!.id);
      res.json(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      res.status(500).json({ error: 'Ошибка при получении баланса' });
    }
  },

  async deposit(req: Request, res: Response) {
    try {
      const { amount, goalId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Некорректная сумма' });
      }

      // Если указан goalId, проверяем существование цели и права доступа
      if (goalId) {
        const goal = await prisma.goal.findFirst({
          where: {
            id: goalId,
            userId: req.user!.id
          }
        });

        if (!goal) {
          return res.status(404).json({ error: 'Цель не найдена или нет прав доступа' });
        }
      }

      const result = await balanceService.deposit(req.user!.id, amount, goalId);
      res.json(result);
    } catch (error) {
      console.error('Error depositing:', error);
      res.status(500).json({ error: 'Ошибка при пополнении баланса' });
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      console.log('=== getTransactions Start ===');
      console.log('User from request:', req.user);

      if (!req.user || !req.user.id) {
        console.log('No user in request or missing user ID');
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              iin: true,
              name: true
            }
          },
          relative: {
            select: {
              id: true,
              fullName: true,
              iin: true
            }
          },
          goal: {
            select: {
              id: true,
              targetAmount: true,
              currentAmount: true,
              relative: {
                select: {
                  fullName: true,
                  iin: true
                }
              }
            }
          }
        }
      });

      console.log('Found transactions:', transactions.length);

      const formattedTransactions = transactions.map(tx => ({
        id: tx.id,
        transactionNumber: tx.transactionNumber,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        iin: tx.user.iin,
        name: tx.user.name || 'Пользователь',
        date: tx.createdAt.toISOString().split('T')[0],
        goalId: tx.goal?.id || null,
        goal: tx.goal ? {
          currentAmount: tx.goal.currentAmount,
          targetAmount: tx.goal.targetAmount,
          relativeName: tx.goal.relative?.fullName || null,
          relativeIin: tx.goal.relative?.iin || null
        } : null,
        relative: tx.relative ? {
          id: tx.relative.id,
          fullName: tx.relative.fullName,
          iin: tx.relative.iin
        } : null
      }));

      console.log('Formatted transactions:', formattedTransactions.length);
      res.json(formattedTransactions);
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ error: 'Ошибка при получении истории транзакций' });
    }
  }
}; 