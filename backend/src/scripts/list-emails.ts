import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    console.log('Проверка сохраненных учетных данных...');
    if (fs.existsSync(TOKEN_PATH)) {
      console.log('Токен найден, загружаем учетные данные');
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
    console.log('Токен не найден');
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
  console.log('Инициализация Gmail клиента...');
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    console.log('Используем существующий клиент');
    return google.gmail({ version: 'v1', auth: client });
  }
  console.log('Запрашиваем новую аутентификацию...');
  client = await authenticateWithBrowser();
  if (client?.credentials) {
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
  }
  console.log('Gmail клиент создан');
  return google.gmail({ version: 'v1', auth: client });
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

// Функция для получения заголовков письма в удобном формате
function getHeadersAsObject(headers: any[]) {
  const result: Record<string, string> = {};
  if (headers) {
    for (const header of headers) {
      result[header.name.toLowerCase()] = header.value;
    }
  }
  return result;
}

// Основная функция для отображения списка писем
async function listEmails() {
  try {
    console.log('Получение списка писем...');
    const gmail = await getGmailClient();
    
    // Получаем список последних 20 писем без фильтрации
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
    });

    const messages = response.data.messages || [];
    console.log(`Найдено ${messages.length} писем в ящике`);
    
    console.log('=========== СПИСОК ПИСЕМ ===========');
    
    // Обрабатываем каждое письмо
    for (const message of messages) {
      const fullMessage = await getMessage(gmail, message.id!);
      if (!fullMessage) {
        continue;
      }
      
      const headers = getHeadersAsObject(fullMessage.payload.headers);
      
      console.log('-------------------------------');
      console.log(`ID: ${message.id}`);
      console.log(`От: ${headers.from || 'Неизвестно'}`);
      console.log(`Тема: ${headers.subject || 'Без темы'}`);
      console.log(`Дата: ${headers.date || 'Неизвестно'}`);
      
      // Извлекаем фрагмент содержимого для просмотра
      let snippet = fullMessage.snippet || 'Нет содержимого';
      console.log(`Фрагмент: ${snippet}`);
    }
    
    console.log('====================================');
    
  } catch (error) {
    console.error('Ошибка при получении списка писем:', error);
  }
}

// Запускаем скрипт
console.log('Запуск скрипта для просмотра списка писем...');
listEmails(); 