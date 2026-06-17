# Nail Studio — Система онлайн записи

Веб-приложение для записи клиентов на бьюти-услуги.

## Быстрый старт

### 1. Запуск бэкенда

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts   # Заполнить тестовыми данными
npm run dev
```

Сервер запустится на `http://localhost:3000`

### 2. Запуск фронтенда

```bash
cd frontend
npm install
npm run dev
```

Интерфейс откроется на `http://localhost:5173`

---

## Роли и доступы

| Роль | URL | Логин / Пароль |
|------|-----|----------------|
| Клиент | `/` | Без логина |
| Администратор | `/admin` | admin@nail.local / admin123 |
| Мастер | `/master` | anna@nail.local / master123 |
| Мастер | `/master` | maria@nail.local / master123 |

---

## Функции

### Клиент (публичная страница `/`)
- Выбор услуги по категориям
- Выбор мастера с портфолио и ценой
- Выбор даты через интерактивный календарь
- Выбор свободного временного слота
- Автоматический расчёт цены с учётом акций
- Форма с контактными данными
- Подтверждение и номер записи

### Администратор (`/admin`)
- **Услуги**: создание, редактирование, удаление, активация
- **Мастера**: управление профилями, назначение услуг, график работы
- **Акции**: скидки на конкретные услуги или все услуги, период действия
- **Записи**: просмотр всех записей, фильтры, смена статуса

### Мастер (`/master`)
- **Календарь**: недельный/месячный вид записей с цветовым кодированием по статусу
- **График работы**: настройка рабочих дней и часов

---

## Технологии

**Бэкенд**: Node.js + Express + TypeScript + Prisma (SQLite)  
**Фронтенд**: React + TypeScript + Vite + Tailwind CSS + FullCalendar  
**Auth**: JWT  

---

## Деплой на Windows/Linux сервер

### Production сборка

```bash
# Бэкенд
cd backend
npm run build
DATABASE_URL="file:./prod.db" node dist/server.js

# Фронтенд
cd frontend
npm run build
# Раздавайте папку dist/ через nginx или serve
```

### Nginx конфигурация (пример)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Фронтенд
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Переменные окружения (backend/.env)

```env
DATABASE_URL="file:./prod.db"
JWT_SECRET="замените-на-секретный-ключ-минимум-32-символа"
JWT_EXPIRES_IN="24h"
PORT=3000
CORS_ORIGIN="https://yourdomain.com"
```
