import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireAdminPage } from '@/lib/auth/server'
import { teacherService } from '@/lib/services/teacher.service'
import { deleteTeacherAction } from './actions'
import { stripHtml } from '@/lib/utils/html'

type AdminTeachersPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ active?: string; q?: string; subject?: string }>
}

export default async function AdminTeachersPage({ params, searchParams }: AdminTeachersPageProps) {
  const { slug } = await params
  const filters = await searchParams
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const allTeachers = await teacherService.getAdminTeachers(academy.id)
  const query = filters.q?.trim().toLowerCase() || ''
  const selectedSubject = filters.subject?.trim() || ''
  const selectedActive = filters.active === 'true' ? true : filters.active === 'false' ? false : undefined
  const subjects = Array.from(new Set(allTeachers.map((teacher) => teacher.subject).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  )
  const teachers = allTeachers.filter((teacher) => {
    const matchesQuery = query
      ? [teacher.name, teacher.subject, stripHtml(teacher.bio ?? ''), teacher.user?.email ?? ''].some((value) =>
          value.toLowerCase().includes(query),
        )
      : true
    const matchesSubject = selectedSubject ? teacher.subject === selectedSubject : true
    const matchesActive = selectedActive === undefined ? true : teacher.isActive === selectedActive
    return matchesQuery && matchesSubject && matchesActive
  })

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">강사진 관리</h1>
          <p className="mt-1 text-sm text-slate-600">강사 정보를 리스트로 관리합니다.</p>
        </div>
        <a className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" href={`/admin/${slug}/teachers/new`}>
          강사 등록
        </a>
      </div>
      <section className="mb-6 rounded-lg border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">검색</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={filters.q ?? ''} name="q" placeholder="이름, 과목, 소개, 이메일" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">과목</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={selectedSubject} name="subject">
              <option value="">전체</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
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
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              조회
            </button>
            <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/teachers`}>
              초기화
            </a>
          </div>
        </form>
        <p className="mt-3 text-sm text-slate-500">총 {teachers.length}명</p>
      </section>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">과목</th>
              <th className="px-4 py-3 font-medium">로그인 계정</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-4 py-3 font-medium">{teacher.name}</td>
                <td className="px-4 py-3">{teacher.subject}</td>
                <td className="px-4 py-3">{teacher.user?.email ?? '-'}</td>
                <td className="px-4 py-3">
                  {teacher.isActive ? (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">공개</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">비공개</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a className="rounded border px-3 py-1" href={`/admin/${slug}/teachers/${teacher.id}/edit`}>
                      수정
                    </a>
                    <form action={deleteTeacherAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={teacher.id} />
                      <ConfirmSubmitButton className="rounded border px-3 py-1 text-red-700" message="이 강사를 삭제할까요?">
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 ? <p className="p-4 text-sm text-slate-500">등록된 강사가 없습니다.</p> : null}
      </div>
    </main>
  )
}
