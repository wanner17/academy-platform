import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { StudentFields } from '@/components/admin/student-fields'
import { createStudentAction } from '../actions'
import { requireMemberPage } from '@/lib/auth/server'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { studentService } from '@/lib/services/student.service'

type NewStudentPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function NewStudentPage({ params, searchParams }: NewStudentPageProps) {
  const { slug } = await params
  const { error } = await searchParams
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const schools = await studentService.getDistinctSchools(academy.id)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/students`}>
        학생 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">학생 등록</h1>
        {error ? (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        <form action={createStudentAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <StudentFields schools={schools} />
          <ConfirmSubmitButton className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white" message="학생을 저장할까요?">
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
