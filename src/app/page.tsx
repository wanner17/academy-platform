import PublicLayout from '@/app/(public)/[slug]/layout'
import AcademyHomePage from '@/app/(public)/[slug]/page'
import { DEFAULT_PUBLIC_SLUG } from '@/lib/utils/public-path'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const params = Promise.resolve({ slug: DEFAULT_PUBLIC_SLUG })

  return (
    <PublicLayout params={params}>
      <AcademyHomePage params={params} />
    </PublicLayout>
  )
}
