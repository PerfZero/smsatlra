import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      console.log('=== Register Start ===');
      console.log('Request body:', req.body);
      
      const { iin, phone, password, name } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { iin },
            { phone }
          ]
        }
      });

      if (existingUser && existingUser.password === '') {
        console.log('User exists with empty password, updating:', existingUser.id);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            phone,
            password: hashedPassword,
            name: name || existingUser.name,
          }
        });
        
        console.log('Updated user:', updatedUser.id);
        
        const token = jwt.sign(
          { id: updatedUser.id, iin: updatedUser.iin, role: updatedUser.role },
          process.env.JWT_SECRET!,
          { expiresIn: '24h' }
        );
        
        console.log('Generated token:', token.substring(0, 20) + '...');
        
        return res.json({ 
          user: {
            id: updatedUser.id,
            iin: updatedUser.iin,
            phone: updatedUser.phone,
            name: updatedUser.name,
            role: updatedUser.role
          },
          token 
        });
      }
      else if (existingUser) {
        console.log('User already exists with password set:', existingUser.id);
        return res.status(400).json({ error: 'Пользователь уже существует' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          iin,
          phone,
          password: hashedPassword,
          name,
          balance: {
            create: {
              amount: 0,
              bonusAmount: 0
            }
          }
        }
      });

      console.log('Created user:', user.id);

      const token = jwt.sign(
        { id: user.id, iin: user.iin, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      console.log('Generated token:', token.substring(0, 20) + '...');

      res.json({ 
        user: {
          id: user.id,
          iin: user.iin,
          phone: user.phone,
          name: user.name,
          role: user.role
        },
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Ошибка при регистрации' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      console.log('=== Login Start ===');
      console.log('Request body:', { iin: req.body.iin });
      
      const { iin, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { iin }
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Неверный ИИН или пароль' });
      }

      const token = jwt.sign(
        { id: user.id, iin: user.iin, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      console.log('Generated token:', token.substring(0, 20) + '...');

      res.json({
        user: {
          id: user.id,
          iin: user.iin,
          phone: user.phone,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Ошибка при входе' });
    }
  },

  async getCurrentUser(req: Request, res: Response) {
    try {
      console.log('=== getCurrentUser Start ===');
      console.log('User from request:', req.user);
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          balance: true
        }
      });

      console.log('Found user:', user ? {
        id: user.id,
        iin: user.iin,
        phone: user.phone,
        name: user.name,
        role: user.role,
        balance: user.balance
      } : null);

      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({
        iin: user.iin,
        phone: user.phone,
        name: user.name,
        role: user.role,
        balance: user.balance
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const { name, phone } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { name, phone },
        select: {
          id: true,
          iin: true,
          phone: true,
          name: true,
          role: true
        }
      });

      res.json(user);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Ошибка при обновлении профиля' });
    }
  }
}; 