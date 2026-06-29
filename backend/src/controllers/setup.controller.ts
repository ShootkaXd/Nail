import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { env } from '../config/env'

// Whether the system still needs an initial admin
export async function setupStatus(_req: Request, res: Response) {
  const adminCount = await prisma.user.count({ where: { role: 'admin' } })
  res.json({ needsSetup: adminCount === 0 })
}

// Create the first admin. Only allowed when no admin exists yet.
export async function setup(req: Request, res: Response) {
  const adminCount = await prisma.user.count({ where: { role: 'admin' } })
  if (adminCount > 0) {
    return res.status(409).json({ error: 'Система уже настроена' })
  }

  const { name, login, email, password } = req.body

  const existing = await prisma.user.findUnique({ where: { login } })
  if (existing) return res.status(409).json({ error: 'Такой логин уже занят' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, login, email: email || null, passwordHash, role: 'admin' },
  })

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  )

  res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } })
}
