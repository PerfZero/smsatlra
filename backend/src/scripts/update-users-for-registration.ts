import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUsersForRegistration() {
  try {
    console.log('Начинаем обновление пользователей для подготовки к регистрации...');
    
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      where: {
        role: 'USER' // Ограничиваем только обычными пользователями
      }
    });
    
    console.log(`Найдено ${users.length} пользователей`);
    
    // Для каждого пользователя обновляем данные
    for (const user of users) {
      // Устанавливаем пустой пароль и генерируем заглушку номера телефона
      // Использование ИИН для телефона обеспечит уникальность
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: "", // Пустой пароль
        }
      });
      
      console.log(`Обновлен пользователь ${updatedUser.name} (${updatedUser.iin})`);
    }
    
    console.log('Процесс обновления пользователей завершен');
    console.log('ВАЖНО: Теперь нужно изменить контроллер auth.controller.ts, чтобы позволить обновление пользователей с пустыми паролями');
  } catch (error) {
    console.error('Ошибка при обновлении пользователей:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Соединение с базой данных закрыто');
  }
}

// Запускаем скрипт
updateUsersForRegistration(); 