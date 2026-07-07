import { useEffect, useState } from 'react'
import { reportsApi, type EarningsReport } from '../../api/admin'
import Spinner from '../../components/ui/Spinner'

const money = (n: number) => n.toLocaleString('ru-RU') + ' ₽'

const STATUS_PRESETS = [
  { key: 'completed,confirmed', label: 'Завершённые + подтверждённые' },
  { key: 'completed', label: 'Только завершённые' },
  { key: 'completed,confirmed,pending', label: 'Все, кроме отменённых' },
]

export default function ReportsPage() {
  const [report, setReport] = useState<EarningsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ from: '', to: '', statuses: 'completed,confirmed' })

  const load = () => {
    setLoading(true)
    const params: Record<string, string> = { statuses: filters.statuses }
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    reportsApi.earnings(params).then(setReport).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filters])

  const setThisMonth = () => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setFilters(f => ({ ...f, from: fmt(first), to: fmt(last) }))
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Бухгалтерия — учёт заработка</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">С даты</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">По дату</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Статусы</label>
          <select value={filters.statuses} onChange={e => setFilters(f => ({ ...f, statuses: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {STATUS_PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <button onClick={setThisMonth} className="text-sm text-brand-600 hover:text-brand-700 px-3 py-2">Текущий месяц</button>
        <button onClick={() => setFilters({ from: '', to: '', statuses: 'completed,confirmed' })} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Сбросить</button>
      </div>

      {loading ? <Spinner /> : report && (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white animate-fade-in-up">
              <p className="text-brand-100 text-sm">Общий заработок</p>
              <p className="text-3xl font-bold mt-1">{money(report.total)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fade-in-up [animation-delay:60ms]">
              <p className="text-gray-500 text-sm">Количество записей</p>
              <p className="text-3xl font-bold mt-1 text-gray-900">{report.count}</p>
              <p className="text-xs text-gray-400 mt-1">Средний чек: {money(report.count ? Math.round(report.total / report.count) : 0)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="animate-fade-in-up [animation-delay:120ms]"><ReportTable title="По услугам" rows={report.byService.map(s => ({ name: s.name, sub: s.category, count: s.count, total: s.total }))} total={report.total} /></div>
            <div className="animate-fade-in-up [animation-delay:160ms]"><ReportTable title="По мастерам" rows={report.byMaster.map(m => ({ name: m.name, sub: '', count: m.count, total: m.total }))} total={report.total} /></div>
            <div className="animate-fade-in-up [animation-delay:200ms]"><ReportTable title="По категориям" rows={report.byCategory.map(c => ({ name: c.category, sub: '', count: c.count, total: c.total }))} total={report.total} /></div>
          </div>
        </>
      )}
    </div>
  )
}

function ReportTable({ title, rows, total }: { title: string; rows: Array<{ name: string; sub: string; count: number; total: number }>; total: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">{title}</div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Наименование</th>
            <th className="text-right px-4 py-2 font-medium">Кол-во</th>
            <th className="text-right px-4 py-2 font-medium">Сумма</th>
            <th className="text-right px-4 py-2 font-medium">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2.5">
                <p className="font-medium text-gray-900">{r.name}</p>
                {r.sub && <p className="text-xs text-gray-400">{r.sub}</p>}
              </td>
              <td className="px-4 py-2.5 text-right text-gray-600">{r.count}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{money(r.total)}</td>
              <td className="px-4 py-2.5 text-right text-gray-400">{total ? Math.round((r.total / total) * 100) : 0}%</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Нет данных</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
