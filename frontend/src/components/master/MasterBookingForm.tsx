import { useEffect, useState } from 'react'
import { masterApi } from '../../api/admin'
import { publicApi } from '../../api/public'
import { useAuthStore } from '../../store/auth.store'
import type { Service } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import PhoneInput from '../ui/PhoneInput'

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MasterBookingForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { user } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState<number | ''>('')
  const [date, setDate] = useState(toLocalDateStr(new Date()))
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState({ clientName: '', clientPhone: '', clientEmail: '', notes: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { masterApi.myServices().then(setServices) }, [])

  useEffect(() => {
    if (!serviceId || !user) { setSlots([]); return }
    setLoadingSlots(true)
    setSlot(null)
    publicApi.getSlots(user.id, Number(serviceId), date)
      .then(setSlots)
      .finally(() => setLoadingSlots(false))
  }, [serviceId, date, user])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!serviceId) return setError('Выберите услугу')
    if (!slot) return setError('Выберите время')
    if (!form.clientName || !form.clientPhone) return setError('Укажите имя и телефон клиента')
    setSaving(true)
    try {
      await masterApi.createAppointment({
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || undefined,
        serviceId: Number(serviceId),
        startAt: slot,
        notes: form.notes || undefined,
        status: 'confirmed',
      })
      onDone()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Услуга *</label>
        <select value={serviceId} onChange={e => setServiceId(e.target.value ? Number(e.target.value) : '')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Выберите услугу</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price} ₽ ({s.durationMinutes} мин)</option>)}
        </select>
      </div>

      <Input label="Дата *" type="date" value={date} onChange={e => setDate(e.target.value)} />

      {serviceId && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Время *</label>
          {loadingSlots ? <p className="text-sm text-gray-400">Загрузка...</p> : slots.length === 0 ? (
            <p className="text-sm text-gray-400">Нет свободного времени на эту дату</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {slots.map(s => {
                const t = new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                return (
                  <button key={s} type="button" onClick={() => setSlot(s)}
                    className={`py-2 rounded-lg text-sm border-2 transition ${slot === s ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-200 hover:border-brand-400'}`}>
                    {t}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <Input label="Имя клиента *" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required />
        <PhoneInput label="Телефон клиента *" value={form.clientPhone} onChange={v => setForm(f => ({ ...f, clientPhone: v }))} required />
        <Input label="Email (необязательно)" type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Заметки</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>Отмена</Button>
        <Button type="submit" loading={saving}>Создать запись</Button>
      </div>
    </form>
  )
}
