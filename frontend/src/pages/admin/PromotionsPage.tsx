import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { promotionsApi, servicesApi } from '../../api/admin'
import type { Promotion, Service } from '../../types'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useForm } from 'react-hook-form'

type Form = { name: string; serviceId: string; discountPercent: number; startDate: string; endDate: string; isActive: boolean }

function PromotionForm({ promo, services, onSave, onCancel }: { promo?: Promotion; services: Service[]; onSave: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<Form>({
    defaultValues: promo ? {
      name: promo.name,
      serviceId: promo.serviceId ? String(promo.serviceId) : '',
      discountPercent: promo.discountPercent,
      startDate: promo.startDate.slice(0, 10),
      endDate: promo.endDate.slice(0, 10),
      isActive: promo.isActive,
    } : { name: '', serviceId: '', discountPercent: 10, startDate: '', endDate: '', isActive: true },
  })

  const submit = async (data: Form) => {
    setLoading(true)
    const payload = { ...data, serviceId: data.serviceId ? Number(data.serviceId) : null }
    try {
      if (promo) await promotionsApi.update(promo.id, payload)
      else await promotionsApi.create(payload)
      onSave()
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input label="Название акции *" {...register('name', { required: true })} placeholder="Летняя скидка" />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Услуга (или все услуги)</label>
        <select {...register('serviceId')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Все услуги</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <Input label="Скидка (%) *" type="number" {...register('discountPercent', { required: true, min: 1, max: 100 })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Начало *" type="date" {...register('startDate', { required: true })} />
        <Input label="Конец *" type="date" {...register('endDate', { required: true })} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('isActive')} className="accent-brand-500" />
        <span className="text-sm font-medium text-gray-700">Акция активна</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Отмена</Button>
        <Button type="submit" loading={loading}>{promo ? 'Сохранить' : 'Создать'}</Button>
      </div>
    </form>
  )
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [editing, setEditing] = useState<Promotion | null | 'new'>(null)

  const load = () => promotionsApi.list().then(setPromotions)
  useEffect(() => { load(); servicesApi.list().then(setServices) }, [])

  const del = async (id: number) => {
    if (!confirm('Удалить акцию?')) return
    await promotionsApi.delete(id)
    load()
  }

  const toggle = async (p: Promotion) => {
    await promotionsApi.update(p.id, { isActive: !p.isActive })
    load()
  }

  const now = new Date()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Акции и скидки</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" /> Добавить акцию
        </Button>
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Акция</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Услуга</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Скидка</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Период</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promotions.map(p => {
              const start = new Date(p.startDate)
              const end = new Date(p.endDate)
              const active = p.isActive && start <= now && end >= now
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.service?.name ?? 'Все услуги'}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-brand-600">-{p.discountPercent}%</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {start.toLocaleDateString('ru-RU')} — {end.toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(p)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {active ? 'Активна' : p.isActive ? 'Ожидает' : 'Отключена'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setEditing(p)} className="text-blue-500 hover:text-blue-700 text-xs">Изменить</button>
                    <button onClick={() => del(p.id)} className="text-red-500 hover:text-red-700 text-xs">Удалить</button>
                  </td>
                </tr>
              )
            })}
            {promotions.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Нет акций</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Новая акция' : 'Редактировать акцию'} size="sm">
        <PromotionForm
          promo={editing !== 'new' && editing !== null ? editing : undefined}
          services={services}
          onSave={() => { setEditing(null); load() }}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </div>
  )
}
