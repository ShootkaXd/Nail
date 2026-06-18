import prisma from '../lib/prisma'

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export async function getAvailableSlots(
  masterId: number,
  serviceId: number,
  dateStr: string
): Promise<string[]> {
  // Parse as local midnight to avoid timezone shift on dayOfWeek
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()

  const workingHour = await prisma.workingHour.findFirst({
    where: { masterId, dayOfWeek, isActive: true },
  })
  if (!workingHour) return []

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return []

  const durationMs = service.durationMinutes * 60 * 1000
  const stepMs = 30 * 60 * 1000

  const workStart = parseTime(workingHour.startTime, date)
  const workEnd = parseTime(workingHour.endTime, date)

  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      masterId,
      startAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: ['cancelled'] },
    },
  })

  const slots: string[] = []
  let cursor = workStart.getTime()
  const workEndMs = workEnd.getTime()

  while (cursor + durationMs <= workEndMs) {
    const slotStart = cursor
    const slotEnd = cursor + durationMs

    const hasConflict = existingAppointments.some((appt) => {
      const apptStart = new Date(appt.startAt).getTime()
      const apptEnd = new Date(appt.endAt).getTime()
      return slotStart < apptEnd && slotEnd > apptStart
    })

    if (!hasConflict) {
      slots.push(new Date(slotStart).toISOString())
    }

    cursor += stepMs
  }

  return slots
}
