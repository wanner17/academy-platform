import { notFound } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { TeacherFields } from '@/components/admin/teacher-fields'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireAdminPage } from '@/lib/auth/server'
import { teacherService } from '@/lib/services/teacher.service'
import { resetTeacherPasswordAction, updateTeacherAction } from '../../actions'

type EditTeacherPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function EditTeacherPage({ params }: EditTeacherPageProps) {
  const { slug, id } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const teacher = await teacherService.getTeacherById(id, academy.id).catch(() => null)
  if (!teacher) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/teachers`}>
        강사진 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">강사 수정</h1>
        <form action={updateTeacherAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="id" value={teacher.id} />
          <TeacherFields defaults={teacher} slug={slug} />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="강사 정보를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
        {teacher.user ? (
          <form action={resetTeacherPasswordAction} className="mt-6 flex flex-wrap items-end gap-2 border-t pt-5">
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
      </section>
    </main>
  )
}
