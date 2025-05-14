import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MockGmailService {
  static async getGmailClient() {
    console.log('Использую мок-клиент для Gmail API (без аутентификации)');
    
    // Возвращаем мок-объект с необходимыми методами
    return {
      users: {
        messages: {
          list: async () => {
            return { data: { messages: [] } };
          },
          get: async () => {
            return { data: { } };
          }
        },
        getProfile: async () => {
          return { data: { emailAddress: 'mock@example.com' } };
        }
      }
    };
  }
} 