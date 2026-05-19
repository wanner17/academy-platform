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
    ? programs.filter((program) => program.subject === selectedSubject)
    : programs

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">수업 안내</h1>
      <p className="mb-6 text-slate-600">내신 기간에는 학교별 수업, 비내신 기간에는 수준별 수업으로 운영합니다.</p>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="과목 필터">
        <a
          className={`rounded border px-3 py-2 text-sm font-medium ${!selectedSubject ? 'border-blue-700 bg-blue-700 text-white' : 'bg-white text-slate-700'}`}
          href={`/${slug}/programs`}
        >
          전체
        </a>
        {subjects.map((item) => (
          <a
            className={`rounded border px-3 py-2 text-sm font-medium ${selectedSubject === item ? 'border-blue-700 bg-blue-700 text-white' : 'bg-white text-slate-700'}`}
            href={`/${slug}/programs?subject=${encodeURIComponent(item)}`}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {sections.map((mode) => (
          <section key={mode}>
            <h2 className="mb-4 text-xl font-semibold">{programModeLabels[mode]}</h2>
            <ProgramGrid programs={visiblePrograms.filter((program) => program.mode === mode)} slug={slug} />
          </section>
        ))}
      </div>
    </main>
  )
}

function getSubjects(programs: Program[]) {
  return Array.from(new Set(programs.map((program) => program.subject).filter(isSubject))).sort((left, right) =>
    left.localeCompare(right, 'ko-KR'),
  )
}

function isSubject(value: string | null): value is string {
  return Boolean(value)
}

function ProgramGrid({ programs, slug }: { programs: Program[]; slug: string }) {
  if (programs.length === 0) {
    return <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 수업이 없습니다.</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => (
        <article key={program.id} className="rounded-lg border bg-white p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
              {targetLevelLabels[program.targetLevel]}
            </span>
            {program.subject ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{program.subject}</span> : null}
            {program.schoolName ? (
              <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{program.schoolName}</span>
            ) : null}
            {program.grade ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{program.grade}</span> : null}
          </div>
          <h3 className="mb-3 text-lg font-semibold">{program.title}</h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {program.description || '수업 설명을 준비 중입니다.'}
          </p>
          <a className="mt-4 inline-block rounded border px-4 py-2 text-sm" href={`/${slug}/programs/${program.id}`}>
            상세/시간표
          </a>
        </article>
      ))}
    </div>
  )
}
