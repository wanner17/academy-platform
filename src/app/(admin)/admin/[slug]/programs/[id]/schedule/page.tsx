import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScheduleFields } from '@/components/admin/schedule-fields'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { dayLabels } from '@/lib/schedule-labels'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/schedule.service'
import { createProgramScheduleAction, deleteProgramScheduleAction } from '../actions'

type ProgramSchedulePageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function ProgramSchedulePage({ params }: ProgramSchedulePageProps) {
  const { slug, id } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)

  const schedules = await scheduleService.getProgramSchedules(academy.id, program.id)
  const teacherName = program.teacher?.name ?? ''
  const subject = program.subject ?? program.teacher?.subject ?? ''

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
          수업 상세
        </a>
        <h1 className="mb-4 text-2xl font-bold">{program.title} 시간표</h1>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">요일/시간</th>
                <th className="px-4 py-3 font-medium">수업명</th>
                <th className="px-4 py-3 font-medium">강사</th>
                <th className="px-4 py-3 font-medium">교실</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-4 py-3">{dayLabels[schedule.dayOfWeek]}요일 {schedule.startTime}-{schedule.endTime}</td>
                  <td className="px-4 py-3 font-medium">{schedule.title}</td>
                  <td className="px-4 py-3">{schedule.teacher ?? '-'}</td>
                  <td className="px-4 py-3">{schedule.room ?? '-'}</td>
                  <td className="px-4 py-3">{schedule.isActive ? '공개' : '비공개'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a className="rounded border px-3 py-1" href={`/admin/${slug}/schedule/${schedule.id}/edit`}>
                        수정
                      </a>
                      <form action={deleteProgramScheduleAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="programId" value={program.id} />
                        <input type="hidden" name="id" value={schedule.id} />
                        <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 시간표를 삭제할까요?">
                          삭제
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 ? <p className="p-4 text-sm text-slate-500">등록된 시간표가 없습니다.</p> : null}
        </div>
      </section>
      <aside className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">시간표 추가</h2>
        <form action={createProgramScheduleAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <ScheduleFields
            programId={program.id}
            defaults={{ title: program.title, subject, teacher: teacherName, room: '', dayOfWeek: 0, startTime: '16:00', endTime: '18:00', color: '#2563EB', isActive: true }}
          />
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="시간표를 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </aside>
    </main>
  )
}
