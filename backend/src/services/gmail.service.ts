import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function authenticateWithBrowser(scopes: string[], credentialsPath: string, tokenPath: string): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8')).installed;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log('Перейдите по ссылке для авторизации:', authUrl);
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>(resolve => rl.question('Введите код с сайта: ', (answer: string) => { rl.close(); resolve(answer); }));
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  // Сохраняем токен
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id,
    client_secret,
    refresh_token: tokens.refresh_token,
  });
  fs.writeFileSync(tokenPath, payload);
  return oAuth2Client;
}

export class GmailService {
  private static SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
  private static CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
  private static TOKEN_PATH = path.join(process.cwd(), 'token.json');

  private auth: any;

  async initialize() {
    try {
      // Если есть сохранённый токен, используем его
      if (fs.existsSync(GmailService.TOKEN_PATH)) {
        const content = fs.readFileSync(GmailService.TOKEN_PATH, 'utf-8');
        const credentials = JSON.parse(content);
        const client = new OAuth2Client(credentials.client_id, credentials.client_secret, 'urn:ietf:wg:oauth:2.0:oob');
        client.setCredentials({ refresh_token: credentials.refresh_token });
        this.auth = client;
      } else {
        this.auth = await authenticateWithBrowser(GmailService.SCOPES, GmailService.CREDENTIALS_PATH, GmailService.TOKEN_PATH);
      }
      return true;
    } catch (error) {
      console.error('Error initializing Gmail service:', error);
      return false;
    }
  }

  async fetchKaspiEmails() {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.auth });
      
      // Поиск писем от Kaspi Bank за последние 24 часа
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: `from:kaspi.payments@kaspibank.kz after:${yesterday.getTime() / 1000}`,
      });

      const messages = response.data.messages || [];
      
      for (const message of messages) {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const content = this.decodeEmailContent(email);
        const { fullName, iin } = this.parseKaspiEmail(content);

        if (fullName && iin) {
          await this.saveToDatabase(fullName, iin);
        }
      }

      return true;
    } catch (error) {
      console.error('Error fetching Kaspi emails:', error);
      return false;
    }
  }

  private decodeEmailContent(email: any): string {
    const parts = email.data.payload.parts;
    let content = '';

    if (parts) {
      for (const part of parts) {
        if (part.mimeType === 'text/plain') {
          content = Buffer.from(part.body.data, 'base64').toString();
          break;
        }
      }
    }

    return content;
  }

  private parseKaspiEmail(content: string): { fullName: string | null; iin: string | null } {
    const fullNameMatch = content.match(/ФИО отдыхающего: ([^\n]+)/);
    const iinMatch = content.match(/ИИН отдыхающего: (\d{12})/);

    return {
      fullName: fullNameMatch ? fullNameMatch[1].trim() : null,
      iin: iinMatch ? iinMatch[1] : null,
    };
  }

  private async saveToDatabase(fullName: string, iin: string) {
    try {
      // Проверяем, существует ли пользователь с таким ИИН
      const existingUser = await prisma.user.findUnique({
        where: { iin }
      });

      if (existingUser) {
        // Если пользователь существует, обновляем его имя
        await prisma.user.update({
          where: { iin },
          data: { name: fullName }
        });
      } else {
        // Если пользователь не существует, проверяем есть ли он в родственниках
        const existingRelative = await prisma.relative.findUnique({
          where: { iin }
        });

        if (!existingRelative) {
          // Если нет в родственниках, создаем запись в таблице Relative
          // Привязываем к администратору системы (ID=1)
          await prisma.relative.create({
            data: {
              fullName,
              iin,
              userId: 1 // ID администратора системы
            }
          });
        }
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }
}