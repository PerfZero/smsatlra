import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

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
      // Проверяем, что пользователь - админ
      if (req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      const { id } = req.params;

      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Пользователь успешно удален' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Ошибка при удалении пользователя' });
    }
  }
}; 