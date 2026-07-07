import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// Earnings report aggregated by service and by master.
// By default counts completed + confirmed appointments (excludes cancelled/pending).
export async function earnings(req: Request, res: Response) {
  const { from, to, statuses } = req.query

  const statusList = statuses
    ? String(statuses).split(',')
    : ['completed', 'confirmed']

  const where: Record<string, unknown> = { status: { in: statusList } }
  if (from || to) {
    const range: Record<string, Date> = {}
    if (from) range.gte = new Date(String(from))
    if (to) range.lte = new Date(String(to) + 'T23:59:59')
    where.startAt = range
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      master: { select: { id: true, name: true } },
      services: { include: { service: { select: { id: true, name: true, category: true } } } },
    },
    orderBy: { startAt: 'desc' },
  })

  const total = appointments.reduce((sum, a) => sum + a.totalPrice, 0)
  const count = appointments.length

  // Group by service
  const byServiceMap = new Map<number, { serviceId: number; name: string; category: string; count: number; total: number }>()
  // Group by master
  const byMasterMap = new Map<number, { masterId: number; name: string; count: number; total: number }>()
  // Group by category
  const byCategoryMap = new Map<string, { category: string; count: number; total: number }>()

  for (const a of appointments) {
    const m = byMasterMap.get(a.master.id) ?? { masterId: a.master.id, name: a.master.name, count: 0, total: 0 }
    m.count++; m.total += a.totalPrice; byMasterMap.set(a.master.id, m)

    // A single booking can bundle several services — each line item is
    // counted/totaled against its own service and category.
    for (const line of a.services) {
      const s = byServiceMap.get(line.service.id) ?? { serviceId: line.service.id, name: line.service.name, category: line.service.category, count: 0, total: 0 }
      s.count++; s.total += line.price; byServiceMap.set(line.service.id, s)

      const c = byCategoryMap.get(line.service.category) ?? { category: line.service.category, count: 0, total: 0 }
      c.count++; c.total += line.price; byCategoryMap.set(line.service.category, c)
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100

  res.json({
    total: round(total),
    count,
    byService: [...byServiceMap.values()].map(x => ({ ...x, total: round(x.total) })).sort((a, b) => b.total - a.total),
    byMaster: [...byMasterMap.values()].map(x => ({ ...x, total: round(x.total) })).sort((a, b) => b.total - a.total),
    byCategory: [...byCategoryMap.values()].map(x => ({ ...x, total: round(x.total) })).sort((a, b) => b.total - a.total),
  })
}
