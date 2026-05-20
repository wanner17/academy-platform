import { notFound } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { updateTestResultAction } from '../../actions'

type EditTestResultPageProps = {
  params: Promise<{ slug: string; id: string; resultId: string }>
}

export default async function EditTestResultPage({ params }: EditTestResultPageProps) {
  const { slug, id, resultId } = await params
  const { academy } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  const [result, students] = await Promise.all([
    testResultService.getTestResultById(resultId, academy.id),
    studentService.getAdminStudents(academy.id),
  ])
  if (result.programId !== program.id) notFound()
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}/tests`}>
        테스트 관리
      </a>
      <h1 className="mb-6 text-2xl font-bold">테스트 결과 수정</h1>
      <form action={updateTestResultAction} className="space-y-4 rounded-lg border bg-white p-5">
        <input name="slug" type="hidden" value={slug} />
        <input name="programId" type="hidden" value={program.id} />
        <input name="id" type="hidden" value={result.id} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학생</span>
          <select className="w-full rounded border px-3 py-2 text-sm" defaultValue={result.studentId} name="studentId" required>
            {enrolledStudents.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">테스트명</span>
          <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={result.testName} name="testName" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">점수</span>
          <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={result.score} name="score" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">일시</span>
          <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={toDateTimeLocalValue(result.testedAt)} name="testedAt" type="datetime-local" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">메모</span>
          <textarea className="min-h-24 w-full rounded border px-3 py-2 text-sm" defaultValue={result.memo ?? ''} name="memo" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked={result.isVisible} name="isVisible" type="checkbox" value="true" />
          학생에게 공개
        </label>
        <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="테스트 결과를 수정할까요?">
          저장
        </ConfirmSubmitButton>
      </form>
    </main>
  )
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
