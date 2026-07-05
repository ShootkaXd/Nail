import rateLimit from 'express-rate-limit'

// Strict limiter for auth/setup — mitigates brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Попробуйте позже.' },
})

// Limiter for public booking creation — mitigates spam
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте через минуту.' },
})

// Limiter for "my bookings" phone lookup — mitigates enumeration of phone numbers
export const myBookingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
})

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
