import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { schoolExamService } from '@/lib/services/school-exam.service'
import { ScoreTrendChart } from '@/components/admin/analytics/score-trend-chart'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { deleteSchoolExamAction } from './exams/actions'

type PageProps = { params: Promise<{ slug: string; id: string }> }

type ChartDataPoint = Record<string, string | number>

function periodLabel(year: number, semester: number) {
  return `${year}-${semester}학기`
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { slug, id: studentId } = await params
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const student = await studentService.getStudentById(studentId, academy.id)
  const exams = await schoolExamService.getByStudent(academy.id, studentId)

  // Chart: subjects that have at least one numeric score
  const subjects = [...new Set(exams.filter((e) => e.score != null).map((e) => e.subject))].sort()
  const periods = [
    ...new Set(exams.map((e) => periodLabel(e.examYear, e.semester))),
  ].sort()

  const trendMap = new Map<string, Map<string, { sum: number; count: number }>>()
  for (const exam of exams) {
    if (exam.score == null) continue
    const period = periodLabel(exam.examYear, exam.semester)
    if (!trendMap.has(period)) trendMap.set(period, new Map())
    const pMap = trendMap.get(period)!
    const entry = pMap.get(exam.subject) ?? { sum: 0, count: 0 }
    entry.sum += exam.score
    entry.count++
    pMap.set(exam.subject, entry)
  }

  const chartData: ChartDataPoint[] = periods.map((period) => {
    const entry: ChartDataPoint = { month: period }
    const pMap = trendMap.get(period)
    for (const subject of subjects) {
      const d = pMap?.get(subject)
      if (d && d.count > 0) entry[subject] = Math.round((d.sum / d.count) * 10) / 10
    }
    return entry
  })

  const activeEnrollments = student.enrollments.filter((e) => e.status === 'ACTIVE')

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <a className="text-sm text-slate-500 hover:underline" href={`/admin/${slug}/students`}>
          ← 학생 관리
        </a>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {[student.schoolName, student.grade].filter(Boolean).join(' ')}
              {student.phone && ` · ${student.phone}`}
            </p>
          </div>
          <a
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
            href={`/admin/${slug}/students/${studentId}/edit`}
          >
            학생 정보 수정
          </a>
        </div>
      </div>

      {activeEnrollments.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">수강 수업</h2>
          <div className="flex flex-wrap gap-2">
            {activeEnrollments.map((e) => (
              <span key={e.programId} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {e.program.title}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">학교 시험 성적</h2>
          <a
            className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white"
            href={`/admin/${slug}/students/${studentId}/exams/new`}
          >
            성적 추가
          </a>
        </div>

        {exams.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            등록된 학교 시험 성적이 없습니다
          </div>
        ) : (
          <>
            {subjects.length > 0 && (
              <div className="mb-6">
                <ScoreTrendChart data={chartData} programs={subjects} />
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">연도/학기</th>
                    <th className="px-4 py-3 text-left font-medium">학년</th>
                    <th className="px-4 py-3 text-left font-medium">시험 종류</th>
                    <th className="px-4 py-3 text-left font-medium">과목</th>
                    <th className="px-4 py-3 text-center font-medium">원점수</th>
                    <th className="px-4 py-3 text-center font-medium">등급</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{exam.examYear}년 {exam.semester}학기</td>
                      <td className="px-4 py-3 text-slate-500">{exam.schoolYear ? `${exam.schoolYear}학년` : '-'}</td>
                      <td className="px-4 py-3">{exam.examType}</td>
                      <td className="px-4 py-3">{exam.subject}</td>
                      <td className="px-4 py-3 text-center">
                        {exam.score != null ? <span className="font-semibold">{exam.score}</span> : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {exam.grade != null ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{exam.grade}등급</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                            href={`/admin/${slug}/students/${studentId}/exams/${exam.id}/edit`}
                          >
                            수정
                          </a>
                          <form action={deleteSchoolExamAction}>
                            <input type="hidden" name="slug" value={slug} />
                            <input type="hidden" name="studentId" value={studentId} />
                            <input type="hidden" name="id" value={exam.id} />
                            <ConfirmSubmitButton
                              className="rounded border border-red-100 px-2 py-1 text-xs text-red-600"
                              message="이 성적을 삭제할까요?"
                            >
                              삭제
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
