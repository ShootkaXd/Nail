import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { publicApi } from '../../api/public'
import type { Master, Service } from '../../types'
import Spinner from '../ui/Spinner'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

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
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите мастера</h2>
      <p className="text-gray-500 mb-6">Услуга: <span className="font-medium text-gray-700">{service.name}</span></p>

      {masters.length === 0 ? (
        <p className="text-center py-12 text-gray-400">Нет доступных мастеров для этой услуги</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {masters.map((m, i) => {
            const customPrice = m.masterProfile?.masterServices.find(ms => ms.serviceId === service.id)?.customPrice
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`text-left p-5 rounded-2xl border-2 transition-all animate-fade-in-up opacity-0 [animation-fill-mode:forwards] ${
                  selected?.id === m.id
                    ? 'border-brand-500 bg-brand-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/60 hover:border-brand-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar name={m.name} url={m.masterProfile?.avatarUrl} size={56} />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{m.name}</p>
                    {m.masterProfile?.bio && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{m.masterProfile.bio}</p>}
                    {m.masterProfile?.address && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {m.masterProfile.address}
                      </p>
                    )}
                    <p className="text-brand-600 font-semibold mt-1">
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
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Назад
        </Button>
      </div>
    </div>
  )
}
