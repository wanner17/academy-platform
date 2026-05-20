import { notFound } from 'next/navigation'
import { publicPath } from '@/lib/utils/public-path'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'
import { sanitizeRichText } from '@/lib/utils/html'

type NoticeDetailPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { slug, id } = await params
  const academy = await getAcademyBySlug(slug)
  const notice = await noticeService.getPublicNoticeById(id, academy.id).catch(() => null)
  if (!notice) notFound()

  const date = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(notice.createdAt)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">공지사항</div>
          <h1 className="pub-page-title" style={{ fontSize: 'clamp(28px, 3vw, 46px)' }}>
            {notice.title}
          </h1>
          <p className="pub-page-subtitle">{date}</p>
        </div>
      </div>

      <div className="pub-page-content" style={{ maxWidth: 760 }}>
        <a className="pub-back-link" href={publicPath(slug, '/notices')}>
          ← 공지 목록
        </a>

        <div className="pub-notice-header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {notice.isPinned && (
              <span className="pub-card-tag" style={{ marginBottom: 0 }}>고정</span>
            )}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--muted)', letterSpacing: '1px' }}>
              {date}
            </span>
          </div>
        </div>

        <div className="pub-notice-body rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(notice.content) }} />

        {notice.attachments.length > 0 && (
          <div style={{ marginTop: 64, borderTop: '1px solid var(--line)', paddingTop: 48 }}>
            <div className="pub-label" style={{ marginBottom: 24 }}>첨부파일</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {notice.attachments.map((attachment) => (
                <AttachmentItem attachment={attachment} key={attachment.objectKey} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
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
      <a href={href} target="_blank" style={{ display: 'block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={label}
          src={href}
          style={{ maxHeight: 560, width: '100%', objectFit: 'contain', border: '1px solid var(--line)' }}
        />
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      style={{
        display: 'block',
        padding: '16px 24px',
        border: '1px solid var(--line)',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        letterSpacing: '1px',
        color: 'var(--brown)',
      }}
    >
      ↓ {label}
    </a>
  )
}
