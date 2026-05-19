import type { Session } from 'next-auth'
import { getAcademyBySlug } from '@/lib/utils/tenant'

export async function requireAcademyAdmin(session: Session | null, slug: string) {
  if (!session?.user) throw new Error('Unauthorized')

  const academy = await getAcademyBySlug(slug)
  const role = session.user.role
  const academyId = session.user.academyId

  if (role === 'SUPER_ADMIN') return { academy, user: session.user }
  if ((role === 'ADMIN' || role === 'STAFF') && academyId === academy.id) {
    return { academy, user: session.user }
  }

  throw new Error('Forbidden')
}

export async function requireAcademyMember(session: Session | null, slug: string) {
  if (!session?.user) throw new Error('Unauthorized')

  const academy = await getAcademyBySlug(slug)
  const role = session.user.role
  const academyId = session.user.academyId

  if (role === 'SUPER_ADMIN') return { academy, user: session.user }
  if ((role === 'ADMIN' || role === 'STAFF' || role === 'TEACHER') && academyId === academy.id) {
    return { academy, user: session.user }
  }

  throw new Error('Forbidden')
}

export async function requireAcademyStudent(session: Session | null, slug: string) {
  if (!session?.user) throw new Error('Unauthorized')

  const academy = await getAcademyBySlug(slug)
  const role = session.user.role
  const academyId = session.user.academyId

  if (role === 'STUDENT' && academyId === academy.id) {
    return { academy, user: session.user }
  }

  throw new Error('Forbidden')
}

export function isAcademyAdminRole(role: string) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'STAFF'
}
