import prisma from '../lib/prisma'
import { salonLocalToUtc, parseSalonDateStart, parseSalonDateEnd } from '../lib/salonTime'

function parseTime(timeStr: string, year: number, month: number, day: number): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return salonLocalToUtc(year, month, day, hours, minutes)
}

export async function getAvailableSlots(
  masterId: number,
  serviceIds: number[],
  dateStr: string
): Promise<string[]> {
  if (serviceIds.length === 0) return []

  const [year, month, day] = dateStr.split('-').map(Number)
  // dayOfWeek must reflect the salon's local calendar date, not UTC's —
  // construct it from the same local wall-clock reference point (local noon
  // avoids any chance of crossing a UTC day boundary near midnight).
  const dayOfWeek = new Date(year, month - 1, day, 12).getDay()

  const workingHour = await prisma.workingHour.findFirst({
    where: { masterId, dayOfWeek, isActive: true },
  })
  if (!workingHour) return []

  // Booking multiple services back-to-back needs a slot long enough for all of them combined.
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } })
  if (services.length !== serviceIds.length) return []

  const durationMs = services.reduce((sum, s) => sum + s.durationMinutes, 0) * 60 * 1000
  const stepMs = 30 * 60 * 1000

  const workStart = parseTime(workingHour.startTime, year, month, day)
  const workEnd = parseTime(workingHour.endTime, year, month, day)

  const dayStart = parseSalonDateStart(dateStr)
  const dayEnd = parseSalonDateEnd(dateStr)

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
