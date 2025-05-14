import { Response } from 'express';
import { PrismaClient, Transaction } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  private static clients: Map<string, Response[]> = new Map();

  // Добавление нового клиента для получения уведомлений
  static addClient(userId: string, res: Response) {
    // Настройка SSE соединения
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
    
    // Добавляем клиента в список
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)?.push(res);
    
    // Обработка закрытия соединения
    res.on('close', () => {
      const userClients = this.clients.get(userId);
      if (userClients) {
        const index = userClients.indexOf(res);
        if (index !== -1) {
          userClients.splice(index, 1);
        }
        // Если у пользователя нет активных соединений, удаляем запись
        if (userClients.length === 0) {
          this.clients.delete(userId);
        }
      }
    });
  }

  // Отправка уведомления о транзакции
  static async sendTransactionNotification(userId: string, transactionId: number) {
    try {
      // Получаем данные транзакции из БД
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          user: true,
          relative: true
        }
      });

      if (!transaction) {
        console.error(`Транзакция с ID ${transactionId} не найдена`);
        return;
      }

      // Формируем данные для отправки клиенту
      const notificationData = {
        type: 'TRANSACTION',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          transactionNumber: transaction.transactionNumber,
          date: transaction.createdAt,
          iin: transaction.user.iin,
          name: transaction.user.name,
          relative: transaction.relative ? {
            id: transaction.relative.id,
            fullName: transaction.relative.fullName,
            iin: transaction.relative.iin
          } : null
        }
      };

      // Отправляем уведомление всем соединениям пользователя
      const userClients = this.clients.get(userId);
      if (userClients && userClients.length > 0) {
        userClients.forEach(client => {
          client.write(`data: ${JSON.stringify(notificationData)}\n\n`);
        });
        console.log(`Уведомление о транзакции ${transactionId} отправлено пользователю ${userId}`);
      } else {
        console.log(`Пользователь ${userId} не подключен для получения уведомлений`);
      }
    } catch (error) {
      console.error('Ошибка при отправке уведомления:', error);
    }
  }
} 