import type { Schedule } from '@prisma/client'
import { dayLabels } from '@/lib/schedule-labels'
import { scheduleService } from '@/lib/services/schedule.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'

type SchedulePageProps = {
  params: Promise<{ slug: string }>
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const schedules = await scheduleService.getPublicSchedules(academy.id)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">시간표</h1>
      <p className="mb-6 text-slate-600">요일별 수업 시간과 담당 선생님을 확인하세요.</p>
      <div className="grid gap-4 lg:grid-cols-7">
        {dayLabels.map((label, dayOfWeek) => (
          <section key={label} className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">{label}요일</h2>
            <div className="space-y-3">
              <ScheduleItems schedules={schedules.filter((schedule) => schedule.dayOfWeek === dayOfWeek)} />
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function ScheduleItems({ schedules }: { schedules: Schedule[] }) {
  if (schedules.length === 0) {
    return <p className="text-sm text-slate-400">수업 없음</p>
  }

  return schedules.map((schedule) => (
    <article className="rounded border-l-4 bg-slate-50 p-3" key={schedule.id} style={{ borderLeftColor: schedule.color ?? '#2563EB' }}>
      <p className="text-sm font-semibold">
        {schedule.startTime} - {schedule.endTime}
      </p>
      <h3 className="mt-1 font-medium">{schedule.title}</h3>
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        {schedule.subject ? <p>과목: {schedule.subject}</p> : null}
        {schedule.teacher ? <p>강사: {schedule.teacher}</p> : null}
        {schedule.room ? <p>교실: {schedule.room}</p> : null}
      </div>
    </article>
  ))
}
