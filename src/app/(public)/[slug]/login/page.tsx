import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PublicLoginForm } from '@/components/public-login-form'
import { authConfig } from '@/lib/integrations/auth/config'
import { adminPath } from '@/lib/utils/public-path'
import { getAcademyBySlug } from '@/lib/utils/tenant'

type PublicLoginPageProps = {
  params: Promise<{ slug: string }>
}

export default async function PublicLoginPage({ params }: PublicLoginPageProps) {
  const { slug } = await params
  const [academy, session] = await Promise.all([
    getAcademyBySlug(slug),
    getServerSession(authConfig),
  ])
  const callbackUrl = adminPath(slug)

  if (session?.user) {
    redirect(callbackUrl)
  }

  return (
    <main className="pub-login">
      <section className="pub-login-copy">
        <div className="pub-eyebrow">회원 로그인</div>
        <h1 className="pub-login-title">{academy.name}</h1>
        <p className="pub-login-desc">
          로그인 페이지입니다.
        </p>
      </section>
      <section className="pub-login-panel" aria-label="로그인">
        <div className="pub-login-panel-head">
          <span>로그인</span>
          <h2>계정 로그인</h2>
        </div>
        <PublicLoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  )
}
