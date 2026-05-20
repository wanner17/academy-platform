import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'
import { teacherService } from '@/lib/services/teacher.service'
import { scheduleService } from '@/lib/services/schedule.service'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function AcademyHomePage({ params }: PageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)

  const [{ items: notices }, teachers, schedules] = await Promise.all([
    noticeService.getPublicNotices(academy.id, 1, 5),
    teacherService.getPublicTeachers(academy.id),
    scheduleService.getPublicSchedules(academy.id),
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
            <a className="pub-btn-primary" href={`/${slug}/contact`}>
              GET CONSULTATION
            </a>
            <a className="pub-btn-outline" href={`/${slug}/programs`}>
              VIEW CURRICULUM
            </a>
          </div>
        </div>
        <div className="pub-hero-image" aria-label="academy interior" />
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

      {/* Instructors */}
      {teachers.length > 0 && (
        <section className="pub-section">
          <div className="pub-section-head">
            <div>
              <div className="pub-label">THE FACULTY</div>
              <h2 className="pub-h2">Master Instructors</h2>
            </div>
            <a className="pub-view-all" href={`/${slug}/teachers`}>
              VIEW ALL PROFILES →
            </a>
          </div>
          <div className="pub-instructors">
            {teachers.slice(0, 3).map((teacher) => (
              <article key={teacher.id}>
                <div className="pub-teacher-placeholder">👤</div>
                <div className="pub-role">
                  {teacher.subject?.toUpperCase() ?? 'INSTRUCTOR'}
                </div>
                <h3 className="pub-teacher-name">{teacher.name}</h3>
                <p className="pub-teacher-bio">
                  {teacher.bio || '소개를 준비 중입니다.'}
                </p>
              </article>
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
              <div className="pub-post-placeholder" />
              <div>
                <div className="pub-meta">
                  NOTICE{notice.isPinned ? ' · 고정' : ''}
                </div>
                <h3 className="pub-post-title">
                  <a href={`/${slug}/notices/${notice.id}`}>{notice.title}</a>
                </h3>
                <p className="pub-post-desc">{notice.content}</p>
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
            <a className="pub-cs-link" href={`/${slug}/contact`}>
              INQUIRY →
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
