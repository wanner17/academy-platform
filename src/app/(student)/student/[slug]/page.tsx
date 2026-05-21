import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { LogoutButton } from '@/components/admin/logout-button'
import { StudentAttendanceButton } from '@/components/student-attendance-button'
import { StudentCalendarNav } from '@/components/student-calendar-nav'
import { attendanceStatusLabels } from '@/lib/attendance-labels'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { requireStudentPage } from '@/lib/auth/server'
import { attendanceService, isWithinCheckInWindow } from '@/lib/services/attendance.service'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { studentPath } from '@/lib/utils/public-path'
import { formatKoreaTime, getKoreaDateParts, toKoreaDateKey } from '@/lib/utils/korea-time'
import { updateStudentPasswordAction } from './actions'

type StudentHomePageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ month?: string }>
}

export default async function StudentHomePage({ params, searchParams }: StudentHomePageProps) {
  const { slug } = await params
  const { month } = await searchParams
  const { academy, user } = await requireStudentPage(slug)
  const student = await studentService.getStudentByUserId(user.id, academy.id).catch(() => null)
  if (!student) return <MissingStudentProfile academyName={academy.name} />
  const activeEnrollments = student.enrollments.filter((enrollment) => enrollment.status === 'ACTIVE')
  const programIds = activeEnrollments.map((e) => e.programId)
  const selectedMonth = parseMonthParam(month)
  const prevMonth = addMonths(selectedMonth, -1)
  const nextMonth = addMonths(selectedMonth, 1)

  const now = new Date()
  const [homeworks, progressLogs, testResults, attendanceSetting, todayAttendances, monthlyAttendance, todaySchedules] = await Promise.all([
    homeworkService.getVisibleHomeworksForPrograms(academy.id, programIds, student.id),
    progressService.getVisibleProgressLogsForPrograms(academy.id, programIds, student.id),
    testResultService.getStudentVisibleTestResults(academy.id, student.id),
    attendanceService.getSetting(academy.id),
    attendanceService.getStudentRecordsForDate(academy.id, student.id, now),
    attendanceService.getStudentRecordsForMonth(academy.id, student.id, selectedMonth.getFullYear(), selectedMonth.getMonth()),
    attendanceService.getTodaySchedulesForStudent(student.id, now),
  ])
  const attendancesByDate = monthlyAttendance.reduce((map, record) => {
    const key = toKoreaDateKey(record.attendanceDate)
    map.set(key, [...(map.get(key) ?? []), record])
    return map
  }, new Map<string, typeof monthlyAttendance>())
  const calendarCells = getCalendarCells(selectedMonth)

  return (
    <main>
      <section className="pub-page-hero student-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">STUDENT PORTAL</div>
          <h1 className="pub-page-title">{student.name}</h1>
          <p className="pub-page-subtitle">
            {[student.schoolName, student.grade].filter(Boolean).join(' ') || `${academy.name} 수강생`}
          </p>
        </div>
      </section>

      <div className="student-portal">
        <section className="student-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">ATTENDANCE</div>
              <h2 className="pub-h2">출석</h2>
            </div>
            <LogoutButton className="student-inline-logout" />
          </div>
          <div className="student-attendance-card">
            <h3>오늘 출석</h3>
            {todaySchedules.length > 0 ? (
              <ul className="student-attendance-list">
                {todaySchedules.map((schedule) => {
                  const record = todayAttendances.find((r) => r.scheduleId === schedule.id)
                  const withinWindow = isWithinCheckInWindow(schedule.startTime, schedule.endTime, now)
                  return (
                    <li key={schedule.id}>
                      <span className="student-attendance-schedule">{schedule.title}</span>
                      {record ? (
                        <>
                          <span>{attendanceStatusLabels[record.status]}</span>
                          {record.checkedAt ? (
                            <span className="student-attendance-time">{formatKoreaTime(record.checkedAt)}</span>
                          ) : (
                            <span className="student-attendance-time">관리자 처리</span>
                          )}
                        </>
                      ) : attendanceSetting?.isEnabled && withinWindow ? (
                        <StudentAttendanceButton disabled={false} hasRecord={false} scheduleId={schedule.id} slug={slug} />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>{attendanceSetting?.isEnabled ? '오늘 수업이 없습니다.' : '출석 기능이 아직 열려 있지 않습니다.'}</p>
            )}
          </div>

          <StudentCalendarNav
            currentLabel={`${selectedMonth.getFullYear()}년 ${selectedMonth.getMonth() + 1}월 출석내역`}
            nextHref={`${studentPath(slug)}?month=${toMonthParam(nextMonth)}`}
            prevHref={`${studentPath(slug)}?month=${toMonthParam(prevMonth)}`}
          />
          <div className="student-attendance-calendar">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div className="student-calendar-weekday" key={day}>{day}</div>
            ))}
            {calendarCells.map((day, index) => {
              const dayRecords = day ? (attendancesByDate.get(toKoreaDateKey(day)) ?? []) : []
              const isToday = day ? toKoreaDateKey(day) === toKoreaDateKey(new Date()) : false
              const cellClassName = `student-calendar-day${day ? '' : ' is-empty'}${isToday ? ' is-today' : ''}`
              return (
                <div className={cellClassName} key={day ? toKoreaDateKey(day) : `empty-${index}`}>
                  {day ? (
                    <>
                      <span className="student-calendar-date">{day.getDate()}</span>
                      {dayRecords.map((record) => (
                        <span key={record.id} className={`student-calendar-status status-${record.status.toLowerCase()}`}>
                          {record.schedule?.title ? `${record.schedule.title.slice(0, 4)} ` : ''}{attendanceStatusLabels[record.status]}
                        </span>
                      ))}
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>

        <section className="student-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">MY CLASSES</div>
              <h2 className="pub-h2">내 수업</h2>
            </div>
          </div>
          <div className="student-card-grid">
          {activeEnrollments.map((enrollment) => (
            <article className="pub-card" key={enrollment.id}>
              <div className="student-tags">
                <span className="pub-card-tag">
                  {programModeLabels[enrollment.program.mode]}
                </span>
                <span className="pub-card-tag muted">
                  {targetLevelLabels[enrollment.program.targetLevel]}
                </span>
                {enrollment.program.subject ? (
                  <span className="pub-card-tag muted">{enrollment.program.subject}</span>
                ) : null}
              </div>
              <h3 className="pub-card-title">{enrollment.program.title}</h3>
              {enrollment.program.teacher ? (
                <p className="pub-card-body">담당 강사: {enrollment.program.teacher.name}</p>
              ) : null}
            </article>
          ))}
          {activeEnrollments.length === 0 ? (
            <div className="student-empty">배정된 수업이 없습니다.</div>
          ) : null}
          </div>
        </section>

        <section className="student-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">TEST RESULTS</div>
              <h2 className="pub-h2">테스트 결과</h2>
            </div>
          </div>
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>테스트명</th>
                  <th>점수</th>
                  <th>일시</th>
                  <th>수업</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result) => (
                  <tr key={result.id}>
                    <td>{result.testName}</td>
                    <td>{result.score}</td>
                    <td>{result.testedAt.toLocaleString('ko-KR')}</td>
                    <td>{result.program.title}</td>
                  </tr>
                ))}
                {testResults.length === 0 ? (
                  <tr><td colSpan={4}>공개된 테스트 결과가 없습니다.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="student-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">HOMEWORK</div>
              <h2 className="pub-h2">숙제</h2>
            </div>
          </div>
          <div className="student-list">
          {homeworks.map((hw) => (
            <article className="student-record" key={hw.id}>
              <div className="student-tags">
                <span className="pub-card-tag muted">{hw.program.title}</span>
                {hw.dueDate ? (
                  <span className="pub-card-tag">
                    마감 {hw.dueDate.toLocaleDateString('ko-KR')}
                  </span>
                ) : null}
                {'student' in hw && hw.student ? (
                  <span className="pub-card-tag">개인</span>
                ) : null}
              </div>
              <h3>{hw.title}</h3>
              <p>{hw.content}</p>
            </article>
          ))}
          {homeworks.length === 0 ? (
            <div className="student-empty">등록된 숙제가 없습니다.</div>
          ) : null}
          </div>
        </section>

        <section className="student-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">PROGRESS</div>
              <h2 className="pub-h2">진도</h2>
            </div>
          </div>
          <div className="student-list">
          {progressLogs.map((log) => (
            <article className="student-record" key={log.id}>
              <div className="student-tags">
                <span className="pub-card-tag muted">{log.program.title}</span>
                <span className="pub-card-tag">{log.classDate.toLocaleDateString('ko-KR')} 수업</span>
              </div>
              <p>{log.content}</p>
              {log.nextPlan ? (
                <p className="student-next-plan">
                  <span className="font-medium">다음 수업 계획:</span> {log.nextPlan}
                </p>
              ) : null}
            </article>
          ))}
          {progressLogs.length === 0 ? (
            <div className="student-empty">등록된 진도 기록이 없습니다.</div>
          ) : null}
          </div>
        </section>

        <section className="student-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">PASSWORD</div>
              <h2 className="pub-h2">비밀번호 변경</h2>
            </div>
          </div>
          <form action={updateStudentPasswordAction} className="student-password-form">
            <input name="slug" type="hidden" value={slug} />
            <label>
              <span>현재 비밀번호</span>
              <input name="currentPassword" required type="password" />
            </label>
            <label>
              <span>새 비밀번호</span>
              <input minLength={8} name="newPassword" required type="password" />
            </label>
            <label>
              <span>새 비밀번호 확인</span>
              <input minLength={8} name="confirmPassword" required type="password" />
            </label>
            <ConfirmSubmitButton className="student-password-submit" message="비밀번호를 변경할까요?">
              변경
            </ConfirmSubmitButton>
          </form>
        </section>
      </div>
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

function MissingStudentProfile({ academyName }: { academyName: string }) {
  return (
    <main>
      <section className="pub-page-hero student-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">STUDENT PORTAL</div>
          <h1 className="pub-page-title">학생 정보 없음</h1>
          <p className="pub-page-subtitle">
            로그인 계정은 학생 권한이지만 {academyName} 학생 정보와 연결되어 있지 않습니다.
          </p>
        </div>
      </section>
      <div className="student-portal">
        <div className="student-empty">
          관리자에게 학생 계정 연결을 요청하세요.
          <div className="student-empty-action">
            <LogoutButton className="student-password-submit" />
          </div>
        </div>
      </div>
    </main>
  )
}
