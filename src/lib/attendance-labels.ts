import type { AttendanceSource, AttendanceStatus } from '@prisma/client'

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  PRESENT: '출석',
  LATE: '지각',
  ABSENT: '결석',
  EXCUSED: '인정결석',
}

export const attendanceSourceLabels: Record<AttendanceSource, string> = {
  STUDENT_LOCATION: '학생 위치',
  ADMIN_MANUAL: '관리자 수동',
}
