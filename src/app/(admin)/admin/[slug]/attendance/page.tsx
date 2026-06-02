import type { AttendanceStatus } from '@prisma/client'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { Pagination } from '@/components/admin/pagination'
import { attendanceStatusLabels } from '@/lib/attendance-labels'
import { requireMemberPage } from '@/lib/auth/server'
import { attendanceService, toDateInputValue } from '@/lib/services/attendance.service'
import { scheduleService } from '@/lib/services/schedule.service'
import { studentService } from '@/lib/services/student.service'
import { formatKoreaTime, getKoreaDayOfWeek } from '@/lib/utils/korea-time'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'
import { markAttendanceAction, updateAttendanceSettingAction } from './actions'
import { AttendanceTable, type AttendanceRow } from './attendance-table'

type AdminAttendancePageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string; limit?: string; page?: string; q?: string; saved?: string; status?: AttendanceStatus }>
}

export default async function AdminAttendancePage({ params, searchParams }: AdminAttendancePageProps) {
  const { slug } = await params
  const filters = await searchParams
  const { academy } = await requireMemberPage(slug)
  const selectedDate = filters.date ? new Date(`${filters.date}T00:00:00`) : new Date()
  const dateValue = toDateInputValue(selectedDate)
  const selectedDayOfWeek = getKoreaDayOfWeek(selectedDate)
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedStatus = filters.status ?? ''
  const { page, limit } = parsePaginationParams(filters)

  await attendanceService.backfillAbsencesForDate(academy.id, selectedDate)
  const [setting, records, students, schedules] = await Promise.all([
    attendanceService.getSetting(academy.id),
    attendanceService.getRecordsByDate(academy.id, selectedDate),
    studentService.getAdminStudents(academy.id),
    scheduleService.getAdminSchedules(academy.id),
  ])

  const activeStudents = students.filter((student) => student.isActive)
  const recordsByStudentSchedule = new Map(
    records
      .filter((record) => record.scheduleId)
      .map((record) => [`${record.studentId}:${record.scheduleId}`, record] as const),
  )

  const expectedRows = activeStudents.flatMap((student) => {
    const activeProgramIds = new Set(
      student.enrollments
        .filter((enrollment) => enrollment.status === 'ACTIVE')
        .map((enrollment) => enrollment.programId),
    )

    return schedules
      .filter((schedule) => (
        schedule.isActive &&
        schedule.programId &&
        schedule.dayOfWeek === selectedDayOfWeek &&
        activeProgramIds.has(schedule.programId)
      ))
      .map((schedule) => ({
        record: recordsByStudentSchedule.get(`${student.id}:${schedule.id}`),
        schedule,
        student,
      }))
  })

  const expectedKeys = new Set(expectedRows.map(({ schedule, student }) => `${student.id}:${schedule.id}`))
  const extraRecordRows = records
    .filter((record) => !record.scheduleId || !expectedKeys.has(`${record.studentId}:${record.scheduleId}`))
    .map((record) => ({ record, schedule: record.schedule, student: record.student }))

  const allRows = [...expectedRows, ...extraRecordRows].filter(({ student, record }) => {
    const matchesQuery = query
      ? [student.name, student.schoolName ?? '', student.grade ?? '', student.user?.email ?? ''].some((v) =>
          v.toLowerCase().includes(query),
        )
      : true
    const matchesStatus = selectedStatus ? record?.status === selectedStatus : true
    return matchesQuery && matchesStatus
  })

  const { items: rows, total, totalPages, page: currentPage } = paginateArray(allRows, page, limit)

  const serializedRows: AttendanceRow[] = rows.map(({ student, record, schedule }, idx) => ({
    key: record?.id ?? `no-record-${student.id}-${schedule?.id ?? idx}`,
    studentId: student.id,
    studentName: student.name,
    studentSchool: [student.schoolName, student.grade].filter(Boolean).join(' ') || '-',
    scheduleId: schedule?.id ?? null,
    scheduleLabel: schedule ? `${schedule.title} (${schedule.startTime}~${schedule.endTime})` : null,
    recordStatus: record?.status ?? null,
    recordCheckedAtFormatted: record?.checkedAt ? formatKoreaTime(record.checkedAt) : null,
    recordDistanceMeters: record?.distanceMeters ?? null,
    recordSource: record?.source ?? null,
    recordMemo: record?.memo ?? null,
  }))

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">출석 관리</h1>
        <p className="mt-1 text-sm text-slate-600">학생 위치 출석 설정과 일자별 출석 상태를 관리합니다.</p>
      </div>

      {filters.saved === '1' ? (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          설정이 저장되었습니다.
        </div>
      ) : null}

      <section className="mb-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form action={updateAttendanceSettingAction} className="rounded-lg border bg-white p-5">
          <input name="slug" type="hidden" value={slug} />
          <h2 className="mb-4 font-semibold">위치 출석 설정</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked={setting?.isEnabled ?? false} name="isEnabled" type="checkbox" value="true" />
              학생 위치 출석 사용
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">학원 위도</span>
              <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.latitude ?? ''} name="latitude" placeholder="37.5665" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">학원 경도</span>
              <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.longitude ?? ''} name="longitude" placeholder="126.9780" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">허용 반경(m)</span>
              <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.radiusMeters ?? 100} max={2000} min={10} name="radiusMeters" type="number" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">출석 가능 시작(수업 시작 몇 분 전)</span>
              <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.earlyCheckinMinutes ?? 30} max={120} min={0} name="earlyCheckinMinutes" type="number" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">지각 유예 시간(수업 시작 몇 분 후까지 출석)</span>
              <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.lateGraceMinutes ?? 5} max={60} min={0} name="lateGraceMinutes" type="number" />
            </label>
            <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="출석 설정을 저장할까요?">
              설정 저장
            </ConfirmSubmitButton>
          </div>
        </form>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">수동 출석 처리</h2>
          <form action={markAttendanceAction} className="grid gap-3 md:grid-cols-2">
            <input name="slug" type="hidden" value={slug} />
            <input name="date" type="hidden" value={dateValue} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">학생</span>
              <select className="w-full rounded border px-3 py-2 text-sm" name="studentId" required>
                <option value="">학생 선택</option>
                {activeStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} {[student.schoolName, student.grade].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">수업</span>
              <select className="w-full rounded border px-3 py-2 text-sm" name="scheduleId">
                <option value="">수업 없음</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.startTime}~{s.endTime})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">상태</span>
              <select className="w-full rounded border px-3 py-2 text-sm" name="status" required>
                {Object.entries(attendanceStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">메모</span>
              <input className="w-full rounded border px-3 py-2 text-sm" name="memo" placeholder="선택" />
            </label>
            <ConfirmSubmitButton className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white md:col-span-2" message="출석 상태를 저장할까요?">
              수동 저장
            </ConfirmSubmitButton>
          </form>
        </section>
      </section>

      <section className="mb-4 rounded-lg border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto]" method="get">
          <input className="rounded border px-3 py-2 text-sm" defaultValue={dateValue} name="date" type="date" />
          <input className="rounded border px-3 py-2 text-sm" defaultValue={filters.q ?? ''} name="q" placeholder="학생명, 학교, 이메일" />
          <select className="rounded border px-3 py-2 text-sm" defaultValue={selectedStatus} name="status">
            <option value="">전체 상태</option>
            {Object.entries(attendanceStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">조회</button>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {total}명</p>
      </section>

      <AttendanceTable dateValue={dateValue} rows={serializedRows} slug={slug}>
        <Pagination
          basePath={`/admin/${slug}/attendance`}
          limit={limit}
          page={currentPage}
          searchParams={{ ...filters }}
          total={total}
          totalPages={totalPages}
        />
      </AttendanceTable>
    </main>
  )
}
