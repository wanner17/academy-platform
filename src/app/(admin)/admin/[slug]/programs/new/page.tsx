import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ProgramFields } from '@/components/admin/program-fields'
import { createProgramAction } from '../actions'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireAdminPage } from '@/lib/auth/server'
import { teacherService } from '@/lib/services/teacher.service'

type NewProgramPageProps = {
  params: Promise<{ slug: string }>
}

export default async function NewProgramPage({ params }: NewProgramPageProps) {
  const { slug } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const teachers = await teacherService.getAdminTeachers(academy.id)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs`}>
        수업 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">수업 등록</h1>
        <form action={createProgramAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <ProgramFields teachers={teachers} />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="수업을 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
