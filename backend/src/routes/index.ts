import { Router } from 'express'
import { login, me } from '../controllers/auth.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { authLimiter, bookingLimiter, myBookingsLimiter } from '../middleware/rateLimit'
import { validateBody, loginSchema, setupSchema, createAppointmentSchema } from '../lib/validation'
import { listServices, createService, updateService, deleteService } from '../controllers/services.controller'
import { listMasters, createMaster, updateMaster, deleteMaster, getMyProfile, updateMyProfile } from '../controllers/masters.controller'
import { listPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotions.controller'
import { getMyHours, saveMyHours, getMasterHours, saveMasterHours } from '../controllers/workingHours.controller'
import { getServices, getMasters, getMastersGallery, getSlots, getPrice, createAppointment, getMyAppointments, cancelMyAppointment } from '../controllers/public.controller'
import { listAll, listMine, updateStatus, myServices, createByStaff } from '../controllers/appointments.controller'
import { earnings } from '../controllers/reports.controller'
import { uploadMiddleware, uploadPhoto, listMyPhotos, deletePhoto } from '../controllers/photos.controller'
import { setupStatus, setup } from '../controllers/setup.controller'
import { listAdmins, createAdmin, deleteAdmin, changePassword } from '../controllers/admins.controller'
import { getBookingFormPublic, updateBookingForm, getSitePublic, updateSite, uploadLogo } from '../controllers/settings.controller'
import { logoUploadMiddleware } from '../controllers/photos.controller'
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
router.get('/public/masters-gallery', getMastersGallery)
router.post('/public/appointments', bookingLimiter, validateBody(createAppointmentSchema), createAppointment)
router.get('/public/my-appointments', myBookingsLimiter, getMyAppointments)
router.put('/public/appointments/:id/cancel', myBookingsLimiter, cancelMyAppointment)

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

// Site config (public read; admin write + logo upload)
router.get('/public/site-config', getSitePublic)
router.put('/settings/site', authenticate, requireRole('admin'), updateSite)
router.post('/settings/logo', authenticate, requireRole('admin'), logoUploadMiddleware, uploadLogo)

// Admin — system / updates
router.get('/system/version', authenticate, requireRole('admin'), versionInfo)
router.get('/system/check-updates', authenticate, requireRole('admin'), checkUpdates)

// Admin — accounting / earnings report
router.get('/reports/earnings', authenticate, requireRole('admin'), earnings)

// Staff booking (master books own client, admin any)
router.post('/appointments', authenticate, requireRole('master', 'admin'), createByStaff)
router.get('/master/my-services', authenticate, requireRole('master'), myServices)
router.get('/master/profile', authenticate, requireRole('master'), getMyProfile)
router.put('/master/profile', authenticate, requireRole('master'), updateMyProfile)

// Master portfolio photos
router.get('/master/photos', authenticate, requireRole('master', 'admin'), listMyPhotos)
router.post('/master/photos', authenticate, requireRole('master', 'admin'), uploadMiddleware, uploadPhoto)
router.delete('/master/photos/:id', authenticate, requireRole('master', 'admin'), deletePhoto)

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
