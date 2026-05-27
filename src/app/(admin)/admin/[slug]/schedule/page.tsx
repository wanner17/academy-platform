import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { Pagination } from '@/components/admin/pagination'
import { dayLabels } from '@/lib/schedule-labels'
import { scheduleService } from '@/lib/services/schedule.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { deleteScheduleAction } from './actions'
import { requireAdminPage } from '@/lib/auth/server'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'

type AdminSchedulePageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ active?: string; day?: string; limit?: string; page?: string; q?: string }>
}

export default async function AdminSchedulePage({ params, searchParams }: AdminSchedulePageProps) {
  const { slug } = await params
  const filters = await searchParams
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const allSchedules = await scheduleService.getAdminSchedules(academy.id)
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedDay = filters.day !== undefined && filters.day !== '' ? Number(filters.day) : undefined
  const selectedActive = filters.active === 'true' ? true : filters.active === 'false' ? false : undefined
  const { page, limit } = parsePaginationParams(filters)
  const filteredSchedules = allSchedules.filter((schedule) => {
    const matchesQuery = query
      ? [schedule.title, schedule.subject ?? '', schedule.teacher ?? '', schedule.room ?? '', schedule.program?.title ?? ''].some((value) =>
          value.toLowerCase().includes(query),
        )
      : true
    const matchesDay = selectedDay === undefined ? true : schedule.dayOfWeek === selectedDay
    const matchesActive = selectedActive === undefined ? true : schedule.isActive === selectedActive
    return matchesQuery && matchesDay && matchesActive
  })
  const { items: schedules, total, totalPages, page: currentPage } = paginateArray(filteredSchedules, page, limit)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">시간표 관리</h1>
          <p className="mt-1 text-sm text-slate-600">시간표를 요일과 상태 기준으로 확인합니다.</p>
        </div>
        <a className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" href={`/admin/${slug}/schedule/new`}>
          시간표 등록
        </a>
      </div>
      <section className="mb-6 rounded-lg border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">검색</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={filters.q ?? ''} name="q" placeholder="수업명, 과목, 강사, 교실" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">요일</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={filters.day ?? ''} name="day">
              <option value="">전체</option>
              {dayLabels.map((label, index) => (
                <option key={label} value={index}>
                  {label}요일
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">공개</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={filters.active ?? ''} name="active">
              <option value="">전체</option>
              <option value="true">공개</option>
              <option value="false">비공개</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              조회
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/schedule`}>
              초기화
            </a>
          </div>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {total}개</p>
      </section>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">수업명</th>
              <th className="px-4 py-3 font-medium">요일/시간</th>
              <th className="px-4 py-3 font-medium">과목</th>
              <th className="px-4 py-3 font-medium">강사</th>
              <th className="px-4 py-3 font-medium">교실</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-4 py-3 font-medium">{schedule.title}</td>
                <td className="px-4 py-3">
                  {dayLabels[schedule.dayOfWeek]}요일 {schedule.startTime}-{schedule.endTime}
                </td>
                <td className="px-4 py-3">{schedule.subject ?? '-'}</td>
                <td className="px-4 py-3">{schedule.teacher ?? '-'}</td>
                <td className="px-4 py-3">{schedule.room ?? '-'}</td>
                <td className="px-4 py-3">
                  {schedule.isActive ? (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">공개</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">비공개</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a className="rounded border px-3 py-1" href={`/admin/${slug}/schedule/${schedule.id}/edit`}>
                      수정
                    </a>
                    <form action={deleteScheduleAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={schedule.id} />
                      <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 시간표를 삭제할까요?">
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 ? <p className="p-4 text-sm text-slate-500">등록된 시간표가 없습니다.</p> : null}
        <div className="border-t px-4">
          <Pagination
            basePath={`/admin/${slug}/schedule`}
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
