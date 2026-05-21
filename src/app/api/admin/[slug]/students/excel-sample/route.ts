import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as XLSX from 'xlsx'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'

type RouteProps = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  await requireAcademyMember(session, slug)

  const wb = XLSX.utils.book_new()
  const headers = [['이름', '학교', '학년', '학생연락처', '학부모연락처', '메모', '로그인이메일', '임시비밀번호']]
  const sample = [['홍길동', '서울중학교', '2학년', '010-1234-5678', '010-9876-5432', '특이사항 없음', 'hong@example.com', 'pass1234']]
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample])

  ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, '학생목록')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="students_sample.xlsx"',
    },
  })
}
