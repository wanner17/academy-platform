import { notFound } from 'next/navigation'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { teacherService } from '@/lib/services/teacher.service'
import { sanitizeRichText } from '@/lib/utils/html'
import { getVideoPreview, parseVideoUrls } from '@/lib/utils/video'
import { publicPath } from '@/lib/utils/public-path'

type TeacherDetailPageProps = {
  params: Promise<{ id: string; slug: string }>
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const { id, slug } = await params
  const academy = await getAcademyBySlug(slug)
  const teacher = await teacherService.getPublicTeacherById(id, academy.id).catch(() => null)
  if (!teacher) notFound()

  const videoUrls = parseVideoUrls(teacher.introVideoUrls ?? teacher.introVideoUrl)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">{teacher.subject?.toUpperCase() ?? 'INSTRUCTOR'}</div>
          <h1 className="pub-page-title">{teacher.name}</h1>
          <p className="pub-page-subtitle">강사 소개와 강의 영상을 확인하세요.</p>
        </div>
      </div>

      <main className="pub-teacher-detail">
        <a className="pub-back-link" href={publicPath(slug, '/teachers')}>
          ← 강사진 목록
        </a>
        <section className="pub-teacher-detail-head">
          {teacher.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${teacher.name} 프로필`} className="pub-teacher-detail-img" src={teacher.profileImageUrl} />
          ) : (
            <div className="pub-teacher-detail-placeholder">👤</div>
          )}
          <div>
            <div className="pub-role">{teacher.subject?.toUpperCase() ?? 'INSTRUCTOR'}</div>
            <h2 className="pub-teacher-detail-name">{teacher.name}</h2>
            {teacher.bio ? (
              <div className="pub-teacher-detail-bio rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(teacher.bio) }} />
            ) : (
              <p className="pub-teacher-detail-bio">소개를 준비 중입니다.</p>
            )}
          </div>
        </section>

        {videoUrls.length > 0 ? (
          <section className="pub-teacher-detail-videos">
            <div className="pub-label">LECTURE VIDEOS</div>
            <h2 className="pub-h2">강의 영상 미리보기</h2>
            <div className="pub-teacher-video-grid">
              {videoUrls.map((url, index) => {
                const preview = getVideoPreview(url)
                if (!preview) return null
                return (
                  <article className="pub-teacher-video-card" key={`${url}-${index}`}>
                    {preview.kind === 'embed' ? (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        src={preview.src}
                        title={`${teacher.name} 강의 영상 ${index + 1}`}
                      />
                    ) : (
                      <video controls src={preview.src} />
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
      </main>
    </>
  )
}
