import { Request, Response } from 'express';
import { startEmailMonitoring, stopEmailMonitoring, getEmailMonitoringStatus, changeMonitoringInterval } from '../services/email-monitor.service';

export const emailMonitorController = {
  /**
   * Запустить мониторинг почты
   */
  startMonitoring: (req: Request, res: Response) => {
    try {
      const { intervalSeconds } = req.body;
      startEmailMonitoring(intervalSeconds || 300); // По умолчанию 5 минут (300 секунд)
      res.status(200).json({ 
        success: true,
        message: `Мониторинг почты запущен (интервал: ${intervalSeconds || 300} секунд)`
      });
    } catch (error: any) {
      console.error('Ошибка при запуске мониторинга почты:', error);
      res.status(500).json({ 
        success: false,
        message: 'Ошибка при запуске мониторинга почты',
        error: error.message
      });
    }
  },

  /**
   * Изменить интервал мониторинга
   */
  changeInterval: (req: Request, res: Response) => {
    try {
      const { intervalSeconds } = req.body;
      
      if (!intervalSeconds || intervalSeconds < 1) {
        return res.status(400).json({
          success: false,
          message: 'Интервал должен быть положительным числом'
        });
      }
      
      changeMonitoringInterval(intervalSeconds);
      res.status(200).json({ 
        success: true,
        message: `Интервал мониторинга почты изменен на ${intervalSeconds} секунд`
      });
    } catch (error: any) {
      console.error('Ошибка при изменении интервала мониторинга:', error);
      res.status(500).json({ 
        success: false,
        message: 'Ошибка при изменении интервала мониторинга',
        error: error.message
      });
    }
  },

  /**
   * Остановить мониторинг почты
   */
  stopMonitoring: (req: Request, res: Response) => {
    try {
      stopEmailMonitoring();
      res.status(200).json({ 
        success: true,
        message: 'Мониторинг почты остановлен'
      });
    } catch (error: any) {
      console.error('Ошибка при остановке мониторинга почты:', error);
      res.status(500).json({ 
        success: false,
        message: 'Ошибка при остановке мониторинга почты',
        error: error.message
      });
    }
  },

  /**
   * Получить статус мониторинга почты
   */
  getStatus: (req: Request, res: Response) => {
    try {
      const status = getEmailMonitoringStatus();
      res.status(200).json({ 
        success: true,
        status
      });
    } catch (error: any) {
      console.error('Ошибка при получении статуса мониторинга почты:', error);
      res.status(500).json({ 
        success: false,
        message: 'Ошибка при получении статуса мониторинга почты',
        error: error.message
      });
    }
  },

  /**
   * Принудительно запустить проверку почты
   */
  runNow: async (req: Request, res: Response) => {
    try {
      console.log('Запуск ручной проверки почты...');
      const { parseEmails } = await import('../scripts/parse-emails');
      await parseEmails();
      res.status(200).json({ 
        success: true,
        message: 'Проверка почты успешно выполнена'
      });
    } catch (error: any) {
      console.error('Ошибка при проверке почты:', error);
      res.status(500).json({ 
        success: false,
        message: 'Ошибка при проверке почты',
        error: error.message
      });
    }
  }
}; 