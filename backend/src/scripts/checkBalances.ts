import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBalances() {
  try {
    console.log('Проверяем состояние балансов...\n');

    const balances = await prisma.balance.findMany({
      include: {
        user: {
          select: {
            name: true,
            transactions: true
          }
        }
      }
    });

    for (const balance of balances) {
      console.log(`Пользователь: ${balance.user?.name || 'Без имени'}`);
      console.log(`ID пользователя: ${balance.userId}`);
      console.log(`Баланс: ${balance.amount}`);
      console.log(`Бонусы: ${balance.bonusAmount}`);
      console.log(`Был первый депозит: ${balance.hasFirstDeposit}`);
      console.log('\nТранзакции:');
      
      const transactions = await prisma.transaction.findMany({
        where: { userId: balance.userId }
      });
      
      for (const tx of transactions) {
        console.log(`- ${tx.type}: ${tx.amount} (${tx.status}) - ${tx.description}`);
      }
      console.log('------------------------\n');
    }

  } catch (error) {
    console.error('Ошибка при проверке балансов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBalances(); 