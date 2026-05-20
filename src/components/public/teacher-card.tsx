type TeacherCardProps = {
  href: string
  teacher: {
    id: string
    name: string
    profileImageUrl?: string | null
    subject: string | null
  }
  titleLevel?: 'h2' | 'h3'
}

export function TeacherCard({ href, teacher, titleLevel = 'h3' }: TeacherCardProps) {
  const Heading = titleLevel

  return (
    <article className="pub-teacher-card">
      {teacher.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`${teacher.name} 프로필`} className="pub-teacher-img" src={teacher.profileImageUrl} />
      ) : (
        <div className="pub-teacher-placeholder">👤</div>
      )}
      <div className="pub-role">{teacher.subject?.toUpperCase() ?? 'INSTRUCTOR'}</div>
      <Heading className="pub-teacher-name">{teacher.name}</Heading>
      <a className="pub-teacher-detail-link" href={href}>상세보기</a>
    </article>
  )
}
