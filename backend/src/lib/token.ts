import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AppUser {
  id: number
  role: string
  name: string
}

// Full session token, issued after password (+ 2FA code, if enabled) checks out
export function issueSessionToken(user: AppUser): string {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  )
}

// Short-lived token proving password was already verified, used only to
// carry the user through the second (TOTP) step — cannot access any other
// authenticated route since middleware/auth.ts requires a session token.
export function issuePreAuthToken(userId: number): string {
  return jwt.sign({ id: userId, purpose: '2fa-pending' }, env.JWT_SECRET, { expiresIn: '5m' })
}

export function verifyPreAuthToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: number; purpose: string }
    return payload.purpose === '2fa-pending' ? payload.id : null
  } catch {
    return null
  }
}
