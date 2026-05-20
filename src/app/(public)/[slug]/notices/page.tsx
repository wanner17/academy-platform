import { getAcademyBySlug } from '@/lib/utils/tenant'
import { publicPath } from '@/lib/utils/public-path'
import { noticeService } from '@/lib/services/notice.service'

type NoticesPageProps = {
  params: Promise<{ slug: string }>
}

export default async function NoticesPage({ params }: NoticesPageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const { items } = await noticeService.getPublicNotices(academy.id)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">BOARD</div>
          <h1 className="pub-page-title">공지사항</h1>
          <p className="pub-page-subtitle">학원의 주요 공지 및 안내를 확인하세요.</p>
        </div>
      </div>

      <div className="pub-page-content">
        {items.length > 0 ? (
          <div>
            {items.map((notice) => (
              <article key={notice.id} className="pub-post">
                <div>
                  <div className="pub-meta">
                    공지{notice.isPinned ? ' · 고정' : ''}
                  </div>
                  <h2 className="pub-post-title">
                    <a href={publicPath(slug, `/notices/${notice.id}`)}>{notice.title}</a>
                  </h2>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="pub-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>등록된 공지가 없습니다.</p>
          </div>
        )}
      </div>
    </>
  )
}
