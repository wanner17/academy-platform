import { notFound, redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { progressService } from '@/lib/services/progress.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { updateProgressLogAction } from '../../../actions'
import { StudentScopeCheckboxes } from '../../student-scope-checkboxes'

type EditProgressPageProps = {
  params: Promise<{ slug: string; id: string; progressId: string }>
}

export default async function EditProgressPage({ params }: EditProgressPageProps) {
  const { slug, id, progressId } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)
  const [progressLog, students] = await Promise.all([
    progressService.getProgressLogById(progressId, academy.id).catch(() => null),
    studentService.getAdminStudents(academy.id),
  ])
  if (!progressLog || progressLog.programId !== program.id) notFound()
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}/progress`}>
        ← 진도 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">진도 수정</h1>
        <form action={updateProgressLogAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="programId" value={program.id} />
          <input type="hidden" name="id" value={progressLog.id} />
          <StudentScopeCheckboxes
            initialStudentId={progressLog.studentId}
            students={enrolledStudents.map((student) => ({ id: student.id, name: student.name }))}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">수업일</span>
            <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={progressLog.classDate.toISOString().slice(0, 10)} name="classDate" required type="date" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">오늘 수업 내용</span>
            <textarea className="min-h-32 w-full rounded border px-3 py-2 text-sm" defaultValue={progressLog.content} name="content" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">다음 수업 계획 (선택)</span>
            <textarea className="min-h-20 w-full rounded border px-3 py-2 text-sm" defaultValue={progressLog.nextPlan ?? ''} name="nextPlan" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">숙제 수행률 (%, 선택)</span>
            <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={progressLog.homeworkRate ?? ''} max="100" min="0" name="homeworkRate" placeholder="0~100" type="number" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={progressLog.isVisible} name="isVisible" type="checkbox" value="true" />
            학생에게 공개
          </label>
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="진도를 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
