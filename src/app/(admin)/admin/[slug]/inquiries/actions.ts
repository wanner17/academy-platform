'use server'

import type { InquiryStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { inquiryService } from '@/lib/services/inquiry.service'

const allowedStatuses: InquiryStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE']

export async function updateInquiryStatusAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as InquiryStatus

  if (!allowedStatuses.includes(status)) throw new Error('Invalid status')

  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyMember(session, slug)

  await inquiryService.updateInquiryStatus(id, academy.id, status)

  revalidatePath(`/admin/${slug}/inquiries`)
  redirect(`/admin/${slug}/inquiries`)
}

export async function updateInquiryMemoAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const memo = String(formData.get('memo') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyMember(session, slug)

  await inquiryService.updateInquiryMemo(id, academy.id, memo)

  revalidatePath(`/admin/${slug}/inquiries`)
  redirect(`/admin/${slug}/inquiries`)
}
