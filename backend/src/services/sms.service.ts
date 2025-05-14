import axios from 'axios';

interface SmsSendResponse {
  id?: string;
  error?: string;
}

export class SmsService {
  private readonly login: string = 'SattilyBro';
  private readonly password: string = 'pswForSmsc1!';
  private readonly baseUrl: string = 'https://smsc.kz/sys/send.php';

  async sendSms(phone: string, message: string): Promise<boolean> {
    try {
      // Форматируем номер телефона для Казахстана:
      // 1. Убираем все нецифровые символы
      // 2. Оставляем только последние 10 цифр
      // 3. Добавляем код Казахстана
      let formattedPhone = phone.replace(/\D/g, '');
      formattedPhone = formattedPhone.slice(-10);
      if (formattedPhone.length === 10) {
        formattedPhone = '+77' + formattedPhone.substring(1);
      }
      
      console.log(`Отправка SMS на номер: ${formattedPhone}`);
      
      const response = await axios.get<SmsSendResponse>(this.baseUrl, {
        params: {
          login: this.login,
          psw: this.password,
          phones: formattedPhone,
          mes: message,
          fmt: 3,
          charset: 'utf-8',
          sender: 'Atlas Save' // Добавляем имя отправителя
        }
      });

      if (response.data.error) {
        console.error('SMS sending error:', response.data.error);
        return false;
      }

      console.log('SMS sent successfully, ID:', response.data.id);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }
} 