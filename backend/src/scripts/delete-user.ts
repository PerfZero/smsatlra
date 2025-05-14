import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  // ИИН пользователя, которого нужно удалить
  const iin = '910721451060'; // ИИН Кожахметовой Галии Ерболовны
  
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
    
    // Проверяем, есть ли связанные записи
    const relatives = await prisma.relative.findMany({
      where: { userId: user.id }
    });
    
    if (relatives.length > 0) {
      console.log(`Найдено ${relatives.length} связанных родственников, удаляем...`);
      await prisma.relative.deleteMany({
        where: { userId: user.id }
      });
    }
    
    const goals = await prisma.goal.findMany({
      where: { userId: user.id }
    });
    
    if (goals.length > 0) {
      console.log(`Найдено ${goals.length} связанных целей, удаляем...`);
      await prisma.goal.deleteMany({
        where: { userId: user.id }
      });
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id }
    });
    
    if (transactions.length > 0) {
      console.log(`Найдено ${transactions.length} связанных транзакций, удаляем...`);
      await prisma.transaction.deleteMany({
        where: { userId: user.id }
      });
    }
    
    const balance = await prisma.balance.findUnique({
      where: { userId: user.id }
    });
    
    if (balance) {
      console.log(`Найден баланс, удаляем...`);
      await prisma.balance.delete({
        where: { userId: user.id }
      });
    }
    
    // Удаляем пользователя
    await prisma.user.delete({
      where: { iin }
    });
    
    console.log(`Пользователь ${user.name} с ИИН ${iin} успешно удален`);
    console.log(`Теперь он может зарегистрироваться заново`);
    
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

 