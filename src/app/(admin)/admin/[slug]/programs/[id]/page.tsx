import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScheduleFields } from '@/components/admin/schedule-fields'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { scheduleService } from '@/lib/services/schedule.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import {
  createProgramScheduleAction,
  deleteProgramScheduleAction,
  updateProgramScheduleAction,
} from './actions'

type AdminProgramDetailPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function AdminProgramDetailPage({ params }: AdminProgramDetailPageProps) {
  const { slug, id } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  const isAdmin = isAcademyAdminRole(user.role)
  const canManage = isAdmin || program.teacher?.userId === user.id

  if (!canManage) redirect(`/admin/${slug}/my`)

  const schedules = await scheduleService.getProgramSchedules(academy.id, program.id)
  const teacherName = program.teacher?.name ?? ''
  const subject = program.subject ?? program.teacher?.subject ?? ''

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <a className="mb-2 inline-block text-sm text-blue-700" href={isAdmin ? `/admin/${slug}/programs` : `/admin/${slug}/my`}>
              {isAdmin ? '수업 관리로 돌아가기' : '내 수업으로 돌아가기'}
            </a>
            <h1 className="text-2xl font-bold">{program.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {programModeLabels[program.mode]} · {targetLevelLabels[program.targetLevel]}
              {subject ? ` · ${subject}` : ''}
              {teacherName ? ` · ${teacherName}` : ''}
            </p>
            <a className="mt-3 inline-block rounded border px-4 py-2 text-sm" href={`/admin/${slug}/programs/${program.id}/edit`}>
              수업 정보 수정
            </a>
          </div>
        </div>

        <div className="space-y-4">
          {schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-lg border bg-white p-5">
              <form action={updateProgramScheduleAction} className="space-y-4">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={schedule.id} />
                <ScheduleFields defaults={schedule} programId={program.id} />
                <ConfirmSubmitButton
                  className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                  message="시간표를 저장할까요?"
                >
                  저장
                </ConfirmSubmitButton>
              </form>
              <form action={deleteProgramScheduleAction} className="mt-3">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="programId" value={program.id} />
                <input type="hidden" name="id" value={schedule.id} />
                <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 시간표를 삭제할까요?">
                  삭제
                </ConfirmSubmitButton>
              </form>
            </article>
          ))}
          {schedules.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">이 수업에 등록된 시간표가 없습니다.</div>
          ) : null}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">시간표 추가</h2>
          <form action={createProgramScheduleAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <ScheduleFields
              programId={program.id}
              defaults={{
                title: program.title,
                subject,
                teacher: teacherName,
                room: '',
                dayOfWeek: 0,
                startTime: '16:00',
                endTime: '18:00',
                color: '#2563EB',
                isActive: true,
              }}
            />
            <ConfirmSubmitButton
              className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
              message="시간표를 저장할까요?"
            >
              저장
            </ConfirmSubmitButton>
          </form>
        </section>
      </aside>
    </main>
  )
}
