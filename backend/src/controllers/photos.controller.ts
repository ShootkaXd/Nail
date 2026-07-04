import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import prisma from '../lib/prisma'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`)
  },
})

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Разрешены только изображения (jpg, png, webp, gif)'))
  },
}).single('photo')

async function resolveProfileId(userId: number, role: string, bodyMasterId?: unknown): Promise<number | null> {
  if (role === 'admin' && bodyMasterId) {
    const p = await prisma.masterProfile.findUnique({ where: { userId: Number(bodyMasterId) } })
    return p?.id ?? null
  }
  const p = await prisma.masterProfile.findUnique({ where: { userId } })
  return p?.id ?? null
}

export async function uploadPhoto(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })

  const profileId = await resolveProfileId(req.user!.id, req.user!.role, req.body.masterId)
  if (!profileId) {
    fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {})
    return res.status(404).json({ error: 'Профиль мастера не найден' })
  }

  const photo = await prisma.masterPhoto.create({
    data: {
      masterId: profileId,
      url: `/uploads/${req.file.filename}`,
      caption: req.body.caption || null,
    },
  })
  res.status(201).json(photo)
}

export async function listMyPhotos(req: Request, res: Response) {
  const profileId = await resolveProfileId(req.user!.id, req.user!.role, undefined)
  if (!profileId) return res.json([])
  const photos = await prisma.masterPhoto.findMany({ where: { masterId: profileId }, orderBy: { createdAt: 'desc' } })
  res.json(photos)
}

export async function deletePhoto(req: Request, res: Response) {
  const id = Number(req.params.id)
  const photo = await prisma.masterPhoto.findUnique({ where: { id }, include: { master: true } })
  if (!photo) return res.status(404).json({ error: 'Фото не найдено' })

  // Master can only delete own photos
  if (req.user!.role === 'master') {
    const profile = await prisma.masterProfile.findUnique({ where: { userId: req.user!.id } })
    if (!profile || profile.id !== photo.masterId) {
      return res.status(403).json({ error: 'Нет доступа' })
    }
  }

  // Remove file from disk if local
  if (photo.url.startsWith('/uploads/')) {
    const filePath = path.join(UPLOAD_DIR, path.basename(photo.url))
    fs.unlink(filePath, () => {})
  }
  await prisma.masterPhoto.delete({ where: { id } })
  res.status(204).send()
}
