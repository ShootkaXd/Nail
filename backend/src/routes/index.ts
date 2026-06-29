import { Router } from 'express'
import { login, me } from '../controllers/auth.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { authLimiter, bookingLimiter } from '../middleware/rateLimit'
import { validateBody, loginSchema, setupSchema, createAppointmentSchema } from '../lib/validation'
import { listServices, createService, updateService, deleteService } from '../controllers/services.controller'
import { listMasters, createMaster, updateMaster, deleteMaster } from '../controllers/masters.controller'
import { listPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotions.controller'
import { listAll, listMine, updateStatus } from '../controllers/appointments.controller'
import { getMyHours, saveMyHours, getMasterHours, saveMasterHours } from '../controllers/workingHours.controller'
import { getServices, getMasters, getSlots, getPrice, createAppointment } from '../controllers/public.controller'
import { setupStatus, setup } from '../controllers/setup.controller'
import { listAdmins, createAdmin, deleteAdmin, changePassword } from '../controllers/admins.controller'
import { getBookingFormPublic, updateBookingForm } from '../controllers/settings.controller'
import { versionInfo, checkUpdates } from '../controllers/system.controller'

const router = Router()

// Setup (first admin)
router.get('/setup/status', setupStatus)
router.post('/setup', authLimiter, validateBody(setupSchema), setup)

// Public
router.get('/public/services', getServices)
router.get('/public/masters', getMasters)
router.get('/public/slots', getSlots)
router.get('/public/price', getPrice)
router.get('/public/form-config', getBookingFormPublic)
router.post('/public/appointments', bookingLimiter, validateBody(createAppointmentSchema), createAppointment)

// Auth
router.post('/auth/login', authLimiter, validateBody(loginSchema), login)
router.get('/auth/me', authenticate, me)
router.post('/auth/change-password', authenticate, changePassword)

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

// Admin — admins management
router.get('/admins', authenticate, requireRole('admin'), listAdmins)
router.post('/admins', authenticate, requireRole('admin'), createAdmin)
router.delete('/admins/:id', authenticate, requireRole('admin'), deleteAdmin)

// Admin — promotions
router.get('/promotions', authenticate, requireRole('admin'), listPromotions)
router.post('/promotions', authenticate, requireRole('admin'), createPromotion)
router.put('/promotions/:id', authenticate, requireRole('admin'), updatePromotion)
router.delete('/promotions/:id', authenticate, requireRole('admin'), deletePromotion)

// Admin — booking form settings
router.put('/settings/booking-form', authenticate, requireRole('admin'), updateBookingForm)

// Admin — system / updates
router.get('/system/version', authenticate, requireRole('admin'), versionInfo)
router.get('/system/check-updates', authenticate, requireRole('admin'), checkUpdates)

// Admin — all appointments
router.get('/appointments', authenticate, requireRole('admin'), listAll)
router.put('/appointments/:id/status', authenticate, requireRole('admin', 'master'), updateStatus)

// Working hours (admin editing a master)
router.get('/masters/:id/working-hours', authenticate, requireRole('admin'), getMasterHours)
router.put('/masters/:id/working-hours', authenticate, requireRole('admin'), saveMasterHours)

// Master — own
router.get('/appointments/mine', authenticate, requireRole('master'), listMine)
router.get('/working-hours', authenticate, requireRole('master'), getMyHours)
router.put('/working-hours', authenticate, requireRole('master'), saveMyHours)

export default router
