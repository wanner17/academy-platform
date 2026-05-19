import type { InquiryStatus } from '@prisma/client'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { inquiryService } from '@/lib/services/inquiry.service'
import { updateInquiryStatusAction } from './actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { requireAdminPage } from '@/lib/auth/server'

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
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const selectedStatus = statuses.includes(status as InquiryStatus) ? (status as InquiryStatus) : undefined
  const query = q?.trim() || undefined
  const { items, total } = await inquiryService.getAdminInquiries(academy.id, 1, 50, {
    query,
    status: selectedStatus,
  })

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
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
              필터
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/inquiries`}>
              초기화
            </a>
          </div>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {total}건</p>
      </section>
      <div className="space-y-4">
        {items.map((inquiry) => (
          <article key={inquiry.id} className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {statusLabels[inquiry.status]}
                  </span>
                  <h2 className="font-semibold">{inquiry.subject || '제목 없음'}</h2>
                </div>
                <p className="text-sm text-slate-600">
                  {inquiry.name} · {inquiry.phone}
                  {inquiry.email ? ` · ${inquiry.email}` : ''}
                </p>
              </div>
              <time className="text-sm text-slate-500">
                {new Intl.DateTimeFormat('ko-KR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(inquiry.createdAt)}
              </time>
            </div>
            <p className="mb-4 whitespace-pre-wrap text-sm text-slate-700">{inquiry.content}</p>
            <form action={updateInquiryStatusAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={inquiry.id} />
              <ConfirmSubmitButton
                className="rounded border px-3 py-1 text-sm"
                message="문의 상태를 대기로 변경할까요?"
                name="status"
                value="PENDING"
              >
                대기
              </ConfirmSubmitButton>
              <ConfirmSubmitButton
                className="rounded border px-3 py-1 text-sm"
                message="문의 상태를 처리중으로 변경할까요?"
                name="status"
                value="IN_PROGRESS"
              >
                처리중
              </ConfirmSubmitButton>
              <ConfirmSubmitButton
                className="rounded border px-3 py-1 text-sm"
                message="문의 상태를 완료로 변경할까요?"
                name="status"
                value="DONE"
              >
                완료
              </ConfirmSubmitButton>
            </form>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">접수된 문의가 없습니다.</div>
        ) : null}
      </div>
    </main>
  )
}
