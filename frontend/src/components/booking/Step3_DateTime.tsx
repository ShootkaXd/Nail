import { useEffect, useState } from 'react'
import { publicApi } from '../../api/public'
import type { Master, PriceInfo, Service } from '../../types'
import Spinner from '../ui/Spinner'
import Button from '../ui/Button'

interface Props {
  service: Service
  master: Master
  selectedSlot: string | null
  selectedDate: string | null
  onSelect: (slot: string, date: string, priceInfo: PriceInfo) => void
  onBack: () => void
}

function toLocalDateStr(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export default function Step3DateTime({ service, master, selectedSlot, selectedDate, onSelect, onBack }: Props) {
  const [date, setDate] = useState<string>(selectedDate ?? toLocalDateStr(new Date()))
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    publicApi.getPrice(service.id, master.id).then(setPriceInfo)
  }, [service.id, master.id])

  useEffect(() => {
    setLoadingSlots(true)
    setSlots([])
    publicApi.getSlots(master.id, service.id, date)
      .then(setSlots)
      .finally(() => setLoadingSlots(false))
  }, [date, master.id, service.id])

  const calendarDays = () => {
    const { year, month } = currentMonth
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const days: (Date | null)[] = Array(first.getDay()).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const today = toLocalDateStr(new Date())
  const maxDate = toLocalDateStr(addDays(new Date(), 60))

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Назад</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите дату и время</h2>
      <p className="text-gray-500 mb-6">Мастер: <span className="font-medium text-gray-700">{master.name}</span></p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(m => {
                const d = new Date(m.year, m.month - 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >←</button>
            <span className="font-semibold">{MONTHS[currentMonth.month]} {currentMonth.year}</span>
            <button
              onClick={() => setCurrentMonth(m => {
                const d = new Date(m.year, m.month + 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays().map((d, i) => {
              if (!d) return <div key={i} />
              const ds = toLocalDateStr(d)
              const isPast = ds < today
              const isFuture = ds > maxDate
              const isSelected = ds === date
              return (
                <button
                  key={i}
                  disabled={isPast || isFuture}
                  onClick={() => setDate(ds)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                    isSelected ? 'bg-rose-500 text-white' :
                    isPast || isFuture ? 'text-gray-300 cursor-not-allowed' :
                    'hover:bg-rose-50 text-gray-700'
                  }`}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Slots */}
        <div>
          <p className="font-medium text-gray-700 mb-3">
            Доступное время на {new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {loadingSlots ? <Spinner className="py-8" /> : slots.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">Нет доступного времени на эту дату</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(slot => {
                const time = new Date(slot).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                const isSelected = slot === selectedSlot && date === selectedDate
                return (
                  <button
                    key={slot}
                    onClick={() => priceInfo && onSelect(slot, date, priceInfo)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-gray-200 bg-white hover:border-rose-400 text-gray-700'
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          )}

          {priceInfo && (
            <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Стоимость</span>
                <div className="text-right">
                  {priceInfo.discountPercent > 0 && (
                    <p className="text-sm text-gray-400 line-through">{priceInfo.basePrice.toLocaleString('ru-RU')} ₽</p>
                  )}
                  <p className="font-bold text-rose-600 text-lg">{priceInfo.finalPrice.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
              {priceInfo.promotionName && (
                <p className="text-xs text-rose-500 mt-1">🎉 Акция: {priceInfo.promotionName} (-{priceInfo.discountPercent}%)</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button variant="secondary" onClick={onBack}>← Назад</Button>
      </div>
    </div>
  )
}
