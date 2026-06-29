import { useState } from 'react'
import { publicApi } from '../../api/public'
import type { BookingState } from '../../pages/BookingPage'
import Button from '../ui/Button'

interface Props {
  booking: BookingState
  onConfirm: (id: number) => void
  onBack: () => void
}

export default function Step5Confirm({ booking, onConfirm, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { service, master, slot, date, contact, priceInfo } = booking

  const startDate = slot ? new Date(slot) : null
  const dateStr = startDate?.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = startDate?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const handleConfirm = async () => {
    if (!service || !master || !slot || !contact) return
    setLoading(true)
    setError(null)
    try {
      const result = await publicApi.createAppointment({
        clientName: contact.name,
        clientPhone: contact.phone,
        clientEmail: contact.email || undefined,
        masterId: master.id,
        serviceId: service.id,
        startAt: slot,
        notes: contact.notes || undefined,
      })
      onConfirm(result.id)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Ошибка при создании записи. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Назад</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Подтверждение записи</h2>
      <p className="text-gray-500 mb-6">Проверьте данные перед подтверждением</p>

      <div className="max-w-md bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <Row label="Услуга" value={service?.name ?? ''} />
        <Row label="Мастер" value={master?.name ?? ''} />
        <Row label="Дата" value={dateStr ?? ''} />
        <Row label="Время" value={timeStr ?? ''} />
        <Row label="Длительность" value={`${service?.durationMinutes} мин`} />
        <div className="border-t border-gray-100 pt-4">
          <Row label="Имя" value={contact?.name ?? ''} />
          <Row label="Телефон" value={contact?.phone ?? ''} />
          <Row label="Email" value={contact?.email ?? ''} />
          {contact?.notes && <Row label="Пожелания" value={contact.notes} />}
        </div>
        <div className="border-t border-gray-100 pt-4">
          {priceInfo && priceInfo.discountPercent > 0 ? (
            <>
              <Row label="Базовая цена" value={`${priceInfo.basePrice.toLocaleString('ru-RU')} ₽`} />
              <Row label={`Скидка (${priceInfo.discountPercent}%)`} value={`-${(priceInfo.basePrice - priceInfo.finalPrice).toLocaleString('ru-RU')} ₽`} />
              {priceInfo.promotionName && <Row label="Акция" value={priceInfo.promotionName} />}
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Итого</span>
                <span className="text-rose-600">{priceInfo.finalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-bold text-lg">
              <span>Итого</span>
              <span className="text-rose-600">{priceInfo?.finalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={onBack} disabled={loading}>← Назад</Button>
        <Button onClick={handleConfirm} loading={loading} size="lg">
          Подтвердить запись
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}
