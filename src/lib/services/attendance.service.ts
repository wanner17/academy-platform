import type { AttendanceStatus } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { getKoreaMinutes, getKoreaDateParts, toStoredKoreaDate, getKoreaDayOfWeek } from '@/lib/utils/korea-time'

export type AttendanceSettingInput = {
  isEnabled: boolean
  latitude?: number
  longitude?: number
  radiusMeters: number
  earlyCheckinMinutes: number
  lateGraceMinutes: number
}

export type StudentCheckInInput = {
  accuracyMeters?: number
  latitude: number
  longitude: number
}

export type ManualAttendanceInput = {
  attendanceDate: Date
  memo?: string | null
  scheduleId?: string
  status: AttendanceStatus
  studentId: string
  updatedById: string
}

const DEFAULT_LATE_GRACE_MINUTES = 5
const DEFAULT_CHECKIN_EARLY_MINUTES = 30

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

  async backfillAbsencesForDate(
    academyId: string,
    date: Date,
    options: { now?: Date; studentId?: string } = {},
  ) {
    const now = options.now ?? new Date()
    const attendanceDate = toAttendanceDate(date)
    await this.deleteAutoAbsencesBeforeEnrollment(academyId, attendanceDate, options.studentId)
    const today = toAttendanceDate(now)
    const attendanceTime = attendanceDate.getTime()
    const todayTime = today.getTime()

    if (attendanceTime > todayTime) return 0

    const dayOfWeek = getKoreaDayOfWeek(date)
    const currentMinutes = attendanceTime === todayTime ? getKoreaMinutes(now) : null
    const enrollments = await prisma.enrollment.findMany({
      where: { academyId, status: 'ACTIVE', ...(options.studentId ? { studentId: options.studentId } : {}), student: { isActive: true } },
      select: {
        createdAt: true,
        studentId: true,
        program: {
          select: {
            schedules: {
              where: { dayOfWeek, isActive: true },
              select: { endTime: true, id: true },
            },
          },
        },
      },
    })

    const expectedPairs = enrollments.flatMap((enrollment) => (
      enrollment.program.schedules
        .filter(() => attendanceDate.getTime() >= toAttendanceDate(enrollment.createdAt).getTime())
        .filter((schedule) => currentMinutes === null || isScheduleEnded(schedule.endTime, currentMinutes))
        .map((schedule) => ({ scheduleId: schedule.id, studentId: enrollment.studentId }))
    ))

    if (expectedPairs.length === 0) return 0

    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        attendanceDate,
        OR: expectedPairs.map(({ scheduleId, studentId }) => ({ scheduleId, studentId })),
      },
      select: { scheduleId: true, studentId: true },
    })
    const existingKeys = new Set(existingRecords.map((record) => `${record.studentId}:${record.scheduleId}`))
    const missingRecords = expectedPairs.filter(({ scheduleId, studentId }) => !existingKeys.has(`${studentId}:${scheduleId}`))

    if (missingRecords.length === 0) return 0

    const result = await prisma.attendanceRecord.createMany({
      data: missingRecords.map(({ scheduleId, studentId }) => ({
        academyId,
        attendanceDate,
        memo: '자동 결석 처리',
        scheduleId,
        source: 'ADMIN_MANUAL',
        status: 'ABSENT',
        studentId,
      })),
      skipDuplicates: true,
    })

    return result.count
  },

  async deleteAutoAbsencesBeforeEnrollment(academyId: string, attendanceDate: Date, studentId?: string) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        academyId,
        attendanceDate,
        memo: '자동 결석 처리',
        status: 'ABSENT',
        ...(studentId ? { studentId } : {}),
        scheduleId: { not: null },
      },
      select: {
        id: true,
        schedule: { select: { programId: true } },
        studentId: true,
      },
    })

    if (records.length === 0) return 0

    const enrollmentPairs = records
      .filter((record) => record.schedule?.programId)
      .map((record) => ({ programId: record.schedule!.programId!, studentId: record.studentId }))

    if (enrollmentPairs.length === 0) return 0

    const enrollments = await prisma.enrollment.findMany({
      where: {
        academyId,
        OR: enrollmentPairs,
      },
      select: { createdAt: true, programId: true, studentId: true },
    })
    const enrollmentDates = new Map(
      enrollments.map((enrollment) => [`${enrollment.studentId}:${enrollment.programId}`, toAttendanceDate(enrollment.createdAt).getTime()]),
    )
    const deleteIds = records
      .filter((record) => {
        const programId = record.schedule?.programId
        if (!programId) return false
        const enrolledAt = enrollmentDates.get(`${record.studentId}:${programId}`)
        return enrolledAt !== undefined && attendanceDate.getTime() < enrolledAt
      })
      .map((record) => record.id)

    if (deleteIds.length === 0) return 0

    const result = await prisma.attendanceRecord.deleteMany({ where: { id: { in: deleteIds } } })
    return result.count
  },

  async backfillAbsencesForMonth(
    academyId: string,
    year: number,
    monthIndex: number,
    options: { now?: Date; studentId?: string } = {},
  ) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    let created = 0

    for (let day = 1; day <= daysInMonth; day += 1) {
      created += await this.backfillAbsencesForDate(academyId, new Date(year, monthIndex, day), options)
    }

    return created
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

    const schedule = await prisma.schedule.findFirst({
      where: {
        academyId,
        id: scheduleId,
        isActive: true,
        program: {
          enrollments: {
            some: { academyId, studentId, status: 'ACTIVE' },
          },
        },
      },
    })
    if (!schedule) throw new Error('수업을 찾을 수 없습니다')

    const now = new Date()
    if (!isWithinCheckInWindow(schedule.startTime, schedule.endTime, now, setting.earlyCheckinMinutes)) throw new Error('출석 가능 시간이 아닙니다')

    const status = isLate(schedule.startTime, now, setting.lateGraceMinutes) ? 'LATE' : 'PRESENT'
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

  markManualBulk(academyId: string, inputs: ManualAttendanceInput[]) {
    return Promise.all(inputs.map((input) => this.markManual(academyId, input)))
  },

  async markManual(academyId: string, input: ManualAttendanceInput) {
    const attendanceDate = toAttendanceDate(input.attendanceDate)
    const scheduleId = input.scheduleId ?? null
    const now = new Date()
    const checkedAt = input.status === 'PRESENT' || input.status === 'LATE' ? now : null

    if (scheduleId) {
      const schedule = await prisma.schedule.findFirst({
        where: {
          academyId,
          id: scheduleId,
          program: {
            enrollments: {
              some: { academyId, studentId: input.studentId, status: 'ACTIVE' },
            },
          },
        },
      })
      if (!schedule) throw new Error('학생에게 배정된 수업이 아닙니다')
    }

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

export function isWithinCheckInWindow(startTime: string, endTime: string, date: Date, earlyMinutes = DEFAULT_CHECKIN_EARLY_MINUTES): boolean {
  const nowMinutes = getKoreaMinutes(date)
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  if (start === null || end === null) return false
  return nowMinutes >= start - earlyMinutes && nowMinutes <= end
}

function isLate(startTime: string, now: Date, graceMinutes = DEFAULT_LATE_GRACE_MINUTES): boolean {
  const nowMinutes = getKoreaMinutes(now)
  const start = parseTime(startTime)
  if (start === null) return false
  return nowMinutes > start + graceMinutes
}

function isScheduleEnded(endTime: string, currentMinutes: number) {
  const end = parseTime(endTime)
  if (end === null) return false
  return currentMinutes > end
}

function parseTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}
