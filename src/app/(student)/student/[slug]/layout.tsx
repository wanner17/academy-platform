import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/admin/logout-button'
import { requireStudentPage } from '@/lib/auth/server'

type StudentLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function StudentLayout({ children, params }: StudentLayoutProps) {
  const { slug } = await params

  try {
    await requireStudentPage(slug)
  } catch {
    redirect(`/admin/login?callbackUrl=/student/${slug}`)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a className="font-semibold" href={`/student/${slug}`}>
            학생 페이지
          </a>
          <nav className="flex gap-4 text-sm text-slate-600">
            <a href={`/${slug}`}>공개 사이트</a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
