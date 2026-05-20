import { notFound } from 'next/navigation'
import { BackButton } from '@/components/admin/back-button'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScheduleFields } from '@/components/admin/schedule-fields'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/schedule.service'
import { updateScheduleAction } from '../../actions'

type EditSchedulePageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const { slug, id } = await params
  const { user } = await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const schedule = await scheduleService.getScheduleById(id, academy.id).catch(() => null)
  if (!schedule) notFound()
  const program = schedule.programId ? await programService.getProgramById(schedule.programId, academy.id).catch(() => null) : null
  const canEdit = isAcademyAdminRole(user.role) || program?.teacher?.userId === user.id
  if (!canEdit) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <BackButton fallbackHref={`/admin/${slug}/schedule`} />
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">시간표 수정</h1>
        <form action={updateScheduleAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="id" value={schedule.id} />
          {schedule.programId ? <input type="hidden" name="programId" value={schedule.programId} /> : null}
          <ScheduleFields defaults={schedule} />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="시간표를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
