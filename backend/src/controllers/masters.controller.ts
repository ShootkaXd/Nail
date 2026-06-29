import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'

export async function listMasters(req: Request, res: Response) {
  const masters = await prisma.user.findMany({
    where: { role: 'master' },
    select: {
      id: true, name: true, login: true, email: true, phone: true,
      masterProfile: {
        select: {
          id: true, bio: true,
          masterServices: { select: { serviceId: true, customPrice: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  res.json(masters)
}

export async function createMaster(req: Request, res: Response) {
  const { name, login, email, phone, password, bio, serviceIds } = req.body
  const passwordHash = await bcrypt.hash(password || "master123", 12)

  const user = await prisma.user.create({
    data: {
      name, login, email, phone, passwordHash, role: 'master',
      masterProfile: {
        create: {
          bio: bio || null,
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
  const { name, login, email, phone, bio, serviceIds, password } = req.body

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (login) updateData.login = login
  if (email) updateData.email = email
  if (phone !== undefined) updateData.phone = phone
  if (password) updateData.passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      masterProfile: {
        update: {
          bio: bio ?? undefined,
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

export async function deleteMaster(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
}
