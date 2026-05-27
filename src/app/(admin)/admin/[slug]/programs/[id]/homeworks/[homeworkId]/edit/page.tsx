import { notFound, redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { homeworkService } from '@/lib/services/homework.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { updateHomeworkAction } from '../../../actions'

type EditHomeworkPageProps = {
  params: Promise<{ slug: string; id: string; homeworkId: string }>
}

export default async function EditHomeworkPage({ params }: EditHomeworkPageProps) {
  const { slug, id, homeworkId } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)
  const [homework, students] = await Promise.all([
    homeworkService.getHomeworkById(homeworkId, academy.id).catch(() => null),
    studentService.getAdminStudents(academy.id),
  ])
  if (!homework || homework.programId !== program.id) notFound()
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}/homeworks`}>
        숙제 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">숙제 수정</h1>
        <form action={updateHomeworkAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="programId" value={program.id} />
          <input type="hidden" name="id" value={homework.id} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">대상 학생</span>
            <select className="w-full rounded border px-3 py-2 text-sm" defaultValue={homework.studentId ?? ''} name="studentId">
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
            <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={homework.title} name="title" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">내용</span>
            <textarea className="min-h-32 w-full rounded border px-3 py-2 text-sm" defaultValue={homework.content} name="content" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">시작일</span>
            <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={formatDateInput(homework.startDate)} name="startDate" required type="date" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">마감일</span>
            <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={formatDateInput(homework.dueDate)} name="dueDate" type="date" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={homework.isCompleted} name="isCompleted" type="checkbox" value="true" />
            숙제 완료
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={homework.isVisible} name="isVisible" type="checkbox" value="true" />
            학생에게 공개
          </label>
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="숙제를 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : ''
}
