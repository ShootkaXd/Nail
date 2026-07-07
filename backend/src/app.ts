import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import router from './routes'
import { errorHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimit'
import { env } from './config/env'

const app = express()

// Behind a reverse proxy (nginx/docker) — needed for correct client IPs in rate limiting
app.set('trust proxy', 1)
app.disable('x-powered-by')

// Security headers. This process only ever serves JSON + static /uploads
// images, never HTML, so helmet's default CSP (default-src 'self') is safe
// here and closes off any accidental HTML-rendering surface; the actual SPA
// is served by a separate origin and gets its own CSP at the proxy layer.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// Lock CORS to configured origins (comma-separated supported)
const allowedOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim())
app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    credentials: true,
  })
)

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '100kb' }))

// Serve uploaded master photos
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')
app.use('/uploads', express.static(UPLOAD_DIR))

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api', apiLimiter, router)

app.use(errorHandler)

export default app
