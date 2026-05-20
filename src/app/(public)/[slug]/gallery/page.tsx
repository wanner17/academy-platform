import { getAcademyBySlug } from '@/lib/utils/tenant'
import { academyGalleryService } from '@/lib/services/academy-gallery.service'

type GalleryPageProps = {
  params: Promise<{ slug: string }>
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const images = await academyGalleryService.getPublicImages(academy.id)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">LEARNING SPACE</div>
          <h1 className="pub-page-title">학습 공간</h1>
          <p className="pub-page-subtitle">학원의 공간과 학습 환경을 사진으로 확인하세요.</p>
        </div>
      </div>

      <main className="pub-page-content">
        {images.length > 0 ? (
          <div className="pub-gallery-all-grid">
            {images.map((image) => (
              <figure key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="학원 소개 사진" src={image.imageUrl} />
              </figure>
            ))}
          </div>
        ) : (
          <div className="pub-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>등록된 학습 공간 사진이 없습니다.</p>
          </div>
        )}
      </main>
    </>
  )
}
