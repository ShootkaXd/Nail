import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { issueSessionToken, issuePreAuthToken } from '../lib/token'

export async function login(req: Request, res: Response) {
  const { login: username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Login and password required' })
  }

  const user = await prisma.user.findUnique({ where: { login: username } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  if (user.twoFactorEnabled) {
    return res.json({ requires2FA: true, preAuthToken: issuePreAuthToken(user.id) })
  }

  const token = issueSessionToken(user)
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } })
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, role: true, twoFactorEnabled: true },
  })
  res.json(user)
}
