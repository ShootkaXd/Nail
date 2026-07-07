import prisma from '../lib/prisma'

export interface ServicePriceLine {
  serviceId: number
  name: string
  basePrice: number
  discountPercent: number
  finalPrice: number
  promotionName: string | null
}

export interface PriceInfo {
  services: ServicePriceLine[]
  totalBasePrice: number
  totalFinalPrice: number
  totalDurationMinutes: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Computes price + duration for a combination of services booked together
// with one master, applying that master's per-service custom price (if any)
// and the best active promotion for each service independently.
export async function calculatePrice(
  serviceIds: number[],
  masterId: number
): Promise<PriceInfo> {
  if (serviceIds.length === 0) throw new Error('At least one service is required')

  const now = new Date()
  const services: ServicePriceLine[] = []
  let totalDurationMinutes = 0

  for (const serviceId of serviceIds) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) throw new Error('Service not found')
    totalDurationMinutes += service.durationMinutes

    const masterService = await prisma.masterService.findFirst({
      where: { serviceId, master: { userId: masterId } },
    })
    const basePrice = masterService?.customPrice ?? service.price

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
    const finalPrice = round2(basePrice * (1 - discountPercent / 100))

    services.push({ serviceId, name: service.name, basePrice, discountPercent, finalPrice, promotionName: best?.name ?? null })
  }

  return {
    services,
    totalBasePrice: round2(services.reduce((sum, s) => sum + s.basePrice, 0)),
    totalFinalPrice: round2(services.reduce((sum, s) => sum + s.finalPrice, 0)),
    totalDurationMinutes,
  }
}
