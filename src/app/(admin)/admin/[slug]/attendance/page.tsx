import type { AttendanceStatus } from '@prisma/client'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { attendanceSourceLabels, attendanceStatusLabels } from '@/lib/attendance-labels'
import { requireMemberPage } from '@/lib/auth/server'
import { attendanceService, toDateInputValue } from '@/lib/services/attendance.service'
import { studentService } from '@/lib/services/student.service'
import { formatKoreaTime } from '@/lib/utils/korea-time'
import { markAttendanceAction, updateAttendanceSettingAction } from './actions'

type AdminAttendancePageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string; q?: string; status?: AttendanceStatus }>
}

export default async function AdminAttendancePage({ params, searchParams }: AdminAttendancePageProps) {
  const { slug } = await params
  const filters = await searchParams
  const { academy } = await requireMemberPage(slug)
  const selectedDate = filters.date ? new Date(`${filters.date}T00:00:00`) : new Date()
  const dateValue = toDateInputValue(selectedDate)
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedStatus = filters.status ?? ''
  const [setting, records, students] = await Promise.all([
    attendanceService.getSetting(academy.id),
    attendanceService.getRecordsByDate(academy.id, selectedDate),
    studentService.getAdminStudents(academy.id),
  ])
  const recordByStudentId = new Map(records.map((record) => [record.studentId, record]))
  const activeStudents = students.filter((student) => student.isActive)
  const rows = activeStudents
    .map((student) => ({ student, record: recordByStudentId.get(student.id) }))
    .filter(({ student, record }) => {
      const matchesQuery = query
        ? [student.name, student.schoolName ?? '', student.grade ?? '', student.user?.email ?? ''].some((value) =>
            value.toLowerCase().includes(query),
          )
        : true
      const matchesStatus = selectedStatus ? record?.status === selectedStatus : true
      return matchesQuery && matchesStatus
    })

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">출석 관리</h1>
        <p className="mt-1 text-sm text-slate-600">학생 위치 출석 설정과 일자별 출석 상태를 관리합니다.</p>
      </div>

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
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">시작 시간</span>
                  <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.startTime ?? ''} name="startTime" type="time" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">종료 시간</span>
                  <input className="w-full rounded border px-3 py-2 text-sm" defaultValue={setting?.endTime ?? ''} name="endTime" type="time" />
                </label>
              </div>
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
              <span className="mb-1 block text-sm font-medium">상태</span>
              <select className="w-full rounded border px-3 py-2 text-sm" name="status" required>
                {Object.entries(attendanceStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
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
      </section>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">학생</th>
              <th className="px-4 py-3 font-medium">학교/학년</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">출석 시간</th>
              <th className="px-4 py-3 font-medium">거리</th>
              <th className="px-4 py-3 font-medium">처리 방식</th>
              <th className="px-4 py-3 font-medium">메모</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ student, record }) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-medium">{student.name}</td>
                <td className="px-4 py-3">{[student.schoolName, student.grade].filter(Boolean).join(' ') || '-'}</td>
                <td className="px-4 py-3">{record ? attendanceStatusLabels[record.status] : '미처리'}</td>
                <td className="px-4 py-3">{record?.checkedAt ? formatKoreaTime(record.checkedAt) : '-'}</td>
                <td className="px-4 py-3">{record?.distanceMeters !== null && record?.distanceMeters !== undefined ? `${Math.round(record.distanceMeters)}m` : '-'}</td>
                <td className="px-4 py-3">{record ? attendanceSourceLabels[record.source] : '-'}</td>
                <td className="px-4 py-3">{record?.memo ?? '-'}</td>
                <td className="px-4 py-3">
                  <form action={markAttendanceAction} className="flex justify-end gap-2">
                    <input name="slug" type="hidden" value={slug} />
                    <input name="date" type="hidden" value={dateValue} />
                    <input name="studentId" type="hidden" value={student.id} />
                    <select className="rounded border px-2 py-1 text-sm" defaultValue={record?.status ?? 'PRESENT'} name="status">
                      {Object.entries(attendanceStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input className="w-32 rounded border px-2 py-1 text-sm" defaultValue={record?.memo ?? ''} name="memo" placeholder="메모" />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm" message="출석 상태를 변경할까요?">
                      저장
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={8}>표시할 학생이 없습니다.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  )
}
