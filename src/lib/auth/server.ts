import { getServerSession } from 'next-auth'
import { requireAcademyAdmin, requireAcademyMember, requireAcademyStudent } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'

export async function requireAdminPage(slug: string) {
  return requireAcademyAdmin(await getServerSession(authConfig), slug)
}

export async function requireMemberPage(slug: string) {
  return requireAcademyMember(await getServerSession(authConfig), slug)
}

export async function requireStudentPage(slug: string) {
  return requireAcademyStudent(await getServerSession(authConfig), slug)
}
