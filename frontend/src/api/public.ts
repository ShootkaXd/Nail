import api from './client'
import type { Service, Master, PriceInfo, BookingFormConfig, GalleryMaster, SiteConfig, Appointment } from '../types'

export const publicApi = {
  getServices: () => api.get<Service[]>('/public/services').then(r => r.data),
  getMasters: (serviceIds?: number[]) =>
    api.get<Master[]>('/public/masters', { params: serviceIds?.length ? { serviceIds: serviceIds.join(',') } : {} }).then(r => r.data),
  getSlots: (masterId: number, serviceIds: number[], date: string) =>
    api.get<string[]>('/public/slots', { params: { masterId, serviceIds: serviceIds.join(','), date } }).then(r => r.data),
  getPrice: (serviceIds: number[], masterId: number) =>
    api.get<PriceInfo>('/public/price', { params: { serviceIds: serviceIds.join(','), masterId } }).then(r => r.data),
  getFormConfig: () => api.get<BookingFormConfig>('/public/form-config').then(r => r.data),
  getMastersGallery: () => api.get<GalleryMaster[]>('/public/masters-gallery').then(r => r.data),
  getSiteConfig: () => api.get<SiteConfig>('/public/site-config').then(r => r.data),
  getTheme: () => api.get<{ primaryColor: string; fontFamily: string }>('/public/theme').then(r => r.data),
  createAppointment: (data: {
    clientName: string
    clientPhone: string
    clientEmail?: string
    masterId: number
    serviceIds: number[]
    startAt: string
    notes?: string
    consent: boolean
  }) => api.post('/public/appointments', data).then(r => r.data),
  getMyAppointments: (phone: string) =>
    api.get<Appointment[]>('/public/my-appointments', { params: { phone } }).then(r => r.data),
  cancelMyAppointment: (id: number, phone: string) =>
    api.put<Appointment>(`/public/appointments/${id}/cancel`, { phone }).then(r => r.data),
}
