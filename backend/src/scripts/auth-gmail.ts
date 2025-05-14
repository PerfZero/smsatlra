import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import * as path from 'path';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

// Скрипт для однократной аутентификации в Gmail API
// Запускается отдельно от основного приложения

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function saveCredentials(client: OAuth2Client) {
  try {
    console.log('Сохранение учетных данных...');
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
    console.log('Учетные данные сохранены в token.json');
  } catch (err) {
    console.error('Ошибка при сохранении учетных данных:', err);
  }
}

async function loadSavedCredentialsIfExist() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      const oauth2Client = new OAuth2Client({
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret
      });
      oauth2Client.setCredentials({
        refresh_token: credentials.refresh_token
      });
      return oauth2Client;
    }
    return null;
  } catch (err) {
    console.error('Ошибка при загрузке сохраненных учетных данных:', err);
    return null;
  }
}

async function authGmail() {
  try {
    console.log('Запускаем процесс аутентификации в Gmail API...');
    
    // Проверяем наличие сохраненных учетных данных
    let client = await loadSavedCredentialsIfExist();
    
    if (!client) {
      // Если сохраненных учетных данных нет, запускаем процесс аутентификации
      client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH
      });
      
      if (client.credentials) {
        await saveCredentials(client);
      }
    }

    // Проверяем, что авторизация работает
    const gmail = google.gmail({ version: 'v1', auth: client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log(`\nУспешно подключились к Gmail аккаунту: ${profile.data.emailAddress}`);
    
  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
  }
}

// Запускаем аутентификацию
authGmail(); 