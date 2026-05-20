import type { InquiryStatus } from '@prisma/client'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { inquiryService } from '@/lib/services/inquiry.service'
import { updateInquiryMemoAction, updateInquiryStatusAction } from './actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { requireMemberPage } from '@/lib/auth/server'

type AdminInquiriesPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; status?: string }>
}

const statusLabels = {
  PENDING: '대기',
  IN_PROGRESS: '처리중',
  DONE: '완료',
}

const statuses: InquiryStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE']

export default async function AdminInquiriesPage({ params, searchParams }: AdminInquiriesPageProps) {
  const { slug } = await params
  const { q, status } = await searchParams
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const selectedStatus = statuses.includes(status as InquiryStatus) ? (status as InquiryStatus) : undefined
  const query = q?.trim() || undefined
  const { items, total } = await inquiryService.getAdminInquiries(academy.id, 1, 50, {
    query,
    status: selectedStatus,
  })

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-4 text-2xl font-bold">문의 관리</h1>
      <section className="mb-6 rounded-lg border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" method="get">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">검색</span>
            <input
              className="w-full rounded border px-3 py-2"
              defaultValue={query ?? ''}
              name="q"
              placeholder="이름, 연락처, 이메일, 제목, 내용"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">상태</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedStatus ?? ''} name="status">
              <option value="">전체</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              조회
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/inquiries`}>
              초기화
            </a>
          </div>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {total}건</p>
      </section>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[17%]" />
            <col className="w-[14%]" />
            <col className="w-[22%]" />
            <col className="w-[7%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">문의</th>
              <th className="px-4 py-3 font-medium">고객</th>
              <th className="px-4 py-3 font-medium">접수일</th>
              <th className="px-4 py-3 font-medium">상담 내용</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 text-right font-medium">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((inquiry) => (
              <tr key={inquiry.id}>
                <td className="min-w-0 px-4 py-3">
                  <p className="font-medium">{inquiry.subject || '제목 없음'}</p>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-slate-500">{inquiry.content}</p>
                </td>
                <td className="min-w-0 px-4 py-3">
                  <p className="truncate">{inquiry.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {inquiry.phone}
                    {inquiry.email ? ` · ${inquiry.email}` : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs leading-relaxed text-slate-600">
                  {new Intl.DateTimeFormat('ko-KR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(inquiry.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <form action={updateInquiryMemoAction} className="space-y-2">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={inquiry.id} />
                    <textarea
                      className="min-h-20 w-full rounded border px-3 py-2 text-sm"
                      defaultValue={inquiry.memo ?? ''}
                      name="memo"
                      placeholder="상담 내용"
                    />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-xs" message="상담 내용을 저장할까요?">
                      상담 내용 저장
                    </ConfirmSubmitButton>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-xs leading-none text-slate-700">
                    {statusLabels[inquiry.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={updateInquiryStatusAction} className="flex flex-wrap justify-end gap-2">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={inquiry.id} />
                    <ConfirmSubmitButton className="whitespace-nowrap rounded border px-3 py-1" message="문의 상태를 대기로 변경할까요?" name="status" value="PENDING">
                      대기
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton
                      className="whitespace-nowrap rounded border px-3 py-1"
                      message="문의 상태를 처리중으로 변경할까요?"
                      name="status"
                      value="IN_PROGRESS"
                    >
                      처리중
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton className="whitespace-nowrap rounded border px-3 py-1" message="문의 상태를 완료로 변경할까요?" name="status" value="DONE">
                      완료
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="p-4 text-sm text-slate-500">접수된 문의가 없습니다.</p> : null}
      </div>
    </main>
  )
}
