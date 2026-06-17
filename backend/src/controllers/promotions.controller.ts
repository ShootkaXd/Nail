import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function listPromotions(req: Request, res: Response) {
  const promotions = await prisma.promotion.findMany({
    include: { service: { select: { name: true } } },
    orderBy: { startDate: 'desc' },
  })
  res.json(promotions)
}

export async function createPromotion(req: Request, res: Response) {
  const { name, serviceId, discountPercent, startDate, endDate, isActive } = req.body
  const promo = await prisma.promotion.create({
    data: {
      name,
      serviceId: serviceId ? Number(serviceId) : null,
      discountPercent: Number(discountPercent),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive ?? true,
    },
  })
  res.status(201).json(promo)
}

export async function updatePromotion(req: Request, res: Response) {
  const id = Number(req.params.id)
  const { name, serviceId, discountPercent, startDate, endDate, isActive } = req.body
  const promo = await prisma.promotion.update({
    where: { id },
    data: {
      name,
      serviceId: serviceId !== undefined ? (serviceId ? Number(serviceId) : null) : undefined,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive,
    },
  })
  res.json(promo)
}

export async function deletePromotion(req: Request, res: Response) {
  await prisma.promotion.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
}
