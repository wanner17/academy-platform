import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScheduleFields } from '@/components/admin/schedule-fields'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { scheduleService } from '@/lib/services/schedule.service'
import { programService } from '@/lib/services/program.service'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { requireMemberPage } from '@/lib/auth/server'
import {
  createHomeworkAction,
  createProgressLogAction,
  createProgramScheduleAction,
  deleteHomeworkAction,
  deleteProgressLogAction,
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

  const [schedules, homeworks, progressLogs] = await Promise.all([
    scheduleService.getProgramSchedules(academy.id, program.id),
    homeworkService.getProgramHomeworks(academy.id, program.id),
    progressService.getProgramProgressLogs(academy.id, program.id),
  ])

  const teacherName = program.teacher?.name ?? ''
  const subject = program.subject ?? program.teacher?.subject ?? ''

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section className="space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
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

        {/* Schedules */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">시간표</h2>
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
              <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 시간표가 없습니다.</div>
            ) : null}
          </div>
        </div>

        {/* Homeworks */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">숙제</h2>
          <div className="space-y-3">
            {homeworks.map((hw) => (
              <article key={hw.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{hw.title}</span>
                      {hw.dueDate ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          마감 {hw.dueDate.toLocaleDateString('ko-KR')}
                        </span>
                      ) : null}
                      {!hw.isVisible ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">비공개</span>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{hw.content}</p>
                    <p className="mt-1 text-xs text-slate-400">{hw.author.name} · {hw.createdAt.toLocaleDateString('ko-KR')}</p>
                  </div>
                  <form action={deleteHomeworkAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="id" value={hw.id} />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 숙제를 삭제할까요?">
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </article>
            ))}
            {homeworks.length === 0 ? (
              <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 숙제가 없습니다.</div>
            ) : null}
          </div>
        </div>

        {/* Progress Logs */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">진도</h2>
          <div className="space-y-3">
            {progressLogs.map((log) => (
              <article key={log.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{log.classDate.toLocaleDateString('ko-KR')} 수업</span>
                      {!log.isVisible ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">비공개</span>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{log.content}</p>
                    {log.nextPlan ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-blue-700">
                        <span className="font-medium">다음 수업 계획:</span> {log.nextPlan}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-400">{log.author.name} · {log.createdAt.toLocaleDateString('ko-KR')}</p>
                  </div>
                  <form action={deleteProgressLogAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="id" value={log.id} />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 진도 기록을 삭제할까요?">
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </article>
            ))}
            {progressLogs.length === 0 ? (
              <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 진도 기록이 없습니다.</div>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        {/* Add Schedule */}
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

        {/* Add Homework */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">숙제 추가</h2>
          <form action={createHomeworkAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="programId" value={program.id} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">제목</span>
              <input className="w-full rounded border px-3 py-2 text-sm" name="title" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">내용</span>
              <textarea className="min-h-24 w-full rounded border px-3 py-2 text-sm" name="content" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">마감일 (선택)</span>
              <input className="w-full rounded border px-3 py-2 text-sm" name="dueDate" type="date" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked name="isVisible" type="checkbox" value="true" />
              학생에게 공개
            </label>
            <ConfirmSubmitButton
              className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
              message="숙제를 저장할까요?"
            >
              저장
            </ConfirmSubmitButton>
          </form>
        </section>

        {/* Add Progress Log */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">진도 추가</h2>
          <form action={createProgressLogAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="programId" value={program.id} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">수업일</span>
              <input className="w-full rounded border px-3 py-2 text-sm" name="classDate" required type="date" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">오늘 수업 내용</span>
              <textarea className="min-h-24 w-full rounded border px-3 py-2 text-sm" name="content" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">다음 수업 계획 (선택)</span>
              <textarea className="min-h-16 w-full rounded border px-3 py-2 text-sm" name="nextPlan" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked name="isVisible" type="checkbox" value="true" />
              학생에게 공개
            </label>
            <ConfirmSubmitButton
              className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
              message="진도를 저장할까요?"
            >
              저장
            </ConfirmSubmitButton>
          </form>
        </section>
      </aside>
    </main>
  )
}
