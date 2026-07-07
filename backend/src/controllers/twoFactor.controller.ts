import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import prisma from '../lib/prisma'
import { issueSessionToken, verifyPreAuthToken } from '../lib/token'

// Per-account TOTP attempt tracking — independent of the IP-based authLimiter,
// so a distributed brute force (many IPs, one target account) still gets locked out.
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000
const failedAttempts = new Map<number, { count: number; lockedUntil: number }>()

function isLocked(userId: number): boolean {
  const entry = failedAttempts.get(userId)
  return !!entry && entry.lockedUntil > Date.now()
}

function recordFailure(userId: number) {
  const entry = failedAttempts.get(userId) ?? { count: 0, lockedUntil: 0 }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS
    entry.count = 0
  }
  failedAttempts.set(userId, entry)
}

function clearFailures(userId: number) {
  failedAttempts.delete(userId)
}

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

  if (isLocked(user.id)) {
    return res.status(429).json({ error: 'Слишком много неверных попыток. Попробуйте позже.' })
  }

  const valid = authenticator.verify({ token: String(code || ''), secret: user.twoFactorSecret })
  if (!valid) {
    recordFailure(user.id)
    return res.status(401).json({ error: 'Неверный код' })
  }
  clearFailures(user.id)

  const token = issueSessionToken(user)
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } })
}
