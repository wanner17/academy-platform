import { notFound } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { StudentFields } from '@/components/admin/student-fields'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { addEnrollmentAction, removeEnrollmentAction, resetStudentPasswordAction, updateStudentAction } from '../../actions'

type EditStudentPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { slug, id } = await params
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const [student, programs, schools] = await Promise.all([
    studentService.getStudentById(id, academy.id).catch(() => null),
    programService.getAdminPrograms(academy.id),
    studentService.getDistinctSchools(academy.id),
  ])
  if (!student) notFound()

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/students`}>
        ← 학생 관리
      </a>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border bg-white p-5">
          <h1 className="mb-4 text-2xl font-bold">학생 수정</h1>
          <form action={updateStudentAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={student.id} />
            <StudentFields defaults={student} schools={schools} />
            <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="학생 정보를 저장할까요?">
              저장
            </ConfirmSubmitButton>
          </form>
        </section>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">수강 수업</h2>
          <div className="mb-4 space-y-2">
            {student.enrollments.map((enrollment) => (
              <form action={removeEnrollmentAction} className="flex items-center justify-between gap-2 rounded border p-3" key={enrollment.id}>
                <span className="text-sm">{enrollment.program.title}</span>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="studentId" value={student.id} />
                <input type="hidden" name="programId" value={enrollment.programId} />
                <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="수강 수업에서 제거할까요?">
                  제거
                </ConfirmSubmitButton>
              </form>
            ))}
            {student.enrollments.length === 0 ? <p className="text-sm text-slate-500">배정된 수업 없음</p> : null}
          </div>
          <form action={addEnrollmentAction} className="space-y-3">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="studentId" value={student.id} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">수업 선택</span>
              <select className="w-full rounded border px-3 py-2 text-sm" name="programId" required>
                <option value="">수업 선택</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </label>
            <ConfirmSubmitButton className="w-full rounded bg-slate-800 px-4 py-2 text-sm text-white" message="이 수업에 배정할까요?">
              배정
            </ConfirmSubmitButton>
          </form>
        </section>
        <section className="rounded-lg border bg-white p-5 lg:col-start-2">
          <h2 className="mb-2 font-semibold">비밀번호 초기화</h2>
          {student.user ? (
            <>
              <p className="mb-4 text-sm text-slate-600">{student.user.email}</p>
              <form action={resetStudentPasswordAction} className="space-y-3">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="studentId" value={student.id} />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">새 임시 비밀번호</span>
                  <input className="w-full rounded border px-3 py-2 text-sm" minLength={8} name="password" type="password" required />
                </label>
                <ConfirmSubmitButton className="w-full rounded bg-red-700 px-4 py-2 text-sm font-medium text-white" message="학생 비밀번호를 초기화할까요?">
                  비밀번호 초기화
                </ConfirmSubmitButton>
              </form>
            </>
          ) : (
            <p className="text-sm text-slate-500">로그인 계정이 없습니다. 학생 정보에서 로그인 이메일과 임시 비밀번호를 입력해 계정을 먼저 연결하세요.</p>
          )}
        </section>
      </div>
    </main>
  )
}
