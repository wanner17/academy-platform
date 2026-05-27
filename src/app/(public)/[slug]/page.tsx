import { getAcademyBySlug } from '@/lib/utils/tenant'
import { KakaoMap } from '@/components/public/kakao-map'
import { InstructorsSlider } from '@/components/public/instructors-slider'
import { academyGalleryService } from '@/lib/services/academy-gallery.service'
import { noticeService } from '@/lib/services/notice.service'
import { teacherService } from '@/lib/services/teacher.service'
import { scheduleService } from '@/lib/services/schedule.service'
import { publicPath } from '@/lib/utils/public-path'
import { programService } from '@/lib/services/program.service'
import { StatCounters } from '@/components/public/stat-counters'
import { CourseFinderQuiz } from '@/components/public/course-finder-quiz'
import { TestimonialsSlider } from '@/components/public/testimonials-slider'
import { parseStatCounters, parseTestimonials } from '@/lib/homepage-sections'
import { getKoreaDayOfWeek, getKoreaMinutes } from '@/lib/utils/korea-time'
import { dayLabels } from '@/lib/schedule-labels'
import { FadeUp, StaggerList, StaggerItem } from '@/components/ui/animate-on-scroll'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function AcademyHomePage({ params }: PageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)

  const [{ items: notices }, teachers, schedules, galleryImages, programs] = await Promise.all([
    noticeService.getPublicNotices(academy.id, 1, 5),
    teacherService.getPublicTeachers(academy.id),
    scheduleService.getPublicSchedules(academy.id),
    academyGalleryService.getPublicImages(academy.id),
    programService.getPublicPrograms(academy.id),
  ])
  const statCounters = parseStatCounters(academy.statCounters)
  const testimonials = parseTestimonials(academy.testimonials)
  const upcomingSchedules = getUpcomingSchedules(schedules).slice(0, 4)

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
        <div className="pub-hero-visual">
          <div
            className="pub-hero-image"
            style={academy.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.18)), url("${academy.heroImageUrl}")` } : undefined}
            aria-label="academy interior"
          />
        </div>
      </section>

      {/* Schedule Strip */}
      {upcomingSchedules.length > 0 && (
        <FadeUp>
          <section className="pub-schedule-strip">
            {upcomingSchedules.map((schedule) => (
              <div key={schedule.id} className="pub-schedule-item">
                <div className="pub-time">
                  {dayLabels[schedule.dayOfWeek]} {schedule.startTime} – {schedule.endTime}
                </div>
                <div className="pub-class-name">{schedule.title}</div>
              </div>
            ))}
          </section>
        </FadeUp>
      )}

      {/* Stat Counters */}
      {academy.showStatCounters && (
        <FadeUp>
          <StatCounters counters={statCounters} />
        </FadeUp>
      )}

      {galleryImages.length > 0 && (
        <section className="pub-section pub-gallery-section">
          <FadeUp>
            <div className="pub-section-head">
              <div>
                <div className="pub-label">LEARNING SPACE</div>
                <h2 className="pub-h2">학습 공간</h2>
              </div>
              <a className="pub-view-all" href={publicPath(slug, '/gallery')}>
                전체 사진 보기 →
              </a>
            </div>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div className="pub-gallery-grid">
              {galleryImages.slice(0, 5).map((image, index) => (
                <figure className={index === 0 ? 'pub-gallery-main' : undefined} key={image.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="학원 소개 사진" src={image.imageUrl} />
                </figure>
              ))}
            </div>
          </FadeUp>
        </section>
      )}

      {/* Instructors */}
      {teachers.length > 0 && (
        <section className="pub-section">
          <FadeUp>
            <div className="pub-section-head">
              <div>
                <div className="pub-label">강사진 소개</div>
                <h2 className="pub-h2">상위권을 만드는 대표 강사진</h2>
              </div>
              <a className="pub-view-all" href={publicPath(slug, '/teachers')}>
                강사진 전체 보기 →
              </a>
            </div>
          </FadeUp>
          <FadeUp delay={0.12}>
            <InstructorsSlider teachers={teachers} slug={slug} />
          </FadeUp>
        </section>
      )}

      {/* Testimonials Slider */}
      {academy.showTestimonials && (
        <FadeUp>
          <TestimonialsSlider testimonials={testimonials} />
        </FadeUp>
      )}

      {/* Course Finder Quiz */}
      <FadeUp>
        <CourseFinderQuiz programs={programs} slug={slug} />
      </FadeUp>

      {/* Location */}
      {academy.address && academy.features?.showLocation !== false && (
        <section className="pub-section">
          <FadeUp>
            <div className="pub-section-head">
              <div>
                <div className="pub-label">LOCATION</div>
                <h2 className="pub-h2">오시는 길</h2>
              </div>
              <a
                className="pub-view-all"
                href={`https://map.kakao.com/link/search/${encodeURIComponent(academy.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                카카오맵에서 보기 →
              </a>
            </div>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div className="pub-location-body">
              <div className="pub-location-info">
                <div className="pub-location-row">
                  <span>📍</span>
                  <span>{academy.address}</span>
                </div>
                {academy.phone && (
                  <div className="pub-location-row">
                    <span>📞</span>
                    <span>{academy.phone}</span>
                  </div>
                )}
                {academy.email && (
                  <div className="pub-location-row">
                    <span>✉</span>
                    <span>{academy.email}</span>
                  </div>
                )}
                <a className="pub-cs-link" href={publicPath(slug, '/contact')}>
                  상담 신청하기 →
                </a>
              </div>
              <KakaoMap address={academy.address} lat={academy.mapLatitude} lng={academy.mapLongitude} mapUrl={academy.mapUrl} name={academy.name} />
            </div>
          </FadeUp>
        </section>
      )}

      {/* Journal + Sidebar */}
      <div className="pub-journal-wrap">
        <FadeUp>
          <div>
            <h2 className="pub-posts-h2">공지사항</h2>
            <StaggerList>
              {notices.map((notice) => (
                <StaggerItem key={notice.id}>
                  <article className="pub-post">
                    <div>
                      <div className="pub-meta">
                        공지{notice.isPinned ? ' · 고정' : ''}
                      </div>
                      <h3 className="pub-post-title">
                        <a href={publicPath(slug, `/notices/${notice.id}`)}>{notice.title}</a>
                      </h3>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerList>
            {notices.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                등록된 공지가 없습니다.
              </p>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
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
        </FadeUp>
      </div>
    </>
  )
}

function getUpcomingSchedules<T extends { dayOfWeek: number; startTime: string }>(schedules: T[]) {
  const now = new Date()
  const today = getKoreaDayOfWeek(now)
  const currentMinutes = getKoreaMinutes(now)

  return [...schedules]
    .map((schedule) => ({
      schedule,
      sortKey: getUpcomingSortKey(schedule.dayOfWeek, schedule.startTime, today, currentMinutes),
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ schedule }) => schedule)
}

function getUpcomingSortKey(dayOfWeek: number, startTime: string, today: number, currentMinutes: number) {
  const startMinutes = parseTimeToMinutes(startTime)
  const dayOffset = (dayOfWeek - today + 7) % 7

  if (dayOffset === 0 && startMinutes < currentMinutes) {
    return 7 * 24 * 60 + startMinutes
  }

  return dayOffset * 24 * 60 + startMinutes
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return 0
  return hour * 60 + minute
}
