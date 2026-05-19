import { notFound } from 'next/navigation'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'

type NoticeDetailPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { slug, id } = await params
  const academy = await getAcademyBySlug(slug)
  const notice = await noticeService.getPublicNoticeById(id, academy.id).catch(() => null)
  if (!notice) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/${slug}/notices`}>
        공지 목록
      </a>
      <article className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {notice.isPinned ? <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">고정</span> : null}
          <time className="text-sm text-slate-500">
            {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(notice.createdAt)}
          </time>
        </div>
        <h1 className="mb-6 text-3xl font-bold">{notice.title}</h1>
        <p className="whitespace-pre-wrap leading-7 text-slate-700">{notice.content}</p>
        {notice.attachments.length > 0 ? (
          <div className="mt-8 border-t pt-6">
            <h2 className="mb-4 font-semibold">첨부</h2>
            <div className="space-y-4">
              {notice.attachments.map((attachment) => (
                <AttachmentItem attachment={attachment} key={attachment.id} />
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  )
}

function AttachmentItem({
  attachment,
}: {
  attachment: {
    objectKey: string
    displayName: string | null
    publicUrl: string | null
    mimeType: string
  }
}) {
  const isImage = attachment.mimeType.startsWith('image/')
  const href = attachment.publicUrl ?? '#'
  const label = attachment.displayName ?? attachment.objectKey

  if (isImage) {
    return (
      <a className="block" href={href} target="_blank">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={label} className="max-h-[560px] w-full rounded border object-contain" src={href} />
      </a>
    )
  }

  return (
    <a className="block rounded border p-3 text-sm text-blue-700" href={href} target="_blank">
      {label}
    </a>
  )
}
