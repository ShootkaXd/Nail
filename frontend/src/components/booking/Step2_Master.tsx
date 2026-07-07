import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { publicApi } from '../../api/public'
import type { Master, Service } from '../../types'
import CardSkeleton from '../ui/CardSkeleton'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

interface Props {
  services: Service[]
  selected: Master | null
  onSelect: (m: Master) => void
  onBack: () => void
}

export default function Step2Master({ services, selected, onSelect, onBack }: Props) {
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)

  const serviceIds = services.map(s => s.id)
  const idsKey = serviceIds.join(',')
  const basePrice = services.reduce((sum, s) => sum + s.price, 0)

  useEffect(() => {
    publicApi.getMasters(serviceIds).then(setMasters).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите мастера</h2>
      <p className="text-gray-500 mb-6">Услуги: <span className="font-medium text-gray-700">{services.map(s => s.name).join(', ')}</span></p>

      {loading ? <CardSkeleton count={4} /> : masters.length === 0 ? (
        <p className="text-center py-12 text-gray-400">Нет мастера, который выполняет все выбранные услуги</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {masters.map((m, i) => {
            const totalPrice = services.reduce((sum, s) => {
              const customPrice = m.masterProfile?.masterServices.find(ms => ms.serviceId === s.id)?.customPrice
              return sum + (customPrice ?? s.price)
            }, 0)
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
                      {totalPrice.toLocaleString('ru-RU')} ₽
                      {totalPrice !== basePrice && (
                        <span className="text-xs text-gray-400 ml-1 line-through">{basePrice.toLocaleString('ru-RU')} ₽</span>
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
