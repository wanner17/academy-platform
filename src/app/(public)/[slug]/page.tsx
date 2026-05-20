import { getAcademyBySlug } from '@/lib/utils/tenant'
import { TeacherCard } from '@/components/public/teacher-card'
import { academyGalleryService } from '@/lib/services/academy-gallery.service'
import { noticeService } from '@/lib/services/notice.service'
import { teacherService } from '@/lib/services/teacher.service'
import { scheduleService } from '@/lib/services/schedule.service'
import { publicPath } from '@/lib/utils/public-path'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function AcademyHomePage({ params }: PageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)

  const [{ items: notices }, teachers, schedules, galleryImages] = await Promise.all([
    noticeService.getPublicNotices(academy.id, 1, 5),
    teacherService.getPublicTeachers(academy.id),
    scheduleService.getPublicSchedules(academy.id),
    academyGalleryService.getPublicImages(academy.id),
  ])

  return (
    <>
      {/* Hero */}
      <section className="pub-hero">
        <div className="pub-hero-copy">
          <div className="pub-eyebrow">PREMIUM PRIVATE EDUCATION</div>
          <h1 className="pub-h1">{academy.name}</h1>
          <p className="pub-hero-desc">
            {academy.description ??
              '단순한 지식 전달을 넘어, 입시라는 거대한 파도 속에서 흔들리지 않는 중심을 만듭니다. 상위권을 향한 독보적인 커리큘럼.'}
          </p>
          <div className="pub-hero-actions">
            <a className="pub-btn-primary" href={publicPath(slug, '/contact')}>
              상담 신청
            </a>
            <a className="pub-btn-outline" href={publicPath(slug, '/programs')}>
              수업 안내
            </a>
          </div>
        </div>
        <div
          className="pub-hero-image"
          style={academy.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.18)), url("${academy.heroImageUrl}")` } : undefined}
          aria-label="academy interior"
        />
      </section>

      {/* Schedule Strip */}
      {schedules.length > 0 && (
        <section className="pub-schedule-strip">
          {schedules.slice(0, 4).map((schedule) => (
            <div key={schedule.id} className="pub-schedule-item">
              <div className="pub-time">
                {schedule.startTime} – {schedule.endTime}
              </div>
              <div className="pub-class-name">{schedule.title}</div>
            </div>
          ))}
        </section>
      )}

      {galleryImages.length > 0 && (
        <section className="pub-section pub-gallery-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">LEARNING SPACE</div>
              <h2 className="pub-h2">학습 공간</h2>
            </div>
            <a className="pub-view-all" href={publicPath(slug, '/gallery')}>
              전체 사진 보기 →
            </a>
          </div>
          <div className="pub-gallery-grid">
            {galleryImages.slice(0, 5).map((image, index) => (
              <figure className={index === 0 ? 'pub-gallery-main' : undefined} key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="학원 소개 사진" src={image.imageUrl} />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Instructors */}
      {teachers.length > 0 && (
        <section className="pub-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">THE FACULTY</div>
              <h2 className="pub-h2">Master Instructors</h2>
            </div>
            <a className="pub-view-all" href={publicPath(slug, '/teachers')}>
              강사진 전체 보기 →
            </a>
          </div>
          <div className="pub-instructors">
            {teachers.slice(0, 3).map((teacher) => (
              <TeacherCard href={publicPath(slug, `/teachers/${teacher.id}`)} key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </section>
      )}

      {/* Journal + Sidebar */}
      <div className="pub-journal-wrap">
        <div>
          <h2 className="pub-posts-h2">공지사항</h2>
          {notices.map((notice) => (
            <article key={notice.id} className="pub-post">
              <div>
                <div className="pub-meta">
                  공지{notice.isPinned ? ' · 고정' : ''}
                </div>
                <h3 className="pub-post-title">
                  <a href={publicPath(slug, `/notices/${notice.id}`)}>{notice.title}</a>
                </h3>
              </div>
            </article>
          ))}
          {notices.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              등록된 공지가 없습니다.
            </p>
          )}
        </div>

        <aside className="pub-side">
          <h3 className="pub-side-title">상담 문의</h3>
          <div className="pub-side-line" />
          {academy.phone && (
            <div className="pub-notice-item">📞 {academy.phone}</div>
          )}
          {academy.address && (
            <div className="pub-notice-item">📍 {academy.address}</div>
          )}
          {academy.email && (
            <div className="pub-notice-item">✉ {academy.email}</div>
          )}
          <div className="pub-cs">
            <div className="pub-label">CS CENTER</div>
            {academy.phone && (
              <div className="pub-cs-phone">{academy.phone}</div>
            )}
            <p className="pub-cs-desc">
              상담 문의는 전화 또는
              <br />
              온라인으로 접수하세요.
            </p>
            <a className="pub-cs-link" href={publicPath(slug, '/contact')}>
              문의하기 →
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
