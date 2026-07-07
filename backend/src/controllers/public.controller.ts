import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { getAvailableSlots } from '../services/slot.service'
import { calculatePrice } from '../services/price.service'
import { getBookingForm } from './settings.controller'
import { normalizePhoneDigits } from '../lib/phone'

export async function getServices(req: Request, res: Response) {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  res.json(services)
}

function parseServiceIds(raw: unknown): number[] {
  if (!raw) return []
  return String(raw)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
}

export async function getMasters(req: Request, res: Response) {
  const serviceIds = parseServiceIds(req.query.serviceIds ?? req.query.serviceId)

  // A master must offer EVERY requested service to show up (one master does
  // the whole combined booking back-to-back — no splitting across masters).
  const where = serviceIds.length
    ? {
        AND: serviceIds.map((id) => ({
          masterProfile: { masterServices: { some: { serviceId: id } } },
        })),
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
          address: true,
          avatarUrl: true,
          masterServices: {
            where: serviceIds.length ? { serviceId: { in: serviceIds } } : undefined,
            select: { customPrice: true, serviceId: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  res.json(users)
}

// Public gallery: all masters with bio + photos + services offered
export async function getMastersGallery(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { role: 'master', masterProfile: { isNot: null } },
    select: {
      id: true,
      name: true,
      masterProfile: {
        select: {
          id: true,
          bio: true,
          address: true,
          avatarUrl: true,
          photos: { select: { id: true, url: true, caption: true }, orderBy: { createdAt: 'desc' } },
          masterServices: { select: { service: { select: { id: true, name: true, category: true } } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  res.json(users)
}

export async function getSlots(req: Request, res: Response) {
  const { masterId, date } = req.query
  const serviceIds = parseServiceIds(req.query.serviceIds ?? req.query.serviceId)
  if (!masterId || serviceIds.length === 0 || !date) {
    return res.status(400).json({ error: 'masterId, serviceIds, date required' })
  }
  const slots = await getAvailableSlots(Number(masterId), serviceIds, String(date))
  res.json(slots)
}

export async function getPrice(req: Request, res: Response) {
  const { masterId } = req.query
  const serviceIds = parseServiceIds(req.query.serviceIds ?? req.query.serviceId)
  if (serviceIds.length === 0 || !masterId) {
    return res.status(400).json({ error: 'serviceIds, masterId required' })
  }
  const info = await calculatePrice(serviceIds, Number(masterId))
  res.json(info)
}

export async function createAppointment(req: Request, res: Response) {
  const { clientName, clientPhone, clientEmail, masterId, serviceIds, startAt, notes } = req.body

  // Enforce per-config required fields (body already validated by zod)
  const form = await getBookingForm()
  if (form.fields.email.enabled && form.fields.email.required && !clientEmail) {
    return res.status(400).json({ error: 'Email обязателен' })
  }
  if (form.fields.notes.enabled && form.fields.notes.required && !notes) {
    return res.status(400).json({ error: 'Поле «Пожелания» обязательно' })
  }

  const ids: number[] = serviceIds.map(Number)
  const priceInfo = await calculatePrice(ids, Number(masterId)).catch(() => null)
  if (!priceInfo) return res.status(404).json({ error: 'Услуга не найдена' })

  const start = new Date(startAt)
  const end = new Date(start.getTime() + priceInfo.totalDurationMinutes * 60 * 1000)

  const conflict = await prisma.appointment.findFirst({
    where: {
      masterId: Number(masterId),
      status: { notIn: ['cancelled'] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
  })
  if (conflict) return res.status(409).json({ error: 'Time slot no longer available' })

  const appointment = await prisma.appointment.create({
    data: {
      clientName,
      clientPhone,
      clientPhoneDigits: normalizePhoneDigits(clientPhone),
      clientEmail: clientEmail || null,
      masterId: Number(masterId),
      startAt: start,
      endAt: end,
      notes: notes || null,
      totalPrice: priceInfo.totalFinalPrice,
      status: 'pending',
      services: {
        create: priceInfo.services.map((s) => ({ serviceId: s.serviceId, price: s.finalPrice })),
      },
    },
    include: { master: { select: { name: true } }, services: { include: { service: true } } },
  })

  res.status(201).json(appointment)
}

const myAppointmentsInclude = {
  master: { select: { id: true, name: true } },
  services: { include: { service: { select: { id: true, name: true, category: true } } } },
}

// Client looks up their own bookings by phone number — no account needed.
export async function getMyAppointments(req: Request, res: Response) {
  const { phone } = req.query
  if (!phone) return res.status(400).json({ error: 'Укажите номер телефона' })

  const digits = normalizePhoneDigits(String(phone))
  if (digits.length !== 10) return res.status(400).json({ error: 'Введите номер телефона полностью' })

  const appointments = await prisma.appointment.findMany({
    where: { clientPhoneDigits: digits },
    include: myAppointmentsInclude,
    orderBy: { startAt: 'desc' },
    take: 100,
  })
  res.json(appointments)
}

// Client cancels their own upcoming booking — verified by phone match, not just ID.
export async function cancelMyAppointment(req: Request, res: Response) {
  const id = Number(req.params.id)
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Укажите номер телефона' })

  const digits = normalizePhoneDigits(String(phone))
  const appointment = await prisma.appointment.findUnique({ where: { id } })

  if (!appointment || appointment.clientPhoneDigits !== digits) {
    return res.status(404).json({ error: 'Запись не найдена' })
  }
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    return res.status(400).json({ error: 'Эту запись нельзя отменить' })
  }
  if (appointment.startAt.getTime() < Date.now()) {
    return res.status(400).json({ error: 'Запись уже прошла' })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'cancelled' },
    include: myAppointmentsInclude,
  })
  res.json(updated)
}
