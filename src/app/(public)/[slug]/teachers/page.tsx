import { getAcademyBySlug } from '@/lib/utils/tenant'
import { teacherService } from '@/lib/services/teacher.service'

type TeachersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TeachersPage({ params }: TeachersPageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const teachers = await teacherService.getPublicTeachers(academy.id)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">강사진</h1>
      <p className="mb-6 text-slate-600">학생을 지도하는 선생님들을 소개합니다.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {teachers.map((teacher) => (
          <article key={teacher.id} className="rounded-lg border bg-white p-5">
            <p className="mb-2 text-sm font-medium text-blue-700">{teacher.subject}</p>
            <h2 className="mb-3 text-xl font-semibold">{teacher.name}</h2>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {teacher.bio || '소개를 준비 중입니다.'}
            </p>
          </article>
        ))}
        {teachers.length === 0 ? (
          <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">등록된 강사진이 없습니다.</div>
        ) : null}
      </div>
    </main>
  )
}
