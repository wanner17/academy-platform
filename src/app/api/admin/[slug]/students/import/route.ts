import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { prisma } from '@/lib/db/prisma'
import { studentService } from '@/lib/services/student.service'

type RouteProps = { params: Promise<{ slug: string }> }

export async function POST(request: Request, { params }: RouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyMember(session, slug)

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })

  if (rows.length < 2) return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 })

  const dataRows = rows.slice(1)
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const name = String(row[0] ?? '').trim()
    if (!name) continue

    const schoolName = String(row[1] ?? '').trim() || undefined
    const grade = String(row[2] ?? '').trim() || undefined
    const phone = String(row[3] ?? '').trim() || undefined
    const parentPhone = String(row[4] ?? '').trim() || undefined
    const memo = String(row[5] ?? '').trim() || undefined
    const email = String(row[6] ?? '').toLowerCase().trim()
    const password = String(row[7] ?? '').trim()

    try {
      if (!email) throw new Error('로그인이메일이 없습니다')

      const existingUser = await prisma.user.findFirst({ where: { academyId: academy.id, email } })

      if (existingUser) {
        // update: find student by userId
        const existingStudent = await prisma.student.findFirst({ where: { userId: existingUser.id, academyId: academy.id } })
        if (!existingStudent) throw new Error('학생 정보를 찾을 수 없습니다')

        await studentService.updateStudent(existingStudent.id, academy.id, { name, schoolName, grade, phone, parentPhone, memo })
        results.success++
      } else {
        // create: new user + student
        if (!password) throw new Error('신규 학생은 임시비밀번호가 필요합니다')
        if (password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다')

        const user = await prisma.user.create({
          data: { academyId: academy.id, email, name, passwordHash: await bcrypt.hash(password, 12), role: 'STUDENT' },
        })

        await studentService.createStudent(academy.id, { name, schoolName, grade, phone, parentPhone, memo, userId: user.id, isActive: true })
        results.success++
      }
    } catch (err) {
      results.failed++
      results.errors.push(`${i + 2}행 (${name}): ${err instanceof Error ? err.message : '처리 실패'}`)
    }
  }

  return NextResponse.json(results)
}
