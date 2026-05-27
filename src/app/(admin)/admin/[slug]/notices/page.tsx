import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'
import { deleteNoticeAction } from './actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { Pagination } from '@/components/admin/pagination'
import { requireAdminPage } from '@/lib/auth/server'
import { stripHtml } from '@/lib/utils/html'
import { parsePaginationParams, paginateArray } from '@/lib/utils/pagination'

type AdminNoticesPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ limit?: string; page?: string; pinned?: string; q?: string; status?: string }>
}

export default async function AdminNoticesPage({ params, searchParams }: AdminNoticesPageProps) {
  const { slug } = await params
  const filters = await searchParams
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const { items: allNotices } = await noticeService.getAdminNotices(academy.id)
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedStatus = filters.status?.trim() || ''
  const selectedPinned = filters.pinned === 'true' ? true : filters.pinned === 'false' ? false : undefined
  const { page, limit } = parsePaginationParams(filters)

  const filteredNotices = allNotices.filter((notice) => {
    const matchesQuery = query
      ? [notice.title, stripHtml(notice.content)].some((value) => value.toLowerCase().includes(query))
      : true
    const matchesStatus = selectedStatus ? notice.status === selectedStatus : true
    const matchesPinned = selectedPinned === undefined ? true : notice.isPinned === selectedPinned
    return matchesQuery && matchesStatus && matchesPinned
  })
  const { items: notices, total, totalPages, page: currentPage } = paginateArray(filteredNotices, page, limit)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">공지 관리</h1>
          <p className="mt-1 text-sm text-slate-600">공지 상태와 첨부 여부를 리스트로 확인합니다.</p>
        </div>
        <a className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" href={`/admin/${slug}/notices/new`}>
          공지 작성
        </a>
      </div>
      <section className="mb-6 rounded-lg border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">검색</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={filters.q ?? ''} name="q" placeholder="제목, 내용" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">상태</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedStatus} name="status">
              <option value="">전체</option>
              <option value="DRAFT">초안</option>
              <option value="PUBLISHED">게시</option>
              <option value="ARCHIVED">보관</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">고정</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={filters.pinned ?? ''} name="pinned">
              <option value="">전체</option>
              <option value="true">고정</option>
              <option value="false">일반</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              조회
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/notices`}>
              초기화
            </a>
          </div>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {total}개</p>
      </section>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">제목</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">고정</th>
              <th className="px-4 py-3 font-medium">첨부</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {notices.map((notice) => (
              <tr key={notice.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{notice.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{stripHtml(notice.content)}</p>
                </td>
                <td className="px-4 py-3">{notice.status}</td>
                <td className="px-4 py-3">{notice.isPinned ? '고정' : '-'}</td>
                <td className="px-4 py-3">{notice.attachments.length}개</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a className="rounded border px-3 py-1" href={`/admin/${slug}/notices/${notice.id}/edit`}>
                      수정
                    </a>
                    <form action={deleteNoticeAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={notice.id} />
                      <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 공지를 삭제할까요?">
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 ? <p className="p-4 text-sm text-slate-500">공지 없음</p> : null}
        <div className="border-t px-4">
          <Pagination
            basePath={`/admin/${slug}/notices`}
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
