import type { EnrollmentStatus } from '@prisma/client'
import { redirect } from 'next/navigation'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/schedule.service'
import { testResultService } from '@/lib/services/test-result.service'
import { formatPhone } from '@/lib/utils/phone'

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  ACTIVE: '수강중',
  PAUSED: '일시정지',
  ENDED: '종료',
}

const enrollmentStatusClass: Record<EnrollmentStatus, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700',
  PAUSED: 'bg-yellow-50 text-yellow-700',
  ENDED: 'bg-slate-100 text-slate-500',
}

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
        {isAdmin ? '← 수업 관리로 돌아가기' : '← 내 수업으로 돌아가기'}
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

      <section className="mb-6 grid gap-4 md:grid-cols-4">
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

      <section>
        {(() => {
          const activeEnrollments = program.enrollments.filter((e) => e.status === 'ACTIVE')
          const otherEnrollments = program.enrollments.filter((e) => e.status !== 'ACTIVE')
          const sorted = [...activeEnrollments, ...otherEnrollments]
          return (
            <>
              <h2 className="mb-3 font-semibold">
                수강생 <span className="ml-1 text-sm font-normal text-slate-500">{activeEnrollments.length}명 수강중</span>
              </h2>
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">학교/학년</th>
                      <th className="px-4 py-3 font-medium">연락처</th>
                      <th className="px-4 py-3 font-medium">수강 상태</th>
                      <th className="px-4 py-3 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sorted.map(({ id: enrollId, status, student }) => (
                      <tr key={enrollId} className={status !== 'ACTIVE' ? 'bg-slate-50 text-slate-400' : ''}>
                        <td className="px-4 py-3 font-medium">
                          <a className="hover:text-blue-700 hover:underline" href={`/admin/${slug}/students/${student.id}?from=program&programId=${id}`}>
                            {student.name}
                          </a>
                        </td>
                        <td className="px-4 py-3">{[student.schoolName, student.grade].filter(Boolean).join(' ') || '-'}</td>
                        <td className="px-4 py-3">{formatPhone(student.phone) || formatPhone(student.parentPhone) || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-2 py-1 text-xs ${enrollmentStatusClass[status]}`}>
                            {enrollmentStatusLabels[status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a className="rounded border px-3 py-1" href={`/admin/${slug}/students/${student.id}?from=program&programId=${id}`}>
                            학생 상세
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {program.enrollments.length === 0 && (
                  <p className="p-4 text-sm text-slate-500">수강 중인 학생이 없습니다.</p>
                )}
              </div>
            </>
          )
        })()}
      </section>
    </main>
  )
}
