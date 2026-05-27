import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { Pagination } from '@/components/admin/pagination'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { createTestResultAction, deleteTestResultAction } from './actions'
import { TestExcelUpload } from './test-excel-upload'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'

type ProgramTestsPageProps = {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ limit?: string; page?: string; q?: string; studentId?: string; testName?: string }>
}

export default async function ProgramTestsPage({ params, searchParams }: ProgramTestsPageProps) {
  const { slug, id } = await params
  const filters = await searchParams
  const { academy } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  const { page, limit } = parsePaginationParams(filters)

  const [allResults, students] = await Promise.all([
    testResultService.getAdminTestResults(academy.id, {
      programId: program.id,
      query: filters.q,
      studentId: filters.studentId,
      testName: filters.testName,
    }),
    studentService.getAdminStudents(academy.id),
  ])
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )
  const { items: results, total, totalPages, page: currentPage } = paginateArray(allResults, page, limit)

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
          ← 수업 상세
        </a>
        <h1 className="mb-4 text-2xl font-bold">{program.title} 테스트 관리</h1>
        <form className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_180px_160px_auto]">
          <input className="rounded border px-3 py-2 text-sm" defaultValue={filters.q ?? ''} name="q" placeholder="검색어" />
          <select className="rounded border px-3 py-2 text-sm" defaultValue={filters.studentId ?? ''} name="studentId">
            <option value="">전체 학생</option>
            {enrolledStudents.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
          <input className="rounded border px-3 py-2 text-sm" defaultValue={filters.testName ?? ''} name="testName" placeholder="테스트명" />
          <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">조회</button>
        </form>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">테스트명</th>
                <th className="px-4 py-3 font-medium">점수</th>
                <th className="px-4 py-3 font-medium">일시</th>
                <th className="px-4 py-3 font-medium">학생</th>
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
                  <td className="px-4 py-3">{result.isVisible ? '공개' : '비공개'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a className="rounded border px-3 py-1 text-sm" href={`/admin/${slug}/programs/${program.id}/tests/${result.id}/edit`}>
                        수정
                      </a>
                      <form action={deleteTestResultAction}>
                        <input name="slug" type="hidden" value={slug} />
                        <input name="programId" type="hidden" value={program.id} />
                        <input name="id" type="hidden" value={result.id} />
                        <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 테스트 결과를 삭제할까요?">
                          삭제
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {total === 0 ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={6}>등록된 테스트 결과가 없습니다.</td></tr>
              ) : null}
            </tbody>
          </table>
          <div className="border-t px-4">
            <Pagination
              basePath={`/admin/${slug}/programs/${program.id}/tests`}
              limit={limit}
              page={currentPage}
              searchParams={{ ...filters }}
              total={total}
              totalPages={totalPages}
            />
          </div>
        </div>
      </section>
      <aside className="space-y-6">
        <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">테스트 결과 추가</h2>
        <form action={createTestResultAction} className="space-y-4">
          <input name="slug" type="hidden" value={slug} />
          <input name="programId" type="hidden" value={program.id} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학생</span>
            <select className="w-full rounded border px-3 py-2 text-sm" name="studentId" required>
              <option value="">선택</option>
              {enrolledStudents.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">테스트명</span>
            <input className="w-full rounded border px-3 py-2 text-sm" name="testName" placeholder="예: 5월 문법 테스트" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">점수</span>
            <input className="w-full rounded border px-3 py-2 text-sm" name="score" placeholder="예: 92점 / 100" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">일시</span>
            <input className="w-full rounded border px-3 py-2 text-sm" name="testedAt" type="datetime-local" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">메모</span>
            <textarea className="min-h-24 w-full rounded border px-3 py-2 text-sm" name="memo" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked name="isVisible" type="checkbox" value="true" />
            학생에게 공개
          </label>
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="테스트 결과를 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
        </div>
        <TestExcelUpload
          enrolledStudentNames={enrolledStudents.map((s) => s.name)}
          programId={program.id}
          slug={slug}
        />
      </aside>
    </main>
  )
}
