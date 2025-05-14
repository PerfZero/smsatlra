import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setPassword() {
  // ИИН пользователя, для которого нужно обновить пароль
  const iin = '910721451060'; // ИИН Кожахметовой Галии Ерболовны
  
  // Новый пароль
  const newPassword = 'password123';
  
  try {
    console.log(`Поиск пользователя с ИИН: ${iin}`);
    
    // Ищем пользователя по ИИН
    const user = await prisma.user.findUnique({
      where: { iin }
    });
    
    if (!user) {
      console.error(`Пользователь с ИИН ${iin} не найден`);
      return;
    }
    
    console.log(`Пользователь найден: ${user.name} (ID: ${user.id})`);
    
    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль пользователя
    await prisma.user.update({
      where: { iin },
      data: { password: hashedPassword }
    });
    
    console.log(`Пароль успешно обновлен для пользователя ${user.name}`);
    console.log(`Для входа используйте:\nИИН: ${iin}\nПароль: ${newPassword}`);
    
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
setPassword(); 