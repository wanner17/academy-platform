import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'

type NoticesPageProps = {
  params: Promise<{ slug: string }>
}

export default async function NoticesPage({ params }: NoticesPageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const { items } = await noticeService.getPublicNotices(academy.id)

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">공지사항</h1>
      <div className="divide-y rounded-lg border bg-white">
        {items.map((notice) => (
          <article key={notice.id} className="p-5">
            <div className="mb-2 flex items-center gap-2">
              {notice.isPinned ? <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">고정</span> : null}
              <h2 className="font-semibold">
                <a href={`/${slug}/notices/${notice.id}`}>{notice.title}</a>
              </h2>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{notice.content}</p>
          </article>
        ))}
        {items.length === 0 ? <p className="p-5 text-sm text-slate-500">공지 없음</p> : null}
      </div>
    </main>
  )
}
