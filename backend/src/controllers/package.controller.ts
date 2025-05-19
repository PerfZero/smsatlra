import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const packageController = {
  // Получить все пакеты
  async getAll(req: Request, res: Response) {
    const packages = await prisma.tourPackage.findMany();
    res.json(packages);
  },

  // Получить один пакет
  async getOne(req: Request, res: Response) {
    const { id } = req.params;
    const pkg = await prisma.tourPackage.findUnique({ where: { id: Number(id) } });
    if (!pkg) return res.status(404).json({ message: 'Пакет не найден' });
    res.json(pkg);
  },

  // Создать пакет
  async create(req: Request, res: Response) {
    const data = req.body;
    try {
      const newPkg = await prisma.tourPackage.create({ data });
      res.json(newPkg);
    } catch (e) {
      res.status(400).json({ message: 'Ошибка при создании пакета', error: e });
    }
  },

  // Обновить пакет
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    try {
      const updated = await prisma.tourPackage.update({ where: { id: Number(id) }, data });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: 'Ошибка при обновлении пакета', error: e });
    }
  },

  // Удалить пакет
  async remove(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await prisma.tourPackage.delete({ where: { id: Number(id) } });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: 'Ошибка при удалении пакета', error: e });
    }
  },
}; 