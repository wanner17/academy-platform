import type { ProgramMode, TargetLevel } from '@prisma/client'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { programService } from '@/lib/services/program.service'
import { teacherService } from '@/lib/services/teacher.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { deleteProgramAction } from './actions'
import { requireAdminPage } from '@/lib/auth/server'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'

type AdminProgramsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    active?: string
    mode?: string
    q?: string
    subject?: string
    targetLevel?: string
    teacherId?: string
  }>
}

const modes: ProgramMode[] = ['SCHOOL_EXAM', 'LEVEL']
const targetLevels: TargetLevel[] = ['ELEMENTARY', 'MIDDLE', 'HIGH']

export default async function AdminProgramsPage({ params, searchParams }: AdminProgramsPageProps) {
  const { slug } = await params
  const filters = await searchParams
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const allPrograms = await programService.getAdminPrograms(academy.id)
  const teachers = await teacherService.getAdminTeachers(academy.id)
  const selectedMode = modes.includes(filters.mode as ProgramMode) ? (filters.mode as ProgramMode) : undefined
  const selectedTargetLevel = targetLevels.includes(filters.targetLevel as TargetLevel)
    ? (filters.targetLevel as TargetLevel)
    : undefined
  const selectedActive = filters.active === 'true' ? true : filters.active === 'false' ? false : undefined
  const selectedSubject = filters.subject?.trim() || undefined
  const selectedTeacherId = filters.teacherId?.trim() || undefined
  const query = filters.q?.trim() || undefined
  const programs = await programService.getAdminPrograms(academy.id, {
    isActive: selectedActive,
    mode: selectedMode,
    query,
    subject: selectedSubject,
    targetLevel: selectedTargetLevel,
    teacherId: selectedTeacherId,
  })
  const subjects = Array.from(new Set(allPrograms.map((program) => program.subject).filter(isString))).sort((left, right) =>
    left.localeCompare(right, 'ko-KR'),
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">수업 관리</h1>
          <p className="mt-1 text-sm text-slate-600">수업을 리스트로 확인하고 조건별로 필터링합니다.</p>
        </div>
        <a className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" href={`/admin/${slug}/programs/new`}>
          수업 등록
        </a>
      </div>
        <section className="mb-6 rounded-lg border bg-white p-4">
          <form className="grid gap-3 md:grid-cols-3" method="get">
            <label className="block md:col-span-3">
              <span className="mb-1 block text-sm font-medium">검색</span>
              <input
                className="w-full rounded border px-3 py-2"
                defaultValue={query ?? ''}
                name="q"
                placeholder="수업명, 학교명, 학년, 과목, 설명"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">구분</span>
              <select className="w-full rounded border px-3 py-2" defaultValue={selectedMode ?? ''} name="mode">
                <option value="">전체</option>
                {modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {programModeLabels[mode]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">대상</span>
              <select className="w-full rounded border px-3 py-2" defaultValue={selectedTargetLevel ?? ''} name="targetLevel">
                <option value="">전체</option>
                {targetLevels.map((targetLevel) => (
                  <option key={targetLevel} value={targetLevel}>
                    {targetLevelLabels[targetLevel]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">공개</span>
              <select className="w-full rounded border px-3 py-2" defaultValue={filters.active ?? ''} name="active">
                <option value="">전체</option>
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">과목</span>
              <select className="w-full rounded border px-3 py-2" defaultValue={selectedSubject ?? ''} name="subject">
                <option value="">전체</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">담당 강사</span>
              <select className="w-full rounded border px-3 py-2" defaultValue={selectedTeacherId ?? ''} name="teacherId">
                <option value="">전체</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
                조회
              </button>
              <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/programs`}>
                초기화
              </a>
            </div>
          </form>
          <p className="mt-3 text-sm text-slate-500">총 {programs.length}개</p>
        </section>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">수업명</th>
                <th className="px-4 py-3 font-medium">구분</th>
                <th className="px-4 py-3 font-medium">대상</th>
                <th className="px-4 py-3 font-medium">과목</th>
                <th className="px-4 py-3 font-medium">담당 강사</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {programs.map((program) => (
                <tr key={program.id}>
                  <td className="px-4 py-3 font-medium">{program.title}</td>
                  <td className="px-4 py-3">{programModeLabels[program.mode]}</td>
                  <td className="px-4 py-3">{targetLevelLabels[program.targetLevel]}</td>
                  <td className="px-4 py-3">{program.subject ?? '-'}</td>
                  <td className="px-4 py-3">{program.teacher?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    {program.isActive ? (
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">공개</span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">비공개</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a className="rounded border px-3 py-1" href={`/admin/${slug}/programs/${program.id}`}>
                        상세
                      </a>
                      <a className="rounded border px-3 py-1" href={`/admin/${slug}/programs/${program.id}/edit`}>
                        수정
                      </a>
                      <form action={deleteProgramAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="id" value={program.id} />
                        <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 수업을 삭제할까요?">
                          삭제
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {programs.length === 0 ? <p className="p-4 text-sm text-slate-500">등록된 수업이 없습니다.</p> : null}
        </div>
    </main>
  )
}

function isString(value: string | null): value is string {
  return Boolean(value)
}
