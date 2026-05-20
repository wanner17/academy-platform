'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { prisma } from '@/lib/db/prisma'
import { authConfig } from '@/lib/integrations/auth/config'
import { teacherService } from '@/lib/services/teacher.service'
import { sanitizeRichText } from '@/lib/utils/html'

export async function createTeacherAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  const teacherUserId = await createTeacherUserIfRequested(academy.id, formData)

  await teacherService.createTeacher(academy.id, {
    userId: teacherUserId,
    name: String(formData.get('name') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    bio: sanitizeRichText(String(formData.get('bio') ?? '')),
    profileImageUrl: String(formData.get('profileImageUrl') ?? ''),
    introVideoUrls: String(formData.get('introVideoUrls') ?? ''),
    order: Number(formData.get('order') ?? 0),
    isActive: formData.get('isActive') === 'true',
  })

  revalidateTeacherPaths(slug)
  redirect(`/admin/${slug}/teachers`)
}

export async function updateTeacherAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  const teacher = await teacherService.getTeacherById(id, academy.id)
  const teacherUserId = teacher.userId ?? (await createTeacherUserIfRequested(academy.id, formData))

  await teacherService.updateTeacher(id, academy.id, {
    userId: teacherUserId,
    name: String(formData.get('name') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    bio: sanitizeRichText(String(formData.get('bio') ?? '')),
    profileImageUrl: String(formData.get('profileImageUrl') ?? ''),
    introVideoUrls: String(formData.get('introVideoUrls') ?? ''),
    order: Number(formData.get('order') ?? 0),
    isActive: formData.get('isActive') === 'true',
  })

  revalidateTeacherPaths(slug)
  redirect(`/admin/${slug}/teachers`)
}

async function createTeacherUserIfRequested(academyId: string, formData: FormData) {
  const email = String(formData.get('loginEmail') ?? '').toLowerCase().trim()
  const password = String(formData.get('loginPassword') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  if (!email && !password) return undefined
  if (!email || !password) throw new Error('Teacher login email and password are required together')
  if (password.length < 8) throw new Error('Teacher password must be at least 8 characters')

  const existing = await prisma.user.findFirst({ where: { academyId, email } })
  if (existing) {
    if (existing.role !== 'TEACHER') throw new Error('This email is already used by another admin account')
    return existing.id
  }

  const user = await prisma.user.create({
    data: {
      academyId,
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'TEACHER',
    },
  })

  return user.id
}

export async function deleteTeacherAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await teacherService.deleteTeacher(id, academy.id)

  revalidateTeacherPaths(slug)
  redirect(`/admin/${slug}/teachers`)
}

export async function resetTeacherPasswordAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const password = String(formData.get('newPassword') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  const teacher = await teacherService.getTeacherById(id, academy.id)

  if (!teacher.userId) throw new Error('Teacher account is not connected')
  if (password.length < 8) throw new Error('Teacher password must be at least 8 characters')

  await prisma.user.update({
    where: { id: teacher.userId },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  })

  revalidateTeacherPaths(slug)
  redirect(`/admin/${slug}/teachers/${id}/edit`)
}

function revalidateTeacherPaths(slug: string) {
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/teachers`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/teachers`)
}
