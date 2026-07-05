import { useEffect, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { mastersApi, servicesApi } from '../../api/admin'
import type { Master, Service, WorkingHour } from '../../types'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Avatar from '../../components/ui/Avatar'
import { useForm } from 'react-hook-form'

const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

function WorkingHoursEditor({ masterId, onClose }: { masterId: number; onClose: () => void }) {
  const defaultHours: WorkingHour[] = DAYS.map((_, i) => ({
    dayOfWeek: i, startTime: '09:00', endTime: '18:00', isActive: i >= 1 && i <= 5,
  }))
  const [hours, setHours] = useState<WorkingHour[]>(defaultHours)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    mastersApi.getWorkingHours(masterId).then(data => {
      if (data.length > 0) {
        const mapped = defaultHours.map(dh => data.find(d => d.dayOfWeek === dh.dayOfWeek) ?? dh)
        setHours(mapped)
      }
      setLoading(false)
    })
  }, [masterId])

  const update = (i: number, patch: Partial<WorkingHour>) =>
    setHours(h => h.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const save = async () => {
    setSaving(true)
    await mastersApi.saveWorkingHours(masterId, hours)
    setSaving(false)
    onClose()
  }

  if (loading) return <div className="py-8 text-center text-gray-400">Загрузка...</div>

  return (
    <div className="space-y-3">
      {hours.map((h, i) => (
        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${h.isActive ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
          <label className="flex items-center gap-2 w-36 cursor-pointer">
            <input type="checkbox" checked={h.isActive} onChange={e => update(i, { isActive: e.target.checked })} className="accent-brand-500" />
            <span className={`text-sm font-medium ${h.isActive ? 'text-gray-800' : 'text-gray-400'}`}>{DAYS[h.dayOfWeek]}</span>
          </label>
          {h.isActive && (
            <>
              <input type="time" value={h.startTime} onChange={e => update(i, { startTime: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
              <span className="text-gray-400">—</span>
              <input type="time" value={h.endTime} onChange={e => update(i, { endTime: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
            </>
          )}
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button onClick={save} loading={saving}>Сохранить</Button>
      </div>
    </div>
  )
}

type MasterForm = { name: string; login: string; email: string; phone: string; bio: string; address: string; password: string }

function MasterFormComponent({ master, services, onSave, onCancel }: { master?: Master; services: Service[]; onSave: () => void; onCancel: () => void }) {
  const [selectedServices, setSelectedServices] = useState<number[]>(
    master?.masterProfile?.masterServices.map(ms => ms.serviceId) ?? []
  )
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<MasterForm>({
    defaultValues: { name: master?.name ?? '', login: master?.login ?? '', email: '', phone: master?.phone ?? '', bio: master?.masterProfile?.bio ?? '', address: master?.masterProfile?.address ?? '', password: '' },
  })

  const submit = async (data: MasterForm): Promise<void> => {
    setLoading(true)
    try {
      const payload = { ...data, serviceIds: selectedServices }
      if (master) await mastersApi.update(master.id, payload)
      else await mastersApi.create(payload)
      onSave()
    } finally { setLoading(false) }
  }

  const toggleService = (id: number) =>
    setSelectedServices(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input label="Имя *" {...register('name', { required: true })} error={errors.name ? 'Обязательное поле' : ''} />
      {!master && <Input label="Логин *" {...register('login', { required: true })} placeholder="anna_master" error={errors.login ? 'Обязательное поле' : ''} />}
      {!master && <Input label="Email" type="email" {...register('email')} placeholder="anna@mail.ru" />}
      <Input label="Телефон" {...register('phone')} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">О мастере</label>
        <textarea {...register('bio')} rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none" />
      </div>
      <Input label="Адрес приёма" {...register('address')} placeholder="г. Москва, ул. Ленина 10, салон «Роза»" />
      {!master && <Input label="Пароль *" type="password" {...register('password', { required: true })} placeholder="Минимум 6 символов" error={errors.password ? 'Обязательное поле' : ''} />}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Услуги мастера</label>
        <div className="grid grid-cols-2 gap-2">
          {services.filter(s => s.isActive).map(s => (
            <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${selectedServices.includes(s.id) ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="checkbox" checked={selectedServices.includes(s.id)} onChange={() => toggleService(s.id)} className="accent-brand-500" />
              <span className="text-sm text-gray-700">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Отмена</Button>
        <Button type="submit" loading={loading}>{master ? 'Сохранить' : 'Создать'}</Button>
      </div>
    </form>
  )
}

export default function MastersPage() {
  const [masters, setMasters] = useState<Master[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [editing, setEditing] = useState<Master | null | 'new'>(null)
  const [hoursFor, setHoursFor] = useState<number | null>(null)

  const load = () => mastersApi.list().then(setMasters)
  useEffect(() => { load(); servicesApi.list().then(setServices) }, [])

  const del = async (id: number) => {
    if (!confirm('Удалить мастера?')) return
    await mastersApi.delete(id)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мастера</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" /> Добавить мастера
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {masters.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={m.name} url={m.masterProfile?.avatarUrl} size={48} />
              <div>
                <p className="font-bold text-gray-900">{m.name}</p>
                {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
              </div>
            </div>
            {m.masterProfile?.bio && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{m.masterProfile.bio}</p>}
            {m.masterProfile?.address && (
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" /> {m.masterProfile.address}
              </p>
            )}
            <p className="text-xs text-gray-400 mb-3">
              Услуг: {m.masterProfile?.masterServices.length ?? 0}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setEditing(m)} className="text-xs text-blue-500 hover:text-blue-700">Изменить</button>
              <button onClick={() => setHoursFor(m.id)} className="text-xs text-emerald-500 hover:text-emerald-700">График работы</button>
              <button onClick={() => del(m.id)} className="text-xs text-red-500 hover:text-red-700">Удалить</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Новый мастер' : 'Редактировать мастера'}>
        <MasterFormComponent
          master={editing !== 'new' && editing !== null ? editing : undefined}
          services={services}
          onSave={() => { setEditing(null); load() }}
          onCancel={() => setEditing(null)}
        />
      </Modal>

      <Modal open={hoursFor !== null} onClose={() => setHoursFor(null)} title="График работы" size="sm">
        {hoursFor !== null && <WorkingHoursEditor masterId={hoursFor} onClose={() => setHoursFor(null)} />}
      </Modal>
    </div>
  )
}
