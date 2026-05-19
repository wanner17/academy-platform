import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ProgramFields } from '@/components/admin/program-fields'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programService } from '@/lib/services/program.service'
import { teacherService } from '@/lib/services/teacher.service'
import { requireMemberPage } from '@/lib/auth/server'
import { updateProgramInfoAction } from '../actions'

type EditProgramPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function EditProgramPage({ params }: EditProgramPageProps) {
  const { slug, id } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  const isAdmin = isAcademyAdminRole(user.role)
  const canManage = isAdmin || program.teacher?.userId === user.id

  if (!canManage) redirect(`/admin/${slug}/my`)

  const teachers = isAdmin ? await teacherService.getAdminTeachers(academy.id) : []

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}`}>
        시간표로 돌아가기
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">수업 정보 수정</h1>
        <form action={updateProgramInfoAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="programId" value={program.id} />
          <ProgramFields
            defaults={program}
            showAdminControls={isAdmin}
            showTeacherSelect={isAdmin}
            teachers={teachers}
          />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="수업 정보를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
