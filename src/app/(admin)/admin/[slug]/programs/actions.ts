'use server'

import type { ProgramMode, TargetLevel } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { programService } from '@/lib/services/program.service'

export async function createProgramAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await programService.createProgram(academy.id, readProgramForm(formData))

  revalidateProgramPaths(slug)
  redirect(`/admin/${slug}/programs`)
}

export async function updateProgramAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await programService.updateProgram(id, academy.id, readProgramForm(formData))

  revalidateProgramPaths(slug)
  redirect(`/admin/${slug}/programs`)
}

export async function deleteProgramAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await programService.deleteProgram(id, academy.id)

  revalidateProgramPaths(slug)
  redirect(`/admin/${slug}/programs`)
}

function readProgramForm(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    teacherId: String(formData.get('teacherId') ?? ''),
    mode: String(formData.get('mode') ?? 'SCHOOL_EXAM') as ProgramMode,
    targetLevel: String(formData.get('targetLevel') ?? 'MIDDLE') as TargetLevel,
    schoolName: String(formData.get('schoolName') ?? ''),
    grade: String(formData.get('grade') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    description: String(formData.get('description') ?? ''),
    order: Number(formData.get('order') ?? 0),
    isActive: formData.get('isActive') === 'true',
  }
}

function revalidateProgramPaths(slug: string) {
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/programs`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/programs`)
}
