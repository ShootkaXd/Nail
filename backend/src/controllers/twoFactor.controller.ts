import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import prisma from '../lib/prisma'
import { issueSessionToken, verifyPreAuthToken } from '../lib/token'

// Step 1 (authenticated, password re-check): generate a pending secret and
// return a QR code — not yet active until confirmed via /enable.
export async function setupTwoFactor(req: Request, res: Response) {
  const { password } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Неверный пароль' })
  }

  const secret = authenticator.generateSecret()
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } })

  const otpauth = authenticator.keyuri(user.login, 'Nail Studio', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauth)

  res.json({ secret, qrDataUrl })
}

// Step 2: confirm the code from the authenticator app matches, then enable.
export async function enableTwoFactor(req: Request, res: Response) {
  const { code } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user?.twoFactorSecret) return res.status(400).json({ error: 'Сначала начните настройку 2FA' })

  const valid = authenticator.verify({ token: String(code || ''), secret: user.twoFactorSecret })
  if (!valid) return res.status(400).json({ error: 'Неверный код' })

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
  res.json({ enabled: true })
}

// Disable requires both current password and a valid code (defense in depth).
export async function disableTwoFactor(req: Request, res: Response) {
  const { password, code } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Неверный пароль' })
  }
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA не включена' })
  }
  const valid = authenticator.verify({ token: String(code || ''), secret: user.twoFactorSecret })
  if (!valid) return res.status(400).json({ error: 'Неверный код' })

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  res.json({ enabled: false })
}

// Second step of login: exchange a pre-auth token + TOTP code for a real session token.
export async function verifyTwoFactorLogin(req: Request, res: Response) {
  const { preAuthToken, code } = req.body
  const userId = preAuthToken ? verifyPreAuthToken(String(preAuthToken)) : null
  if (!userId) return res.status(401).json({ error: 'Сессия входа истекла, войдите заново' })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA не включена для этого пользователя' })
  }

  const valid = authenticator.verify({ token: String(code || ''), secret: user.twoFactorSecret })
  if (!valid) return res.status(401).json({ error: 'Неверный код' })

  const token = issueSessionToken(user)
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } })
}
