'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { messageService } from '@/lib/services/message.service'

export async function sendMessageAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const content = String(formData.get('content') ?? '')
  const receiverIds = formData.getAll('receiverIds').map(String).filter(Boolean)

  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)

  await messageService.sendMessage(academy.id, user.id, receiverIds, content)

  revalidatePath(`/admin/${slug}/messages`)
  redirect(`/admin/${slug}/messages`)
}

export async function markReadAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')

  const session = await getServerSession(authConfig)
  const { user } = await requireAcademyMember(session, slug)

  await messageService.markRead(id, user.id)

  revalidatePath(`/admin/${slug}/messages`)
  redirect(`/admin/${slug}/messages`)
}

export async function deleteInboxMessageAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')

  const session = await getServerSession(authConfig)
  const { user } = await requireAcademyMember(session, slug)

  await messageService.deleteForReceiver(id, user.id)

  revalidatePath(`/admin/${slug}/messages`)
  redirect(`/admin/${slug}/messages`)
}

export async function deleteSentMessageAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')

  const session = await getServerSession(authConfig)
  const { user } = await requireAcademyMember(session, slug)

  await messageService.deleteForSender(id, user.id)

  revalidatePath(`/admin/${slug}/messages`)
  redirect(`/admin/${slug}/messages`)
}
