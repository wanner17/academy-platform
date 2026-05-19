import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/admin/logout-button'
import { authConfig } from '@/lib/integrations/auth/config'
import { isAcademyAdminRole, requireAcademyMember } from '@/lib/auth/authorization'

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
    redirect(`/admin/login?callbackUrl=/admin/${slug}`)
  }

  const role = session?.user.role
  const isAdmin = role ? isAcademyAdminRole(role) : false

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a className="font-semibold" href={`/admin/${slug}`}>
            관리자
          </a>
          <nav className="flex gap-4 text-sm text-slate-600">
            {isAdmin ? (
              <>
                <a href={`/admin/${slug}/settings`}>기본 설정</a>
                <a href={`/admin/${slug}/programs`}>수업 관리</a>
                <a href={`/admin/${slug}/teachers`}>강사진 관리</a>
                <a href={`/admin/${slug}/students`}>학생 관리</a>
                <a href={`/admin/${slug}/notices`}>공지 관리</a>
                <a href={`/admin/${slug}/inquiries`}>문의 관리</a>
              </>
            ) : (
              <>
                <a href={`/admin/${slug}/my`}>내 수업</a>
                <a href={`/admin/${slug}/profile`}>내 정보</a>
              </>
            )}
            <a href={`/${slug}`}>공개 사이트</a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
