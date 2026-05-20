import { notFound } from 'next/navigation'
import type { Schedule } from '@prisma/client'
import { dayLabels } from '@/lib/schedule-labels'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { programService } from '@/lib/services/program.service'
import { scheduleService } from '@/lib/services/schedule.service'
import { publicPath } from '@/lib/utils/public-path'
import { getAcademyBySlug } from '@/lib/utils/tenant'

type ProgramDetailPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { slug, id } = await params
  const academy = await getAcademyBySlug(slug)
  const program = await programService.getProgramById(id, academy.id).catch(() => null)
  if (!program?.isActive) notFound()

  const schedules = await scheduleService.getPublicProgramSchedules(academy.id, program.id)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={publicPath(slug, '/programs')}>
        수업 안내
      </a>
      <section className="mb-8 rounded-lg border bg-white p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
            {programModeLabels[program.mode]}
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {targetLevelLabels[program.targetLevel]}
          </span>
          {program.subject ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{program.subject}</span> : null}
          {program.schoolName ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{program.schoolName}</span> : null}
          {program.grade ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{program.grade}</span> : null}
        </div>
        <h1 className="text-2xl font-bold">{program.title}</h1>
        {program.teacher ? <p className="mt-2 text-sm text-slate-600">담당 강사: {program.teacher.name}</p> : null}
        <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {program.description || '수업 설명을 준비 중입니다.'}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">시간표</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ScheduleItems schedules={schedules} />
        </div>
      </section>
    </main>
  )
}

function ScheduleItems({ schedules }: { schedules: Schedule[] }) {
  if (schedules.length === 0) {
    return <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 시간표가 없습니다.</div>
  }

  return schedules.map((schedule) => (
    <article className="rounded border-l-4 bg-white p-4" key={schedule.id} style={{ borderLeftColor: schedule.color ?? '#2563EB' }}>
      <p className="text-sm font-semibold">{dayLabels[schedule.dayOfWeek]}요일</p>
      <p className="mt-1 text-sm font-semibold">
        {schedule.startTime} - {schedule.endTime}
      </p>
      <h3 className="mt-2 font-medium">{schedule.title}</h3>
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        {schedule.subject ? <p>과목: {schedule.subject}</p> : null}
        {schedule.teacher ? <p>강사: {schedule.teacher}</p> : null}
        {schedule.room ? <p>교실: {schedule.room}</p> : null}
      </div>
    </article>
  ))
}
