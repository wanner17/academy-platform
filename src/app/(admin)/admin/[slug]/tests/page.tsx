import { Pagination } from '@/components/admin/pagination'
import { requireMemberPage } from '@/lib/auth/server'
import { programService } from '@/lib/services/program.service'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'

type AdminTestsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ limit?: string; page?: string; programId?: string; q?: string; studentId?: string; testName?: string }>
}

export default async function AdminTestsPage({ params, searchParams }: AdminTestsPageProps) {
  const { slug } = await params
  const filters = await searchParams
  const { academy } = await requireMemberPage(slug)
  const { page, limit } = parsePaginationParams(filters)
  const [allResults, programs, students] = await Promise.all([
    testResultService.getAdminTestResults(academy.id, filters),
    programService.getAdminPrograms(academy.id),
    studentService.getAdminStudents(academy.id),
  ])
  const { items: results, total, totalPages, page: currentPage } = paginateArray(allResults, page, limit)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">테스트 관리</h1>
          <p className="mt-1 text-sm text-slate-600">학생 성적을 수업, 학생, 테스트명 기준으로 모아 봅니다.</p>
        </div>
      </div>
      <form className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_180px_180px_160px_auto]">
        <input className="rounded border px-3 py-2 text-sm" defaultValue={filters.q ?? ''} name="q" placeholder="검색어" />
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
        <input className="rounded border px-3 py-2 text-sm" defaultValue={filters.testName ?? ''} name="testName" placeholder="테스트명" />
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">조회</button>
      </form>
      <p className="mb-3 text-sm text-slate-500">총 {total}개</p>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">테스트명</th>
              <th className="px-4 py-3 font-medium">점수</th>
              <th className="px-4 py-3 font-medium">일시</th>
              <th className="px-4 py-3 font-medium">학생</th>
              <th className="px-4 py-3 font-medium">수업</th>
              <th className="px-4 py-3 font-medium">공개</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((result) => (
              <tr key={result.id}>
                <td className="px-4 py-3 font-medium">{result.testName}</td>
                <td className="px-4 py-3">{result.score}</td>
                <td className="px-4 py-3">{result.testedAt.toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3">{result.student.name}</td>
                <td className="px-4 py-3">{result.program.title}</td>
                <td className="px-4 py-3">{result.isVisible ? '공개' : '비공개'}</td>
                <td className="px-4 py-3 text-right">
                  <a className="rounded border px-3 py-1 text-sm" href={`/admin/${slug}/programs/${result.programId}/tests/${result.id}/edit`}>
                    수정
                  </a>
                </td>
              </tr>
            ))}
            {total === 0 ? (
              <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>등록된 테스트 결과가 없습니다.</td></tr>
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
