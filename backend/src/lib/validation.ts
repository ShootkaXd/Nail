import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// Strong password: min 8 chars, at least one letter and one digit
export const passwordSchema = z
  .string()
  .min(8, 'Пароль должен быть не короче 8 символов')
  .max(128)
  .regex(/[A-Za-zА-Яа-я]/, 'Пароль должен содержать букву')
  .regex(/[0-9]/, 'Пароль должен содержать цифру')

export const loginSchema = z.object({
  login: z.string().trim().min(2).max(64),
  password: z.string().min(1).max(128),
})

export const setupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  login: z.string().trim().min(2, 'Логин не короче 2 символов').max(64).regex(/^[A-Za-z0-9_.-]+$/, 'Логин: латиница, цифры, _ . -'),
  email: z.string().trim().email('Неверный email').max(160).optional().or(z.literal('')),
  password: passwordSchema,
})

export const createAppointmentSchema = z.object({
  clientName: z.string().trim().min(1, 'Введите имя').max(120),
  clientPhone: z.string().trim().min(5, 'Введите телефон').max(32),
  clientEmail: z.string().trim().email('Неверный email').max(160).optional().or(z.literal('')),
  masterId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  startAt: z.string().datetime({ message: 'Неверная дата' }),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

// Validate req.body against a schema; on failure return 400 with details
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const first = result.error.errors[0]
      return res.status(400).json({ error: first?.message ?? 'Некорректные данные', issues: result.error.errors })
    }
    req.body = result.data
    next()
  }
}
