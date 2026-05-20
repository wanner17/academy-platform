import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { authConfig } from '@/lib/integrations/auth/config'
import { publicPath } from '@/lib/utils/public-path'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { PublicHeader } from '@/components/public/public-header'

type PublicLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug).catch(() => null)
  if (!academy) notFound()

  const year = new Date().getFullYear()
  const session = await getServerSession(authConfig)
  const loginHref = publicPath(slug, '/login')
  const isStudent = session?.user.role === 'STUDENT'
  const isCurrentAcademyUser = session?.user.academySlug === slug
  const portalHref = isStudent
    ? `/student/${session.user.academySlug}`
    : `/admin/${session?.user.role === 'SUPER_ADMIN' ? slug : session?.user.academySlug}`
  const portalLabel = isStudent ? '나의 강의실' : '관리자 페이지'
  const authHref = session?.user && (isCurrentAcademyUser || session.user.role === 'SUPER_ADMIN')
    ? portalHref
    : loginHref
  const authLabel = session?.user && (isCurrentAcademyUser || session.user.role === 'SUPER_ADMIN')
    ? portalLabel
    : '로그인'

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <PublicHeader
        academyName={academy.name}
        slug={slug}
        homeHref={publicPath(slug)}
        programsHref={publicPath(slug, '/programs')}
        teachersHref={publicPath(slug, '/teachers')}
        scheduleHref={publicPath(slug, '/schedule')}
        noticesHref={publicPath(slug, '/notices')}
        contactHref={publicPath(slug, '/contact')}
        authHref={authHref}
        authLabel={authLabel}
      />

      {children}

      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div>
            <span className="pub-footer-logo">
              <Image alt={`${academy.name} 로고`} height={54} src="/logo.png" width={220} />
            </span>
            <p>
              {academy.address ?? ''}
              {academy.address && academy.phone ? <br /> : null}
              {academy.phone ? `Tel. ${academy.phone}` : null}
            </p>
          </div>
          <div>
            <div className="pub-foot-title">INFORMATION</div>
            <p>
              <a href={publicPath(slug, '/programs')}>수업 안내</a>
              <br />
              <a href={publicPath(slug, '/teachers')}>강사진</a>
              <br />
              <a href={publicPath(slug, '/gallery')}>학습 공간</a>
              <br />
              <a href={publicPath(slug, '/notices')}>공지사항</a>
            </p>
          </div>
          <div>
            <div className="pub-foot-title">연락처</div>
            <p>
              {academy.phone ? (
                <>
                  {academy.phone}
                  <br />
                </>
              ) : null}
              {academy.email ?? null}
            </p>
            {academy.naverBlogUrl || academy.instagramUrl ? (
              <div className="pub-footer-social" aria-label="소셜 링크">
                {academy.naverBlogUrl ? (
                  <a className="pub-social-icon pub-social-blog" href={academy.naverBlogUrl} target="_blank" rel="noreferrer" aria-label="네이버 블로그">
                    <Image alt="" height={41} src="/naver-blog-icon.svg" width={41} />
                  </a>
                ) : null}
                {academy.instagramUrl ? (
                  <a className="pub-social-icon pub-social-instagram" href={academy.instagramUrl} target="_blank" rel="noreferrer" aria-label="인스타그램">
                    <Image alt="" height={41} src="/instagram-icon.svg" width={41} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="pub-copyright">© {year} {academy.name.toUpperCase()}. ALL RIGHTS RESERVED.</div>
      </footer>

      <a className="pub-floating" href={publicPath(slug, '/contact')}>
        <span className="pub-floating-icon">✉</span>
        <span>
          <small className="pub-floating-label">상담 문의</small>
          <strong className="pub-floating-text">방문 상담 예약하기</strong>
        </span>
      </a>
    </div>
  )
}
