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
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">TIMETABLE</div>
          <h1 className="pub-page-title">시간표</h1>
          <p className="pub-page-subtitle">요일별 수업 시간과 담당 선생님을 확인하세요.</p>
        </div>
      </div>

      <div className="pub-page-content">
        <div className="pub-schedule-grid">
          {dayLabels.map((label, dayOfWeek) => (
            <section key={label} className="pub-day-col">
              <div className="pub-day-header">{label}</div>
              <div className="pub-day-body">
                <DayItems
                  schedules={schedules.filter((s) => s.dayOfWeek === dayOfWeek)}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

function DayItems({ schedules }: { schedules: Schedule[] }) {
  if (schedules.length === 0) {
    return <p className="pub-empty">수업 없음</p>
  }

  return (
    <>
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className="pub-schedule-card"
          style={{ borderLeftColor: schedule.color ?? 'var(--gold)' }}
        >
          <div className="pub-schedule-card-time">
            {schedule.startTime} – {schedule.endTime}
          </div>
          <div className="pub-schedule-card-title">{schedule.title}</div>
          <div className="pub-schedule-card-meta">
            {schedule.subject ? <span>{schedule.subject}</span> : null}
            {schedule.subject && schedule.teacher ? ' · ' : null}
            {schedule.teacher ? <span>{schedule.teacher}</span> : null}
            {schedule.room ? <div>{schedule.room}</div> : null}
          </div>
        </div>
      ))}
    </>
  )
}
