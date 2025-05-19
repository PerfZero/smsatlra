import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient();

export const adminController = {
  async getAllUsers(req: Request, res: Response) {
    try {
      // Проверяем, что пользователь - админ
      if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      const users = await prisma.user.findMany({
        include: {
          balance: true,
          goals: true
        }
      });

      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
    }
  },

  async updateUserRole(req: Request, res: Response) {
    try {
      // Проверяем, что пользователь - админ
      if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ error: 'Некорректная роль' });
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { role }
      });

      res.json(user);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Ошибка при обновлении роли пользователя' });
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id: Number(id) } });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Ошибка при удалении пользователя', details: String(error) });
    }
  },

  async makeAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.user.update({
        where: { id: Number(id) },
        data: { role: 'ADMIN' }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Ошибка при назначении роли ADMIN' });
    }
  },

  async makeUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.user.update({
        where: { id: Number(id) },
        data: { role: 'USER' }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Ошибка при назначении роли USER' });
    }
  },

  async getUserDetails(req: Request, res: Response) {
    try {
      if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }
      const userId = Number(req.params.id);
      if (!userId) return res.status(400).json({ error: 'Некорректный id' });
      // Баланс
      const balance = await prisma.balance.findUnique({ where: { userId } });
      // Цели
      const goals = await prisma.goal.findMany({
        where: { userId },
        include: { relative: { select: { fullName: true, iin: true } } }
      });
      // История транзакций
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({
        balance: balance ? { amount: balance.amount, bonusAmount: balance.bonusAmount } : null,
        goals: goals.map(g => ({
          id: g.id,
          type: g.type,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          monthlyTarget: g.monthlyTarget,
          relative: g.relative ? { fullName: g.relative.fullName, iin: g.relative.iin } : undefined
        })),
        transactions: transactions.map(tx => ({
          id: tx.id,
          transactionNumber: tx.transactionNumber,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          description: tx.description,
          date: tx.createdAt.toISOString().split('T')[0]
        }))
      });
    } catch (error) {
      console.error('Error getUserDetails:', error);
      res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
    }
  }
}; 