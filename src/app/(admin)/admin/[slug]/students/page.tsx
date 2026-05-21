import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { StudentExcelImport } from '@/components/admin/student-excel-import'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { deleteStudentAction } from './actions'

type AdminStudentsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ active?: string; grade?: string; programId?: string; q?: string; schoolName?: string }>
}

export default async function AdminStudentsPage({ params, searchParams }: AdminStudentsPageProps) {
  const { slug } = await params
  const filters = await searchParams
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const allStudents = await studentService.getAdminStudents(academy.id)
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedSchool = filters.schoolName?.trim() || ''
  const selectedGrade = filters.grade?.trim() || ''
  const selectedProgramId = filters.programId?.trim() || ''
  const selectedActive = filters.active === 'true' ? true : filters.active === 'false' ? false : undefined
  const schools = Array.from(new Set(allStudents.map((student) => student.schoolName).filter(isString))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  )
  const grades = Array.from(new Set(allStudents.map((student) => student.grade).filter(isString))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  )
  const programs = Array.from(
    new Map(
      allStudents.flatMap((student) => student.enrollments.map((enrollment) => [enrollment.programId, enrollment.program])),
    ).values(),
  ).sort((a, b) => a.title.localeCompare(b.title, 'ko-KR'))
  const students = allStudents.filter((student) => {
    const matchesQuery = query
      ? [
          student.name,
          student.schoolName ?? '',
          student.grade ?? '',
          student.phone ?? '',
          student.parentPhone ?? '',
          student.user?.email ?? '',
        ].some((value) => value.toLowerCase().includes(query))
      : true
    const matchesSchool = selectedSchool ? student.schoolName === selectedSchool : true
    const matchesGrade = selectedGrade ? student.grade === selectedGrade : true
    const matchesProgram = selectedProgramId
      ? student.enrollments.some((enrollment) => enrollment.programId === selectedProgramId)
      : true
    const matchesActive = selectedActive === undefined ? true : student.isActive === selectedActive
    return matchesQuery && matchesSchool && matchesGrade && matchesProgram && matchesActive
  })

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">학생 관리</h1>
          <p className="mt-1 text-sm text-slate-600">학생 계정, 상태, 수강 수업을 리스트로 확인합니다.</p>
        </div>
        <div className="flex gap-2">
          <StudentExcelImport slug={slug} />
          <a className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" href={`/admin/${slug}/students/new`}>
            학생 등록
          </a>
        </div>
      </div>
      <section className="mb-6 rounded-lg border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">검색</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={filters.q ?? ''} name="q" placeholder="이름, 학교, 연락처, 이메일" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학교</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedSchool} name="schoolName">
              <option value="">전체</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학년</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedGrade} name="grade">
              <option value="">전체</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">수강 수업</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedProgramId} name="programId">
              <option value="">전체</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">상태</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={filters.active ?? ''} name="active">
              <option value="">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              조회
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/students`}>
              초기화
            </a>
          </div>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {students.length}명</p>
      </section>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">학교/학년</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">로그인 계정</th>
              <th className="px-4 py-3 font-medium">수강 수업</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-medium">
                  <a className="hover:text-blue-700 hover:underline" href={`/admin/${slug}/students/${student.id}`}>
                    {student.name}
                  </a>
                </td>
                <td className="px-4 py-3">{[student.schoolName, student.grade].filter(Boolean).join(' ') || '-'}</td>
                <td className="px-4 py-3">{student.phone ?? student.parentPhone ?? '-'}</td>
                <td className="px-4 py-3">{student.user?.email ?? '-'}</td>
                <td className="px-4 py-3">{student.enrollments.length}개</td>
                <td className="px-4 py-3">
                  {student.isActive ? (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">활성</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">비활성</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a className="rounded border px-3 py-1" href={`/admin/${slug}/students/${student.id}`}>
                      상세
                    </a>
                    <a className="rounded border px-3 py-1" href={`/admin/${slug}/students/${student.id}/edit`}>
                      수정
                    </a>
                    <form action={deleteStudentAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={student.id} />
                      <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 학생을 삭제할까요?">
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 ? <p className="p-4 text-sm text-slate-500">등록된 학생이 없습니다.</p> : null}
      </div>
    </main>
  )
}

function isString(value: string | null): value is string {
  return Boolean(value)
}
