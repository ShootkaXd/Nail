import prisma from '../lib/prisma'

// The salon operates on Russian local time. Working hours entered by
// admins/masters ("09:00"–"18:00") are wall-clock times in this timezone,
// not the server process's timezone (which is UTC in Docker by default).
// Russia has used a single permanent offset (no DST) since 2014, so a fixed
// offset is safe and avoids depending on the container having IANA tzdata
// installed / TZ env configured correctly.
const SALON_UTC_OFFSET_HOURS = 3 // Europe/Moscow (MSK, UTC+3, no DST)

// Builds the UTC instant corresponding to a given wall-clock date/time in
// the salon's local timezone — independent of the server's own TZ setting.
function salonLocalToUtc(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hours - SALON_UTC_OFFSET_HOURS, minutes))
}

function parseTime(timeStr: string, year: number, month: number, day: number): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return salonLocalToUtc(year, month, day, hours, minutes)
}

export async function getAvailableSlots(
  masterId: number,
  serviceId: number,
  dateStr: string
): Promise<string[]> {
  const [year, month, day] = dateStr.split('-').map(Number)
  // dayOfWeek must reflect the salon's local calendar date, not UTC's —
  // construct it from the same local wall-clock reference point (local noon
  // avoids any chance of crossing a UTC day boundary near midnight).
  const dayOfWeek = new Date(year, month - 1, day, 12).getDay()

  const workingHour = await prisma.workingHour.findFirst({
    where: { masterId, dayOfWeek, isActive: true },
  })
  if (!workingHour) return []

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return []

  const durationMs = service.durationMinutes * 60 * 1000
  const stepMs = 30 * 60 * 1000

  const workStart = parseTime(workingHour.startTime, year, month, day)
  const workEnd = parseTime(workingHour.endTime, year, month, day)

  const dayStart = salonLocalToUtc(year, month, day, 0, 0)
  const dayEnd = new Date(salonLocalToUtc(year, month, day + 1, 0, 0).getTime() - 1)

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
