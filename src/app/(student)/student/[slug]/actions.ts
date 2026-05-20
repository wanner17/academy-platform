'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStudentPage } from '@/lib/auth/server'
import { prisma } from '@/lib/db/prisma'
import { attendanceService, type StudentCheckInInput } from '@/lib/services/attendance.service'
import { studentService } from '@/lib/services/student.service'

export async function updateStudentPasswordAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const { academy, user } = await requireStudentPage(slug)

  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters')
  if (newPassword !== confirmPassword) throw new Error('New passwords do not match')

  const dbUser = await prisma.user.findFirst({
    where: { id: user.id, academyId: academy.id, role: 'STUDENT' },
  })
  if (!dbUser?.passwordHash) throw new Error('User password is not set')

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
  if (!valid) throw new Error('Current password is invalid')

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })

  revalidatePath(`/student/${slug}`)
  redirect(`/student/${slug}`)
}

export async function checkInAttendanceAction(slug: string, input: StudentCheckInInput) {
  try {
    const { academy, user } = await requireStudentPage(slug)
    const student = await studentService.getStudentByUserId(user.id, academy.id)
    const record = await attendanceService.checkInStudent(academy.id, student.id, input)
    return {
      ok: true,
      message: `출석 완료: ${record.checkedAt?.toLocaleTimeString('ko-KR') ?? ''}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '출석 처리에 실패했습니다.'
    return { ok: false, message: toKoreanAttendanceMessage(message) }
  }
}

function toKoreanAttendanceMessage(message: string) {
  if (message === 'Attendance is disabled') return '출석 기능이 꺼져 있습니다.'
  if (message === 'Academy location is not set') return '학원 위치 설정이 필요합니다.'
  if (message === 'Location is invalid') return '위치 정보가 올바르지 않습니다.'
  if (message === 'Attendance time is closed') return '출석 가능 시간이 아닙니다.'
  if (message === 'Outside attendance radius') return '학원 위치에서만 출석할 수 있습니다.'
  return message
}
