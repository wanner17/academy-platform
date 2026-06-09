import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { SmartEditor } from '@/components/admin/smart-editor'
import { requireMemberPage } from '@/lib/auth/server'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { prisma } from '@/lib/db/prisma'
import { dailyQuizService } from '@/lib/services/daily-quiz.service'
import { toKoreaDateKey } from '@/lib/utils/korea-time'
import { stripHtml } from '@/lib/utils/html'
import { createQuizAction, deleteQuizAction } from './actions'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string; programId?: string }>
}

export default async function AdminQuizPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { error, programId: qsProgramId } = await searchParams
  const { academy, user } = await requireMemberPage(slug)
  const isAdmin = isAcademyAdminRole(user.role)

  let programs: { id: string; title: string }[] = []
  if (isAdmin) {
    programs = await prisma.program.findMany({
      where: { academyId: academy.id, isActive: true },
      select: { id: true, title: true },
      orderBy: { order: 'asc' },
    })
  } else {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id, academyId: academy.id },
    })
    if (teacher) {
      programs = await prisma.program.findMany({
        where: { teacherId: teacher.id, isActive: true },
        select: { id: true, title: true },
        orderBy: { order: 'asc' },
      })
    }
  }

  const programId = qsProgramId ?? programs[0]?.id ?? null
  const quizzes = programId ? await dailyQuizService.listQuizzes(programId) : []
  const today = toKoreaDateKey(new Date())

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">퀴즈 관리</h1>
        <p className="mt-1 text-sm text-slate-600">수업별 날짜별 OX 퀴즈를 등록하면 해당 수업 학생 페이지에 표시됩니다.</p>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-slate-700">수업 선택</p>
        {programs.length === 0 ? (
          <p className="text-sm text-slate-500">담당 수업이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {programs.map((p) => (
              <a
                key={p.id}
                href={`/admin/${slug}/quiz?programId=${p.id}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  p.id === programId
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {programId && (
        <>
          <section className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 font-semibold">새 퀴즈 등록</h2>
            <form action={createQuizAction} className="grid gap-4 sm:grid-cols-2">
              <input name="slug" type="hidden" value={slug} />
              <input name="programId" type="hidden" value={programId} />
              <label className="block">
                <span className="mb-1 block text-sm font-medium">날짜</span>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  defaultValue={today}
                  name="date"
                  required
                  type="date"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">정답</span>
                <select className="w-full rounded border px-3 py-2 text-sm" name="answer" required>
                  <option value="true">O (맞다)</option>
                  <option value="false">X (틀리다)</option>
                </select>
              </label>
              <div className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">문제</span>
                <SmartEditor minHeight={160} name="question" slug={slug} />
              </div>
              <div className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">
                  해설 <span className="font-normal text-slate-400">(선택)</span>
                </span>
                <SmartEditor minHeight={120} name="explanation" slug={slug} />
              </div>
              <div className="flex items-center gap-4 sm:col-span-2">
                <button className="rounded bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800" type="submit">
                  등록
                </button>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
              </div>
            </form>
          </section>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <colgroup>
                <col className="w-32" />
                <col />
                <col className="w-16" />
                <col className="w-16" />
                <col className="w-16" />
              </colgroup>
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">날짜</th>
                  <th className="px-4 py-3 font-medium">문제</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">정답</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">참여</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quizzes.map((quiz) => {
                  const dateKey = toKoreaDateKey(quiz.date)
                  return (
                    <tr key={quiz.id} className={dateKey === today ? 'bg-blue-50' : undefined}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {dateKey}
                        {dateKey === today ? (
                          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">오늘</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="line-clamp-2">{stripHtml(quiz.question)}</p>
                        {quiz.explanation ? (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-400">{stripHtml(quiz.explanation)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${quiz.answer ? 'text-emerald-600' : 'text-red-500'}`}>
                          {quiz.answer ? 'O' : 'X'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{quiz._count.attempts}명</td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteQuizAction}>
                          <input name="slug" type="hidden" value={slug} />
                          <input name="id" type="hidden" value={quiz.id} />
                          <input name="programId" type="hidden" value={programId} />
                          <ConfirmSubmitButton
                            className="rounded border px-3 py-1 text-red-700 hover:bg-red-50"
                            message="이 퀴즈를 삭제하면 학생 답변 기록도 모두 삭제됩니다. 계속할까요?"
                          >
                            삭제
                          </ConfirmSubmitButton>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {quizzes.length === 0 ? <p className="p-4 text-sm text-slate-500">등록된 퀴즈가 없습니다.</p> : null}
          </div>
        </>
      )}
    </main>
  )
}
