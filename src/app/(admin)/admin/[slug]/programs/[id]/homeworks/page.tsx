import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { homeworkService } from '@/lib/services/homework.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { getKoreaDateParts } from '@/lib/utils/korea-time'
import { createHomeworkAction, deleteHomeworkAction } from '../actions'
import { HomeworkExcelUpload } from './homework-excel-upload'

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

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
          ← 수업 상세
        </a>
        <h1 className="mb-4 text-2xl font-bold">{program.title} 숙제</h1>
        <div className="space-y-3">
          {homeworks.map((hw) => (
            <article key={hw.id} className="rounded-lg border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{hw.title}</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{hw.student?.name ?? '전체'}</span>
                    {hw.isCompleted
                      ? <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">완료</span>
                      : <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">미완료</span>}
                    {hw.startDate ? <span className="rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-700">시작 {hw.startDate.toLocaleDateString('ko-KR')}</span> : null}
                    {hw.dueDate ? <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">마감 {hw.dueDate.toLocaleDateString('ko-KR')}</span> : null}
                    {!hw.isVisible ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">비공개</span> : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{hw.content}</p>
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
          ))}
          {homeworks.length === 0 ? <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 숙제가 없습니다.</div> : null}
        </div>
      </section>
      <aside className="space-y-6">
        <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">숙제 추가</h2>
        <form action={createHomeworkAction} className="space-y-4">
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
            <span className="mb-1 block text-sm font-medium">제목</span>
            <input className="w-full rounded border px-3 py-2 text-sm" name="title" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">내용</span>
            <textarea className="min-h-24 w-full rounded border px-3 py-2 text-sm" name="content" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">시작일</span>
            <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={today} name="startDate" required type="date" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">마감일</span>
            <input className="w-full rounded border px-3 py-2 text-sm" name="dueDate" type="date" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="isCompleted" type="checkbox" value="true" />
            숙제 완료
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked name="isVisible" type="checkbox" value="true" />
            학생에게 공개
          </label>
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="숙제를 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
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
