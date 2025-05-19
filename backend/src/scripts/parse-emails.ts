import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { SmsService } from '../services/sms.service';

const prisma = new PrismaClient();
const smsService = new SmsService();

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

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Путь к файлу с временной меткой последней проверки
const LAST_CHECK_PATH = path.join(process.cwd(), 'last_email_check.json');

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
    const key = keys.web; // Используем только web, так как у нас веб-приложение
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

// Сохранение временной метки последней проверки
async function saveLastCheckTime(timestamp: number) {
  try {
    fs.writeFileSync(LAST_CHECK_PATH, JSON.stringify({ lastCheck: timestamp }));
  } catch (error) {
    console.error('Ошибка при сохранении временной метки:', error);
  }
}

// Загрузка временной метки последней проверки
function getLastCheckTime(): number {
  try {
    if (fs.existsSync(LAST_CHECK_PATH)) {
      const data = JSON.parse(fs.readFileSync(LAST_CHECK_PATH, 'utf-8'));
      return data.lastCheck;
    }
  } catch (error) {
    console.error('Ошибка при загрузке временной метки:', error);
  }
  
  // Если файла нет или была ошибка, возвращаем текущее время минус 1 час
  // (для первого запуска, чтобы не проверять слишком старые письма)
  const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
  console.log('Используем временную метку час назад (первый запуск)');
  return oneHourAgo;
}

// Преобразование timestamp в формат для запроса к Gmail API (YYYY/MM/DD)
function formatDateForGmail(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const processAll = args.includes('--all');

async function processEmailData(personData: PersonData) {
  try {
    if (!personData.phone || !personData.amount) {
      console.log('Недостаточно данных для отправки SMS');
      return;
    }

    // Форматируем сумму для красивого отображения
    const formattedAmount = parseFloat(personData.amount).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Формируем текст сообщения
    const message = `Ваш счет успешно пополнен на ${formattedAmount} тг. Спасибо что выбрали Atlas Save!`;
    
    // Отправляем SMS
    const smsSent = await smsService.sendSms(personData.phone, message);
    
    if (smsSent) {
      console.log(`SMS отправлено на номер ${personData.phone}`);
    } else {
      console.error(`Ошибка отправки SMS на номер ${personData.phone}`);
    }
  } catch (error) {
    console.error('Ошибка при обработке данных и отправке SMS:', error);
  }
}

// Добавляем новую функцию для обработки целей
async function processGoalUpdate(userId: number, amount: number, payerIin: string, recipientIin: string) {
  try {
    // Проверяем, совпадают ли ИИН плательщика и получателя
    const isSelfPayment = payerIin === recipientIin;

    if (isSelfPayment) {
      // Ищем личную цель пользователя
      const personalGoal = await prisma.goal.findFirst({
        where: {
          userId: userId,
          relativeId: null
        }
      });

      if (personalGoal) {
        // Обновляем личную цель
        await prisma.goal.update({
          where: { id: personalGoal.id },
          data: {
            currentAmount: {
              increment: amount
            }
          }
        });
        console.log(`Обновлена личная цель пользователя. Текущая сумма увеличена на ${amount}`);
      }
    } else {
      // Ищем цель для родственника по ИИН получателя
      const relative = await prisma.relative.findUnique({
        where: { iin: recipientIin },
        include: {
          goals: {
            where: {
              userId: userId
            }
          }
        }
      });

      if (relative && relative.goals.length > 0) {
        // Обновляем цель родственника
        const relativeGoal = relative.goals[0]; // Берем первую цель, если их несколько
        await prisma.goal.update({
          where: { id: relativeGoal.id },
          data: {
            currentAmount: {
              increment: amount
            }
          }
        });
        console.log(`Обновлена цель родственника ${relative.fullName}. Текущая сумма увеличена на ${amount}`);
      } else {
        console.log(`Не найдена цель для родственника с ИИН ${recipientIin}`);
      }
    }
  } catch (error) {
    console.error('Ошибка при обновлении цели:', error);
  }
}

// Экспортируем функцию parseEmails для использования в других модулях
export async function parseEmails() {
  try {
    console.log('Проверка почты...');
    
    let gmail;
    try {
      gmail = await getGmailClient();
    } catch (error) {
      const authError = error as Error;
      console.error('Ошибка аутентификации Gmail, пропускаем проверку писем:', authError.message);
      return; // Прерываем функцию, но не блокируем сервер
    }
    
    // Если gmail равен null, прекращаем выполнение
    if (!gmail) {
      console.error('Не удалось получить Gmail клиент');
      return;
    }
    
    // Получаем только последние 2 письма от нужных отправителей
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:kaspi.payments@kaspibank.kz OR from:zorden2020@gmail.com OR from:rewqwsa',
      maxResults: 2
    });

    const messages = response.data.messages || [];
    console.log(`Найдено ${messages.length} писем для обработки`);
    
    // Теперь обрабатываем письма, пропуская только те, что уже обработаны
    let processedCount = 0;
    
    for (const message of messages) {
      // Сначала проверяем, обрабатывали ли мы уже это письмо
      const messageIdSafe = message.id || 'unknown';
      const transactionExists = await prisma.transaction.findFirst({
        where: {
          description: {
            contains: messageIdSafe
          }
        }
      });
      
      if (transactionExists) {
        // Пропускаем уже обработанные письма
        continue;
      }
      
      const fullMessage = await getMessage(gmail, message.id!);
      if (!fullMessage || !fullMessage.payload) continue;
      
      const payload = fullMessage.payload;
      
      // Получаем заголовки письма
      const headers = payload.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      
      // Проверяем, что это релевантное письмо
      if (!from.includes('zorden2020@gmail.com') && !from.includes('rewqwsa') && !from.includes('kaspi.payments@kaspibank.kz')) {
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
        continue;
      }

      // Извлекаем данные из текста письма
      const personData = extractPersonData(emailBody);
      if (!personData || !personData.iin) {
        console.log("Не удалось извлечь данные о платеже из письма");
        continue;
      }
      
      console.log(`Обработка нового письма: ID=${messageIdSafe}, От=${from}, Тема=${subject}`);
      console.log(`Данные платежа: ИИН=${personData.iin}, сумма=${personData.amount || 'не определена'}`);
      
      if (!personData.amount) {
        console.log("Не найдена сумма платежа в письме");
        continue;
      }
      
      try {
        // Ищем пользователя (владельца аккаунта) по ИИН отдыхающего
        const user = await prisma.user.findUnique({
          where: { iin: personData.recipientIin }
        });

        if (!user) {
          console.log(`Пользователь с ИИН ${personData.recipientIin} не найден`);
          continue;
        }

        // Создаем уникальный ID транзакции
        const transactionId = personData.paymentId && personData.paymentId !== '99999999999999999' ? personData.paymentId : `MANUAL-${messageIdSafe}`;
        
        // Проверяем, существует ли уже транзакция с таким номером
        const existingTransaction = await prisma.transaction.findFirst({
          where: { 
            transactionNumber: transactionId
          }
        });

        if (existingTransaction) {
          console.log(`Транзакция с номером ${transactionId} уже существует`);
          continue;
        }
        
        // Преобразуем сумму платежа
        const amount = parseFloat(personData.amount.replace(',', '.'));
        if (isNaN(amount)) {
          console.log(`Некорректная сумма платежа: ${personData.amount}`);
          continue;
        }
        
        // Определяем дату транзакции
        let transactionDate = new Date();
        if (personData.date) {
          try {
            const [datePart, timePart] = personData.date.split(' ');
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
              transactionDate = new Date();
            }
          } catch (error) {
            transactionDate = new Date();
          }
        }
        
        // Ищем родственника по ИИН из поля ЖСН|ИИН|ИИН
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
        
        // Проверяем, является ли это самостоятельным пополнением
        if (personData.payerIin === personData.recipientIin) {
          // Ищем личную цель пользователя
          targetGoal = await prisma.goal.findFirst({
            where: {
              userId: user.id,
              relativeId: null  // Личная цель не привязана к родственнику
            }
          });
        } else if (relative && relative.goals.length > 0) {
          // Если это пополнение от родственника, используем его цель
          targetGoal = relative.goals[0];
        }

        // Формируем описание транзакции
        let transactionDescription = '';
        if (personData.payerIin === personData.recipientIin) {
          transactionDescription = `Самостоятельное пополнение (${personData.payerIin})`;
        } else if (relative) {
          transactionDescription = `Пополнение от родственника: ${relative.fullName || 'Неизвестно'} (${personData.payerIin}) для ${user.name || 'пользователя'} (${personData.recipientIin})`;
        } else {
          transactionDescription = `Пополнение от: ${personData.payerIin} для ${user.name || 'пользователя'} (${personData.recipientIin})`;
        }

        // Если это не самостоятельное пополнение и не найден relative с целью — пропускаем
        if (personData.payerIin !== personData.recipientIin && (!relative || !relative.goals || relative.goals.length === 0)) {
          console.log(`Родственник с ИИН ${personData.payerIin} и его цель не найдены у пользователя ${user.iin}, пополнение не производится`);
          continue;
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
            relativeId: relative?.id || null,
            goalId: targetGoal?.id || null,
            createdAt: transactionDate,
            updatedAt: transactionDate
          }
        });

        // Обновляем баланс пользователя только если это самостоятельное пополнение
        if (personData.payerIin === personData.recipientIin) {
          const balance = await prisma.balance.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              amount: amount,
              bonusAmount: 0,
              hasFirstDeposit: false
            },
            update: {
              amount: {
                increment: amount
              }
            }
          });

          // Проверяем, нужно ли начислить бонус (только один раз)
          if (!balance.hasFirstDeposit) {
            const completedTxCount = await prisma.transaction.count({
              where: {
                userId: user.id,
                status: 'COMPLETED'
              }
            });
            if (completedTxCount > 0) {
              const BONUS_AMOUNT = 10000;
              await prisma.balance.update({
                where: { userId: user.id },
                data: {
                  amount: { increment: BONUS_AMOUNT },
                  bonusAmount: { increment: BONUS_AMOUNT },
                  hasFirstDeposit: true
                }
              });
              console.log(`Бонус ${BONUS_AMOUNT} начислен пользователю с userId=${user.id}`);
            }
          }
        }

        // Если есть цель, обновляем её
        if (targetGoal) {
          await prisma.goal.update({
            where: { id: targetGoal.id },
            data: {
              currentAmount: {
                increment: amount
              }
            }
          });
          if (relative && relative.fullName) {
            console.log(`Обновлена цель родственника ${relative.fullName}. Текущая сумма увеличена на ${amount}`);
          } else {
            console.log(`Обновлена цель. Текущая сумма увеличена на ${amount}`);
          }
        } else {
          console.log(`Транзакция создана без привязки к цели`);
        }

        // Отправляем уведомление
        try {
          const { NotificationService } = require('../services/notification.service');
          await NotificationService.sendTransactionNotification(user.id.toString(), newTransaction.id);
        } catch (notifyError) {
          console.error('Ошибка при отправке уведомления:', notifyError);
        }

        // Обновляем ФИО, если оно отличается
        if (personData.name && user.name !== personData.name) {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: personData.name }
          });
          console.log(`ФИО пользователя обновлено: ${user.name} → ${personData.name}`);
        }

        await processEmailData(personData);
      } catch (error) {
        console.error('Ошибка при обработке транзакции:', error);
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке почты:', error);
  } finally {
    // Обновляем временную метку после каждой проверки, независимо от результата
    await saveLastCheckTime(Date.now());
    console.log(`Временная метка обновлена: ${new Date().toLocaleString()}`);
    await prisma.$disconnect();
  }
}

// Если скрипт запущен напрямую, выполняем одну проверку
if (require.main === module) {
  parseEmails().then(() => {
    console.log('Проверка писем завершена');
    process.exit(0);
  }).catch(error => {
    console.error('Ошибка при выполнении проверки:', error);
    process.exit(1);
  });
} 