import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Sparkles } from 'lucide-react'
import { publicApi } from '../api/public'
import { useSeason } from '../hooks/useSeason'
import { useSiteConfig } from '../hooks/useSiteConfig'
import SeasonalEffects from '../components/SeasonalEffects'
import PublicFooter from '../components/PublicFooter'
import PhoneInput from '../components/ui/PhoneInput'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { confirmDialog } from '../store/confirm.store'
import type { Appointment } from '../types'

export default function MyBookingsPage() {
  const theme = useSeason()
  const site = useSiteConfig()

  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 11) return setError('Введите номер телефона полностью')
    setError('')
    setLoading(true)
    try {
      const result = await publicApi.getMyAppointments(phone)
      setAppointments(result)
      setSearchedPhone(phone)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка поиска')
      setAppointments(null)
    } finally {
      setLoading(false)
    }
  }

  const cancel = async (id: number) => {
    if (!await confirmDialog('Отменить эту запись?')) return
    setCancellingId(id)
    try {
      const updated = await publicApi.cancelMyAppointment(id, searchedPhone)
      setAppointments(list => list?.map(a => a.id === id ? updated : a) ?? null)
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Не удалось отменить запись')
    } finally {
      setCancellingId(null)
    }
  }

  const now = Date.now()
  const canCancel = (a: Appointment) =>
    ['pending', 'confirmed'].includes(a.status) && new Date(a.startAt).getTime() > now

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${theme.gradient}`}>
      <SeasonalEffects season={theme.season} />
      <header className={`bg-white/80 backdrop-blur shadow-sm border-b ${theme.headerBorder}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.salonName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Мои записи</h1>
          </div>
          <Link to="/" className="text-xs sm:text-sm text-brand-500 hover:text-brand-600 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 shrink-0 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> К записи
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 w-full flex-1">
        <p className="text-gray-500 mb-6">Введите номер телефона, указанный при записи, чтобы посмотреть свои записи.</p>

        <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1">
            <PhoneInput value={phone} onChange={setPhone} error={error} />
          </div>
          <Button type="submit" loading={loading} size="lg">Найти</Button>
        </form>

        {appointments !== null && (
          appointments.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Записей с этим номером телефона не найдено</p>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id} className="surface p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{a.service.name}</p>
                      <p className="text-sm text-gray-500">Мастер: {a.master.name}</p>
                    </div>
                    <Badge status={a.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 shrink-0" /> {new Date(a.startAt).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 shrink-0" /> {new Date(a.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-gray-900">{a.totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  {a.notes && <p className="text-xs text-gray-400 mb-3">Пожелания: {a.notes}</p>}
                  {canCancel(a) && (
                    <Button variant="danger" size="sm" onClick={() => cancel(a.id)} loading={cancellingId === a.id}>
                      Отменить запись
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
