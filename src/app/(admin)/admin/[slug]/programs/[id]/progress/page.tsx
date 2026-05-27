import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { progressService } from '@/lib/services/progress.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { createProgressLogAction, deleteProgressLogAction } from '../actions'

type ProgramProgressPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function ProgramProgressPage({ params }: ProgramProgressPageProps) {
  const { slug, id } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)

  const [progressLogs, students] = await Promise.all([
    progressService.getProgramProgressLogs(academy.id, program.id),
    studentService.getAdminStudents(academy.id),
  ])
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
          ← 수업 상세
        </a>
        <h1 className="mb-4 text-2xl font-bold">{program.title} 진도</h1>
        <div className="space-y-3">
          {progressLogs.map((log) => (
            <article key={log.id} className="rounded-lg border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{log.classDate.toLocaleDateString('ko-KR')} 수업</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{log.student?.name ?? '전체'}</span>
                    {!log.isVisible ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">비공개</span> : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{log.content}</p>
                  {log.nextPlan ? <p className="mt-2 whitespace-pre-wrap text-sm text-blue-700"><span className="font-medium">다음 수업 계획:</span> {log.nextPlan}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">{log.author.name} · {log.createdAt.toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a className="rounded border px-3 py-1 text-sm" href={`/admin/${slug}/programs/${program.id}/progress/${log.id}/edit`}>
                    수정
                  </a>
                  <form action={deleteProgressLogAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="id" value={log.id} />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 진도 기록을 삭제할까요?">
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
          {progressLogs.length === 0 ? <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 진도 기록이 없습니다.</div> : null}
        </div>
      </section>
      <aside className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">진도 추가</h2>
        <form action={createProgressLogAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="programId" value={program.id} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">대상 학생</span>
            <select className="w-full rounded border px-3 py-2 text-sm" name="studentId">
              <option value="">전체 학생</option>
              {enrolledStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
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
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="진도를 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </aside>
    </main>
  )
}
