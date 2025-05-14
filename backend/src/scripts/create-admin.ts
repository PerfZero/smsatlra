import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Проверка наличия администратора...');
    
    // Проверяем, существует ли уже администратор
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log(`Администратор уже существует: ${existingAdmin.name} (ID: ${existingAdmin.id})`);
      return existingAdmin;
    }

    console.log('Создание нового администратора...');
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Создаем администратора
    const admin = await prisma.user.create({
      data: {
        name: 'Администратор',
        phone: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        iin: '000000000000' // Фиктивный ИИН для админа
      }
    });
    
    console.log(`Администратор успешно создан: ${admin.name} (ID: ${admin.id})`);
    return admin;
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
createAdmin(); 