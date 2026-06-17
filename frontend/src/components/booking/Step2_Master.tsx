import { useEffect, useState } from 'react'
import { publicApi } from '../../api/public'
import type { Master, Service } from '../../types'
import Spinner from '../ui/Spinner'
import Button from '../ui/Button'

interface Props {
  service: Service
  selected: Master | null
  onSelect: (m: Master) => void
  onBack: () => void
}

export default function Step2Master({ service, selected, onSelect, onBack }: Props) {
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getMasters(service.id).then(setMasters).finally(() => setLoading(false))
  }, [service.id])

  if (loading) return <Spinner />

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← Назад
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите мастера</h2>
      <p className="text-gray-500 mb-6">Услуга: <span className="font-medium text-gray-700">{service.name}</span></p>

      {masters.length === 0 ? (
        <p className="text-center py-12 text-gray-400">Нет доступных мастеров для этой услуги</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {masters.map(m => {
            const customPrice = m.masterProfile?.masterServices.find(ms => ms.serviceId === service.id)?.customPrice
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className={`text-left p-5 rounded-xl border-2 transition-all ${
                  selected?.id === m.id
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-200 bg-white hover:border-rose-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{m.name}</p>
                    {m.masterProfile?.bio && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{m.masterProfile.bio}</p>}
                    <p className="text-rose-600 font-semibold mt-1">
                      {(customPrice ?? service.price).toLocaleString('ru-RU')} ₽
                      {customPrice && customPrice !== service.price && (
                        <span className="text-xs text-gray-400 ml-1 line-through">{service.price.toLocaleString('ru-RU')} ₽</span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Button variant="secondary" onClick={onBack}>← Назад</Button>
      </div>
    </div>
  )
}
