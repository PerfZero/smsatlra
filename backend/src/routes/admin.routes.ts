import express from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { adminController } from '../controllers/admin.controller';
import { parserController } from '../controllers/parser.controller';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(authMiddleware);

// Middleware для проверки роли администратора
const adminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  if (req.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  next();
};

// Получить список всех пользователей (только для админов)
router.get('/users', adminMiddleware, adminController.getAllUsers);

// Обновление роли пользователя
router.put('/users/:id/role', adminMiddleware, adminController.updateUserRole);

// Удаление пользователя
router.delete('/users/:id', adminMiddleware, adminController.deleteUser);

// Парсинг email и сохранение данных
router.post('/parse-email', adminMiddleware, parserController.parseEmail);

// Страница для ручной проверки почты
router.get('/email-monitor', adminMiddleware, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Управление мониторингом почты</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        h1 { color: #333; }
        button { padding: 10px 15px; margin-right: 10px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px; }
        button:hover { background-color: #45a049; }
        button.red { background-color: #f44336; }
        button.red:hover { background-color: #d32f2f; }
        button.blue { background-color: #2196F3; }
        button.blue:hover { background-color: #0b7dda; }
        #status { margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        input { padding: 8px; margin-right: 10px; }
      </style>
    </head>
    <body>
      <h1>Управление мониторингом почты</h1>
      
      <div class="card">
        <h2>Проверка почты</h2>
        <button id="checkNow" class="blue">Проверить сейчас</button>
        <div id="checkStatus"></div>
      </div>
      
      <div class="card">
        <h2>Управление мониторингом</h2>
        <div>
          <button id="startMonitoring">Запустить мониторинг</button>
          <button id="stopMonitoring" class="red">Остановить мониторинг</button>
        </div>
        <div style="margin-top: 10px;">
          <input type="number" id="interval" min="1" value="5" />
          <button id="changeInterval" class="blue">Изменить интервал (сек)</button>
        </div>
      </div>
      
      <div class="card">
        <h2>Статус мониторинга</h2>
        <button id="getStatus" class="blue">Обновить статус</button>
        <div id="status">Статус загружается...</div>
      </div>
      
      <script>
        // Загружаем статус при загрузке страницы
        window.onload = function() {
          updateStatus();
        };
        
        // Обработчик кнопки "Проверить сейчас"
        document.getElementById('checkNow').addEventListener('click', function() {
          const statusElement = document.getElementById('checkStatus');
          statusElement.innerText = 'Проверка почты...';
          
          fetch('/api/email-monitor/run-now', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => {
            statusElement.innerText = data.success 
              ? 'Проверка успешно выполнена! ' + data.message
              : 'Ошибка: ' + data.message;
          })
          .catch(error => {
            statusElement.innerText = 'Ошибка: ' + error.message;
          });
        });
        
        // Обработчик кнопки "Запустить мониторинг"
        document.getElementById('startMonitoring').addEventListener('click', function() {
          const interval = document.getElementById('interval').value;
          
          fetch('/api/email-monitor/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intervalSeconds: parseInt(interval) })
          })
          .then(response => response.json())
          .then(data => {
            alert(data.success ? 'Мониторинг запущен!' : 'Ошибка: ' + data.message);
            updateStatus();
          })
          .catch(error => {
            alert('Ошибка: ' + error.message);
          });
        });
        
        // Обработчик кнопки "Остановить мониторинг"
        document.getElementById('stopMonitoring').addEventListener('click', function() {
          fetch('/api/email-monitor/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => {
            alert(data.success ? 'Мониторинг остановлен!' : 'Ошибка: ' + data.message);
            updateStatus();
          })
          .catch(error => {
            alert('Ошибка: ' + error.message);
          });
        });
        
        // Обработчик кнопки "Изменить интервал"
        document.getElementById('changeInterval').addEventListener('click', function() {
          const interval = document.getElementById('interval').value;
          
          fetch('/api/email-monitor/change-interval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intervalSeconds: parseInt(interval) })
          })
          .then(response => response.json())
          .then(data => {
            alert(data.success ? 'Интервал изменен!' : 'Ошибка: ' + data.message);
            updateStatus();
          })
          .catch(error => {
            alert('Ошибка: ' + error.message);
          });
        });
        
        // Обработчик кнопки "Обновить статус"
        document.getElementById('getStatus').addEventListener('click', function() {
          updateStatus();
        });
        
        // Функция обновления статуса
        function updateStatus() {
          const statusElement = document.getElementById('status');
          statusElement.innerText = 'Загрузка статуса...';
          
          fetch('/api/email-monitor/status')
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              const status = data.status;
              let statusText = 'Статус мониторинга: ' + (status.active ? 'Активен' : 'Не активен');
              
              if (status.intervalSeconds) {
                statusText += '\nИнтервал проверки: ' + status.intervalSeconds + ' секунд';
              }
              
              statusText += '\nОбновлено: ' + new Date().toLocaleTimeString();
              
              statusElement.innerText = statusText;
            } else {
              statusElement.innerText = 'Ошибка при получении статуса: ' + data.message;
            }
          })
          .catch(error => {
            statusElement.innerText = 'Ошибка: ' + error.message;
          });
        }
      </script>
    </body>
    </html>
  `);
});

export default router; 