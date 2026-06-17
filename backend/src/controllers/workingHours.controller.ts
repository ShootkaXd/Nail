import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function getMyHours(req: Request, res: Response) {
  const masterId = req.user!.id
  const hours = await prisma.workingHour.findMany({ where: { masterId }, orderBy: { dayOfWeek: 'asc' } })
  res.json(hours)
}

export async function getMasterHours(req: Request, res: Response) {
  const masterId = Number(req.params.id)
  const hours = await prisma.workingHour.findMany({ where: { masterId }, orderBy: { dayOfWeek: 'asc' } })
  res.json(hours)
}

export async function saveMyHours(req: Request, res: Response) {
  const masterId = req.user!.id
  const hours: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }> = req.body

  await prisma.workingHour.deleteMany({ where: { masterId } })
  if (hours.length > 0) {
    await prisma.workingHour.createMany({
      data: hours.map((h) => ({ masterId, ...h })),
    })
  }
  const result = await prisma.workingHour.findMany({ where: { masterId }, orderBy: { dayOfWeek: 'asc' } })
  res.json(result)
}

export async function saveMasterHours(req: Request, res: Response) {
  const masterId = Number(req.params.id)
  const hours: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }> = req.body

  await prisma.workingHour.deleteMany({ where: { masterId } })
  if (hours.length > 0) {
    await prisma.workingHour.createMany({
      data: hours.map((h) => ({ masterId, ...h })),
    })
  }
  const result = await prisma.workingHour.findMany({ where: { masterId }, orderBy: { dayOfWeek: 'asc' } })
  res.json(result)
}
