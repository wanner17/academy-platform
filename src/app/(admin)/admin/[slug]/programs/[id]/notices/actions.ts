'use server'

import type { ProgramNoticeType } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAcademyAdminRole, requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { programNoticeService } from '@/lib/services/program-notice.service'
import { programService } from '@/lib/services/program.service'
import { messageService } from '@/lib/services/message.service'
import { studentPath } from '@/lib/utils/public-path'
import { prisma } from '@/lib/db/prisma'

async function readContext(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)
  return { slug, programId, academy, user }
}

function assertWritable(
  program: Awaited<ReturnType<typeof programService.getProgramById>>,
  user: { id: string; role: string },
) {
  if (isAcademyAdminRole(user.role)) return
  if (program.teacher?.userId === user.id) return
  throw new Error('Forbidden')
}

function revalidateAll(slug: string, programId: string) {
  revalidatePath(`/admin/${slug}/programs/${programId}`)
  revalidatePath(`/admin/${slug}/programs/${programId}/notices`)
  revalidatePath(`/student/${slug}`)
}

function readNoticeFields(formData: FormData) {
  const type = String(formData.get('type') ?? '') as ProgramNoticeType
  const title = String(formData.get('title') ?? '')
  const content = String(formData.get('content') ?? '') || undefined
  const isVisible = formData.get('isVisible') !== 'false'

  const makeupDate = formData.get('makeupDate') ? new Date(String(formData.get('makeupDate'))) : undefined
  const makeupStartTime = String(formData.get('makeupStartTime') ?? '') || undefined
  const makeupEndTime = String(formData.get('makeupEndTime') ?? '') || undefined

  const cancelDate = formData.get('cancelDate') ? new Date(String(formData.get('cancelDate'))) : undefined

  const changeDate = formData.get('changeDate') ? new Date(String(formData.get('changeDate'))) : undefined
  const changeFromTime = String(formData.get('changeFromTime') ?? '') || undefined
  const changeToTime = String(formData.get('changeToTime') ?? '') || undefined
  const dayOfWeekRaw = formData.get('dayOfWeek')
  const dayOfWeek = dayOfWeekRaw !== null && dayOfWeekRaw !== '' ? Number(dayOfWeekRaw) : undefined
  const originalDate = formData.get('originalDate') ? new Date(String(formData.get('originalDate'))) : undefined

  return { type, title, content, isVisible, makeupDate, makeupStartTime, makeupEndTime, cancelDate, changeDate, changeFromTime, changeToTime, dayOfWeek, originalDate }
}

export async function createProgramNoticeAction(formData: FormData) {
  const { slug, programId, academy, user } = await readContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertWritable(program, user)

  const fields = readNoticeFields(formData)
  await programNoticeService.createProgramNotice(academy.id, { authorId: user.id, programId, ...fields })

  if (fields.isVisible) {
    const enrollments = await prisma.enrollment.findMany({
      where: { programId, status: 'ACTIVE' },
      include: { student: { select: { userId: true } } },
    })
    const receiverIds = enrollments.flatMap((e) => (e.student.userId ? [e.student.userId] : []))
    if (receiverIds.length > 0) {
      await messageService.sendMessage(
        academy.id,
        user.id,
        receiverIds,
        `새 수업 공지가 등록되었습니다.\n\n${fields.title}`,
        studentPath(slug),
      )
    }
  }

  revalidateAll(slug, programId)
  redirect(`/admin/${slug}/programs/${programId}/notices`)
}

export async function updateProgramNoticeAction(formData: FormData) {
  const { slug, programId, academy, user } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  const program = await programService.getProgramById(programId, academy.id)
  assertWritable(program, user)

  const notice = await programNoticeService.getProgramNoticeById(id, academy.id)
  if (notice.programId !== programId) throw new Error('Notice does not belong to this program')

  const fields = readNoticeFields(formData)
  await programNoticeService.updateProgramNotice(id, academy.id, fields)

  revalidateAll(slug, programId)
  redirect(`/admin/${slug}/programs/${programId}/notices`)
}

export async function deleteProgramNoticeAction(formData: FormData) {
  const { slug, programId, academy, user } = await readContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertWritable(program, user)

  await programNoticeService.deleteProgramNotice(String(formData.get('id') ?? ''), academy.id)

  revalidateAll(slug, programId)
  redirect(`/admin/${slug}/programs/${programId}/notices`)
}
