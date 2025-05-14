import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface PersonData {
  name: string;
  iin: string;
  service?: string;
  amount?: string;
  date?: string;
  paymentId?: string;
  phone?: string;
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      const oauth2Client = new OAuth2Client({
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
      });
      oauth2Client.setCredentials({
        refresh_token: credentials.refresh_token
      });
      return oauth2Client;
    }
    return null;
  } catch (err) {
    console.error('Error loading saved credentials:', err);
    return null;
  }
}

async function authenticateWithBrowser(): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).installed;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Перейдите по ссылке для авторизации:', authUrl);
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>(resolve => rl.question('Введите код с сайта: ', (answer: string) => { rl.close(); resolve(answer); }));
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

async function getGmailClient() {
  try {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return google.gmail({ version: 'v1', auth: client });
    }
    client = await authenticateWithBrowser();
    if (client?.credentials) {
      await saveCredentials(client);
    }
    return google.gmail({ version: 'v1', auth: client });
  } catch (error) {
    console.error('Ошибка при получении Gmail клиента:', error);
    throw error;
  }
}

async function saveCredentials(client: OAuth2Client) {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    fs.writeFileSync(TOKEN_PATH, payload);
  } catch (err) {
    console.error('Error saving credentials:', err);
  }
}

async function getMessage(gmail: any, messageId: string) {
  try {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return message.data;
  } catch (error) {
    console.error(`Ошибка при получении сообщения ${messageId}:`, error);
    return null;
  }
}

function decodeBase64(data: string) {
  try {
    return Buffer.from(data, 'base64').toString();
  } catch (error) {
    console.error('Ошибка при декодировании данных:', error);
    return '';
  }
}

function extractPersonData(text: string): PersonData | null {
  try {
    // Проверяем наличие ИИН/ИНН в письме
    let iinMatch = text.match(/(?:ИИН|ИНН)\s*:?\s*(\d+)/i);
    // Если не найден в стандартном формате, ищем ИИН в формате "ИИН отдыхающего:"
    if (!iinMatch) {
      iinMatch = text.match(/(?:ИИН|ИНН) отдыхающего\s*:?\s*(\d+)/i);
    }
    
    if (!iinMatch) {
      return null;
    }

    const iin = iinMatch[1].trim();
    
    // Поиск суммы платежа разными способами
    const amountMatch = text.match(/Платеж на сумму\s*:?\s*([0-9.,]+)/i);
    
    // Поиск услуги
    let serviceMatch = text.match(/Услуга\s*:?\s*([^\n,]+)/i);
    if (!serviceMatch) {
      serviceMatch = text.match(/Услуга\s*:?\s*([^,]+)/i);
    }
    
    // Поиск даты в разных форматах
    let dateMatch = text.match(/Дата\s*:?\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2})/i);
    if (!dateMatch) {
      dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2})/i);
    }
    
    // Поиск ID платежа
    let paymentIdMatch = text.match(/Идентификатор платежа\s*:?\s*(\d+)/i);
    if (!paymentIdMatch) {
      paymentIdMatch = text.match(/(?:ID|номер) платежа\s*:?\s*(\d+)/i);
    }
    
    // Поиск телефона
    const phoneMatch = text.match(/(?:телефон|тел|phone)\s*:?\s*(\+?[0-9]+)/i);
    
    // Поиск имени
    let nameMatch = text.match(/ФИО отдыхающего\s*:?\s*([^\n]+)/i);
    
    return {
      name: nameMatch ? nameMatch[1].trim() : "Не указано",
      iin: iin,
      service: serviceMatch && serviceMatch[1] ? serviceMatch[1].trim() : "Не указано",
      amount: amountMatch ? amountMatch[1].trim() : undefined,
      date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleString('ru-RU'), // Используем дату из письма, если есть
      paymentId: paymentIdMatch ? paymentIdMatch[1].trim() : `MANUAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined
    };
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

async function processSpecificEmail() {
  try {
    console.log('Обработка конкретного письма...');
    const gmail = await getGmailClient();
    
    // ID интересующего нас письма
    const messageId = '196960962ef759d4';
    
    console.log(`Получение письма с ID: ${messageId}`);
    const fullMessage = await getMessage(gmail, messageId);
    
    if (!fullMessage || !fullMessage.payload) {
      console.log('Не удалось получить письмо');
      return;
    }
    
    const payload = fullMessage.payload;
    
    // Получаем заголовки письма
    const headers = payload.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
    const from = headers.find((h: any) => h.name === 'From')?.value || '';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '';
    
    console.log(`Письмо: От=${from}, Тема=${subject}, Дата=${date}`);
    
    // Проверяем, обрабатывали ли мы уже это письмо
    const transactionExists = await prisma.transaction.findFirst({
      where: {
        description: {
          contains: messageId
        }
      }
    });
    
    if (transactionExists) {
      console.log(`Письмо с ID ${messageId} уже обработано ранее`);
      return;
    }
    
    // Извлекаем тело письма
    let emailBody = '';
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          emailBody = decodeBase64(part.body.data);
        }
      }
    } else if (payload.body && payload.body.data) {
      emailBody = decodeBase64(payload.body.data);
    }

    if (!emailBody) {
      console.log('Не удалось извлечь текст письма');
      return;
    }
    
    // Выводим содержимое для отладки
    console.log("Содержимое письма:");
    console.log("--------------------");
    console.log(emailBody);
    console.log("--------------------");

    // Извлекаем данные из текста письма
    const personData = extractPersonData(emailBody);
    if (!personData || !personData.iin || !personData.amount) {
      console.log("Не удалось извлечь данные о платеже из письма");
      return;
    }
    
    console.log(`Найдены данные платежа: ИИН=${personData.iin}, сумма=${personData.amount}, ID=${personData.paymentId}`);
    
    try {
      // Ищем пользователя по ИИН
      let user = await prisma.user.findUnique({
        where: { iin: personData.iin }
      });
      
      if (!user) {
        console.log(`Пользователь с ИИН ${personData.iin} не найден в базе`);
        
        // Создаем пользователя, если его нет
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        // Используем телефон из письма или генерируем из ИИН
        const phone = personData.phone || `7${personData.iin.substring(0, 10)}`;
        
        user = await prisma.user.create({
          data: {
            name: personData.name || "Пользователь",
            iin: personData.iin,
            phone: phone,
            password: hashedPassword,
            role: 'USER'
          }
        });
        
        console.log(`Создан новый пользователь: ИИН=${personData.iin}`);
      }
      
      // Теперь user гарантированно существует
      if (!user) {
        throw new Error("Не удалось создать пользователя");
      }
      
      // Создаем уникальный ID транзакции
      const transactionId = personData.paymentId || `MANUAL-${messageId}`;
      
      // Проверяем, существует ли уже транзакция с таким номером
      const existingTransaction = await prisma.transaction.findFirst({
        where: { 
          transactionNumber: transactionId
        }
      });

      if (existingTransaction) {
        console.log(`Транзакция с номером ${transactionId} уже существует, пропускаем`);
        return;
      }
      
      // Преобразуем сумму платежа
      const amount = parseFloat(personData.amount.replace(',', '.'));
      if (isNaN(amount)) {
        console.log(`Некорректная сумма платежа: ${personData.amount}`);
        return;
      }
      
      // Определяем дату транзакции
      let transactionDate = new Date();
      if (personData.date) {
        try {
          // Формат даты: DD.MM.YYYY HH:MM:SS
          const [datePart, timePart] = personData.date.split(' ');
          const [day, month, year] = datePart.split('.');
          const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['0', '0', '0'];
          
          transactionDate = new Date(
            parseInt(year), 
            parseInt(month) - 1, // Месяцы в JS начинаются с 0
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
          );
          
          if (isNaN(transactionDate.getTime())) {
            transactionDate = new Date();
          }
        } catch (error) {
          console.log(`Ошибка при обработке даты: ${personData.date}`);
          transactionDate = new Date();
        }
      }
      
      // Создаем транзакцию и пополняем баланс
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: amount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          description: `Платеж: ${personData.service || 'Не указано'}, ID: ${transactionId}, MessageID: ${messageId}`,
          transactionNumber: transactionId,
          createdAt: transactionDate,
          updatedAt: transactionDate
        }
      });
      
      console.log(`Создана транзакция с ID: ${transaction.id}`);
      
      // Обновляем баланс пользователя
      const balance = await prisma.balance.upsert({
        where: { userId: user.id },
        update: {
          amount: {
            increment: amount
          }
        },
        create: {
          userId: user.id,
          amount: amount
        }
      });
      
      console.log(`УСПЕШНО: Баланс пользователя с ИИН ${personData.iin} пополнен на ${amount} тг. Новый баланс: ${balance.amount}`);
    } catch (error) {
      console.error('Ошибка при обработке транзакции:', error);
    }
  } catch (error) {
    console.error('Ошибка при обработке письма:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('Запуск скрипта обработки конкретного письма...');
processSpecificEmail().then(() => {
  console.log('Обработка письма завершена');
}); 