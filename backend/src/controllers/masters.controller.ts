import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { passwordSchema } from '../lib/validation'

export async function listMasters(req: Request, res: Response) {
  const masters = await prisma.user.findMany({
    where: { role: 'master' },
    select: {
      id: true, name: true, login: true, email: true, phone: true,
      masterProfile: {
        select: {
          id: true, bio: true, address: true, avatarUrl: true,
          masterServices: { select: { serviceId: true, customPrice: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  res.json(masters)
}

export async function createMaster(req: Request, res: Response) {
  const { name, login, email, phone, password, bio, address, serviceIds } = req.body
  if (!name || !login) {
    return res.status(400).json({ error: 'Имя и логин обязательны' })
  }
  if (!password) {
    return res.status(400).json({ error: 'Пароль обязателен' })
  }
  const pw = passwordSchema.safeParse(password)
  if (!pw.success) return res.status(400).json({ error: pw.error.errors[0].message })

  const existing = await prisma.user.findUnique({ where: { login } })
  if (existing) return res.status(409).json({ error: 'Такой логин уже занят' })

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name, login, email, phone, passwordHash, role: 'master',
      masterProfile: {
        create: {
          bio: bio || null,
          address: address || null,
          masterServices: serviceIds?.length
            ? { create: serviceIds.map((id: number) => ({ serviceId: id })) }
            : undefined,
        },
      },
    },
    include: { masterProfile: { include: { masterServices: true } } },
  })
  res.status(201).json(user)
}

export async function updateMaster(req: Request, res: Response) {
  const id = Number(req.params.id)
  const { name, login, email, phone, bio, address, serviceIds, password } = req.body

  // Prevent this master-management endpoint from being used to edit an
  // unrelated user (e.g. another admin account) by passing an arbitrary id.
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!target || target.role !== 'master') {
    return res.status(404).json({ error: 'Мастер не найден' })
  }

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (login) updateData.login = login
  if (email) updateData.email = email
  if (phone !== undefined) updateData.phone = phone
  if (password) {
    const pw = passwordSchema.safeParse(password)
    if (!pw.success) return res.status(400).json({ error: pw.error.errors[0].message })
    updateData.passwordHash = await bcrypt.hash(password, 12)
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      masterProfile: {
        update: {
          bio: bio ?? undefined,
          address: address ?? undefined,
          ...(serviceIds !== undefined && {
            masterServices: {
              deleteMany: {},
              create: serviceIds.map((sid: number) => ({ serviceId: sid })),
            },
          }),
        },
      },
    },
    include: { masterProfile: { include: { masterServices: true } } },
  })
  res.json(user)
}

// Master reads own profile (bio + address)
export async function getMyProfile(req: Request, res: Response) {
  const profile = await prisma.masterProfile.findUnique({
    where: { userId: req.user!.id },
    select: { bio: true, address: true, avatarUrl: true },
  })
  res.json(profile ?? { bio: null, address: null, avatarUrl: null })
}

// Master updates own profile (bio + address)
export async function updateMyProfile(req: Request, res: Response) {
  const { bio, address } = req.body
  const profile = await prisma.masterProfile.update({
    where: { userId: req.user!.id },
    data: {
      bio: bio !== undefined ? String(bio).slice(0, 1000) || null : undefined,
      address: address !== undefined ? String(address).slice(0, 300) || null : undefined,
    },
    select: { bio: true, address: true },
  })
  res.json(profile)
}

export async function deleteMaster(req: Request, res: Response) {
  const id = Number(req.params.id)
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!target || target.role !== 'master') {
    return res.status(404).json({ error: 'Мастер не найден' })
  }
  await prisma.user.delete({ where: { id } })
  res.status(204).send()
}
