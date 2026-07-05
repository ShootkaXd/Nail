import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StepIndicator from '../components/booking/StepIndicator'
import Step1Service from '../components/booking/Step1_Service'
import Step2Master from '../components/booking/Step2_Master'
import Step3DateTime from '../components/booking/Step3_DateTime'
import Step4Contact from '../components/booking/Step4_Contact'
import Step5Confirm from '../components/booking/Step5_Confirm'
import { publicApi } from '../api/public'
import { useSeason } from '../hooks/useSeason'
import { useSiteConfig } from '../hooks/useSiteConfig'
import SeasonalEffects from '../components/SeasonalEffects'
import PublicFooter from '../components/PublicFooter'
import CookieNotice from '../components/CookieNotice'
import type { Service, Master, PriceInfo, BookingFormConfig } from '../types'

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

  const [formConfig, setFormConfig] = useState<BookingFormConfig | null>(null)

  useEffect(() => { publicApi.getFormConfig().then(setFormConfig).catch(() => {}) }, [])

  const update = (patch: Partial<BookingState>) => setBooking(b => ({ ...b, ...patch }))

  const theme = useSeason()
  const site = useSiteConfig()

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${theme.gradient}`}>
      <SeasonalEffects season={theme.season} />
      <header className={`bg-white/80 backdrop-blur shadow-sm border-b ${theme.headerBorder}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.salonName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">💅</div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{site.salonName}</h1>
              <p className="text-xs text-gray-500 truncate">{formConfig?.subtitle ?? 'Онлайн запись на услуги'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className={`hidden md:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${theme.badge}`}>
              {theme.emoji} {theme.label}
            </span>
            <Link to="/masters" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100">
              Мастера
            </Link>
            <Link to="/login" className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100">
              Вход
            </Link>
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
            formConfig={formConfig}
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
      <div className="flex-1" />
      <PublicFooter />
      <CookieNotice />
    </div>
  )
}
