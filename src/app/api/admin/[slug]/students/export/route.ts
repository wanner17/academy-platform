import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as XLSX from 'xlsx'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { studentService } from '@/lib/services/student.service'

type RouteProps = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyMember(session, slug)

  const students = await studentService.getAdminStudents(academy.id)

  const headers = ['이름', '학교', '학년', '학생연락처', '학부모연락처', '메모', '로그인이메일', '임시비밀번호(신규만)']
  const rows = students.map((s) => [
    s.name,
    s.schoolName ?? '',
    s.grade ?? '',
    s.phone ?? '',
    s.parentPhone ?? '',
    s.memo ?? '',
    s.user?.email ?? '',
    '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '학생목록')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="students_list.xlsx"`,
    },
  })
}
