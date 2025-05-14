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
    console.error('Ошибка при загрузке учетных данных:', err);
    return null;
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
    console.error('Ошибка при сохранении учетных данных:', err);
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
    // Ищем в формате Kaspi
    if (!iinMatch) {
      iinMatch = text.match(/ЖСН\|ИИН\|ИИН\s*=\s*(\d+)/i);
    }
    
    if (!iinMatch) {
      return null;
    }

    const iin = iinMatch[1].trim();
    
    // Поиск ФИО отдыхающего
    let nameMatch = text.match(/ФИО отдыхающего\s*:?\s*([^\n]+)/i);
    
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
    let phoneMatch = text.match(/(?:телефон|тел|phone)\s*:?\s*(\+?[0-9]+)/i);
    // Поиск телефона в формате Kaspi
    if (!phoneMatch) {
      phoneMatch = text.match(/Телефон нөмірі\|Номер телефона\s*=\s*(\d+)/i);
    }
    
    return {
      name: nameMatch ? nameMatch[1].trim() : "Не указано",
      iin: iin,
      service: serviceMatch && serviceMatch[1] ? serviceMatch[1].trim() : "Не указано",
      amount: amountMatch ? amountMatch[1].trim() : undefined,
      date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleString('ru-RU'),
      paymentId: paymentIdMatch ? paymentIdMatch[1].trim() : `MANUAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined
    };
  } catch (error) {
    console.error('Ошибка при извлечении данных:', error);
    return null;
  }
}

async function updateUserInfoFromEmail(personData: PersonData): Promise<boolean> {
  try {
    // Проверяем, существует ли пользователь с таким ИИН
    let user = await prisma.user.findUnique({
      where: { iin: personData.iin }
    });
    
    if (user) {
      console.log(`Найден пользователь с ИИН ${personData.iin}`);
      
      // Обновляем имя пользователя, если оно не указано
      if (personData.name !== "Не указано" && (user.name === "Не указано" || user.name === "Пользователь")) {
        const updatedUser = await prisma.user.update({
          where: { iin: personData.iin },
          data: { 
            name: personData.name,
            phone: personData.phone || user.phone
          }
        });
        
        console.log(`Обновлено имя пользователя с ИИН ${personData.iin} на "${updatedUser.name}"`);
        return true;
      } else {
        console.log(`Обновление не требуется для пользователя с ИИН ${personData.iin}`);
        return false;
      }
    } else {
      // Создаем нового пользователя
      console.log(`Создаем нового пользователя с ИИН ${personData.iin}`);
      
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const newUser = await prisma.user.create({
        data: {
          name: personData.name,
          iin: personData.iin,
          phone: personData.phone || `7${personData.iin.substring(0, 10)}`,
          password: hashedPassword,
          role: 'USER'
        }
      });
      
      console.log(`Создан новый пользователь с ИИН ${personData.iin}, имя: "${newUser.name}"`);
      return true;
    }
  } catch (error) {
    console.error('Ошибка при обновлении/создании пользователя:', error);
    return false;
  }
}

async function processAllEmails() {
  try {
    console.log('Инициализация Gmail клиента...');
    const gmail = await getGmailClient();
    
    // Используем запрос для поиска писем от нужных отправителей
    const query = `from:zorden2020@gmail.com OR from:rewqwsa OR from:kaspi.payments@kaspibank.kz`;
    
    console.log(`Поиск писем по запросу: ${query}`);
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100, // Увеличим до 100 писем для большего охвата
    });
    
    const messages = response.data.messages || [];
    
    if (!messages || messages.length === 0) {
      console.log('Письма не найдены');
      return;
    }
    
    console.log(`Найдено ${messages.length} писем для обработки`);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const message of messages) {
      console.log(`\nОбработка письма ${++processedCount}/${messages.length}, ID: ${message.id}`);
      
      const fullMessage = await getMessage(gmail, message.id!);
      if (!fullMessage || !fullMessage.payload) {
        console.log('Не удалось получить данные письма, пропускаем');
        continue;
      }
      
      const payload = fullMessage.payload;
      
      // Получаем заголовки письма
      const headers = payload.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      
      console.log(`От: ${from}`);
      console.log(`Тема: ${subject}`);
      
      // Проверяем, что это релевантное письмо
      if (!from.includes('zorden2020@gmail.com') && !from.includes('rewqwsa') && !from.includes('kaspi.payments@kaspibank.kz')) {
        console.log('Письмо не от нужного отправителя, пропускаем');
        continue;
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
        console.log('Не удалось извлечь содержимое письма, пропускаем');
        continue;
      }

      // Извлекаем данные из текста письма
      const personData = extractPersonData(emailBody);
      if (!personData || !personData.iin) {
        console.log('Не удалось извлечь данные о платеже из письма, пропускаем');
        continue;
      }
      
      console.log(`Найдены данные: ИИН=${personData.iin}, ФИО=${personData.name}`);
      
      // Обновляем информацию о пользователе
      const updated = await updateUserInfoFromEmail(personData);
      if (updated) {
        updatedCount++;
      }
    }
    
    console.log(`\nОбработка завершена. Обработано писем: ${processedCount}, обновлено/создано пользователей: ${updatedCount}`);
    
  } catch (error) {
    console.error('Ошибка при обработке писем:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем обработку всех писем
console.log('Запуск обработки всех писем...');
processAllEmails().then(() => {
  console.log('\nСкрипт завершен.');
}); 