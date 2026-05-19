'use server'

import type { ProgramMode, TargetLevel } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireMemberPage } from '@/lib/auth/server'
import { programService } from '@/lib/services/program.service'
import { teacherService } from '@/lib/services/teacher.service'

export async function createMyProgramAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const { academy, user } = await requireMemberPage(slug)
  const teacher = await teacherService.getTeacherByUserId(user.id, academy.id)

  await programService.createProgram(academy.id, {
    teacherId: teacher.id,
    title: String(formData.get('title') ?? ''),
    mode: String(formData.get('mode') ?? 'SCHOOL_EXAM') as ProgramMode,
    targetLevel: String(formData.get('targetLevel') ?? 'MIDDLE') as TargetLevel,
    schoolName: String(formData.get('schoolName') ?? ''),
    grade: String(formData.get('grade') ?? ''),
    subject: String(formData.get('subject') ?? teacher.subject),
    description: String(formData.get('description') ?? ''),
    order: 0,
    isActive: true,
  })

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/programs`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/my`)
  redirect(`/admin/${slug}/my`)
}

export async function deleteMyProgramAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)

  if (program.teacher?.userId !== user.id) throw new Error('Forbidden')

  await programService.deleteProgram(id, academy.id)

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/programs`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/my`)
  redirect(`/admin/${slug}/my`)
}
