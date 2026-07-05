import { useEffect, useState } from 'react'
import { appointmentsApi, mastersApi } from '../../api/admin'
import type { Appointment, Master } from '../../types'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed']
const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', confirmed: 'Подтверждено', cancelled: 'Отменено', completed: 'Завершено' }

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Appointment | null>(null)
  const [filters, setFilters] = useState({ status: '', masterId: '', from: '', to: '' })

  const load = async () => {
    setLoading(true)
    const params: Record<string, string | number> = {}
    if (filters.status) params.status = filters.status
    if (filters.masterId) params.masterId = Number(filters.masterId)
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to + 'T23:59:59'
    await appointmentsApi.list(params as Parameters<typeof appointmentsApi.list>[0]).then(setAppointments)
    setLoading(false)
  }

  useEffect(() => { mastersApi.list().then(setMasters) }, [])
  useEffect(() => { load() }, [filters])

  const changeStatus = async (id: number, status: string) => {
    await appointmentsApi.updateStatus(id, status)
    load()
    if (detail?.id === id) setDetail(a => a ? { ...a, status: status as Appointment['status'] } : null)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Записи</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Все статусы</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filters.masterId} onChange={e => setFilters(f => ({ ...f, masterId: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Все мастера</option>
          {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="От" />
        <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="До" />
        <button onClick={() => setFilters({ status: '', masterId: '', from: '', to: '' })}
          className="text-sm text-gray-500 hover:text-gray-700 px-3">Сбросить</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Клиент</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Услуга</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Мастер</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата/Время</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Цена</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(a)}>
                  <td className="px-4 py-3 text-gray-400">#{a.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.clientName}</p>
                    <p className="text-xs text-gray-400">{a.clientPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.service.name}</td>
                  <td className="px-4 py-3 text-gray-700">{a.master.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{new Date(a.startAt).toLocaleDateString('ru-RU')}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} —{' '}
                      {new Date(a.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{a.totalPrice.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3"><Badge status={a.status} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={a.status}
                      onChange={e => changeStatus(a.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Записей не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={`Запись #${detail?.id}`} size="sm">
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Клиент" value={detail.clientName} />
            <Row label="Телефон" value={detail.clientPhone} />
            <Row label="Email" value={detail.clientEmail ?? '—'} />
            <Row label="Услуга" value={detail.service.name} />
            <Row label="Мастер" value={detail.master.name} />
            <Row label="Дата" value={new Date(detail.startAt).toLocaleString('ru-RU')} />
            <Row label="Стоимость" value={`${detail.totalPrice.toLocaleString('ru-RU')} ₽`} />
            {detail.notes && <Row label="Пожелания" value={detail.notes} />}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 mb-2">Изменить статус:</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => changeStatus(detail.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${detail.status === s ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:border-brand-300'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-900">{value}</span></div>
}
