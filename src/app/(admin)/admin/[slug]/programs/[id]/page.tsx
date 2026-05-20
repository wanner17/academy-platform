import { redirect } from 'next/navigation'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/schedule.service'
import { testResultService } from '@/lib/services/test-result.service'

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

  const [schedules, homeworks, progressLogs, testResults] = await Promise.all([
    scheduleService.getProgramSchedules(academy.id, program.id),
    homeworkService.getProgramHomeworks(academy.id, program.id),
    progressService.getProgramProgressLogs(academy.id, program.id),
    testResultService.getAdminTestResults(academy.id, { programId: program.id }),
  ])
  const subject = program.subject ?? program.teacher?.subject ?? ''

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <a className="mb-2 inline-block text-sm text-blue-700" href={isAdmin ? `/admin/${slug}/programs` : `/admin/${slug}/my`}>
        {isAdmin ? '수업 관리로 돌아가기' : '내 수업으로 돌아가기'}
      </a>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{program.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {programModeLabels[program.mode]} · {targetLevelLabels[program.targetLevel]}
            {subject ? ` · ${subject}` : ''}
            {program.teacher?.name ? ` · ${program.teacher.name}` : ''}
          </p>
        </div>
        <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/programs/${program.id}/edit`}>
          수업 정보 수정
        </a>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/programs/${program.id}/schedule`}>
          <div className="text-sm text-slate-500">시간표</div>
          <div className="mt-2 text-3xl font-bold">{schedules.length}</div>
          <p className="mt-2 text-sm text-slate-600">요일/시간표를 별도 화면에서 관리합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/programs/${program.id}/homeworks`}>
          <div className="text-sm text-slate-500">숙제</div>
          <div className="mt-2 text-3xl font-bold">{homeworks.length}</div>
          <p className="mt-2 text-sm text-slate-600">숙제 목록과 등록 폼을 별도 화면에서 관리합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/programs/${program.id}/progress`}>
          <div className="text-sm text-slate-500">진도</div>
          <div className="mt-2 text-3xl font-bold">{progressLogs.length}</div>
          <p className="mt-2 text-sm text-slate-600">수업 진도 기록을 별도 화면에서 관리합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/programs/${program.id}/tests`}>
          <div className="text-sm text-slate-500">테스트</div>
          <div className="mt-2 text-3xl font-bold">{testResults.length}</div>
          <p className="mt-2 text-sm text-slate-600">학생별 테스트 결과를 별도 화면에서 관리합니다.</p>
        </a>
      </section>
    </main>
  )
}
