import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/integrations/auth/config'

type AdminIndexPageProps = {
  searchParams: Promise<{ slug?: string }>
}

export default async function AdminIndexPage({ searchParams }: AdminIndexPageProps) {
  const session = await getServerSession(authConfig)
  const academySlug = session?.user?.academySlug
  const { slug } = await searchParams
  const targetSlug = session?.user?.role === 'SUPER_ADMIN' ? slug : academySlug

  if (!session?.user || !targetSlug) {
    const callbackUrl = slug ? `/admin?slug=${encodeURIComponent(slug)}` : '/admin'
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  if (session.user.role === 'STUDENT') {
    redirect(`/student/${targetSlug}`)
  }

  redirect(`/admin/${targetSlug}`)
}
