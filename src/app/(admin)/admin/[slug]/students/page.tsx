import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { programService } from '@/lib/services/program.service'
import { studentService } from '@/lib/services/student.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireAdminPage } from '@/lib/auth/server'
import {
  addEnrollmentAction,
  createStudentAction,
  deleteStudentAction,
  removeEnrollmentAction,
  updateStudentAction,
} from './actions'

type AdminStudentsPageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminStudentsPage({ params }: AdminStudentsPageProps) {
  const { slug } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const students = await studentService.getAdminStudents(academy.id)
  const programs = await programService.getAdminPrograms(academy.id)

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">학생 관리</h1>
        <div className="space-y-4">
          {students.map((student) => (
            <article className="rounded-lg border bg-white p-5" key={student.id}>
              <form action={updateStudentAction} className="space-y-4">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={student.id} />
                <StudentFields defaults={student} />
                <AccountFields email={student.user?.email ?? null} />
                <ConfirmSubmitButton
                  className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                  message="학생 정보를 저장할까요?"
                >
                  저장
                </ConfirmSubmitButton>
              </form>

              <section className="mt-5 rounded border bg-slate-50 p-4">
                <h2 className="mb-3 font-semibold">수강 수업</h2>
                <div className="mb-3 flex flex-wrap gap-2">
                  {student.enrollments.map((enrollment) => (
                    <form action={removeEnrollmentAction} key={enrollment.id}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="studentId" value={student.id} />
                      <input type="hidden" name="programId" value={enrollment.programId} />
                      <ConfirmSubmitButton className="rounded border bg-white px-3 py-1 text-sm" message="수강 수업에서 제거할까요?">
                        {enrollment.program.title} ×
                      </ConfirmSubmitButton>
                    </form>
                  ))}
                  {student.enrollments.length === 0 ? <p className="text-sm text-slate-500">매칭된 수업 없음</p> : null}
                </div>
                <form action={addEnrollmentAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <select className="min-w-56 rounded border px-3 py-2 text-sm" name="programId" required>
                    <option value="">수업 선택</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                  <ConfirmSubmitButton className="rounded bg-slate-800 px-4 py-2 text-sm text-white" message="이 수업에 배정할까요?">
                    배정
                  </ConfirmSubmitButton>
                </form>
              </section>

              <form action={deleteStudentAction} className="mt-3">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={student.id} />
                <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 학생을 삭제할까요?">
                  삭제
                </ConfirmSubmitButton>
              </form>
            </article>
          ))}
          {students.length === 0 ? <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 학생이 없습니다.</div> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">학생 추가</h2>
        <form action={createStudentAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <StudentFields />
          <AccountFields />
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="학생을 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}

function StudentFields({
  defaults,
}: {
  defaults?: {
    grade: string | null
    isActive: boolean
    memo: string | null
    name: string
    parentPhone: string | null
    phone: string | null
    schoolName: string | null
  }
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">이름</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.name ?? ''} name="name" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학교</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.schoolName ?? ''} name="schoolName" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학년</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.grade ?? ''} name="grade" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학생 연락처</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.phone ?? ''} name="phone" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학부모 연락처</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.parentPhone ?? ''} name="parentPhone" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">메모</span>
        <textarea className="min-h-20 w-full rounded border px-3 py-2" defaultValue={defaults?.memo ?? ''} name="memo" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={defaults?.isActive ?? true} name="isActive" type="checkbox" value="true" />
        활성
      </label>
    </>
  )
}

function AccountFields({ email }: { email?: string | null }) {
  return (
    <div className="rounded border bg-slate-50 p-4">
      <p className="mb-3 text-sm font-medium">학생 로그인 계정</p>
      {email ? (
        <p className="text-sm text-slate-600">{email}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">로그인 이메일</span>
            <input className="w-full rounded border px-3 py-2" name="loginEmail" type="email" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">임시 비밀번호</span>
            <input className="w-full rounded border px-3 py-2" minLength={8} name="loginPassword" type="password" />
          </label>
        </div>
      )}
    </div>
  )
}
