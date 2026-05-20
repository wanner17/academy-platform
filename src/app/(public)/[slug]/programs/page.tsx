import type { Program, ProgramMode } from '@prisma/client'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { programService } from '@/lib/services/program.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'

type ProgramsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ subject?: string }>
}

const sections: ProgramMode[] = ['SCHOOL_EXAM', 'LEVEL']

export default async function ProgramsPage({ params, searchParams }: ProgramsPageProps) {
  const { slug } = await params
  const { subject } = await searchParams
  const academy = await getAcademyBySlug(slug)
  const programs = await programService.getPublicPrograms(academy.id)
  const subjects = getSubjects(programs)
  const selectedSubject = subject && subjects.includes(subject) ? subject : undefined
  const visiblePrograms = selectedSubject
    ? programs.filter((p) => p.subject === selectedSubject)
    : programs

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">CURRICULUM</div>
          <h1 className="pub-page-title">수업 안내</h1>
          <p className="pub-page-subtitle">
            내신 기간에는 학교별 수업, 비내신 기간에는 수준별 수업으로 운영합니다.
          </p>
        </div>
      </div>

      <div className="pub-page-content">
        {subjects.length > 0 && (
          <nav className="pub-filter-nav" aria-label="과목 필터">
            <a
              className={`pub-filter-btn${!selectedSubject ? ' active' : ''}`}
              href={`/${slug}/programs`}
            >
              ALL
            </a>
            {subjects.map((item) => (
              <a
                className={`pub-filter-btn${selectedSubject === item ? ' active' : ''}`}
                href={`/${slug}/programs?subject=${encodeURIComponent(item)}`}
                key={item}
              >
                {item.toUpperCase()}
              </a>
            ))}
          </nav>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {sections.map((mode) => {
            const modePrograms = visiblePrograms.filter((p) => p.mode === mode)
            if (modePrograms.length === 0) return null
            return (
              <section key={mode}>
                <div style={{ marginBottom: 36 }}>
                  <div className="pub-label">{programModeLabels[mode].toUpperCase()}</div>
                </div>
                <ProgramGrid programs={modePrograms} slug={slug} />
              </section>
            )
          })}
        </div>

        {visiblePrograms.length === 0 && (
          <div className="pub-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>등록된 수업이 없습니다.</p>
          </div>
        )}
      </div>
    </>
  )
}

function getSubjects(programs: Program[]) {
  return Array.from(new Set(programs.map((p) => p.subject).filter(isSubject))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  )
}

function isSubject(value: string | null): value is string {
  return Boolean(value)
}

function ProgramGrid({ programs, slug }: { programs: Program[]; slug: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
      {programs.map((program) => (
        <article key={program.id} className="pub-card">
          <div>
            <span className="pub-card-tag">{targetLevelLabels[program.targetLevel]}</span>
            {program.subject ? (
              <span className="pub-card-tag muted">{program.subject}</span>
            ) : null}
            {program.schoolName ? (
              <span className="pub-card-tag muted">{program.schoolName}</span>
            ) : null}
            {program.grade ? (
              <span className="pub-card-tag muted">{program.grade}</span>
            ) : null}
          </div>
          <h3 className="pub-card-title">{program.title}</h3>
          <p className="pub-card-body">
            {program.description || '수업 설명을 준비 중입니다.'}
          </p>
          <a className="pub-card-link" href={`/${slug}/programs/${program.id}`}>
            상세 / 시간표 →
          </a>
        </article>
      ))}
    </div>
  )
}
