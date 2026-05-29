'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { dailyQuizService } from '@/lib/services/daily-quiz.service'
import { toStoredKoreaDate } from '@/lib/utils/korea-time'

export async function createQuizAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  const dateStr = String(formData.get('date') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    redirect(`/admin/${slug}/quiz?error=${encodeURIComponent('날짜 형식이 올바르지 않습니다.')}`)
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = toStoredKoreaDate(new Date(year, month - 1, day))

  const explanation = String(formData.get('explanation') ?? '').trim() || undefined
  try {
    await dailyQuizService.createQuiz(academy.id, {
      date,
      question: String(formData.get('question') ?? ''),
      answer: formData.get('answer') === 'true',
      explanation,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : '등록에 실패했습니다.'
    redirect(`/admin/${slug}/quiz?error=${encodeURIComponent(message)}`)
  }

  revalidatePath(`/admin/${slug}/quiz`)
  redirect(`/admin/${slug}/quiz`)
}

export async function deleteQuizAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await dailyQuizService.deleteQuiz(id, academy.id)

  revalidatePath(`/admin/${slug}/quiz`)
  redirect(`/admin/${slug}/quiz`)
}
