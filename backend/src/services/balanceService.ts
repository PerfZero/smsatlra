import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FIRST_DEPOSIT_BONUS = 10000; // Бонус за первое пополнение в баллах

// Функция для генерации номера транзакции
export const generateTransactionNumber = async (suffix?: string) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Получаем количество транзакций за сегодня
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const todayTransactions = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd
      }
    }
  });
  
  // Генерируем порядковый номер (4 цифры с ведущими нулями)
  const sequence = (todayTransactions + 1).toString().padStart(4, '0');
  
  // Формат: ГГММДД-XXXX-SUFFIX (где XXXX - порядковый номер за день)
  return `${year}${month}${day}-${sequence}${suffix ? `-${suffix}` : ''}`;
};

export const balanceService = {
  // Получить баланс пользователя
  getBalance: async (userId: number) => {
    return prisma.balance.findUnique({
      where: { userId }
    });
  },

  // Пополнить баланс
  deposit: async (userId: number, amount: number, goalId?: number) => {
    // Начинаем транзакцию
    return prisma.$transaction(async (tx) => {
      // Проверяем, было ли уже пополнение (депозит)
      const firstDepositExists = await tx.transaction.findFirst({
        where: {
          userId,
          type: 'DEPOSIT',
          status: 'COMPLETED'
        }
      });
      const isFirstDeposit = !firstDepositExists;
      const currentBalance = await tx.balance.findUnique({
        where: { userId },
        select: { hasFirstDeposit: true, bonusAmount: true }
      });
      let targetGoal = null;
      if (goalId) {
        targetGoal = await tx.goal.findUnique({
          where: { id: goalId },
          include: { relative: true }
        });
        if (!targetGoal) {
          throw new Error('Цель не найдена');
        }
      } else {
        // Если goalId не указан, проверяем наличие личной цели
        targetGoal = await tx.goal.findFirst({
          where: {
            userId,
            relativeId: null // личная цель не имеет привязки к родственнику
          }
        });
        if (targetGoal) {
          goalId = targetGoal.id;
        }
      }
      // Генерируем номер транзакции
      const transactionNumber = await generateTransactionNumber();
      // Создаем запись о транзакции для денег
      const transaction = await tx.transaction.create({
        data: {
          userId,
          transactionNumber,
          amount,
          type: 'DEPOSIT',
          status: 'PENDING',
          description: goalId ? 'Пополнение цели' : 'Пополнение баланса',
          goalId: goalId || null
        }
      });
      let updatedBalance;
      if (isFirstDeposit) {
        // При первом пополнении начисляем бонус и выставляем hasFirstDeposit
        updatedBalance = await tx.balance.upsert({
          where: { userId },
          create: {
            userId,
            amount: amount + FIRST_DEPOSIT_BONUS,
            bonusAmount: FIRST_DEPOSIT_BONUS,
            hasFirstDeposit: true
          },
          update: {
            amount: { increment: amount + FIRST_DEPOSIT_BONUS },
            bonusAmount: (currentBalance?.bonusAmount || 0) + FIRST_DEPOSIT_BONUS,
            hasFirstDeposit: true
          }
        });
      } else {
        // Обычное пополнение
        updatedBalance = await tx.balance.update({
          where: { userId },
          data: {
            amount: { increment: amount }
          }
        });
      }
      // Если есть goalId, обновляем прогресс цели
      if (goalId) {
        await tx.goal.update({
          where: { id: goalId },
          data: {
            currentAmount: { increment: amount }
          }
        });
      }
      // Помечаем основную транзакцию как завершенную
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' }
      });
      // Получаем обновленную цель, если она была указана или найдена
      const updatedGoal = goalId ? await tx.goal.findUnique({
        where: { id: goalId },
        select: {
          currentAmount: true,
          targetAmount: true,
          relative: {
            select: {
              fullName: true
            }
          }
        }
      }) : null;
      return {
        balance: updatedBalance,
        isFirstDeposit,
        transaction: {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber,
          amount,
          bonus: isFirstDeposit ? FIRST_DEPOSIT_BONUS : 0,
          goal: updatedGoal ? {
            currentAmount: updatedGoal.currentAmount,
            targetAmount: updatedGoal.targetAmount,
            relativeName: updatedGoal.relative?.fullName
          } : null
        }
      };
    });
  }
};