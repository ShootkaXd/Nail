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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done ? 'bg-rose-500 text-white' : active ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-gray-200 text-gray-500'
              }`}>
                {done ? '✓' : num}
              </div>
              <span className={`mt-1 text-xs hidden sm:block ${active ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-5 ${done ? 'bg-rose-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
