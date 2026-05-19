import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'
import { createNoticeAction, deleteNoticeAction } from './actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { NoticeAttachmentInput } from '@/components/admin/notice-attachment-input'
import { requireAdminPage } from '@/lib/auth/server'

type AdminNoticesPageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminNoticesPage({ params }: AdminNoticesPageProps) {
  const { slug } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const { items } = await noticeService.getAdminNotices(academy.id)

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">공지 관리</h1>
        <div className="divide-y rounded-lg border bg-white">
          {items.map((notice) => (
            <article key={notice.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {notice.isPinned ? <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">고정</span> : null}
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{notice.status}</span>
                  <h2 className="font-medium">{notice.title}</h2>
                </div>
                <p className="line-clamp-2 whitespace-pre-wrap text-sm text-slate-600">{notice.content}</p>
                {notice.attachments.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">첨부 {notice.attachments.length}개</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <a className="rounded border px-3 py-1 text-sm" href={`/admin/${slug}/notices/${notice.id}/edit`}>
                  수정
                </a>
                <form action={deleteNoticeAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={notice.id} />
                  <ConfirmSubmitButton
                    className="rounded border px-3 py-1 text-sm text-red-700"
                    message="이 공지를 삭제할까요?"
                  >
                    삭제
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
          {items.length === 0 ? <p className="p-4 text-sm text-slate-500">공지 없음</p> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">공지 작성</h2>
        <form action={createNoticeAction} className="space-y-4" encType="multipart/form-data">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">제목</span>
            <input className="w-full rounded border px-3 py-2" name="title" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">내용</span>
            <textarea className="min-h-32 w-full rounded border px-3 py-2" name="content" required />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="isPinned" type="checkbox" value="true" />
            고정 공지
          </label>
          <NoticeAttachmentInput slug={slug} />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="공지를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
