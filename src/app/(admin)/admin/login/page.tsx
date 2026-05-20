import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/integrations/auth/config'
import { LoginForm } from '@/components/admin/login-form'

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authConfig)
  const { callbackUrl } = await searchParams
  if (session?.user) {
    if (callbackUrl?.startsWith('/admin?slug=')) redirect(callbackUrl)
    if (session.user.academySlug) {
      if (session.user.role === 'STUDENT') redirect(`/student/${session.user.academySlug}`)
      redirect(`/admin/${session.user.academySlug}`)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">로그인</h1>
        <p className="mb-6 text-sm text-slate-600">계정으로 로그인하세요.</p>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  )
}
