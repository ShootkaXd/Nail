import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { getAvailableSlots } from '../services/slot.service'
import { calculatePrice } from '../services/price.service'

export async function getServices(req: Request, res: Response) {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  res.json(services)
}

export async function getMasters(req: Request, res: Response) {
  const { serviceId } = req.query

  const where = serviceId
    ? {
        masterProfile: {
          masterServices: { some: { serviceId: Number(serviceId) } },
        },
      }
    : { masterProfile: { isNot: null } }

  const users = await prisma.user.findMany({
    where: { role: 'master', ...where },
    select: {
      id: true,
      name: true,
      phone: true,
      masterProfile: {
        select: {
          id: true,
          bio: true,
          masterServices: {
            where: serviceId ? { serviceId: Number(serviceId) } : undefined,
            select: { customPrice: true, serviceId: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  res.json(users)
}

export async function getSlots(req: Request, res: Response) {
  const { masterId, serviceId, date } = req.query
  if (!masterId || !serviceId || !date) {
    return res.status(400).json({ error: 'masterId, serviceId, date required' })
  }
  const slots = await getAvailableSlots(Number(masterId), Number(serviceId), String(date))
  res.json(slots)
}

export async function getPrice(req: Request, res: Response) {
  const { serviceId, masterId } = req.query
  if (!serviceId || !masterId) {
    return res.status(400).json({ error: 'serviceId, masterId required' })
  }
  const info = await calculatePrice(Number(serviceId), Number(masterId))
  res.json(info)
}

export async function createAppointment(req: Request, res: Response) {
  const { clientName, clientPhone, clientEmail, masterId, serviceId, startAt, notes } = req.body

  if (!clientName || !clientPhone || !clientEmail || !masterId || !serviceId || !startAt) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } })
  if (!service) return res.status(404).json({ error: 'Service not found' })

  const start = new Date(startAt)
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000)

  const conflict = await prisma.appointment.findFirst({
    where: {
      masterId: Number(masterId),
      status: { notIn: ['cancelled'] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
  })
  if (conflict) return res.status(409).json({ error: 'Time slot no longer available' })

  const priceInfo = await calculatePrice(Number(serviceId), Number(masterId))

  const appointment = await prisma.appointment.create({
    data: {
      clientName,
      clientPhone,
      clientEmail,
      masterId: Number(masterId),
      serviceId: Number(serviceId),
      startAt: start,
      endAt: end,
      notes: notes || null,
      totalPrice: priceInfo.finalPrice,
      status: 'pending',
    },
    include: { master: { select: { name: true } }, service: true },
  })

  res.status(201).json(appointment)
}
