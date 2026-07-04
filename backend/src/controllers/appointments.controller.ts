import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { calculatePrice } from '../services/price.service'

const include = {
  master: { select: { id: true, name: true } },
  service: { select: { id: true, name: true, category: true } },
}

// Services offered by the current master (for their own booking form)
export async function myServices(req: Request, res: Response) {
  const profile = await prisma.masterProfile.findUnique({
    where: { userId: req.user!.id },
    include: { masterServices: { include: { service: true } } },
  })
  if (!profile) return res.json([])
  const services = profile.masterServices
    .map(ms => ms.service)
    .filter(s => s.isActive)
  res.json(services)
}

// Master (or admin) books a client manually.
// Master can only book for themselves; admin must pass masterId.
export async function createByStaff(req: Request, res: Response) {
  const { clientName, clientPhone, clientEmail, serviceId, startAt, notes, status } = req.body
  const masterId = req.user!.role === 'master' ? req.user!.id : Number(req.body.masterId)

  if (!clientName || !clientPhone || !serviceId || !startAt || !masterId) {
    return res.status(400).json({ error: 'Заполните обязательные поля' })
  }

  const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } })
  if (!service) return res.status(404).json({ error: 'Услуга не найдена' })

  const start = new Date(startAt)
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000)

  const conflict = await prisma.appointment.findFirst({
    where: {
      masterId,
      status: { notIn: ['cancelled'] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
  })
  if (conflict) return res.status(409).json({ error: 'Это время уже занято' })

  const priceInfo = await calculatePrice(Number(serviceId), masterId)

  const appointment = await prisma.appointment.create({
    data: {
      clientName,
      clientPhone,
      clientEmail: clientEmail || null,
      masterId,
      serviceId: Number(serviceId),
      startAt: start,
      endAt: end,
      notes: notes || null,
      totalPrice: priceInfo.finalPrice,
      status: status && ['pending', 'confirmed', 'completed'].includes(status) ? status : 'confirmed',
    },
    include,
  })
  res.status(201).json(appointment)
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
