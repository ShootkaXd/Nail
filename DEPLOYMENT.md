# Развёртывание в продакшн

Пошаговая инструкция для полноценного боевого запуска: сервер, домен, SSL,
бэкапы. Ориентировано на Ubuntu 22.04/24.04 VPS, но подходит для любого
Linux-сервера с Docker.

---

## 1. Что понадобится

- VPS/сервер с публичным IP (от 1 CPU / 1 ГБ RAM достаточно для салона)
- Доменное имя (можно купить на Reg.ru, Namecheap, Cloudflare Registrar и т.п.)
- SSH-доступ к серверу с правами sudo

---

## 2. Домен и DNS

1. Купите домен (например, `salon-anna.ru`) у любого регистратора.
2. В панели управления DNS у регистратора (или Cloudflare, если используете
   его как DNS) создайте **A-запись**:

   | Тип | Имя | Значение |
   |-----|-----|----------|
   | A   | `@` (или `salon`) | IP-адрес вашего сервера |

   Если хотите `www.salon-anna.ru`, добавьте ещё одну A-запись с именем `www`.

3. Подождите распространения DNS (обычно 5–30 минут). Проверить:

   ```bash
   dig +short salon-anna.ru
   # должен вернуть IP вашего сервера
   ```

**Если используете Cloudflare** — на время выпуска сертификата отключите
оранжевое облако (proxy), поставьте DNS-запись в режим «Only DNS» (серое
облако), иначе Caddy не сможет получить сертификат Let's Encrypt через
HTTP-01 challenge. Включить проксирование обратно можно после того, как
всё заработает — тогда TLS будет терминироваться у Cloudflare тоже (двойной
слой, это нормально).

---

## 3. Базовая защита сервера

Подключитесь по SSH и выполните:

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Firewall: разрешить только SSH, HTTP, HTTPS
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# (Рекомендуется) fail2ban против перебора SSH
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

Если ещё не настроен вход по SSH-ключу вместо пароля — настройте (`~/.ssh/authorized_keys`
на сервере, затем `PasswordAuthentication no` в `/etc/ssh/sshd_config` и `sudo systemctl restart sshd`).

---

## 4. Установка Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # применить группу без перелогина
docker --version
docker compose version
```

---

## 5. Разворачивание приложения

```bash
git clone https://github.com/ShootkaXd/Nail.git nail
cd nail

cp .env.example .env
nano .env
```

Заполните `.env`:

```env
JWT_SECRET=<результат: openssl rand -hex 32>
JWT_EXPIRES_IN=24h
HTTP_PORT=8080
CORS_ORIGIN=https://salon-anna.ru
DOMAIN=salon-anna.ru
```

Сгенерировать секрет:

```bash
openssl rand -hex 32
```

Запуск **с HTTPS через Caddy** (рекомендуется для прода):

```bash
docker compose --profile https up -d --build
```

Caddy автоматически получит и будет продлевать сертификат Let's Encrypt для
домена из `DOMAIN`, слушает 80/443, и проксирует на фронтенд. Порт `HTTP_PORT`
(8080) при этом остаётся открытым — рекомендуется закрыть его от внешнего
мира в firewall, так как весь трафик снаружи должен идти через Caddy (443):

```bash
sudo ufw delete allow 8080/tcp 2>/dev/null  # если такое правило было
# порт 8080 слушает только на всех интерфейсах Docker, но не имеет
# отдельного ufw allow — по умолчанию ufw блокирует всё, кроме разрешённого
```

Убедитесь, что `ufw status` показывает только `22`, `80`, `443` — не `8080`.

Проверка:

```bash
docker compose ps           # backend/frontend/caddy должны быть Up (backend — healthy)
docker compose logs caddy --tail 30   # ищите "certificate obtained successfully"
curl -I https://salon-anna.ru
```

Откройте `https://salon-anna.ru/setup` в браузере — появится форма создания
первого администратора.

---

## 6. Первые шаги после запуска

1. Создайте администратора на `/setup`.
2. Зайдите в **Настройки** → включите **двухфакторную аутентификацию** (2FA)
   для админ-аккаунта — обязательно для боевого использования.
3. Заполните реквизиты (152-ФЗ) в **Настройки** → «Салон: название, логотип,
   реквизиты» — они появятся в политике конфиденциальности и подвале сайта.
4. Настройте цвет/шрифт под бренд салона.
5. Создайте мастеров, услуги, график работы.

---

## 7. Резервное копирование

База данных лежит в Docker-volume `db-data` (SQLite-файл), фото — тоже там
же (`UPLOAD_DIR=/app/data/uploads`).

**Разовый бэкап:**

```bash
docker compose exec backend sh -c "cd /app/data && tar czf - prod.db uploads" > backup-$(date +%F).tar.gz
```

**Восстановление:**

```bash
docker compose stop backend
docker run --rm -v nail_db-data:/app/data -v $(pwd):/backup alpine \
  sh -c "cd /app/data && tar xzf /backup/backup-2026-07-05.tar.gz"
docker compose start backend
```

**Автоматизация** (cron, ежедневно в 3:00, хранить 14 дней):

```bash
crontab -e
```

Добавить строку:

```
0 3 * * * cd /path/to/nail && docker compose exec -T backend sh -c "cd /app/data && tar czf - prod.db uploads" > /path/to/backups/backup-$(date +\%F).tar.gz && find /path/to/backups -name 'backup-*.tar.gz' -mtime +14 -delete
```

Рекомендуется также копировать бэкапы за пределы сервера (S3, другой сервер,
Yandex Object Storage и т.п.) — локальный бэкап не спасёт при потере сервера.

---

## 8. Обновление

```bash
cd nail
./update.sh
```

Скрипт делает `git pull`, пересобирает образы, перезапускает контейнеры.
Миграции БД применяются автоматически при старте бэкенда. Если запускали с
профилем `https`, обновляйте так же с флагом:

```bash
git pull
docker compose --profile https up -d --build
```

---

## 9. Мониторинг и логи

```bash
docker compose logs -f backend     # логи API
docker compose logs -f caddy       # логи сертификатов/прокси
docker stats                       # нагрузка CPU/памяти по контейнерам
```

Проверка, что сертификат не просрочен (Caddy обновляет сам, но можно свериться):

```bash
curl -vI https://salon-anna.ru 2>&1 | grep -A2 "expire date"
```

---

## 10. Чеклист перед тем, как дать ссылку клиентам

- [ ] Домен открывается по `https://` без предупреждений браузера
- [ ] `http://` редиректит на `https://` (Caddy делает это автоматически)
- [ ] Порт 8080 недоступен снаружи (только 80/443 в `ufw status`)
- [ ] Создан администратор, включена 2FA
- [ ] `CORS_ORIGIN` в `.env` указывает именно на ваш домен, не `*`
- [ ] Заполнены реквизиты 152-ФЗ в Настройках
- [ ] Настроен автоматический бэкап (cron)
- [ ] Проверена запись клиента от начала до конца на реальном телефоне

См. также [`SECURITY.md`](./SECURITY.md) — общий обзор мер безопасности
приложения.
