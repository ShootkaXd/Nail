import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { passwordSchema } from '../lib/validation'

export async function listAdmins(_req: Request, res: Response) {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, name: true, login: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(admins)
}

export async function createAdmin(req: Request, res: Response) {
  const { name, login, email, password } = req.body
  if (!name || !login || !password) {
    return res.status(400).json({ error: 'Имя, логин и пароль обязательны' })
  }
  const pw = passwordSchema.safeParse(password)
  if (!pw.success) return res.status(400).json({ error: pw.error.errors[0].message })

  const existing = await prisma.user.findUnique({ where: { login } })
  if (existing) return res.status(409).json({ error: 'Такой логин уже занят' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, login, email: email || null, passwordHash, role: 'admin' },
    select: { id: true, name: true, login: true, email: true, createdAt: true },
  })
  res.status(201).json(user)
}

export async function deleteAdmin(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись' })
  }
  const adminCount = await prisma.user.count({ where: { role: 'admin' } })
  if (adminCount <= 1) {
    return res.status(400).json({ error: 'Нельзя удалить последнего администратора' })
  }
  await prisma.user.delete({ where: { id } })
  res.status(204).send()
}

// Change own password
export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body
  const pw = passwordSchema.safeParse(newPassword)
  if (!pw.success) return res.status(400).json({ error: pw.error.errors[0].message })

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !(await bcrypt.compare(currentPassword || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Текущий пароль неверен' })
  }
  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  res.json({ ok: true })
}
