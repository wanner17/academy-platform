import { scheduleService } from '@/lib/services/schedule.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { InteractiveSchedule } from '@/components/public/interactive-schedule'

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
        <InteractiveSchedule schedules={schedules} />
      </div>
    </>
  )
}
