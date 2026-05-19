import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScheduleFields } from '@/components/admin/schedule-fields'
import { scheduleService } from '@/lib/services/schedule.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { createScheduleAction, deleteScheduleAction, updateScheduleAction } from './actions'
import { requireAdminPage } from '@/lib/auth/server'

type AdminSchedulePageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminSchedulePage({ params }: AdminSchedulePageProps) {
  const { slug } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const schedules = await scheduleService.getAdminSchedules(academy.id)

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">시간표 관리</h1>
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-lg border bg-white p-5">
              <form action={updateScheduleAction} className="space-y-4">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={schedule.id} />
                <ScheduleFields defaults={schedule} />
                <ConfirmSubmitButton
                  className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                  message="시간표를 저장할까요?"
                >
                  저장
                </ConfirmSubmitButton>
              </form>
              <form action={deleteScheduleAction} className="mt-3">
                <input type="hidden" name="slug" value={slug} />
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
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">시간표 추가</h2>
        <form action={createScheduleAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <ScheduleFields />
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
