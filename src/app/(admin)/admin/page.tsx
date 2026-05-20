import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/integrations/auth/config'

export default async function AdminIndexPage() {
  const session = await getServerSession(authConfig)
  const academySlug = session?.user?.academySlug

  if (!academySlug) {
    redirect('/admin/login?callbackUrl=/admin')
  }

  if (session.user.role === 'STUDENT') {
    redirect(`/student/${academySlug}`)
  }

  redirect(`/admin/${academySlug}`)
}
