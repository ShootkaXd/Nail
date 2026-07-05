import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { masterApi } from '../../api/admin'
import type { WorkingHour } from '../../types'
import Button from '../../components/ui/Button'

const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

const defaultHours: WorkingHour[] = DAYS.map((_, i) => ({
  dayOfWeek: i, startTime: '09:00', endTime: '18:00', isActive: i >= 1 && i <= 5,
}))

export default function WorkingHoursPage() {
  const [hours, setHours] = useState<WorkingHour[]>(defaultHours)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    masterApi.getWorkingHours().then(data => {
      if (data.length > 0) {
        setHours(defaultHours.map(dh => data.find(d => d.dayOfWeek === dh.dayOfWeek) ?? dh))
      }
      setLoading(false)
    })
  }, [])

  const update = (i: number, patch: Partial<WorkingHour>) =>
    setHours(h => h.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const save = async () => {
    setSaving(true)
    await masterApi.saveWorkingHours(hours)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="p-6 text-gray-400">Загрузка...</div>

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">График работы</h1>

      <div className="space-y-3">
        {hours.map((h, i) => (
          <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border transition ${h.isActive ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input type="checkbox" checked={h.isActive} onChange={e => update(i, { isActive: e.target.checked })} className="w-4 h-4 accent-brand-500" />
              <span className={`font-medium w-28 ${h.isActive ? 'text-gray-800' : 'text-gray-400'}`}>{DAYS[h.dayOfWeek]}</span>
            </label>
            {h.isActive ? (
              <div className="flex items-center gap-2">
                <input type="time" value={h.startTime} onChange={e => update(i, { startTime: e.target.value })}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-medium" />
                <span className="text-gray-400">—</span>
                <input type="time" value={h.endTime} onChange={e => update(i, { endTime: e.target.value })}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-medium" />
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Выходной</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} loading={saving} size="lg">Сохранить график</Button>
        {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Сохранено</span>}
      </div>
    </div>
  )
}
