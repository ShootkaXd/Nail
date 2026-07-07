import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { masterApi, appointmentsApi } from '../../api/admin'
import type { Appointment } from '../../types'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import MasterBookingForm from '../../components/master/MasterBookingForm'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  completed: '#6b7280',
}

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed']
const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', confirmed: 'Подтверждено', cancelled: 'Отменено', completed: 'Завершено' }

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [booking, setBooking] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)

  const load = () => masterApi.listMine().then(setAppointments)
  useEffect(() => { load() }, [])

  const events = appointments.map(a => ({
    id: String(a.id),
    title: `${a.clientName} — ${a.services.map(s => s.service.name).join(', ')}`,
    start: a.startAt,
    end: a.endAt,
    backgroundColor: STATUS_COLORS[a.status] ?? '#f43f5e',
    borderColor: STATUS_COLORS[a.status] ?? '#f43f5e',
    extendedProps: { appointment: a },
  }))

  const changeStatus = async (id: number, status: string) => {
    await appointmentsApi.updateStatus(id, status)
    load()
    setSelected(a => a ? { ...a, status: status as Appointment['status'] } : null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Мой календарь</h1>
        <Button onClick={() => setBooking(true)}>+ Записать клиента</Button>
        <div className="flex items-center gap-4 text-xs w-full sm:w-auto">
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[k] }} />
              <span className="text-gray-500">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="surface p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="ru"
          buttonText={{ today: 'Сегодня', month: 'Месяц', week: 'Неделя', day: 'День' }}
          events={events}
          eventClick={({ event }) => setSelected(event.extendedProps.appointment)}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          height="auto"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Детали записи" size="sm">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Статус</span>
              <Badge status={selected.status} />
            </div>
            <Row label="Клиент" value={selected.clientName} />
            <Row label="Телефон" value={selected.clientPhone} />
            <Row label={selected.services.length > 1 ? 'Услуги' : 'Услуга'} value={selected.services.map(s => s.service.name).join(', ')} />
            <Row label="Время" value={`${new Date(selected.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — ${new Date(selected.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`} />
            <Row label="Стоимость" value={`${selected.totalPrice.toLocaleString('ru-RU')} ₽`} />
            {selected.notes && <Row label="Пожелания" value={selected.notes} />}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 mb-2 text-xs">Изменить статус:</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => changeStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${selected.status === s ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:border-brand-300'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={booking} onClose={() => setBooking(false)} title="Записать клиента" size="sm">
        <MasterBookingForm onDone={() => { setBooking(false); load() }} onCancel={() => setBooking(false)} />
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-900">{value}</span></div>
}
