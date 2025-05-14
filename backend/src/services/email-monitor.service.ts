import { parseEmails } from '../scripts/parse-emails';

let isMonitoringActive = false;
let monitoringInterval: NodeJS.Timeout | null = null;
let currentIntervalSeconds: number = 60; // 1 минута по умолчанию

/**
 * Начать мониторинг почты
 * @param intervalSeconds Интервал проверки в секундах
 */
export function startEmailMonitoring(intervalSeconds: number = 60): void {
  if (isMonitoringActive) {
    return;
  }
  
  currentIntervalSeconds = intervalSeconds;
  console.log(`Запуск мониторинга почты (проверка каждые ${intervalSeconds} секунд)`);
  
  // Выполняем первую проверку сразу при запуске
  parseEmails()
    .catch(error => console.error('Ошибка при первоначальной проверке почты:', error));
  
  // Настраиваем интервал проверки
  const intervalMs = intervalSeconds * 1000;
  monitoringInterval = setInterval(() => {
    parseEmails()
      .catch(error => console.error('Ошибка при проверке почты:', error));
  }, intervalMs);
  
  isMonitoringActive = true;
}

/**
 * Изменить интервал проверки почты
 * @param newIntervalSeconds Новый интервал в секундах
 */
export function changeMonitoringInterval(newIntervalSeconds: number): void {
  if (!isMonitoringActive || !monitoringInterval) {
    console.log('Мониторинг почты не запущен. Сначала запустите мониторинг.');
    return;
  }
  
  // Останавливаем текущий интервал
  clearInterval(monitoringInterval);
  
  // Настраиваем новый интервал
  const intervalMs = newIntervalSeconds * 1000;
  currentIntervalSeconds = newIntervalSeconds;
  
  console.log(`Изменен интервал проверки почты на ${newIntervalSeconds} секунд`);
  
  monitoringInterval = setInterval(() => {
    parseEmails()
      .catch(error => console.error('Ошибка при проверке почты:', error));
  }, intervalMs);
}

/**
 * Остановить мониторинг почты
 */
export function stopEmailMonitoring(): void {
  if (!isMonitoringActive || !monitoringInterval) {
    console.log('Мониторинг почты не запущен');
    return;
  }
  
  clearInterval(monitoringInterval);
  monitoringInterval = null;
  isMonitoringActive = false;
  console.log('Мониторинг почты остановлен');
}

/**
 * Получить статус мониторинга почты
 */
export function getEmailMonitoringStatus(): { active: boolean; intervalSeconds?: number } {
  if (!isMonitoringActive || !monitoringInterval) {
    return { active: false };
  }
  
  return { 
    active: true,
    intervalSeconds: currentIntervalSeconds
  };
} 