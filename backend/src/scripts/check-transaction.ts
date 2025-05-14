import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransaction() {
  try {
    // Проверяем все транзакции
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('Последние 10 транзакций:');
    transactions.forEach(tx => {
      console.log(`ID: ${tx.id}, Сумма: ${tx.amount}, Номер: ${tx.transactionNumber}, Дата: ${tx.createdAt.toLocaleString()}`);
    });
    
    // Проверяем конкретную транзакцию
    const specificTransaction = await prisma.transaction.findFirst({
      where: {
        transactionNumber: '11113119899'
      }
    });

    if (specificTransaction) {
      console.log('\nНайдена транзакция с номером 11113119899:');
      console.log(`ID: ${specificTransaction.id}, Сумма: ${specificTransaction.amount}, Дата: ${specificTransaction.createdAt.toLocaleString()}`);
    } else {
      console.log('\nТранзакция с номером 11113119899 НЕ найдена');
    }
  } catch (error) {
    console.error('Ошибка при проверке транзакций:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('Проверка транзакций...');
checkTransaction().then(() => {
  console.log('Проверка завершена');
}); 