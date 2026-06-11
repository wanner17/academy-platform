'use server'

import type { AttendanceStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireMemberPage } from '@/lib/auth/server'
import { attendanceService } from '@/lib/services/attendance.service'
import { studentService } from '@/lib/services/student.service'

export async function updateAttendanceSettingAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const { academy } = await requireMemberPage(slug)
  const latitude = readOptionalNumber(formData, 'latitude')
  const longitude = readOptionalNumber(formData, 'longitude')
  const radiusMeters = Number(formData.get('radiusMeters') ?? 100)
  const earlyCheckinMinutes = Number(formData.get('earlyCheckinMinutes') ?? 30)
  const lateGraceMinutes = Number(formData.get('lateGraceMinutes') ?? 5)

  if (!Number.isInteger(radiusMeters) || radiusMeters < 10 || radiusMeters > 2000) {
    throw new Error('Radius must be between 10 and 2000 meters')
  }
  if (!Number.isInteger(earlyCheckinMinutes) || earlyCheckinMinutes < 0 || earlyCheckinMinutes > 120) {
    throw new Error('Early check-in must be between 0 and 120 minutes')
  }
  if (!Number.isInteger(lateGraceMinutes) || lateGraceMinutes < 0 || lateGraceMinutes > 60) {
    throw new Error('Late grace must be between 0 and 60 minutes')
  }

  await attendanceService.upsertSetting(academy.id, {
    isEnabled: formData.get('isEnabled') === 'true',
    latitude,
    longitude,
    radiusMeters,
    earlyCheckinMinutes,
    lateGraceMinutes,
  })

  revalidateAttendancePaths(slug)
  redirect(`/admin/${slug}/attendance?saved=1`)
}

export async function markAttendanceAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const date = String(formData.get('date') ?? '')
  const studentId = String(formData.get('studentId') ?? '')
  const status = String(formData.get('status') ?? 'PRESENT') as AttendanceStatus
  const { academy, user } = await requireMemberPage(slug)
  const student = await studentService.getStudentById(studentId, academy.id)
  const attendanceDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(attendanceDate.getTime())) throw new Error('Attendance date is invalid')
  if (!['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].includes(status)) throw new Error('Attendance status is invalid')

  await attendanceService.markManual(academy.id, {
    attendanceDate,
    memo: readOptionalMemo(formData),
    scheduleId: String(formData.get('scheduleId') ?? '').trim() || undefined,
    status,
    studentId: student.id,
    updatedById: user.id,
  })

  revalidateAttendancePaths(slug)
  redirect(`/admin/${slug}/attendance?date=${date}`)
}

export async function bulkMarkAttendanceAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const date = String(formData.get('date') ?? '')
  const status = String(formData.get('status') ?? 'PRESENT') as AttendanceStatus
  const memo = String(formData.get('memo') ?? '').trim() || undefined
  const { academy, user } = await requireMemberPage(slug)

  const entries = formData
    .getAll('entry')
    .map((e) => JSON.parse(String(e)) as { studentId: string; scheduleId: string | null })

  const attendanceDate = new Date(`${date}T00:00:00`)
  if (Number.isNaN(attendanceDate.getTime())) throw new Error('Attendance date is invalid')
  if (!['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].includes(status)) throw new Error('Attendance status is invalid')
  if (entries.length === 0) throw new Error('No entries selected')

  const uniqueStudentIds = [...new Set(entries.map((e) => e.studentId))]
  await Promise.all(uniqueStudentIds.map((id) => studentService.getStudentById(id, academy.id)))

  await attendanceService.markManualBulk(
    academy.id,
    entries.map(({ studentId, scheduleId }) => ({
      attendanceDate,
      memo,
      scheduleId: scheduleId ?? undefined,
      status,
      studentId,
      updatedById: user.id,
    })),
  )

  revalidateAttendancePaths(slug)
  redirect(`/admin/${slug}/attendance?date=${date}`)
}

function readOptionalNumber(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? '').trim()
  if (!value) return undefined
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${name} is invalid`)
  return number
}

function readOptionalMemo(formData: FormData) {
  const value = String(formData.get('memo') ?? '').trim()
  return value || null
}

function revalidateAttendancePaths(slug: string) {
  revalidatePath(`/admin/${slug}/attendance`)
  revalidatePath(`/student/${slug}`)
}
