import api from './client'
import type { Service, Master, Promotion, Appointment, WorkingHour, MasterPhoto } from '../types'

export const servicesApi = {
  list: () => api.get<Service[]>('/services').then(r => r.data),
  create: (data: Partial<Service>) => api.post<Service>('/services', data).then(r => r.data),
  update: (id: number, data: Partial<Service>) => api.put<Service>(`/services/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/services/${id}`),
}

export const mastersApi = {
  list: () => api.get<Master[]>('/masters').then(r => r.data),
  create: (data: { name: string; login: string; email?: string; phone?: string; password?: string; bio?: string; serviceIds?: number[] }) =>
    api.post<Master>('/masters', data).then(r => r.data),
  update: (id: number, data: Partial<{ name: string; login: string; email: string; phone: string; bio: string; serviceIds: number[]; password: string }>) =>
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
  myServices: () => api.get<Service[]>('/master/my-services').then(r => r.data),
  createAppointment: (data: { clientName: string; clientPhone: string; clientEmail?: string; serviceId: number; startAt: string; notes?: string; status?: string }) =>
    api.post<Appointment>('/appointments', data).then(r => r.data),
  listPhotos: () => api.get<MasterPhoto[]>('/master/photos').then(r => r.data),
  uploadPhoto: (file: File, caption?: string) => {
    const fd = new FormData()
    fd.append('photo', file)
    if (caption) fd.append('caption', caption)
    return api.post<MasterPhoto>('/master/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  deletePhoto: (id: number) => api.delete(`/master/photos/${id}`),
}

export interface EarningsReport {
  total: number
  count: number
  byService: Array<{ serviceId: number; name: string; category: string; count: number; total: number }>
  byMaster: Array<{ masterId: number; name: string; count: number; total: number }>
  byCategory: Array<{ category: string; count: number; total: number }>
}

export const reportsApi = {
  earnings: (params?: { from?: string; to?: string; statuses?: string }) =>
    api.get<EarningsReport>('/reports/earnings', { params }).then(r => r.data),
}

export const adminsApi = {
  list: () => api.get<Array<{ id: number; name: string; login: string; email: string | null; createdAt: string }>>('/admins').then(r => r.data),
  create: (data: { name: string; login: string; email?: string; password: string }) =>
    api.post('/admins', data).then(r => r.data),
  delete: (id: number) => api.delete(`/admins/${id}`),
}

export const settingsApi = {
  updateBookingForm: (config: unknown) => api.put('/settings/booking-form', config).then(r => r.data),
}

export const systemApi = {
  version: () => api.get<{ version: string; commit: string; branch: string }>('/system/version').then(r => r.data),
  checkUpdates: () => api.get<{ updateAvailable: boolean; local: string; remote: string; changes: string }>('/system/check-updates').then(r => r.data),
}

export const accountApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then(r => r.data),
}

export const authApi = {
  setupStatus: () => api.get<{ needsSetup: boolean }>('/setup/status').then(r => r.data),
  setup: (data: { name: string; login: string; email?: string; password: string }) =>
    api.post<{ token: string; user: { id: number; name: string; email: string; role: string } }>('/setup', data).then(r => r.data),
  login: (login: string, password: string) =>
    api.post<{ token: string; user: { id: number; name: string; email: string; role: string } }>('/auth/login', { login, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}
