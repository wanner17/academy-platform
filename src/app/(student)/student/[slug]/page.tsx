import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { LogoutButton } from '@/components/admin/logout-button'
import { StudentAttendanceButton } from '@/components/student-attendance-button'
import { StudentCalendarNav } from '@/components/student-calendar-nav'
import { attendanceStatusLabels } from '@/lib/attendance-labels'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { requireStudentPage } from '@/lib/auth/server'
import { attendanceService } from '@/lib/services/attendance.service'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'
import { studentPath } from '@/lib/utils/public-path'
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

  const [homeworks, progressLogs, testResults, attendanceSetting, todayAttendance, monthlyAttendance] = await Promise.all([
    homeworkService.getVisibleHomeworksForPrograms(academy.id, programIds, student.id),
    progressService.getVisibleProgressLogsForPrograms(academy.id, programIds, student.id),
    testResultService.getStudentVisibleTestResults(academy.id, student.id),
    attendanceService.getSetting(academy.id),
    attendanceService.getStudentRecordForDate(academy.id, student.id, new Date()),
    attendanceService.getStudentRecordsForMonth(academy.id, student.id, selectedMonth.getFullYear(), selectedMonth.getMonth()),
  ])
  const attendanceByDate = new Map(monthlyAttendance.map((record) => [toDateKey(record.attendanceDate), record]))
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
            <div>
              <h3>오늘 출석</h3>
              <p>
                {todayAttendance
                  ? `${attendanceStatusLabels[todayAttendance.status]} · ${todayAttendance.checkedAt?.toLocaleTimeString('ko-KR') ?? '관리자 처리'}`
                  : attendanceSetting?.isEnabled
                    ? '학원 위치에서 출석 버튼을 누르세요.'
                    : '출석 기능이 아직 열려 있지 않습니다.'}
              </p>
              {attendanceSetting?.startTime || attendanceSetting?.endTime ? (
                <p className="student-attendance-meta">
                  가능 시간: {attendanceSetting.startTime ?? '00:00'} - {attendanceSetting.endTime ?? '23:59'}
                </p>
              ) : null}
            </div>
            <StudentAttendanceButton
              disabled={!attendanceSetting?.isEnabled}
              hasRecord={Boolean(todayAttendance)}
              slug={slug}
            />
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
              const record = day ? attendanceByDate.get(toDateKey(day)) : null
              const isToday = day ? toDateKey(day) === toDateKey(new Date()) : false
              const cellClassName = `student-calendar-day${day ? '' : ' is-empty'}${isToday ? ' is-today' : ''}`
              return (
                <div className={cellClassName} key={day ? toDateKey(day) : `empty-${index}`}>
                  {day ? (
                    <>
                      <span className="student-calendar-date">{day.getDate()}</span>
                      {record ? (
                        <span className={`student-calendar-status status-${record.status.toLowerCase()}`}>
                          {attendanceStatusLabels[record.status]}
                        </span>
                      ) : null}
                      {record?.checkedAt ? (
                        <span className="student-calendar-time">
                          {record.checkedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : null}
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
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const [year, month] = value.split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  }
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
