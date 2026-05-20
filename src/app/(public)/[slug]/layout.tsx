import { notFound } from 'next/navigation'
import { getAcademyBySlug } from '@/lib/utils/tenant'

type PublicLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug).catch(() => null)
  if (!academy) notFound()

  const year = new Date().getFullYear()

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <header className="pub-header">
        <a className="pub-logo" href={`/${slug}`}>
          {academy.name.toUpperCase()}
        </a>
        <nav className="pub-nav">
          <a href={`/${slug}/programs`}>CURRICULUM</a>
          <a href={`/${slug}/teachers`}>INSTRUCTORS</a>
          <a href={`/${slug}/schedule`}>SCHEDULE</a>
          <a href={`/${slug}/notices`}>NOTICE</a>
        </nav>
        <a className="pub-cta" href={`/${slug}/contact`}>
          CONSULTATION
        </a>
      </header>

      {children}

      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div>
            <span className="pub-footer-logo">{academy.name.toUpperCase()}</span>
            <p>
              {academy.address ?? ''}
              {academy.address && academy.phone ? <br /> : null}
              {academy.phone ? `Tel. ${academy.phone}` : null}
            </p>
          </div>
          <div>
            <div className="pub-foot-title">INFORMATION</div>
            <p>
              <a href={`/${slug}/programs`}>수업 안내</a>
              <br />
              <a href={`/${slug}/teachers`}>강사진</a>
              <br />
              <a href={`/${slug}/notices`}>공지사항</a>
            </p>
          </div>
          <div>
            <div className="pub-foot-title">CONTACT</div>
            <p>
              {academy.phone ? (
                <>
                  {academy.phone}
                  <br />
                </>
              ) : null}
              {academy.email ?? null}
            </p>
          </div>
        </div>
        <div className="pub-copyright">© {year} {academy.name.toUpperCase()}. ALL RIGHTS RESERVED.</div>
      </footer>

      <a className="pub-floating" href={`/${slug}/contact`}>
        <span className="pub-floating-icon">✉</span>
        <span>
          <small className="pub-floating-label">FREE CONSULTATION</small>
          <strong className="pub-floating-text">방문 상담 예약하기</strong>
        </span>
      </a>
    </div>
  )
}
