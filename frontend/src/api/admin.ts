import api from './client'
import type { Service, Master, Promotion, Appointment, WorkingHour } from '../types'

export const servicesApi = {
  list: () => api.get<Service[]>('/services').then(r => r.data),
  create: (data: Partial<Service>) => api.post<Service>('/services', data).then(r => r.data),
  update: (id: number, data: Partial<Service>) => api.put<Service>(`/services/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/services/${id}`),
}

export const mastersApi = {
  list: () => api.get<Master[]>('/masters').then(r => r.data),
  create: (data: { name: string; email: string; phone?: string; password?: string; bio?: string; serviceIds?: number[] }) =>
    api.post<Master>('/masters', data).then(r => r.data),
  update: (id: number, data: Partial<{ name: string; email: string; phone: string; bio: string; serviceIds: number[]; password: string }>) =>
    api.put<Master>(`/masters/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/masters/${id}`),
  getWorkingHours: (id: number) => api.get<WorkingHour[]>(`/masters/${id}/working-hours`).then(r => r.data),
  saveWorkingHours: (id: number, hours: WorkingHour[]) =>
    api.put<WorkingHour[]>(`/masters/${id}/working-hours`, hours).then(r => r.data),
}

export const promotionsApi = {
  list: () => api.get<Promotion[]>('/promotions').then(r => r.data),
  create: (data: Partial<Promotion>) => api.post<Promotion>('/promotions', data).then(r => r.data),
  update: (id: number, data: Partial<Promotion>) => api.put<Promotion>(`/promotions/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/promotions/${id}`),
}

export const appointmentsApi = {
  list: (params?: { status?: string; masterId?: number; from?: string; to?: string }) =>
    api.get<Appointment[]>('/appointments', { params }).then(r => r.data),
  updateStatus: (id: number, status: string) =>
    api.put<Appointment>(`/appointments/${id}/status`, { status }).then(r => r.data),
}

export const masterApi = {
  listMine: (params?: { from?: string; to?: string }) =>
    api.get<Appointment[]>('/appointments/mine', { params }).then(r => r.data),
  getWorkingHours: () => api.get<WorkingHour[]>('/working-hours').then(r => r.data),
  saveWorkingHours: (hours: WorkingHour[]) =>
    api.put<WorkingHour[]>('/working-hours', hours).then(r => r.data),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: number; name: string; email: string; role: string } }>('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}
