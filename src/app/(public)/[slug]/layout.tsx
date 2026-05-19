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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a className="text-lg font-semibold" href={`/${slug}`}>
            {academy.name}
          </a>
          <nav className="flex gap-4 text-sm text-slate-600">
            <a href={`/${slug}/programs`}>수업 안내</a>
            <a href={`/${slug}/teachers`}>강사진</a>
            <a href={`/${slug}/notices`}>공지사항</a>
            <a href={`/${slug}/contact`}>상담문의</a>
            <a href={`/admin/${slug}`}>관리자</a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
