import { redirect } from 'next/navigation'
import { PublicHeader } from '@/components/public/public-header'
import { requireStudentPage } from '@/lib/auth/server'
import { messageService } from '@/lib/services/message.service'
import { publicPath, studentPath } from '@/lib/utils/public-path'

type StudentLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function StudentLayout({ children, params }: StudentLayoutProps) {
  const { slug } = await params
  let academyName = ''
  let unreadCount = 0

  try {
    const { academy, user } = await requireStudentPage(slug)
    academyName = academy.name
    unreadCount = await messageService.countUnread(user.id, academy.id)
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
        messagesHref={studentPath(slug, '/messages')}
        noticesHref={publicPath(slug, '/notices')}
        programsHref={publicPath(slug, '/programs')}
        scheduleHref={publicPath(slug, '/schedule')}
        slug={slug}
        teachersHref={publicPath(slug, '/teachers')}
        unreadCount={unreadCount}
      />
      {children}
    </div>
  )
}
