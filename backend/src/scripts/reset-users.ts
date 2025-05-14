import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log('Начинаем сброс данных пользователей...');
    
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      where: {
        role: 'USER' // Ограничиваем только обычными пользователями
      }
    });
    
    console.log(`Найдено ${users.length} пользователей`);
    
    // Для каждого пользователя обновляем password на пустую строку
    // Это позволит пользователям заново зарегистрироваться, но сохранит их ФИО и ИИН
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: '' // Сбрасываем пароль на пустую строку
        }
      });
      console.log(`Сброшен пароль для пользователя ${user.name} (${user.iin})`);
    }
    
    console.log('Процесс сброса пользователей завершен');
  } catch (error) {
    console.error('Ошибка при сбросе пользователей:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Соединение с базой данных закрыто');
  }
}

// Запускаем скрипт
resetUsers(); 