import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { homeworkService } from '@/lib/services/homework.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { getKoreaDateParts } from '@/lib/utils/korea-time'
import { deleteHomeworkAction, toggleHomeworkStudentCompletionAction } from '../actions'
import { HomeworkExcelUpload } from './homework-excel-upload'
import { HomeworkRowForm } from './homework-row-form'

type ProgramHomeworksPageProps = {
  params: Promise<{ slug: string; id: string }>
}

function getTodayStr() {
  const { day, month, year } = getKoreaDateParts(new Date())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default async function ProgramHomeworksPage({ params }: ProgramHomeworksPageProps) {
  const { slug, id } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)

  const today = getTodayStr()
  const [homeworks, students] = await Promise.all([
    homeworkService.getProgramHomeworks(academy.id, program.id),
    studentService.getAdminStudents(academy.id),
  ])
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )

  const groupedHomeworks = homeworks.reduce<Map<string, { displayDate: string; items: typeof homeworks }>>((acc, hw) => {
    const key = hw.startDate ? hw.startDate.toISOString().split('T')[0] : '__none__'
    const displayDate = hw.startDate ? hw.startDate.toLocaleDateString('ko-KR') : '날짜 없음'
    if (!acc.has(key)) acc.set(key, { displayDate, items: [] })
    acc.get(key)!.items.push(hw)
    return acc
  }, new Map())

  const sortedGroups = [...groupedHomeworks.entries()].sort(([a], [b]) => {
    if (a === '__none__') return 1
    if (b === '__none__') return -1
    return b.localeCompare(a)
  })

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
          ← 수업 상세
        </a>
        <h1 className="mb-4 text-2xl font-bold">{program.title} 숙제</h1>
        <div className="space-y-3">
          {sortedGroups.map(([key, { displayDate, items }]) => (
            <details key={key} className="group rounded-lg border bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 select-none">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{displayDate}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{items.length}건</span>
                </div>
                <span className="text-slate-400 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="space-y-2 border-t px-5 py-4">
                {items.map((hw) => {
            const isAllStudents = hw.studentId === null
            const completedCount = isAllStudents
              ? hw.completions.filter((c) => c.isCompleted).length
              : 0
            const totalCount = isAllStudents ? enrolledStudents.length : 0
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            return (
              <article key={hw.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{hw.title}</span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{hw.student?.name ?? '전체'}</span>
                      {isAllStudents ? (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${pct === 100 ? 'bg-green-50 text-green-700' : pct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {pct}% ({completedCount}/{totalCount})
                        </span>
                      ) : (
                        hw.isCompleted
                          ? <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">완료</span>
                          : <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">미완료</span>
                      )}
                      {hw.startDate ? <span className="rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-700">시작 {hw.startDate.toLocaleDateString('ko-KR')}</span> : null}
                      {hw.dueDate ? <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">마감 {hw.dueDate.toLocaleDateString('ko-KR')}</span> : null}
                      {!hw.isVisible ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">비공개</span> : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{hw.content}</p>
                    {isAllStudents && enrolledStudents.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {enrolledStudents.map((student) => {
                          const completion = hw.completions.find((c) => c.studentId === student.id)
                          const done = completion?.isCompleted ?? false
                          return (
                            <form key={student.id} action={toggleHomeworkStudentCompletionAction}>
                              <input type="hidden" name="slug" value={slug} />
                              <input type="hidden" name="programId" value={program.id} />
                              <input type="hidden" name="homeworkId" value={hw.id} />
                              <input type="hidden" name="studentId" value={student.id} />
                              <input type="hidden" name="isCompleted" value={done ? 'false' : 'true'} />
                              <button
                                type="submit"
                                className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-colors ${done ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                              >
                                {done ? '✓ ' : ''}{student.name}
                              </button>
                            </form>
                          )
                        })}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-slate-400">{hw.author.name} · {hw.createdAt.toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a className="rounded border px-3 py-1 text-sm" href={`/admin/${slug}/programs/${program.id}/homeworks/${hw.id}/edit`}>
                      수정
                    </a>
                    <form action={deleteHomeworkAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="programId" value={program.id} />
                      <input type="hidden" name="id" value={hw.id} />
                      <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 숙제를 삭제할까요?">
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </article>
            )
                })}
              </div>
            </details>
          ))}
          {homeworks.length === 0 ? <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 숙제가 없습니다.</div> : null}
        </div>
      </section>
      <aside className="space-y-6">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">숙제 추가</h2>
          <HomeworkRowForm
            enrolledStudents={enrolledStudents.map((s) => ({ id: s.id, name: s.name }))}
            programId={program.id}
            slug={slug}
            today={today}
          />
        </div>
        <HomeworkExcelUpload
          enrolledStudentNames={enrolledStudents.map((s) => s.name)}
          programId={program.id}
          slug={slug}
        />
      </aside>
    </main>
  )
}
