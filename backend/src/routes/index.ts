import { Router } from 'express'
import { login, me } from '../controllers/auth.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { listServices, createService, updateService, deleteService } from '../controllers/services.controller'
import { listMasters, createMaster, updateMaster, deleteMaster } from '../controllers/masters.controller'
import { listPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotions.controller'
import { listAll, listMine, updateStatus } from '../controllers/appointments.controller'
import { getMyHours, saveMyHours, getMasterHours, saveMasterHours } from '../controllers/workingHours.controller'
import { getServices, getMasters, getSlots, getPrice, createAppointment } from '../controllers/public.controller'

const router = Router()

// Public
router.get('/public/services', getServices)
router.get('/public/masters', getMasters)
router.get('/public/slots', getSlots)
router.get('/public/price', getPrice)
router.post('/public/appointments', createAppointment)

// Auth
router.post('/auth/login', login)
router.get('/auth/me', authenticate, me)

// Admin — services
router.get('/services', authenticate, requireRole('admin'), listServices)
router.post('/services', authenticate, requireRole('admin'), createService)
router.put('/services/:id', authenticate, requireRole('admin'), updateService)
router.delete('/services/:id', authenticate, requireRole('admin'), deleteService)

// Admin — masters
router.get('/masters', authenticate, requireRole('admin'), listMasters)
router.post('/masters', authenticate, requireRole('admin'), createMaster)
router.put('/masters/:id', authenticate, requireRole('admin'), updateMaster)
router.delete('/masters/:id', authenticate, requireRole('admin'), deleteMaster)

// Admin — promotions
router.get('/promotions', authenticate, requireRole('admin'), listPromotions)
router.post('/promotions', authenticate, requireRole('admin'), createPromotion)
router.put('/promotions/:id', authenticate, requireRole('admin'), updatePromotion)
router.delete('/promotions/:id', authenticate, requireRole('admin'), deletePromotion)

// Admin — all appointments
router.get('/appointments', authenticate, requireRole('admin'), listAll)
router.put('/appointments/:id/status', authenticate, requireRole('admin', 'master'), updateStatus)

// Master — working hours for admin to edit
router.get('/masters/:id/working-hours', authenticate, requireRole('admin'), getMasterHours)
router.put('/masters/:id/working-hours', authenticate, requireRole('admin'), saveMasterHours)

// Master — own
router.get('/appointments/mine', authenticate, requireRole('master'), listMine)
router.get('/working-hours', authenticate, requireRole('master'), getMyHours)
router.put('/working-hours', authenticate, requireRole('master'), saveMyHours)

export default router
