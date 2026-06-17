import { useState } from 'react'
import StepIndicator from '../components/booking/StepIndicator'
import Step1Service from '../components/booking/Step1_Service'
import Step2Master from '../components/booking/Step2_Master'
import Step3DateTime from '../components/booking/Step3_DateTime'
import Step4Contact from '../components/booking/Step4_Contact'
import Step5Confirm from '../components/booking/Step5_Confirm'
import type { Service, Master, PriceInfo } from '../types'

export interface BookingState {
  service: Service | null
  master: Master | null
  slot: string | null
  date: string | null
  contact: { name: string; phone: string; email: string; notes: string } | null
  priceInfo: PriceInfo | null
  appointmentId: number | null
}

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [booking, setBooking] = useState<BookingState>({
    service: null, master: null, slot: null, date: null,
    contact: null, priceInfo: null, appointmentId: null,
  })

  const update = (patch: Partial<BookingState>) => setBooking(b => ({ ...b, ...patch }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">💅</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nail Studio</h1>
            <p className="text-xs text-gray-500">Онлайн запись на услуги</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {step < 6 && <StepIndicator current={step} />}

        {step === 1 && (
          <Step1Service
            onSelect={(service) => { update({ service, master: null, slot: null, date: null, priceInfo: null }); setStep(2) }}
            selected={booking.service}
          />
        )}
        {step === 2 && booking.service && (
          <Step2Master
            service={booking.service}
            selected={booking.master}
            onSelect={(master) => { update({ master, slot: null, date: null, priceInfo: null }); setStep(3) }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && booking.service && booking.master && (
          <Step3DateTime
            service={booking.service}
            master={booking.master}
            selectedSlot={booking.slot}
            selectedDate={booking.date}
            onSelect={(slot, date, priceInfo) => { update({ slot, date, priceInfo }); setStep(4) }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Contact
            contact={booking.contact}
            onSubmit={(contact) => { update({ contact }); setStep(5) }}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && booking.service && booking.master && booking.slot && booking.contact && (
          <Step5Confirm
            booking={booking}
            onConfirm={(id) => { update({ appointmentId: id }); setStep(6) }}
            onBack={() => setStep(4)}
          />
        )}
        {step === 6 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Запись создана!</h2>
            <p className="text-gray-500 mb-1">Номер записи: <strong>#{booking.appointmentId}</strong></p>
            <p className="text-gray-500 mb-6">Мы свяжемся с вами для подтверждения</p>
            <button
              onClick={() => { setStep(1); setBooking({ service: null, master: null, slot: null, date: null, contact: null, priceInfo: null, appointmentId: null }) }}
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              Записаться ещё раз
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
