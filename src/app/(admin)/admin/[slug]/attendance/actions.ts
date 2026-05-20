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

  if (!Number.isInteger(radiusMeters) || radiusMeters < 10 || radiusMeters > 2000) {
    throw new Error('Radius must be between 10 and 2000 meters')
  }

  await attendanceService.upsertSetting(academy.id, {
    endTime: String(formData.get('endTime') ?? '') || undefined,
    isEnabled: formData.get('isEnabled') === 'true',
    latitude,
    longitude,
    radiusMeters,
    startTime: String(formData.get('startTime') ?? '') || undefined,
  })

  revalidateAttendancePaths(slug)
  redirect(`/admin/${slug}/attendance`)
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
    memo: String(formData.get('memo') ?? '') || undefined,
    status,
    studentId: student.id,
    updatedById: user.id,
  })

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

function revalidateAttendancePaths(slug: string) {
  revalidatePath(`/admin/${slug}/attendance`)
  revalidatePath(`/student/${slug}`)
}
