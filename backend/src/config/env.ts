import 'dotenv/config'

const required = ['DATABASE_URL', 'JWT_SECRET']
const missing = required.filter((k) => !process.env[k])

if (missing.length > 0) {
  console.error('\n❌ Отсутствуют переменные окружения:', missing.join(', '))
  console.error('   Создайте файл backend/.env (см. backend/.env.example)\n')
  process.exit(1)
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
}
