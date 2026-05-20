'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/integrations/auth/config'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { noticeAttachmentService } from '@/lib/services/notice-attachment.service'
import { noticeService } from '@/lib/services/notice.service'
import { sanitizeRichText } from '@/lib/utils/html'

export async function createNoticeAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyAdmin(session, slug)

  const notice = await noticeService.createNotice(academy.id, {
    title: String(formData.get('title') ?? ''),
    content: sanitizeRichText(String(formData.get('content') ?? '')),
    isPinned: formData.get('isPinned') === 'true',
  })
  await noticeAttachmentService.attachUploadedObjects(academy.id, notice.id, user.id, readUploadedAttachments(formData))
  await noticeAttachmentService.saveAttachments(academy.id, notice.id, user.id, readAttachmentFiles(formData))

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/notices`)
  revalidatePath(`/admin/${slug}/notices`)
  redirect(`/admin/${slug}/notices`)
}

export async function deleteNoticeAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await noticeAttachmentService.deleteNoticeFiles(academy.id, id)
  await noticeService.deleteNotice(id, academy.id)

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/notices`)
  revalidatePath(`/admin/${slug}/notices`)
  redirect(`/admin/${slug}/notices`)
}

export async function updateNoticeAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyAdmin(session, slug)

  await noticeService.updateNotice(id, academy.id, {
    title: String(formData.get('title') ?? ''),
    content: sanitizeRichText(String(formData.get('content') ?? '')),
    isPinned: formData.get('isPinned') === 'true',
    status: String(formData.get('status') ?? 'PUBLISHED') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  })
  await noticeAttachmentService.attachUploadedObjects(academy.id, id, user.id, readUploadedAttachments(formData))
  await noticeAttachmentService.saveAttachments(academy.id, id, user.id, readAttachmentFiles(formData))

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/notices`)
  revalidatePath(`/${slug}/notices/${id}`)
  revalidatePath(`/admin/${slug}/notices`)
  revalidatePath(`/admin/${slug}/notices/${id}/edit`)
  redirect(`/admin/${slug}/notices`)
}

export async function deleteNoticeAttachmentAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const noticeId = String(formData.get('noticeId') ?? '')
  const attachmentId = String(formData.get('attachmentId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await noticeAttachmentService.deleteAttachment(attachmentId, academy.id, noticeId)

  revalidatePath(`/${slug}/notices/${noticeId}`)
  revalidatePath(`/admin/${slug}/notices`)
  revalidatePath(`/admin/${slug}/notices/${noticeId}/edit`)
  redirect(`/admin/${slug}/notices/${noticeId}/edit`)
}

function readAttachmentFiles(formData: FormData) {
  return formData.getAll('attachments').filter((value): value is File => value instanceof File)
}

function readUploadedAttachments(formData: FormData) {
  const objectKeys = formData.getAll('uploadedObjectKey').map(String)
  const publicUrls = formData.getAll('uploadedPublicUrl').map(String)
  const mimeTypes = formData.getAll('uploadedMimeType').map(String)
  const sizes = formData.getAll('uploadedSize').map((value) => Number(value))

  return objectKeys.map((objectKey, index) => ({
    objectKey,
    displayName: String(formData.getAll('uploadedDisplayName')[index] ?? ''),
    publicUrl: publicUrls[index] ?? '',
    mimeType: mimeTypes[index] ?? 'application/octet-stream',
    size: Number.isFinite(sizes[index]) ? sizes[index] : 0,
  })).filter((attachment) => attachment.objectKey && attachment.publicUrl && attachment.displayName && attachment.size > 0)
}
