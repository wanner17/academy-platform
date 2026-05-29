import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { Pagination } from '@/components/admin/pagination'
import { StudentExcelImport } from '@/components/admin/student-excel-import'
import { requireMemberPage } from '@/lib/auth/server'
import { programService } from '@/lib/services/program.service'
import { studentService } from '@/lib/services/student.service'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'
import { formatPhone } from '@/lib/utils/phone'
import { deleteStudentAction, restoreStudentAction, withdrawStudentAction } from './actions'

type AdminStudentsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ grade?: string; limit?: string; page?: string; programId?: string; q?: string; schoolName?: string; status?: string }>
}

export default async function AdminStudentsPage({ params, searchParams }: AdminStudentsPageProps) {
  const { slug } = await params
  const filters = await searchParams
  const { academy, user } = await requireMemberPage(slug)
  let allStudents = await studentService.getAdminStudents(academy.id)

  if (user.role === 'TEACHER') {
    const teacherPrograms = await programService.getTeacherPrograms(academy.id, user.id)
    const teacherProgramIds = new Set(teacherPrograms.map((p) => p.id))
    allStudents = allStudents.filter((s) => s.enrollments.some((e) => teacherProgramIds.has(e.programId)))
  }
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedSchool = filters.schoolName?.trim() || ''
  const selectedGrade = filters.grade?.trim() || ''
  const selectedProgramId = filters.programId?.trim() || ''
  const selectedStatus = filters.status?.trim() || ''
  const { page, limit } = parsePaginationParams(filters)

  const schools = Array.from(new Set(allStudents.map((s) => s.schoolName).filter(isString))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  )
  const grades = Array.from(
    new Set(allStudents.map((s) => s.grade).filter(isString).map(normalizeGrade))
  ).sort(sortGrade)
  const programs = Array.from(
    new Map(
      allStudents.flatMap((s) => s.enrollments.map((e) => [e.programId, e.program])),
    ).values(),
  ).sort((a, b) => a.title.localeCompare(b.title, 'ko-KR'))

  const filteredStudents = allStudents.filter((student) => {
    const matchesQuery = query
      ? [
          student.name,
          student.schoolName ?? '',
          student.grade ?? '',
          student.phone ?? '',
          student.parentPhone ?? '',
          student.user?.email ?? '',
        ].some((v) => v.toLowerCase().includes(query))
      : true
    const matchesSchool = selectedSchool ? student.schoolName === selectedSchool : true
    const matchesGrade = selectedGrade ? normalizeGrade(student.grade ?? '') === selectedGrade : true
    const matchesProgram = selectedProgramId
      ? student.enrollments.some((e) => e.programId === selectedProgramId)
      : true
    const matchesStatus =
      selectedStatus === 'active' ? student.isActive && !student.withdrawnAt :
      selectedStatus === 'inactive' ? !student.isActive && !student.withdrawnAt :
      selectedStatus === 'withdrawn' ? Boolean(student.withdrawnAt) :
      true
    return matchesQuery && matchesSchool && matchesGrade && matchesProgram && matchesStatus
  })

  const { items: students, total, totalPages, page: currentPage } = paginateArray(filteredStudents, page, limit)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">학생 관리</h1>
          <p className="mt-1 text-sm text-slate-600">학생 계정, 상태, 수강 수업을 리스트로 확인합니다.</p>
        </div>
        <div className="flex gap-2">
          <a
            className="rounded border px-4 py-2 text-sm font-medium"
            download
            href={`/api/admin/${slug}/students/export`}
          >
            엑셀 다운로드
          </a>
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
              {schools.map((school) => <option key={school} value={school}>{school}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학년</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedGrade} name="grade">
              <option value="">전체</option>
              {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">수강 수업</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedProgramId} name="programId">
              <option value="">전체</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">상태</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedStatus} name="status">
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="withdrawn">탈퇴</option>
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
        <p className="mt-3 text-sm text-slate-500">총 {total}명</p>
      </section>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
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
              <tr key={student.id} className={student.withdrawnAt ? 'bg-slate-50 text-slate-400' : ''}>
                <td className="px-4 py-3 font-medium">
                  <a className="hover:text-blue-700 hover:underline" href={`/admin/${slug}/students/${student.id}`}>
                    {student.name}
                  </a>
                </td>
                <td className="px-4 py-3">{[student.schoolName, student.grade].filter(Boolean).join(' ') || '-'}</td>
                <td className="px-4 py-3">{formatPhone(student.phone) || formatPhone(student.parentPhone) || '-'}</td>
                <td className="px-4 py-3">{student.user?.email ?? '-'}</td>
                <td className="px-4 py-3">{student.enrollments.length}개</td>
                <td className="px-4 py-3">
                  {student.withdrawnAt ? (
                    <div>
                      <span className="rounded bg-red-50 px-2 py-1 text-xs text-red-600">탈퇴</span>
                      <div className="mt-0.5 text-xs text-slate-400">{student.withdrawnAt.toLocaleDateString('ko-KR')}</div>
                    </div>
                  ) : student.isActive ? (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">활성</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">비활성</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a className="rounded border px-3 py-1" href={`/admin/${slug}/students/${student.id}`}>상세</a>
                    {!student.withdrawnAt && (
                      <a className="rounded border px-3 py-1" href={`/admin/${slug}/students/${student.id}/edit`}>수정</a>
                    )}
                    {student.withdrawnAt ? (
                      <form action={restoreStudentAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="id" value={student.id} />
                        <ConfirmSubmitButton
                          className="rounded border border-green-200 px-3 py-1 text-green-700"
                          message={`${student.name} 학생을 복귀시킬까요?`}
                        >
                          복귀
                        </ConfirmSubmitButton>
                      </form>
                    ) : (
                      <form action={withdrawStudentAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="id" value={student.id} />
                        <ConfirmSubmitButton
                          className="rounded border border-orange-200 px-3 py-1 text-orange-700"
                          message={`${student.name} 학생을 탈퇴 처리할까요? 이력은 보존됩니다.`}
                        >
                          탈퇴
                        </ConfirmSubmitButton>
                      </form>
                    )}
                    <form action={deleteStudentAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={student.id} />
                      <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 학생을 완전히 삭제할까요? 복구할 수 없습니다.">
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 ? <p className="p-4 text-sm text-slate-500">등록된 학생이 없습니다.</p> : null}
        <div className="border-t px-4">
          <Pagination
            basePath={`/admin/${slug}/students`}
            limit={limit}
            page={currentPage}
            searchParams={{ ...filters }}
            total={total}
            totalPages={totalPages}
          />
        </div>
      </div>
    </main>
  )
}

function isString(value: string | null): value is string {
  return Boolean(value)
}

function normalizeGrade(grade: string): string {
  const trimmed = grade.trim()
  const num = trimmed.replace(/학년$/, '').trim()
  return /^\d+$/.test(num) ? `${num}학년` : trimmed
}

function sortGrade(a: string, b: string): number {
  const numA = parseInt(a.replace(/학년$/, ''), 10)
  const numB = parseInt(b.replace(/학년$/, ''), 10)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB
  return a.localeCompare(b, 'ko-KR')
}
