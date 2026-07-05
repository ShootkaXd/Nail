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

// ---------- Site settings (name, logo, legal requisites) ----------

const SITE_KEY = 'site_settings'

export interface SiteConfig {
  salonName: string
  logoUrl: string | null
  requisites: {
    companyName: string // ИП/ООО — оператор персональных данных
    inn: string
    ogrn: string
    address: string
    email: string
    phone: string
  }
}

export const defaultSite: SiteConfig = {
  salonName: 'Nail Studio',
  logoUrl: null,
  requisites: { companyName: '', inn: '', ogrn: '', address: '', email: '', phone: '' },
}

export async function getSite(): Promise<SiteConfig> {
  const row = await prisma.setting.findUnique({ where: { key: SITE_KEY } })
  if (!row) return defaultSite
  try {
    const parsed = JSON.parse(row.value)
    return { ...defaultSite, ...parsed, requisites: { ...defaultSite.requisites, ...parsed.requisites } }
  } catch {
    return defaultSite
  }
}

// Public: site config for headers/footer/privacy page
export async function getSitePublic(_req: Request, res: Response) {
  res.json(await getSite())
}

// Admin: update site config
export async function updateSite(req: Request, res: Response) {
  const incoming = req.body as Partial<SiteConfig>
  const current = await getSite()
  const s = (v: unknown, fallback: string, max: number) =>
    v === undefined ? fallback : String(v).slice(0, max)
  const merged: SiteConfig = {
    salonName: s(incoming.salonName, current.salonName, 120) || 'Nail Studio',
    logoUrl: incoming.logoUrl === undefined ? current.logoUrl : (incoming.logoUrl ? String(incoming.logoUrl).slice(0, 300) : null),
    requisites: {
      companyName: s(incoming.requisites?.companyName, current.requisites.companyName, 240),
      inn: s(incoming.requisites?.inn, current.requisites.inn, 20),
      ogrn: s(incoming.requisites?.ogrn, current.requisites.ogrn, 20),
      address: s(incoming.requisites?.address, current.requisites.address, 300),
      email: s(incoming.requisites?.email, current.requisites.email, 160),
      phone: s(incoming.requisites?.phone, current.requisites.phone, 32),
    },
  }
  await prisma.setting.upsert({
    where: { key: SITE_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: SITE_KEY, value: JSON.stringify(merged) },
  })
  res.json(merged)
}

// Admin: upload salon logo (multipart, field "logo")
export async function uploadLogo(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const current = await getSite()
  const merged: SiteConfig = { ...current, logoUrl: `/uploads/${req.file.filename}` }
  await prisma.setting.upsert({
    where: { key: SITE_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: SITE_KEY, value: JSON.stringify(merged) },
  })
  res.json(merged)
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
