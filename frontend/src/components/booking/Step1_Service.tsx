import { useEffect, useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { publicApi } from '../../api/public'
import type { Service } from '../../types'
import CardSkeleton from '../ui/CardSkeleton'
import Button from '../ui/Button'

const MAX_SERVICES = 5

interface Props {
  selected: Service[]
  onContinue: (services: Service[]) => void
}

export default function Step1Service({ selected, onContinue }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState<Service[]>(selected)

  useEffect(() => {
    publicApi.getServices().then(setServices).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите услуги</h2>
      <p className="text-gray-500 mb-6">Можно выбрать несколько услуг для одной записи</p>
      <CardSkeleton count={6} />
    </div>
  )

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    ;(acc[s.category] ??= []).push(s)
    return acc
  }, {})

  const toggle = (s: Service) => {
    setPicked(p => {
      const exists = p.some(x => x.id === s.id)
      if (exists) return p.filter(x => x.id !== s.id)
      if (p.length >= MAX_SERVICES) return p
      return [...p, s]
    })
  }

  const totalPrice = picked.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = picked.reduce((sum, s) => sum + s.durationMinutes, 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Выберите услуги</h2>
      <p className="text-gray-500 mb-6">Можно выбрать несколько услуг для одной записи (до {MAX_SERVICES})</p>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{category}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((s, i) => {
              const isSelected = picked.some(x => x.id === s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`text-left p-4 rounded-2xl border-2 transition-all animate-fade-in-up opacity-0 [animation-fill-mode:forwards] ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 shadow-sm'
                      : 'border-gray-100 bg-gray-50/60 hover:border-brand-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-brand-600">{s.price.toLocaleString('ru-RU')} ₽</p>
                      <p className="text-xs text-gray-400">{s.durationMinutes} мин</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 py-4 bg-white/95 backdrop-blur border-t border-gray-100 flex items-center justify-between gap-4">
        <div className="text-sm">
          {picked.length === 0 ? (
            <span className="text-gray-400">Услуги не выбраны</span>
          ) : (
            <>
              <span className="font-semibold text-gray-900">{picked.length} услуг{picked.length === 1 ? 'а' : picked.length < 5 ? 'и' : ''}</span>
              <span className="text-gray-400"> · {totalDuration} мин · </span>
              <span className="font-bold text-brand-600">{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </>
          )}
        </div>
        <Button disabled={picked.length === 0} onClick={() => onContinue(picked)}>
          Далее <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
