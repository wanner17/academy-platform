import type { AttendanceStatus } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { getKoreaMinutes, getKoreaDateParts, toStoredKoreaDate, getKoreaDayOfWeek } from '@/lib/utils/korea-time'

export type AttendanceSettingInput = {
  isEnabled: boolean
  latitude?: number
  longitude?: number
  radiusMeters: number
}

export type StudentCheckInInput = {
  accuracyMeters?: number
  latitude: number
  longitude: number
}

export type ManualAttendanceInput = {
  attendanceDate: Date
  memo?: string
  scheduleId?: string
  status: AttendanceStatus
  studentId: string
  updatedById: string
}

const LATE_GRACE_MINUTES = 5
const CHECKIN_EARLY_MINUTES = 30

export const attendanceService = {
  getSetting(academyId: string) {
    return prisma.attendanceSetting.findUnique({ where: { academyId } })
  },

  upsertSetting(academyId: string, data: AttendanceSettingInput) {
    return prisma.attendanceSetting.upsert({
      where: { academyId },
      update: data,
      create: { ...data, academyId },
    })
  },

  getRecordsByDate(academyId: string, date: Date) {
    const attendanceDate = toAttendanceDate(date)
    return prisma.attendanceRecord.findMany({
      where: { academyId, attendanceDate },
      include: {
        schedule: true,
        student: { include: { enrollments: { include: { program: true } }, user: true } },
        updatedBy: true,
      },
      orderBy: [{ student: { name: 'asc' } }, { schedule: { startTime: 'asc' } }, { createdAt: 'asc' }],
    })
  },

  getStudentRecordForDate(academyId: string, studentId: string, date: Date) {
    return prisma.attendanceRecord.findFirst({
      where: { academyId, studentId, attendanceDate: toAttendanceDate(date) },
      orderBy: { createdAt: 'asc' },
    })
  },

  getStudentRecordsForDate(academyId: string, studentId: string, date: Date) {
    return prisma.attendanceRecord.findMany({
      where: { academyId, studentId, attendanceDate: toAttendanceDate(date) },
      include: { schedule: true },
      orderBy: { createdAt: 'asc' },
    })
  },

  getStudentRecordsForMonth(academyId: string, studentId: string, year: number, monthIndex: number) {
    const start = new Date(Date.UTC(year, monthIndex, 1))
    const end = new Date(Date.UTC(year, monthIndex + 1, 1))
    return prisma.attendanceRecord.findMany({
      where: {
        academyId,
        attendanceDate: { gte: start, lt: end },
        studentId,
      },
      include: { schedule: true },
      orderBy: [{ attendanceDate: 'asc' }, { schedule: { startTime: 'asc' } }, { createdAt: 'asc' }],
    })
  },

  async getTodaySchedulesForStudent(studentId: string, date: Date) {
    const dayOfWeek = getKoreaDayOfWeek(date)
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: {
        program: {
          include: { schedules: { where: { dayOfWeek, isActive: true }, orderBy: { startTime: 'asc' } } },
        },
      },
    })
    return enrollments.flatMap((e) => e.program.schedules)
  },

  async checkInStudent(academyId: string, studentId: string, input: StudentCheckInInput, scheduleId: string) {
    const setting = await this.getSetting(academyId)
    if (!setting?.isEnabled) throw new Error('Attendance is disabled')
    if (setting.latitude === null || setting.longitude === null) throw new Error('Academy location is not set')
    if (!isFiniteCoordinate(input.latitude, input.longitude)) throw new Error('Location is invalid')

    const distanceMeters = getDistanceMeters(setting.latitude, setting.longitude, input.latitude, input.longitude)
    if (distanceMeters > setting.radiusMeters) throw new Error('Outside attendance radius')

    const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, academyId, isActive: true } })
    if (!schedule) throw new Error('수업을 찾을 수 없습니다')

    const now = new Date()
    if (!isWithinCheckInWindow(schedule.startTime, schedule.endTime, now)) throw new Error('출석 가능 시간이 아닙니다')

    const status = isLate(schedule.startTime, now) ? 'LATE' : 'PRESENT'
    const attendanceDate = toAttendanceDate(now)

    const existing = await prisma.attendanceRecord.findFirst({
      where: { studentId, scheduleId: schedule.id, attendanceDate },
    })

    if (existing) {
      return prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          accuracyMeters: input.accuracyMeters,
          checkedAt: now,
          distanceMeters,
          latitude: input.latitude,
          longitude: input.longitude,
          source: 'STUDENT_LOCATION',
          status,
        },
      })
    }

    return prisma.attendanceRecord.create({
      data: {
        academyId,
        accuracyMeters: input.accuracyMeters,
        attendanceDate,
        checkedAt: now,
        distanceMeters,
        latitude: input.latitude,
        longitude: input.longitude,
        scheduleId: schedule.id,
        source: 'STUDENT_LOCATION',
        status,
        studentId,
      },
    })
  },

  async markManual(academyId: string, input: ManualAttendanceInput) {
    const attendanceDate = toAttendanceDate(input.attendanceDate)
    const scheduleId = input.scheduleId ?? null
    const now = new Date()
    const checkedAt = input.status === 'PRESENT' || input.status === 'LATE' ? now : null

    const existing = await prisma.attendanceRecord.findFirst({
      where: { studentId: input.studentId, scheduleId, attendanceDate },
    })

    if (existing) {
      return prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { checkedAt, memo: input.memo, source: 'ADMIN_MANUAL', status: input.status, updatedById: input.updatedById },
      })
    }

    return prisma.attendanceRecord.create({
      data: {
        academyId,
        attendanceDate,
        checkedAt,
        memo: input.memo,
        scheduleId,
        source: 'ADMIN_MANUAL',
        status: input.status,
        studentId: input.studentId,
        updatedById: input.updatedById,
      },
    })
  },
}

export function toAttendanceDate(date: Date) {
  return toStoredKoreaDate(date)
}

export function toDateInputValue(date: Date) {
  const { day, month, year } = getKoreaDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusMeters = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function isFiniteCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export function isWithinCheckInWindow(startTime: string, endTime: string, date: Date): boolean {
  const nowMinutes = getKoreaMinutes(date)
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  if (start === null || end === null) return false
  return nowMinutes >= start - CHECKIN_EARLY_MINUTES && nowMinutes <= end
}

function isLate(startTime: string, now: Date): boolean {
  const nowMinutes = getKoreaMinutes(now)
  const start = parseTime(startTime)
  if (start === null) return false
  return nowMinutes > start + LATE_GRACE_MINUTES
}


function parseTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}
