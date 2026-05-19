import { getAcademyBySlug } from '@/lib/utils/tenant'
import { teacherService } from '@/lib/services/teacher.service'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import {
  createTeacherAction,
  deleteTeacherAction,
  resetTeacherPasswordAction,
  updateTeacherAction,
} from './actions'
import { requireAdminPage } from '@/lib/auth/server'

type AdminTeachersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminTeachersPage({ params }: AdminTeachersPageProps) {
  const { slug } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const teachers = await teacherService.getAdminTeachers(academy.id)

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">강사진 관리</h1>
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="rounded-lg border bg-white p-5">
              <form action={updateTeacherAction} className="space-y-4">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={teacher.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">이름</span>
                    <input className="w-full rounded border px-3 py-2" defaultValue={teacher.name} name="name" required />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">과목</span>
                    <input className="w-full rounded border px-3 py-2" defaultValue={teacher.subject} name="subject" required />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">소개</span>
                  <textarea className="min-h-24 w-full rounded border px-3 py-2" defaultValue={teacher.bio ?? ''} name="bio" />
                </label>
                <div className="rounded border bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-medium">강사 로그인 계정</p>
                  {teacher.user ? (
                    <p className="text-sm text-slate-600">{teacher.user.email}</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">로그인 이메일</span>
                        <input className="w-full rounded border px-3 py-2" name="loginEmail" type="email" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">임시 비밀번호</span>
                        <input className="w-full rounded border px-3 py-2" minLength={8} name="loginPassword" type="password" />
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">정렬</span>
                    <input className="w-24 rounded border px-3 py-2" defaultValue={teacher.order} name="order" type="number" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input defaultChecked={teacher.isActive} name="isActive" type="checkbox" value="true" />
                    공개
                  </label>
                  <ConfirmSubmitButton
                    className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                    message="강사 정보를 저장할까요?"
                  >
                    저장
                  </ConfirmSubmitButton>
                </div>
              </form>
              <form action={deleteTeacherAction} className="mt-3">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={teacher.id} />
                <ConfirmSubmitButton
                  className="rounded border px-3 py-1 text-sm text-red-700"
                  message="이 강사를 삭제할까요?"
                >
                  삭제
                </ConfirmSubmitButton>
              </form>
              {teacher.user ? (
                <form action={resetTeacherPasswordAction} className="mt-3 flex flex-wrap items-end gap-2 rounded border bg-slate-50 p-3">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={teacher.id} />
                  <label className="block grow">
                    <span className="mb-1 block text-sm font-medium">새 임시 비밀번호</span>
                    <input className="w-full rounded border px-3 py-2" minLength={8} name="newPassword" required type="password" />
                  </label>
                  <ConfirmSubmitButton
                    className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white"
                    message="강사 비밀번호를 초기화할까요?"
                  >
                    비밀번호 초기화
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </article>
          ))}
          {teachers.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 강사가 없습니다.</div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">강사 추가</h2>
        <form action={createTeacherAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">이름</span>
            <input className="w-full rounded border px-3 py-2" name="name" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">과목</span>
            <input className="w-full rounded border px-3 py-2" name="subject" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">소개</span>
            <textarea className="min-h-32 w-full rounded border px-3 py-2" name="bio" />
          </label>
          <div className="rounded border bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium">강사 로그인 계정</p>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">로그인 이메일</span>
                <input className="w-full rounded border px-3 py-2" name="loginEmail" type="email" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">임시 비밀번호</span>
                <input className="w-full rounded border px-3 py-2" minLength={8} name="loginPassword" type="password" />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">정렬</span>
              <input className="w-24 rounded border px-3 py-2" defaultValue={0} name="order" type="number" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked name="isActive" type="checkbox" value="true" />
              공개
            </label>
          </div>
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="강사를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
