import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { TeacherFields } from '@/components/admin/teacher-fields'
import { createTeacherAction } from '../actions'
import { requireAdminPage } from '@/lib/auth/server'

type NewTeacherPageProps = {
  params: Promise<{ slug: string }>
}

export default async function NewTeacherPage({ params }: NewTeacherPageProps) {
  const { slug } = await params
  await requireAdminPage(slug)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/teachers`}>
        ← 강사진 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">강사 등록</h1>
        <form action={createTeacherAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <TeacherFields slug={slug} />
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
