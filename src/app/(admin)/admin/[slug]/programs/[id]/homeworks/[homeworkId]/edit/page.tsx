import { notFound, redirect } from 'next/navigation'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { homeworkService } from '@/lib/services/homework.service'
import { programService } from '@/lib/services/program.service'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { HomeworkEditForm } from './homework-edit-form'

type EditHomeworkPageProps = {
  params: Promise<{ slug: string; id: string; homeworkId: string }>
}

export default async function EditHomeworkPage({ params }: EditHomeworkPageProps) {
  const { slug, id, homeworkId } = await params
  const { academy, user } = await requireMemberPage(slug)
  const program = await programService.getProgramById(id, academy.id)
  if (!isAcademyAdminRole(user.role) && program.teacher?.userId !== user.id) redirect(`/admin/${slug}/my`)
  const [homework, students] = await Promise.all([
    homeworkService.getHomeworkById(homeworkId, academy.id).catch(() => null),
    studentService.getAdminStudents(academy.id),
  ])
  if (!homework || homework.programId !== program.id) notFound()
  const enrolledStudents = students.filter((student) =>
    student.enrollments.some((enrollment) => enrollment.programId === program.id && enrollment.status === 'ACTIVE'),
  )

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/programs/${program.id}/homeworks`}>
        ← 숙제 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">숙제 수정</h1>
        <HomeworkEditForm
          enrolledStudents={enrolledStudents.map((s) => ({ id: s.id, name: s.name }))}
          homeworkId={homework.id}
          initialContent={homework.content}
          initialDueDate={formatDateInput(homework.dueDate)}
          initialIsCompleted={homework.isCompleted}
          initialIsVisible={homework.isVisible}
          initialStartDate={formatDateInput(homework.startDate)}
          initialStudentId={homework.studentId ?? ''}
          initialTitle={homework.title}
          programId={program.id}
          slug={slug}
        />
      </section>
    </main>
  )
}

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : ''
}
