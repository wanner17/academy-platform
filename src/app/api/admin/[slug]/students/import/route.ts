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

    const email = String(row[6] ?? '').toLowerCase().trim()
    const password = String(row[7] ?? '').trim()

    try {
      let userId: string | undefined

      if (!email) throw new Error('로그인이메일이 없습니다')
      if (!password) throw new Error('임시비밀번호가 없습니다')
      if (password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다')

      const existing = await prisma.user.findFirst({ where: { academyId: academy.id, email } })
      if (existing) {
        if (existing.role !== 'STUDENT') throw new Error('다른 계정에서 사용 중인 이메일입니다')
        userId = existing.id
      } else {
        const user = await prisma.user.create({
          data: { academyId: academy.id, email, name, passwordHash: await bcrypt.hash(password, 12), role: 'STUDENT' },
        })
        userId = user.id
      }

      await studentService.createStudent(academy.id, {
        name,
        schoolName: String(row[1] ?? '').trim() || undefined,
        grade: String(row[2] ?? '').trim() || undefined,
        phone: String(row[3] ?? '').trim() || undefined,
        parentPhone: String(row[4] ?? '').trim() || undefined,
        memo: String(row[5] ?? '').trim() || undefined,
        userId,
        isActive: true,
      })
      results.success++
    } catch (err) {
      results.failed++
      results.errors.push(`${i + 2}행 (${name}): ${err instanceof Error ? err.message : '등록 실패'}`)
    }
  }

  return NextResponse.json(results)
}
