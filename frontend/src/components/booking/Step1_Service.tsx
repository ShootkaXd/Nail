import { useEffect, useState } from 'react'
import { publicApi } from '../../api/public'
import type { Service } from '../../types'
import CardSkeleton from '../ui/CardSkeleton'

interface Props {
  selected: Service | null
  onSelect: (s: Service) => void
}

export default function Step1Service({ selected, onSelect }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getServices().then(setServices).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите услугу</h2>
      <p className="text-gray-500 mb-6">Нажмите на услугу, чтобы продолжить</p>
      <CardSkeleton count={6} />
    </div>
  )

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    ;(acc[s.category] ??= []).push(s)
    return acc
  }, {})

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите услугу</h2>
      <p className="text-gray-500 mb-6">Нажмите на услугу, чтобы продолжить</p>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{category}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`text-left p-4 rounded-2xl border-2 transition-all animate-fade-in-up opacity-0 [animation-fill-mode:forwards] ${
                  selected?.id === s.id
                    ? 'border-brand-500 bg-brand-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/60 hover:border-brand-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-brand-600">{s.price.toLocaleString('ru-RU')} ₽</p>
                    <p className="text-xs text-gray-400">{s.durationMinutes} мин</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
