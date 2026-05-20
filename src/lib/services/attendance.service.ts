import type { AttendanceStatus } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export type AttendanceSettingInput = {
  endTime?: string
  isEnabled: boolean
  latitude?: number
  longitude?: number
  radiusMeters: number
  startTime?: string
}

export type StudentCheckInInput = {
  accuracyMeters?: number
  latitude: number
  longitude: number
}

export type ManualAttendanceInput = {
  attendanceDate: Date
  memo?: string
  status: AttendanceStatus
  studentId: string
  updatedById: string
}

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
      include: { student: { include: { enrollments: { include: { program: true } } } }, updatedBy: true },
      orderBy: [{ student: { name: 'asc' } }, { createdAt: 'asc' }],
    })
  },

  getStudentRecordForDate(academyId: string, studentId: string, date: Date) {
    return prisma.attendanceRecord.findUnique({
      where: { studentId_attendanceDate: { studentId, attendanceDate: toAttendanceDate(date) } },
    })
  },

  getStudentRecordsForMonth(academyId: string, studentId: string, year: number, monthIndex: number) {
    const start = new Date(year, monthIndex, 1)
    const end = new Date(year, monthIndex + 1, 1)
    return prisma.attendanceRecord.findMany({
      where: {
        academyId,
        attendanceDate: { gte: start, lt: end },
        studentId,
      },
      orderBy: { attendanceDate: 'asc' },
    })
  },

  async checkInStudent(academyId: string, studentId: string, input: StudentCheckInInput) {
    const setting = await this.getSetting(academyId)
    if (!setting?.isEnabled) throw new Error('Attendance is disabled')
    if (setting.latitude === null || setting.longitude === null) throw new Error('Academy location is not set')
    if (!isFiniteCoordinate(input.latitude, input.longitude)) throw new Error('Location is invalid')
    if (!isWithinAttendanceTime(setting.startTime, setting.endTime, new Date())) throw new Error('Attendance time is closed')

    const distanceMeters = getDistanceMeters(setting.latitude, setting.longitude, input.latitude, input.longitude)
    if (distanceMeters > setting.radiusMeters) throw new Error('Outside attendance radius')

    const now = new Date()
    const attendanceDate = toAttendanceDate(now)

    return prisma.attendanceRecord.upsert({
      where: { studentId_attendanceDate: { studentId, attendanceDate } },
      update: {
        accuracyMeters: input.accuracyMeters,
        checkedAt: now,
        distanceMeters,
        latitude: input.latitude,
        longitude: input.longitude,
        source: 'STUDENT_LOCATION',
        status: 'PRESENT',
      },
      create: {
        academyId,
        accuracyMeters: input.accuracyMeters,
        attendanceDate,
        checkedAt: now,
        distanceMeters,
        latitude: input.latitude,
        longitude: input.longitude,
        source: 'STUDENT_LOCATION',
        status: 'PRESENT',
        studentId,
      },
    })
  },

  markManual(academyId: string, input: ManualAttendanceInput) {
    const attendanceDate = toAttendanceDate(input.attendanceDate)
    const now = new Date()
    return prisma.attendanceRecord.upsert({
      where: { studentId_attendanceDate: { studentId: input.studentId, attendanceDate } },
      update: {
        checkedAt: input.status === 'PRESENT' || input.status === 'LATE' ? now : undefined,
        memo: input.memo,
        source: 'ADMIN_MANUAL',
        status: input.status,
        updatedById: input.updatedById,
      },
      create: {
        academyId,
        attendanceDate,
        checkedAt: input.status === 'PRESENT' || input.status === 'LATE' ? now : undefined,
        memo: input.memo,
        source: 'ADMIN_MANUAL',
        status: input.status,
        studentId: input.studentId,
        updatedById: input.updatedById,
      },
    })
  },
}

export function toAttendanceDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

function isWithinAttendanceTime(startTime: string | null | undefined, endTime: string | null | undefined, date: Date) {
  if (!startTime && !endTime) return true
  const minutes = date.getHours() * 60 + date.getMinutes()
  const start = startTime ? parseTime(startTime) : 0
  const end = endTime ? parseTime(endTime) : 24 * 60 - 1
  if (start === null || end === null) return false
  return minutes >= start && minutes <= end
}

function parseTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}
