import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { servicesApi } from '../../api/admin'
import { confirmDialog } from '../../store/confirm.store'
import type { Service } from '../../types'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useForm } from 'react-hook-form'

type Form = { name: string; description: string; category: string; durationMinutes: number; price: number; isActive: boolean }

function ServiceForm({ service, onSave, onCancel }: { service?: Service; onSave: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    defaultValues: service ? { name: service.name, description: service.description ?? '', category: service.category, durationMinutes: service.durationMinutes, price: service.price, isActive: service.isActive } : { name: '', description: '', category: '', durationMinutes: 60, price: 0, isActive: true },
  })

  const submit = async (data: Form): Promise<void> => {
    setLoading(true)
    try {
      if (service) await servicesApi.update(service.id, data)
      else await servicesApi.create(data)
      onSave()
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input label="Название *" {...register('name', { required: true })} error={errors.name ? 'Обязательное поле' : ''} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Описание</label>
        <textarea {...register('description')} rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none" />
      </div>
      <Input label="Категория *" {...register('category', { required: true })} placeholder="Маникюр" error={errors.category ? 'Обязательное поле' : ''} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Длительность (мин) *" type="number" {...register('durationMinutes', { required: true, min: 5 })} />
        <Input label="Цена (₽) *" type="number" {...register('price', { required: true, min: 0 })} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('isActive')} className="rounded accent-brand-500" />
        <span className="text-sm font-medium text-gray-700">Услуга активна</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Отмена</Button>
        <Button type="submit" loading={loading}>{service ? 'Сохранить' : 'Создать'}</Button>
      </div>
    </form>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [editing, setEditing] = useState<Service | null | 'new'>(null)

  const load = () => servicesApi.list().then(setServices)
  useEffect(() => { load() }, [])

  const del = async (id: number) => {
    if (!await confirmDialog('Удалить услугу?')) return
    await servicesApi.delete(id)
    load()
  }

  const grouped = services.reduce<Record<string, Service[]>>((a, s) => { (a[s.category] ??= []).push(s); return a }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Услуги</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" /> Добавить услугу
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</h2>
          <div className="surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Услуга</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Длит.</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Цена</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      {s.description && <p className="text-gray-400 text-xs">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.durationMinutes} мин</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.price.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Активна' : 'Скрыта'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setEditing(s)} className="text-blue-500 hover:text-blue-700 text-xs">Изменить</button>
                      <button onClick={() => del(s.id)} className="text-red-500 hover:text-red-700 text-xs">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Новая услуга' : 'Редактировать услугу'}
      >
        <ServiceForm
          service={editing !== 'new' && editing !== null ? editing : undefined}
          onSave={() => { setEditing(null); load() }}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </div>
  )
}
