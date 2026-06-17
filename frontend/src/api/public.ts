import api from './client'
import type { Service, Master, PriceInfo } from '../types'

export const publicApi = {
  getServices: () => api.get<Service[]>('/public/services').then(r => r.data),
  getMasters: (serviceId?: number) =>
    api.get<Master[]>('/public/masters', { params: serviceId ? { serviceId } : {} }).then(r => r.data),
  getSlots: (masterId: number, serviceId: number, date: string) =>
    api.get<string[]>('/public/slots', { params: { masterId, serviceId, date } }).then(r => r.data),
  getPrice: (serviceId: number, masterId: number) =>
    api.get<PriceInfo>('/public/price', { params: { serviceId, masterId } }).then(r => r.data),
  createAppointment: (data: {
    clientName: string
    clientPhone: string
    clientEmail: string
    masterId: number
    serviceId: number
    startAt: string
    notes?: string
  }) => api.post('/public/appointments', data).then(r => r.data),
}
