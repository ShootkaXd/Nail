import { Request, Response } from 'express'
import prisma from '../lib/prisma'

const include = {
  master: { select: { id: true, name: true } },
  service: { select: { id: true, name: true, category: true } },
}

export async function listAll(req: Request, res: Response) {
  const { status, masterId, from, to } = req.query
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (masterId) where.masterId = Number(masterId)
  if (from || to) {
    where.startAt = {}
    if (from) (where.startAt as Record<string, unknown>).gte = new Date(String(from))
    if (to) (where.startAt as Record<string, unknown>).lte = new Date(String(to))
  }
  const appointments = await prisma.appointment.findMany({
    where,
    include,
    orderBy: { startAt: 'desc' },
  })
  res.json(appointments)
}

export async function listMine(req: Request, res: Response) {
  const masterId = req.user!.id
  const { from, to } = req.query
  const where: Record<string, unknown> = { masterId }
  if (from || to) {
    where.startAt = {}
    if (from) (where.startAt as Record<string, unknown>).gte = new Date(String(from))
    if (to) (where.startAt as Record<string, unknown>).lte = new Date(String(to))
  }
  const appointments = await prisma.appointment.findMany({ where, include, orderBy: { startAt: 'asc' } })
  res.json(appointments)
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  const appointment = await prisma.appointment.update({
    where: { id: Number(id) },
    data: { status },
    include,
  })
  res.json(appointment)
}
