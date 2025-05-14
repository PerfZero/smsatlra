import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Удаляем все записи в правильном порядке (с учетом зависимостей)
    console.log('Начинаем очистку базы данных...');

    // 1. Сначала удаляем транзакции (они ссылаются на goals и users)
    await prisma.transaction.deleteMany();
    console.log('✓ Транзакции удалены');

    // 2. Удаляем балансы (они ссылаются на users)
    await prisma.balance.deleteMany();
    console.log('✓ Балансы удалены');

    // 3. Удаляем цели (они ссылаются на relatives и users)
    await prisma.goal.deleteMany();
    console.log('✓ Цели удалены');

    // 4. Удаляем родственников (они ссылаются на users)
    await prisma.relative.deleteMany();
    console.log('✓ Родственники удалены');

    // 5. Наконец удаляем пользователей
    await prisma.user.deleteMany();
    console.log('✓ Пользователи удалены');

    console.log('База данных успешно очищена!');
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем очистку
clearDatabase(); 