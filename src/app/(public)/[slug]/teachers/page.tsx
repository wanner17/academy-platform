import { getAcademyBySlug } from '@/lib/utils/tenant'
import { TeacherCard } from '@/components/public/teacher-card'
import { teacherService } from '@/lib/services/teacher.service'
import { publicPath } from '@/lib/utils/public-path'

type TeachersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TeachersPage({ params }: TeachersPageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const teachers = await teacherService.getPublicTeachers(academy.id)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">THE FACULTY</div>
          <h1 className="pub-page-title">강사진</h1>
          <p className="pub-page-subtitle">학생을 지도하는 전문 선생님들을 소개합니다.</p>
        </div>
      </div>

      <div className="pub-page-content">
        {teachers.length > 0 ? (
          <div className="pub-instructors">
            {teachers.map((teacher) => (
              <TeacherCard href={publicPath(slug, `/teachers/${teacher.id}`)} key={teacher.id} teacher={teacher} titleLevel="h2" />
            ))}
          </div>
        ) : (
          <div className="pub-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>등록된 강사진이 없습니다.</p>
          </div>
        )}
      </div>
    </>
  )
}
