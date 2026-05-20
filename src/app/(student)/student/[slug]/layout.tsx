import { redirect } from 'next/navigation'
import { PublicHeader } from '@/components/public/public-header'
import { requireStudentPage } from '@/lib/auth/server'
import { publicPath, studentPath } from '@/lib/utils/public-path'

type StudentLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function StudentLayout({ children, params }: StudentLayoutProps) {
  const { slug } = await params
  let academyName = ''

  try {
    const { academy } = await requireStudentPage(slug)
    academyName = academy.name
  } catch {
    redirect(`/${slug}/login`)
  }

  return (
    <div className="student-shell">
      <PublicHeader
        academyName={academyName}
        authHref={studentPath(slug)}
        authLabel="나의 강의실"
        contactHref={publicPath(slug, '/contact')}
        homeHref={publicPath(slug)}
        noticesHref={publicPath(slug, '/notices')}
        programsHref={publicPath(slug, '/programs')}
        scheduleHref={publicPath(slug, '/schedule')}
        slug={slug}
        teachersHref={publicPath(slug, '/teachers')}
      />
      {children}
    </div>
  )
}
