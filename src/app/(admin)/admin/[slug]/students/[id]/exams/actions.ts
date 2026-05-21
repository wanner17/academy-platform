'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { studentService } from '@/lib/services/student.service'
import { schoolExamService } from '@/lib/services/school-exam.service'

export async function createSchoolExamAction(formData: FormData) {
  const { academy, slug, studentId, schoolYear } = await readContext(formData)
  await schoolExamService.create(academy.id, { studentId, ...readExamForm(formData, schoolYear) })
  revalidateExamPaths(slug, studentId)
  redirect(`/admin/${slug}/students/${studentId}`)
}

export async function updateSchoolExamAction(formData: FormData) {
  const { academy, slug, studentId, schoolYear } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  await schoolExamService.update(id, academy.id, readExamForm(formData, schoolYear))
  revalidateExamPaths(slug, studentId)
  redirect(`/admin/${slug}/students/${studentId}`)
}

export async function deleteSchoolExamAction(formData: FormData) {
  const { academy, slug, studentId } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  await schoolExamService.delete(id, academy.id)
  revalidateExamPaths(slug, studentId)
  redirect(`/admin/${slug}/students/${studentId}`)
}

async function readContext(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const studentId = String(formData.get('studentId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyMember(session, slug)
  const student = await studentService.getStudentById(studentId, academy.id)
  return { academy, slug, studentId, schoolYear: parseGradeToYear(student.grade) }
}

function readExamForm(formData: FormData, schoolYear: number | null) {
  const scoreRaw = formData.get('score')
  const gradeRaw = formData.get('grade')
  return {
    examType: String(formData.get('examType') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    score: scoreRaw ? Number(scoreRaw) : null,
    grade: gradeRaw ? Number(gradeRaw) : null,
    examYear: Number(formData.get('examYear') ?? new Date().getFullYear()),
    semester: Number(formData.get('semester') ?? 1),
    schoolYear,
    memo: String(formData.get('memo') ?? '') || undefined,
  }
}

function parseGradeToYear(grade: string | null | undefined): number | null {
  if (!grade) return null
  const match = grade.match(/\d+/)
  if (!match) return null
  const num = parseInt(match[0])
  return num >= 1 && num <= 3 ? num : null
}

function revalidateExamPaths(slug: string, studentId: string) {
  revalidatePath(`/admin/${slug}/students`)
  revalidatePath(`/admin/${slug}/students/${studentId}`)
  revalidatePath(`/admin/${slug}/analytics`)
}
