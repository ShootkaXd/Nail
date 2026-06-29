import { Request, Response } from 'express'
import prisma from '../lib/prisma'

const BOOKING_FORM_KEY = 'booking_form'

export interface BookingFormConfig {
  title: string
  subtitle: string
  fields: {
    name: { enabled: boolean; required: boolean; label: string }
    phone: { enabled: boolean; required: boolean; label: string }
    email: { enabled: boolean; required: boolean; label: string }
    notes: { enabled: boolean; required: boolean; label: string }
  }
}

export const defaultBookingForm: BookingFormConfig = {
  title: 'Онлайн запись',
  subtitle: 'Запишитесь на услугу за пару минут',
  fields: {
    name: { enabled: true, required: true, label: 'Ваше имя' },
    phone: { enabled: true, required: true, label: 'Телефон' },
    email: { enabled: true, required: false, label: 'Email' },
    notes: { enabled: true, required: false, label: 'Пожелания' },
  },
}

export async function getBookingForm(): Promise<BookingFormConfig> {
  const row = await prisma.setting.findUnique({ where: { key: BOOKING_FORM_KEY } })
  if (!row) return defaultBookingForm
  try {
    return { ...defaultBookingForm, ...JSON.parse(row.value) }
  } catch {
    return defaultBookingForm
  }
}

// Public: read form config
export async function getBookingFormPublic(_req: Request, res: Response) {
  res.json(await getBookingForm())
}

// Admin: update form config
export async function updateBookingForm(req: Request, res: Response) {
  const incoming = req.body as Partial<BookingFormConfig>
  const merged: BookingFormConfig = {
    title: String(incoming.title ?? defaultBookingForm.title).slice(0, 120),
    subtitle: String(incoming.subtitle ?? defaultBookingForm.subtitle).slice(0, 240),
    fields: {
      name: { ...defaultBookingForm.fields.name, ...incoming.fields?.name, enabled: true, required: true },
      phone: { ...defaultBookingForm.fields.phone, ...incoming.fields?.phone },
      email: { ...defaultBookingForm.fields.email, ...incoming.fields?.email },
      notes: { ...defaultBookingForm.fields.notes, ...incoming.fields?.notes },
    },
  }
  await prisma.setting.upsert({
    where: { key: BOOKING_FORM_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: BOOKING_FORM_KEY, value: JSON.stringify(merged) },
  })
  res.json(merged)
}
