'use server'

import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyMember, isAcademyAdminRole } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { prisma } from '@/lib/db/prisma'
import { dailyQuizService } from '@/lib/services/daily-quiz.service'
import { sanitizeRichText } from '@/lib/utils/html'
import { toStoredKoreaDate } from '@/lib/utils/korea-time'

async function requireQuizProgramAccess(session: Session | null, slug: string, programId: string) {
  const { academy, user } = await requireAcademyMember(session, slug)

  if (isAcademyAdminRole(user.role)) {
    const program = await prisma.program.findFirst({ where: { id: programId, academyId: academy.id } })
    if (!program) throw new Error('Forbidden')
  } else {
    const teacher = await prisma.teacher.findFirst({ where: { userId: user.id, academyId: academy.id } })
    if (!teacher) throw new Error('Forbidden')
    const program = await prisma.program.findFirst({ where: { id: programId, teacherId: teacher.id } })
    if (!program) throw new Error('Forbidden')
  }

  return { academy, user }
}

export async function createQuizAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireQuizProgramAccess(session, slug, programId)

  const dateStr = String(formData.get('date') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    redirect(`/admin/${slug}/quiz?programId=${programId}&error=${encodeURIComponent('날짜 형식이 올바르지 않습니다.')}`)
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = toStoredKoreaDate(new Date(year, month - 1, day))

  const explanation = sanitizeRichText(String(formData.get('explanation') ?? '')).trim() || undefined
  try {
    await dailyQuizService.createQuiz(academy.id, programId, {
      date,
      question: sanitizeRichText(String(formData.get('question') ?? '')),
      answer: formData.get('answer') === 'true',
      explanation,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : '등록에 실패했습니다.'
    redirect(`/admin/${slug}/quiz?programId=${programId}&error=${encodeURIComponent(message)}`)
  }

  revalidatePath(`/admin/${slug}/quiz`)
  redirect(`/admin/${slug}/quiz?programId=${programId}`)
}

export async function deleteQuizAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireQuizProgramAccess(session, slug, programId)

  await dailyQuizService.deleteQuiz(id, academy.id)

  revalidatePath(`/admin/${slug}/quiz`)
  redirect(`/admin/${slug}/quiz?programId=${programId}`)
}
