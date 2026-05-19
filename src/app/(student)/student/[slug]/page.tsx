import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { requireStudentPage } from '@/lib/auth/server'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { studentService } from '@/lib/services/student.service'

type StudentHomePageProps = {
  params: Promise<{ slug: string }>
}

export default async function StudentHomePage({ params }: StudentHomePageProps) {
  const { slug } = await params
  const { academy, user } = await requireStudentPage(slug)
  const student = await studentService.getStudentByUserId(user.id, academy.id)
  const activeEnrollments = student.enrollments.filter((enrollment) => enrollment.status === 'ACTIVE')
  const programIds = activeEnrollments.map((e) => e.programId)

  const [homeworks, progressLogs] = await Promise.all([
    homeworkService.getVisibleHomeworksForPrograms(academy.id, programIds),
    progressService.getVisibleProgressLogsForPrograms(academy.id, programIds),
  ])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">{student.name} 학생</h1>
      <p className="mb-8 text-slate-600">
        {student.schoolName ? `${student.schoolName} ` : ''}
        {student.grade ?? ''}
      </p>

      {/* My Classes */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">내 수업</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {activeEnrollments.map((enrollment) => (
            <article className="rounded-lg border bg-white p-5" key={enrollment.id}>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                  {programModeLabels[enrollment.program.mode]}
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {targetLevelLabels[enrollment.program.targetLevel]}
                </span>
                {enrollment.program.subject ? (
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{enrollment.program.subject}</span>
                ) : null}
              </div>
              <h3 className="text-lg font-semibold">{enrollment.program.title}</h3>
              {enrollment.program.teacher ? (
                <p className="mt-2 text-sm text-slate-600">담당 강사: {enrollment.program.teacher.name}</p>
              ) : null}
            </article>
          ))}
          {activeEnrollments.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">배정된 수업이 없습니다.</div>
          ) : null}
        </div>
      </section>

      {/* Homework */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">숙제</h2>
        <div className="space-y-3">
          {homeworks.map((hw) => (
            <article className="rounded-lg border bg-white p-5" key={hw.id}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{hw.program.title}</span>
                {hw.dueDate ? (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    마감 {hw.dueDate.toLocaleDateString('ko-KR')}
                  </span>
                ) : null}
              </div>
              <h3 className="font-medium">{hw.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{hw.content}</p>
            </article>
          ))}
          {homeworks.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 숙제가 없습니다.</div>
          ) : null}
        </div>
      </section>

      {/* Progress Logs */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">진도</h2>
        <div className="space-y-3">
          {progressLogs.map((log) => (
            <article className="rounded-lg border bg-white p-5" key={log.id}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{log.program.title}</span>
                <span className="text-xs text-slate-500">{log.classDate.toLocaleDateString('ko-KR')} 수업</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{log.content}</p>
              {log.nextPlan ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-blue-700">
                  <span className="font-medium">다음 수업 계획:</span> {log.nextPlan}
                </p>
              ) : null}
            </article>
          ))}
          {progressLogs.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 진도 기록이 없습니다.</div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
