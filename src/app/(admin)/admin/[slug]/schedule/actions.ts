'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAcademyAdminRole, requireAcademyAdmin, requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { programService } from '@/lib/services/program.service'
import { scheduleService } from '@/lib/services/schedule.service'

export async function createScheduleAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await scheduleService.createSchedule(academy.id, readScheduleForm(formData))

  revalidateSchedulePaths(slug)
  redirect(`/admin/${slug}/schedule`)
}

export async function updateScheduleAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)
  const schedule = await scheduleService.getScheduleById(id, academy.id)
  await assertScheduleWritable(academy.id, schedule.programId, user)

  await scheduleService.updateSchedule(id, academy.id, readScheduleForm(formData))

  revalidateSchedulePaths(slug)
  redirect(schedule.programId ? `/admin/${slug}/programs/${schedule.programId}/schedule` : `/admin/${slug}/schedule`)
}

export async function deleteScheduleAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await scheduleService.deleteSchedule(id, academy.id)

  revalidateSchedulePaths(slug)
  redirect(`/admin/${slug}/schedule`)
}

function readScheduleForm(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    programId: String(formData.get('programId') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    teacher: String(formData.get('teacher') ?? ''),
    room: String(formData.get('room') ?? ''),
    dayOfWeek: Number(formData.get('dayOfWeek') ?? 0),
    startTime: String(formData.get('startTime') ?? ''),
    endTime: String(formData.get('endTime') ?? ''),
    color: String(formData.get('color') ?? ''),
    isActive: formData.get('isActive') === 'true',
  }
}

async function assertScheduleWritable(academyId: string, programId: string | null, user: { id: string; role: string }) {
  if (isAcademyAdminRole(user.role)) return
  if (!programId) throw new Error('Forbidden')

  const program = await programService.getProgramById(programId, academyId)
  if (program.teacher?.userId === user.id) return

  throw new Error('Forbidden')
}

function revalidateSchedulePaths(slug: string) {
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/schedule`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/schedule`)
}
