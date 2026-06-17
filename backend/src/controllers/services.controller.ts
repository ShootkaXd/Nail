import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function listServices(req: Request, res: Response) {
  const services = await prisma.service.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  res.json(services)
}

export async function createService(req: Request, res: Response) {
  const { name, description, category, durationMinutes, price, isActive } = req.body
  const service = await prisma.service.create({
    data: { name, description, category, durationMinutes: Number(durationMinutes), price: Number(price), isActive: isActive ?? true },
  })
  res.status(201).json(service)
}

export async function updateService(req: Request, res: Response) {
  const { id } = req.params
  const data = req.body
  if (data.price !== undefined) data.price = Number(data.price)
  if (data.durationMinutes !== undefined) data.durationMinutes = Number(data.durationMinutes)
  const service = await prisma.service.update({ where: { id: Number(id) }, data })
  res.json(service)
}

export async function deleteService(req: Request, res: Response) {
  await prisma.service.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
}
