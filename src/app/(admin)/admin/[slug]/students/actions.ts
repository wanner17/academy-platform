'use server'

import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { prisma } from '@/lib/db/prisma'
import { authConfig } from '@/lib/integrations/auth/config'
import { programService } from '@/lib/services/program.service'
import { studentService } from '@/lib/services/student.service'

export async function createStudentAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  const studentUserId = await createStudentUserIfRequested(academy.id, formData)

  await studentService.createStudent(academy.id, readStudentForm(formData, studentUserId))

  revalidateStudentPaths(slug)
  redirect(`/admin/${slug}/students`)
}

export async function updateStudentAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  const student = await studentService.getStudentById(id, academy.id)
  const studentUserId = student.userId ?? (await createStudentUserIfRequested(academy.id, formData))

  await studentService.updateStudent(id, academy.id, readStudentForm(formData, studentUserId))

  revalidateStudentPaths(slug)
  redirect(`/admin/${slug}/students`)
}

export async function deleteStudentAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const id = String(formData.get('id') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await studentService.deleteStudent(id, academy.id)

  revalidateStudentPaths(slug)
  redirect(`/admin/${slug}/students`)
}

export async function addEnrollmentAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const studentId = String(formData.get('studentId') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  await programService.getProgramById(programId, academy.id)

  await studentService.addEnrollment(academy.id, studentId, programId)

  revalidateStudentPaths(slug)
  redirect(`/admin/${slug}/students`)
}

export async function removeEnrollmentAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const studentId = String(formData.get('studentId') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  await studentService.removeEnrollment(academy.id, studentId, programId)

  revalidateStudentPaths(slug)
  redirect(`/admin/${slug}/students`)
}

async function createStudentUserIfRequested(academyId: string, formData: FormData) {
  const email = String(formData.get('loginEmail') ?? '').toLowerCase().trim()
  const password = String(formData.get('loginPassword') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  if (!email && !password) return undefined
  if (!email || !password) throw new Error('Student login email and password are required together')
  if (password.length < 8) throw new Error('Student password must be at least 8 characters')

  const existing = await prisma.user.findFirst({ where: { academyId, email } })
  if (existing) {
    if (existing.role !== 'STUDENT') throw new Error('This email is already used by another account')
    return existing.id
  }

  const user = await prisma.user.create({
    data: {
      academyId,
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'STUDENT',
    },
  })

  return user.id
}

function readStudentForm(formData: FormData, userId?: string) {
  return {
    userId,
    name: String(formData.get('name') ?? ''),
    schoolName: String(formData.get('schoolName') ?? ''),
    grade: String(formData.get('grade') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    parentPhone: String(formData.get('parentPhone') ?? ''),
    memo: String(formData.get('memo') ?? ''),
    isActive: formData.get('isActive') === 'true',
  }
}

function revalidateStudentPaths(slug: string) {
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/students`)
  revalidatePath(`/student/${slug}`)
}
