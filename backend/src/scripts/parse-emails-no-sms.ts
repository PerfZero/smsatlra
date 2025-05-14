import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

const prisma = new PrismaClient();

interface PersonData {
  name: string;
  iin: string;
  service?: string;
  amount?: string;
  date?: string;
  paymentId?: string;
  phone?: string;
  payerIin?: string;    // ИИН из поля ЖСН|ИИН|ИИН
  recipientIin?: string; // ИИН из поля ИИН отдыхающего
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const TOKEN_PATH = path.join(__dirname, '../../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      const credentialsContent = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
      const redirectUri = credentialsContent.web.redirect_uris[0];
      
      const oauth2Client = new OAuth2Client({
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
        redirectUri: redirectUri
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

async function saveCredentials(client: OAuth2Client) {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.web;
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

async function authenticateWithBrowser(): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).web;
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
    // Сначала ищем ИИН в формате Kaspi (ЖСН|ИИН|ИИН)
    const kaspiIinMatch = text.match(/ЖСН\|ИИН\|ИИН\s*=\s*(\d+)/i);
    
    // Ищем ИИН отдыхающего
    const guestIinMatch = text.match(/(?:ИИН|ИНН) отдыхающего\s*:?\s*(\d+)/i);
    
    // Если нет ни одного ИИН, возвращаем null
    if (!kaspiIinMatch && !guestIinMatch) {
      console.log("ИИН не найден в письме");
      return null;
    }

    // Приоритет отдаем ИИН из поля ЖСН|ИИН|ИИН
    const iin = kaspiIinMatch ? kaspiIinMatch[1].trim() : guestIinMatch![1].trim();
    
    // Если найдены оба ИИН и они разные, логируем это
    if (kaspiIinMatch && guestIinMatch && kaspiIinMatch[1].trim() !== guestIinMatch[1].trim()) {
      console.log(`Обнаружены разные ИИН в письме: ЖСН|ИИН|ИИН=${kaspiIinMatch[1].trim()}, ИИН отдыхающего=${guestIinMatch[1].trim()}`);
      console.log("Используется ИИН из поля ЖСН|ИИН|ИИН");
    }
    
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
    
    // Поиск имени
    let nameMatch = text.match(/ФИО отдыхающего\s*:?\s*([^\n]+)/i);
    
    return {
      name: nameMatch ? nameMatch[1].trim() : "Не указано",
      iin: iin,
      service: serviceMatch && serviceMatch[1] ? serviceMatch[1].trim() : "Не указано",
      amount: amountMatch ? amountMatch[1].trim() : undefined,
      date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleString('ru-RU'),
      paymentId: paymentIdMatch ? paymentIdMatch[1].trim() : `MANUAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined,
      payerIin: kaspiIinMatch ? kaspiIinMatch[1].trim() : iin,
      recipientIin: guestIinMatch ? guestIinMatch[1].trim() : iin
    };
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

async function parseEmails() {
  try {
    console.log('Проверка почты...');
    
    let gmail;
    try {
      gmail = await getGmailClient();
    } catch (error) {
      const authError = error as Error;
      console.error('Ошибка аутентификации Gmail, пропускаем проверку писем:', authError.message);
      return;
    }
    
    if (!gmail) {
      console.error('Не удалось получить Gmail клиент');
      return;
    }
    
    // Получаем все письма от обоих отправителей
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:kaspi.payments@kaspibank.kz OR from:zorden2020@gmail.com OR from:rewqwsa@gmail.com',
      maxResults: 500
    });

    const messages = response.data.messages || [];
    console.log(`Найдено ${messages.length} писем для обработки`);
    
    for (const message of messages) {
      const messageIdSafe = message.id || 'unknown';
      
      // Проверяем, существует ли уже транзакция с этим ID письма
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          description: {
            contains: messageIdSafe
          }
        }
      });

      if (existingTransaction) {
        console.log(`Письмо ${messageIdSafe} уже обработано`);
        continue;
      }

      const fullMessage = await getMessage(gmail, message.id!);
      if (!fullMessage || !fullMessage.payload) continue;

      const payload = fullMessage.payload;
      const headers = payload.headers || [];
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';

      console.log(`Обработка письма от: ${from}`);
      console.log(`Тема: ${subject}`);

      let emailBody = '';
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            emailBody += decodeBase64(part.body.data);
          }
        }
      } else if (payload.body?.data) {
        emailBody = decodeBase64(payload.body.data);
      }

      console.log('Содержимое письма:', emailBody);

      const personData = extractPersonData(emailBody);
      if (!personData || !personData.iin || !personData.amount) {
        console.log("Не удалось извлечь данные о платеже из письма");
        continue;
      }

      // Логируем найденную дату
      console.log('Найденная дата из письма:', personData.date);

      // Определяем дату транзакции заранее, чтобы использовать и при обновлении, и при создании
      let transactionDate = new Date();
      if (personData.date) {
        try {
          // Поддержка как пробела, так и запятой между датой и временем
          let dateTimeStr = personData.date.replace(',', ' ').replace(/\s+/, ' ').trim();
          const [datePart, timePart] = dateTimeStr.split(' ');
          const [day, month, year] = datePart.split('.');
          const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['0', '0', '0'];

          transactionDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
          );

          if (isNaN(transactionDate.getTime())) {
            console.log('Не удалось распарсить дату, используется текущая:', personData.date);
            transactionDate = new Date();
          }
        } catch (error) {
          console.log('Ошибка при разборе даты, используется текущая:', personData.date);
          transactionDate = new Date();
        }
      } else {
        console.log('Дата не найдена, используется текущая');
      }

      try {
        // Ищем пользователя по ИИН получателя
        const user = await prisma.user.findUnique({
          where: { iin: personData.recipientIin }
        });

        if (!user) {
          console.log(`Пользователь с ИИН ${personData.recipientIin} не найден`);
          continue;
        }

        // Обновляем имя пользователя, если оно отличается от ФИО из письма
        if (user && personData.name && user.name !== personData.name) {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: personData.name }
          });
          console.log(`Имя пользователя с ИИН ${user.iin} обновлено на: ${personData.name}`);
        }

        // Обновляем телефон пользователя, если он отличается от телефона из письма
        if (user && personData.phone && user.phone !== personData.phone) {
          await prisma.user.update({
            where: { id: user.id },
            data: { phone: personData.phone }
          });
          console.log(`Телефон пользователя с ИИН ${user.iin} обновлён на: ${personData.phone}`);
        }

        // Создаем уникальный ID транзакции
        const transactionId = personData.paymentId || `MANUAL-${messageIdSafe}`;

        // Проверяем существование транзакции
        const existingTransactionById = await prisma.transaction.findFirst({
          where: { transactionNumber: transactionId }
        });

        if (existingTransactionById) {
          console.log(`Транзакция с номером ${transactionId} уже существует, обновляю дату и ФИО`);

          // Формируем новое описание с ФИО, если его там нет
          let newDescription = existingTransactionById.description || '';
          if (personData.name && !newDescription.includes(personData.name)) {
            newDescription = `${personData.name} | ${newDescription}`;
          }

          await prisma.transaction.update({
            where: { id: existingTransactionById.id },
            data: {
              createdAt: transactionDate,
              description: newDescription
            }
          });

          continue;
        }

        const amount = parseFloat(personData.amount.replace(',', '.'));
        if (isNaN(amount)) {
          console.log(`Некорректная сумма платежа: ${personData.amount}`);
          continue;
        }

        // Ищем родственника
        const relative = await prisma.relative.findFirst({
          where: { 
            iin: personData.payerIin,
            userId: user.id
          },
          include: {
            goals: true
          }
        });

        // Определяем цель для обновления
        let targetGoal = null;
        if (relative && relative.goals.length > 0) {
          targetGoal = relative.goals[0];
        }

        // Формируем описание транзакции
        let transactionDescription = '';
        if (personData.payerIin === personData.recipientIin) {
          transactionDescription = `Самостоятельное пополнение (${personData.payerIin}). Email ID: ${messageIdSafe}`;
        } else if (relative) {
          transactionDescription = `Пополнение от родственника: ${relative.fullName} (${personData.payerIin}) для ${user.name || 'пользователя'} (${personData.recipientIin}). Email ID: ${messageIdSafe}`;
        } else {
          transactionDescription = `Пополнение от: ${personData.payerIin} для ${user.name || 'пользователя'} (${personData.recipientIin}). Email ID: ${messageIdSafe}`;
        }

        // Создаем транзакцию
        const newTransaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            amount: amount,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: transactionDescription,
            transactionNumber: transactionId,
            goalId: targetGoal?.id || null,
            createdAt: transactionDate,
            updatedAt: transactionDate
          }
        });

        // Обновляем цель, если она есть
        if (targetGoal) {
          await prisma.goal.update({
            where: { id: targetGoal.id },
            data: {
              currentAmount: {
                increment: amount
              }
            }
          });
          console.log(`Обновлена цель родственника ${relative!.fullName}. Текущая сумма увеличена на ${amount}`);
        }

        console.log(`Создана новая транзакция: ${newTransaction.id} (${transactionId})`);

      } catch (error) {
        console.error('Ошибка при обработке транзакции:', error);
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке почты:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  parseEmails().then(() => {
    console.log('Проверка писем завершена');
    process.exit(0);
  }).catch(error => {
    console.error('Ошибка при выполнении проверки:', error);
    process.exit(1);
  });
} 