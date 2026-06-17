export interface Service {
  id: number
  name: string
  description: string | null
  category: string
  durationMinutes: number
  price: number
  isActive: boolean
}

export interface MasterProfile {
  id: number
  bio: string | null
  masterServices: Array<{ serviceId: number; customPrice: number | null }>
}

export interface Master {
  id: number
  name: string
  phone: string | null
  masterProfile: MasterProfile | null
}

export interface Promotion {
  id: number
  name: string
  serviceId: number | null
  discountPercent: number
  startDate: string
  endDate: string
  isActive: boolean
  service?: { name: string } | null
}

export interface WorkingHour {
  id?: number
  masterId?: number
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface Appointment {
  id: number
  clientName: string
  clientPhone: string
  clientEmail: string
  masterId: number
  serviceId: number
  startAt: string
  endAt: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  totalPrice: number
  createdAt: string
  master: { id: number; name: string }
  service: { id: number; name: string; category: string }
}

export interface PriceInfo {
  basePrice: number
  discountPercent: number
  finalPrice: number
  promotionName: string | null
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'master'
}
