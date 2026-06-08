import { Pagination } from '@/components/admin/pagination'
import { requireMemberPage } from '@/lib/auth/server'
import { programService } from '@/lib/services/program.service'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'

type AdminTestsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ limit?: string; page?: string; programId?: string; q?: string; qField?: string; studentId?: string }>
}

export default async function AdminTestsPage({ params, searchParams }: AdminTestsPageProps) {
  const { slug } = await params
  const filters = await searchParams
  const { academy, user } = await requireMemberPage(slug)
  const { page, limit } = parsePaginationParams(filters)

  let teacherProgramIds: Set<string> | null = null
  if (user.role === 'TEACHER') {
    const teacherPrograms = await programService.getTeacherPrograms(academy.id, user.id)
    teacherProgramIds = new Set(teacherPrograms.map((p) => p.id))
  }

  const [rawResults, allPrograms, allStudents] = await Promise.all([
    testResultService.getAdminTestResults(academy.id, filters),
    programService.getAdminPrograms(academy.id),
    studentService.getAdminStudents(academy.id),
  ])

  const allResults = teacherProgramIds ? rawResults.filter((r) => teacherProgramIds!.has(r.programId)) : rawResults
  const programs = teacherProgramIds ? allPrograms.filter((p) => teacherProgramIds!.has(p.id)) : allPrograms
  const students = teacherProgramIds
    ? allStudents.filter((s) => s.enrollments.some((e) => teacherProgramIds!.has(e.programId)))
    : allStudents

  const { items: results, total, totalPages, page: currentPage } = paginateArray(allResults, page, limit)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">테스트 관리</h1>
          <p className="mt-1 text-sm text-slate-600">학생 성적을 수업, 학생, 테스트명 기준으로 모아 봅니다.</p>
        </div>
      </div>
      <form className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <div className="flex gap-2">
          <select className="rounded border px-3 py-2 text-sm" defaultValue={filters.qField ?? ''} name="qField">
            <option value="">전체</option>
            <option value="testName">테스트명</option>
            <option value="studentName">학생명</option>
            <option value="programTitle">수업명</option>
            <option value="score">점수</option>
            <option value="memo">메모</option>
          </select>
          <input className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" defaultValue={filters.q ?? ''} name="q" placeholder="검색어" />
        </div>
        <select className="rounded border px-3 py-2 text-sm" defaultValue={filters.programId ?? ''} name="programId">
          <option value="">전체 수업</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>{program.title}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2 text-sm" defaultValue={filters.studentId ?? ''} name="studentId">
          <option value="">전체 학생</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">조회</button>
      </form>
      <p className="mb-3 text-sm text-slate-500">총 {total}개</p>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">테스트명</th>
              <th className="w-28 px-4 py-3 font-medium">구분</th>
              <th className="w-24 px-4 py-3 font-medium">점수</th>
              <th className="w-20 px-4 py-3 font-medium">P/F</th>
              <th className="w-40 px-4 py-3 font-medium">일시</th>
              <th className="w-20 px-4 py-3 font-medium">학생</th>
              <th className="px-4 py-3 font-medium">수업</th>
              <th className="w-16 px-4 py-3 font-medium">공개</th>
              <th className="w-16 px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((result) => (
              <tr key={result.id}>
                <td className="px-4 py-3 font-medium">{result.testName}</td>
                <td className="px-4 py-3">
                  {result.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: result.category.color }}
                      />
                      <span>{result.category.name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{result.score}</td>
                <td className="px-4 py-3">
                  {result.isPassed === true ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">통과</span>
                  ) : result.isPassed === false ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">미통과</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{result.testedAt.toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3">{result.student.name}</td>
                <td className="px-4 py-3">{result.program.title}</td>
                <td className="px-4 py-3">{result.isVisible ? '공개' : '비공개'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <a className="rounded border px-3 py-1 text-sm" href={`/admin/${slug}/programs/${result.programId}/tests/${result.id}/edit`}>
                    수정
                  </a>
                </td>
              </tr>
            ))}
            {total === 0 ? (
              <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={9}>등록된 테스트 결과가 없습니다.</td></tr>
            ) : null}
          </tbody>
        </table>
        <div className="border-t px-4">
          <Pagination
            basePath={`/admin/${slug}/tests`}
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
