import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programNoticeService } from '@/lib/services/program-notice.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { formatProgramNoticeDetail, programNoticeTypeBadgeClass, programNoticeTypeLabels } from '@/lib/program-notice-labels'
import { getKoreaDateParts } from '@/lib/utils/korea-time'
import { deleteProgramNoticeAction } from './actions'
import { ProgramNoticeForm } from './program-notice-form'

type ProgramNoticesPageProps = {
  params: Promise<{ slug: string; id: string }>
}

function getTodayStr() {
  const { day, month, year } = getKoreaDateParts(new Date())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default async function ProgramNoticesPage({ params }: ProgramNoticesPageProps) {
  const { slug, id } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)

  const notices = await programNoticeService.getProgramNotices(academy.id, program.id)
  const today = getTodayStr()

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 xl:grid-cols-[1fr_380px]">
      <section>
        <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
          ← 수업 상세
        </a>
        <h1 className="mb-4 text-2xl font-bold">{program.title} 공지</h1>
        <div className="space-y-3">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-lg border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${programNoticeTypeBadgeClass[notice.type]}`}>
                      {programNoticeTypeLabels[notice.type]}
                    </span>
                    <span className="font-medium">{notice.title}</span>
                    {!notice.isVisible && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">비공개</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{formatProgramNoticeDetail(notice)}</p>
                  {notice.content && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{notice.content}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{notice.author.name} · {notice.createdAt.toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    className="rounded border px-3 py-1 text-sm"
                    href={`/admin/${slug}/programs/${program.id}/notices/${notice.id}/edit`}
                  >
                    수정
                  </a>
                  <form action={deleteProgramNoticeAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="id" value={notice.id} />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm text-red-700" message="이 공지를 삭제할까요?">
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
          {notices.length === 0 && (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 공지가 없습니다.</div>
          )}
        </div>
      </section>
      <aside className="space-y-6">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">공지 추가</h2>
          <ProgramNoticeForm
            programId={program.id}
            schedules={program.schedules.filter((s) => s.isActive).map((s) => ({
              id: s.id,
              title: s.title,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            }))}
            slug={slug}
            today={today}
          />
        </div>
      </aside>
    </main>
  )
}
