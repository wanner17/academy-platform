import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/admin-nav'
import { authConfig } from '@/lib/integrations/auth/config'
import { isAcademyAdminRole, requireAcademyMember } from '@/lib/auth/authorization'
import { adminPath } from '@/lib/utils/public-path'

type AdminLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)

  try {
    await requireAcademyMember(session, slug)
  } catch {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(adminPath(slug))}`)
  }

  const role = session?.user.role
  const isAdmin = role ? isAcademyAdminRole(role) : false

  return (
    <div className="admin-shell min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a className="shrink-0 font-semibold" href={adminPath(slug)}>
            관리자
          </a>
          <AdminNav isAdmin={isAdmin} slug={slug} />
        </div>
      </header>
      {children}
    </div>
  )
}
