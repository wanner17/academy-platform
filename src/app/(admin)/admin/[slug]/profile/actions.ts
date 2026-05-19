'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireMemberPage } from '@/lib/auth/server'
import { prisma } from '@/lib/db/prisma'
import { teacherService } from '@/lib/services/teacher.service'

export async function updateMyTeacherAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const { academy, user } = await requireMemberPage(slug)
  const teacher = await teacherService.getTeacherByUserId(user.id, academy.id)

  await teacherService.updateTeacher(teacher.id, academy.id, {
    name: String(formData.get('name') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    order: teacher.order,
    isActive: teacher.isActive,
    userId: teacher.userId ?? undefined,
  })

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/teachers`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/profile`)
  redirect(`/admin/${slug}/profile`)
}

export async function updateMyPasswordAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const { academy, user } = await requireMemberPage(slug)

  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters')
  if (newPassword !== confirmPassword) throw new Error('New passwords do not match')

  const dbUser = await prisma.user.findFirst({ where: { id: user.id, academyId: academy.id } })
  if (!dbUser?.passwordHash) throw new Error('User password is not set')

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
  if (!valid) throw new Error('Current password is invalid')

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })

  revalidatePath(`/admin/${slug}/profile`)
  redirect(`/admin/${slug}/profile`)
}
