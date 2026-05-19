import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ProgramFields } from '@/components/admin/program-fields'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { createMyProgramAction, deleteMyProgramAction } from './actions'

type MyTeacherPageProps = {
  params: Promise<{ slug: string }>
}

export default async function MyTeacherPage({ params }: MyTeacherPageProps) {
  const { slug } = await params
  const { academy, user } = await requireMemberPage(slug)

  if (isAcademyAdminRole(user.role)) redirect(`/admin/${slug}`)

  const programs = await programService.getTeacherPrograms(academy.id, user.id)

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">수업 추가</h2>
          <form action={createMyProgramAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <ProgramFields showAdminControls={false} showTeacherSelect={false} />
            <ConfirmSubmitButton
              className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
              message="수업을 저장할까요?"
            >
              저장
            </ConfirmSubmitButton>
          </form>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">내 수업</h2>
        <div className="space-y-4">
          {programs.map((program) => (
            <article key={program.id} className="rounded-lg border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{program.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {programModeLabels[program.mode]} · {targetLevelLabels[program.targetLevel]}
                    {program.subject ? ` · ${program.subject}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/programs/${program.id}`}>
                    상세/시간표
                  </a>
                  <form action={deleteMyProgramAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={program.id} />
                    <ConfirmSubmitButton
                      className="rounded border px-4 py-2 text-sm text-red-700"
                      message="이 수업을 삭제할까요?"
                    >
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
          {programs.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">배정된 수업이 없습니다.</div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
