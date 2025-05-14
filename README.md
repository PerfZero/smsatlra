# SMS - Система Управления Сбережениями

Система для управления сбережениями на Хадж и Умру, позволяющая пользователям контролировать накопления, выбирать пакеты и планировать поездки.

## Структура проекта

- `/sms` - Frontend на React
- `/backend` - Backend на Node.js с Express и Prisma

## Требования

- Node.js 18+
- PostgreSQL
- NPM или Yarn

## Установка и запуск

### Backend

```bash
cd backend
npm install
# Настройте .env с параметрами базы данных
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

### Frontend

```bash
cd sms
npm install
# Настройте .env с адресом API
npm run build
```

## Переменные окружения

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/sms_db"
JWT_SECRET="your-secret-key"
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
SKIP_PREFLIGHT_CHECK=true
``` 