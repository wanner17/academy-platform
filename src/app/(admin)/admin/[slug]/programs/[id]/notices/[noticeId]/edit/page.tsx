import { notFound, redirect } from 'next/navigation'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programNoticeService } from '@/lib/services/program-notice.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { ProgramNoticeEditForm } from './program-notice-edit-form'

type EditProgramNoticePageProps = {
  params: Promise<{ slug: string; id: string; noticeId: string }>
}

function formatDateInput(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : ''
}

function formatTimeInput(time: string | null | undefined) {
  return time ?? ''
}

export default async function EditProgramNoticePage({ params }: EditProgramNoticePageProps) {
  const { slug, id, noticeId } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)

  const notice = await programNoticeService.getProgramNoticeById(noticeId, academy.id).catch(() => null)
  if (!notice || notice.programId !== program.id) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}/notices`}>
        ← 공지 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">공지 수정</h1>
        <ProgramNoticeEditForm
          slug={slug}
          programId={program.id}
          noticeId={notice.id}
          schedules={program.schedules.filter((s) => s.isActive).map((s) => ({
            id: s.id,
            title: s.title,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          }))}
          initialType={notice.type}
          initialTitle={notice.title}
          initialContent={notice.content ?? ''}
          initialIsVisible={notice.isVisible}
          initialMakeupDate={formatDateInput(notice.makeupDate)}
          initialMakeupStartTime={formatTimeInput(notice.makeupStartTime)}
          initialMakeupEndTime={formatTimeInput(notice.makeupEndTime)}
          initialCancelDate={formatDateInput(notice.cancelDate)}
          initialOriginalDate={formatDateInput(notice.originalDate)}
          initialChangeDate={formatDateInput(notice.changeDate)}
          initialChangeFromTime={formatTimeInput(notice.changeFromTime)}
          initialChangeToTime={formatTimeInput(notice.changeToTime)}
          initialDayOfWeek={notice.dayOfWeek != null ? String(notice.dayOfWeek) : ''}
        />
      </section>
    </main>
  )
}
