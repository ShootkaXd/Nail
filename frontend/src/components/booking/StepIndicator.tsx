import { Check } from 'lucide-react'

const steps = ['Услуга', 'Мастер', 'Дата и время', 'Контакты', 'Подтверждение']

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                done ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-500/30'
                  : active ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white ring-4 ring-brand-100 scale-110 shadow-md shadow-brand-500/30'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`mt-1.5 text-xs hidden sm:block transition-colors ${active ? 'text-brand-600 font-semibold' : done ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-12 sm:w-20 h-1 mx-1 mb-5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500 ${done ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
