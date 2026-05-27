import { programService } from '@/lib/services/program.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { ProgramTabs } from '@/components/public/program-tabs'

type ProgramsPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ProgramsPage({ params }: ProgramsPageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const programs = await programService.getPublicPrograms(academy.id)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">수업 안내</div>
          <h1 className="pub-page-title">수업 안내</h1>
          <p className="pub-page-subtitle">
            내신 기간에는 학교별 수업, 비내신 기간에는 수준별 수업으로 운영합니다.
          </p>
        </div>
      </div>

      <div className="pub-page-content">
        <ProgramTabs programs={programs} slug={slug} />
      </div>
    </>
  )
}
