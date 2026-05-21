import { StudentCalendarNav } from '@/components/student-calendar-nav'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScoreTrendChart } from '@/components/admin/analytics/score-trend-chart'
import { attendanceStatusLabels } from '@/lib/attendance-labels'
import { requireMemberPage } from '@/lib/auth/server'
import { attendanceService } from '@/lib/services/attendance.service'
import { homeworkService } from '@/lib/services/homework.service'
import { schoolExamService } from '@/lib/services/school-exam.service'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { formatKoreaTime, getKoreaDateParts, toKoreaDateKey } from '@/lib/utils/korea-time'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { deleteSchoolExamAction } from './exams/actions'

type PageProps = {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ month?: string }>
}

type ChartDataPoint = Record<string, string | number>

function periodLabel(year: number, semester: number) {
  return `${year}-${semester}학기`
}

export default async function StudentDetailPage({ params, searchParams }: PageProps) {
  const { slug, id: studentId } = await params
  const { month } = await searchParams
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)

  const selectedMonth = parseMonthParam(month)
  const prevMonth = addMonths(selectedMonth, -1)
  const nextMonth = addMonths(selectedMonth, 1)
  const year = selectedMonth.getFullYear()
  const monthIndex = selectedMonth.getMonth()

  const student = await studentService.getStudentById(studentId, academy.id)
  const programIds = student.enrollments.map((e) => e.programId)

  await attendanceService.backfillAbsencesForMonth(academy.id, year, monthIndex, { studentId })
  const [exams, monthlyAttendance, monthlyHomework, allTestResults] = await Promise.all([
    schoolExamService.getByStudent(academy.id, studentId),
    attendanceService.getStudentRecordsForMonth(academy.id, studentId, year, monthIndex),
    homeworkService.getStudentHomeworksForMonth(academy.id, studentId, programIds, year, monthIndex),
    testResultService.getAdminTestResults(academy.id, { studentId }),
  ])

  // Filter test results to selected month (Korea time)
  const monthlyTestResults = allTestResults.filter((r) => {
    const key = toKoreaDateKey(r.testedAt)
    const [y, m] = key.split('-').map(Number)
    return y === year && m === monthIndex + 1
  })

  // Attendance calendar data
  const attendanceByDate = monthlyAttendance.reduce((map, record) => {
    const key = toKoreaDateKey(record.attendanceDate)
    map.set(key, [...(map.get(key) ?? []), record])
    return map
  }, new Map<string, typeof monthlyAttendance>())
  const calendarCells = getCalendarCells(selectedMonth)
  const present = monthlyAttendance.filter((r) => r.status === 'PRESENT').length
  const late = monthlyAttendance.filter((r) => r.status === 'LATE').length
  const absent = monthlyAttendance.filter((r) => r.status === 'ABSENT').length
  const excused = monthlyAttendance.filter((r) => r.status === 'EXCUSED').length

  // Activity (homework + test) grouped by date
  type HomeworkItem = (typeof monthlyHomework)[number]
  type TestItem = (typeof monthlyTestResults)[number]
  const activityMap = new Map<string, { homeworks: HomeworkItem[]; tests: TestItem[] }>()
  for (const hw of monthlyHomework) {
    if (!hw.dueDate) continue
    const key = toKoreaDateKey(hw.dueDate)
    const entry = activityMap.get(key) ?? { homeworks: [], tests: [] }
    entry.homeworks.push(hw)
    activityMap.set(key, entry)
  }
  for (const t of monthlyTestResults) {
    const key = toKoreaDateKey(t.testedAt)
    const entry = activityMap.get(key) ?? { homeworks: [], tests: [] }
    entry.tests.push(t)
    activityMap.set(key, entry)
  }
  const activityDates = Array.from(activityMap.keys()).sort()

  const hwTotal = monthlyHomework.filter((h) => h.dueDate).length
  const hwDone = monthlyHomework.filter((h) => h.dueDate && h.isCompleted).length

  // School exam chart data
  const subjects = [...new Set(exams.filter((e) => e.score != null).map((e) => e.subject))].sort()
  const periods = [...new Set(exams.map((e) => periodLabel(e.examYear, e.semester)))].sort()
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
  const basePath = `/admin/${slug}/students/${studentId}`

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
          <a className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50" href={`${basePath}/edit`}>
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

      {/* Attendance calendar */}
      <section className="mb-8 rounded-lg border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">출석 현황</h2>
          <div className="flex gap-2 text-xs">
            <span className="rounded bg-green-50 px-2 py-1 text-green-700">출석 {present}</span>
            <span className="rounded bg-yellow-50 px-2 py-1 text-yellow-700">지각 {late}</span>
            <span className="rounded bg-red-50 px-2 py-1 text-red-700">결석 {absent}</span>
            <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">인정 {excused}</span>
          </div>
        </div>

        <StudentCalendarNav
          currentLabel={`${year}년 ${monthIndex + 1}월`}
          nextHref={`${basePath}?month=${toMonthParam(nextMonth)}`}
          prevHref={`${basePath}?month=${toMonthParam(prevMonth)}`}
        />

        <div className="student-attendance-calendar">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div className="student-calendar-weekday" key={day}>{day}</div>
          ))}
          {calendarCells.map((day, index) => {
            const dayRecords = day ? (attendanceByDate.get(toDateKey(day)) ?? []) : []
            const isToday = day ? toDateKey(day) === toKoreaDateKey(new Date()) : false
            const cellClass = `student-calendar-day${day ? '' : ' is-empty'}${isToday ? ' is-today' : ''}`
            return (
              <div className={cellClass} key={day ? toDateKey(day) : `empty-${index}`}>
                {day ? (
                  <>
                    <span className="student-calendar-date">{day.getDate()}</span>
                    {dayRecords.map((record) => (
                      <span className="student-calendar-record" key={record.id}>
                        <span className={`student-calendar-status status-${record.status.toLowerCase()}`}>
                          {record.schedule?.subject || record.schedule?.title
                            ? `${record.schedule.subject ?? record.schedule.title} `
                            : ''}
                          {attendanceStatusLabels[record.status]}
                        </span>
                        {record.checkedAt ? (
                          <span className="student-calendar-time">
                            {formatKoreaTime(record.checkedAt, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      {/* Monthly homework + test activity */}
      <section className="mb-8 rounded-lg border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">이달 숙제 · 테스트</h2>
          <div className="flex gap-3 text-xs">
            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
              숙제 {hwDone}/{hwTotal}개 완료
              {hwTotal > 0 ? ` (${Math.round((hwDone / hwTotal) * 100)}%)` : ''}
            </span>
            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
              테스트 {monthlyTestResults.length}회
            </span>
          </div>
        </div>

        {activityDates.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">이달 숙제 마감일 또는 테스트 기록이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {activityDates.map((dateKey) => {
              const { homeworks: hws, tests } = activityMap.get(dateKey)!
              const [dy, dm, dd] = dateKey.split('-').map(Number)
              const dateLabel = `${dm}월 ${dd}일 (${['일', '월', '화', '수', '목', '금', '토'][new Date(dy, dm - 1, dd).getDay()]})`
              return (
                <div key={dateKey}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{dateLabel}</span>
                    <span className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="space-y-2 pl-2">
                    {hws.map((hw) => (
                      <div key={hw.id} className="flex items-start gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
                        <span className="mt-0.5 shrink-0 text-slate-400">📚</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{hw.title}</span>
                          <span className="ml-2 text-xs text-slate-400">{hw.program.title}{hw.student ? ` · ${hw.student.name}` : ''}</span>
                        </div>
                        {hw.isCompleted
                          ? <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">완료</span>
                          : <span className="shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">미완료</span>}
                      </div>
                    ))}
                    {tests.map((t) => (
                      <div key={t.id} className="flex items-start gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
                        <span className="mt-0.5 shrink-0 text-slate-400">📝</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{t.testName}</span>
                          <span className="ml-2 text-xs text-slate-400">{t.program.title}</span>
                        </div>
                        <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">{t.score}점</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* School exam scores */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">학교 시험 성적</h2>
          <a className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white" href={`${basePath}/exams/new`}>
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
                          <a className="rounded border px-2 py-1 text-xs hover:bg-slate-50" href={`${basePath}/exams/${exam.id}/edit`}>
                            수정
                          </a>
                          <form action={deleteSchoolExamAction}>
                            <input type="hidden" name="slug" value={slug} />
                            <input type="hidden" name="studentId" value={studentId} />
                            <input type="hidden" name="id" value={exam.id} />
                            <ConfirmSubmitButton className="rounded border border-red-100 px-2 py-1 text-xs text-red-600" message="이 성적을 삭제할까요?">
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

function parseMonthParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return getCurrentKoreaMonth()
  const [year, month] = value.split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return getCurrentKoreaMonth()
  }
  return new Date(year, month - 1, 1)
}

function getCurrentKoreaMonth() {
  const { month, year } = getKoreaDateParts(new Date())
  return new Date(year, month - 1, 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function toMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getCalendarCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
