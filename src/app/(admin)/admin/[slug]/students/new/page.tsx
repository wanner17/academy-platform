import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { StudentFields } from '@/components/admin/student-fields'
import { createStudentAction } from '../actions'
import { requireMemberPage } from '@/lib/auth/server'

type NewStudentPageProps = {
  params: Promise<{ slug: string }>
}

export default async function NewStudentPage({ params }: NewStudentPageProps) {
  const { slug } = await params
  await requireMemberPage(slug)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/students`}>
        학생 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">학생 등록</h1>
        <form action={createStudentAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <StudentFields />
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="학생을 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
