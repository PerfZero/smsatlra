import * as fs from 'fs';
import * as path from 'path';

// Путь к файлу с временной меткой
const LAST_CHECK_PATH = path.join(process.cwd(), 'last_email_check.json');

// Устанавливаем метку на час назад
const oneHourAgo = Date.now() - (60 * 60 * 1000);
fs.writeFileSync(LAST_CHECK_PATH, JSON.stringify({ lastCheck: oneHourAgo }));

console.log(`Временная метка установлена на час назад: ${new Date(oneHourAgo).toLocaleString()}`); 