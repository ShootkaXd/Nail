import prisma from '../lib/prisma'

export interface PriceInfo {
  basePrice: number
  discountPercent: number
  finalPrice: number
  promotionName: string | null
}

export async function calculatePrice(
  serviceId: number,
  masterId: number
): Promise<PriceInfo> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) throw new Error('Service not found')

  const masterService = await prisma.masterService.findFirst({
    where: { serviceId, master: { userId: masterId } },
  })

  const basePrice = masterService?.customPrice ?? service.price

  const now = new Date()
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      OR: [{ serviceId }, { serviceId: null }],
    },
    orderBy: { discountPercent: 'desc' },
  })

  const best = promotions[0] ?? null
  const discountPercent = best?.discountPercent ?? 0
  const finalPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100

  return {
    basePrice,
    discountPercent,
    finalPrice,
    promotionName: best?.name ?? null,
  }
}
