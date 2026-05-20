'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { programService } from '@/lib/services/program.service'
import { studentService } from '@/lib/services/student.service'
import { testResultService } from '@/lib/services/test-result.service'

export async function createTestResultAction(formData: FormData) {
  const { academy, program, slug, user } = await readContext(formData)
  assertProgramWritable(program, user)
  const studentId = await readEnrolledStudentId(academy.id, program.id, formData)

  await testResultService.createTestResult(academy.id, {
    authorId: user.id,
    programId: program.id,
    studentId,
    ...readTestResultForm(formData),
  })

  revalidateTestResultPaths(slug, program.id)
  redirect(`/admin/${slug}/programs/${program.id}/tests`)
}

export async function updateTestResultAction(formData: FormData) {
  const { academy, program, slug, user } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  assertProgramWritable(program, user)
  const result = await testResultService.getTestResultById(id, academy.id)
  if (result.programId !== program.id) throw new Error('Test result does not belong to this program')
  const studentId = await readEnrolledStudentId(academy.id, program.id, formData)

  await testResultService.updateTestResult(id, academy.id, {
    studentId,
    ...readTestResultForm(formData),
  })

  revalidateTestResultPaths(slug, program.id)
  redirect(`/admin/${slug}/programs/${program.id}/tests`)
}

export async function deleteTestResultAction(formData: FormData) {
  const { academy, program, slug, user } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  assertProgramWritable(program, user)
  const result = await testResultService.getTestResultById(id, academy.id)
  if (result.programId !== program.id) throw new Error('Test result does not belong to this program')

  await testResultService.deleteTestResult(id, academy.id)

  revalidateTestResultPaths(slug, program.id)
  redirect(`/admin/${slug}/programs/${program.id}/tests`)
}

async function readContext(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)
  const program = await programService.getProgramById(programId, academy.id)
  return { academy, program, slug, user }
}

function assertProgramWritable(
  program: Awaited<ReturnType<typeof programService.getProgramById>>,
  user: { id: string; role: string },
) {
  void program
  void user
}

async function readEnrolledStudentId(academyId: string, programId: string, formData: FormData) {
  const studentId = String(formData.get('studentId') ?? '').trim()
  if (!studentId) throw new Error('Student is required')

  const student = await studentService.getStudentById(studentId, academyId)
  const isEnrolled = student.enrollments.some((enrollment) => enrollment.programId === programId && enrollment.status === 'ACTIVE')
  if (!isEnrolled) throw new Error('Student is not enrolled in this program')

  return studentId
}

function readTestResultForm(formData: FormData) {
  return {
    testName: String(formData.get('testName') ?? ''),
    score: String(formData.get('score') ?? ''),
    testedAt: new Date(String(formData.get('testedAt') ?? '')),
    memo: String(formData.get('memo') ?? '') || undefined,
    isVisible: formData.get('isVisible') === 'true',
  }
}

function revalidateTestResultPaths(slug: string, programId: string) {
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/tests`)
  revalidatePath(`/admin/${slug}/programs/${programId}`)
  revalidatePath(`/admin/${slug}/programs/${programId}/tests`)
  revalidatePath(`/student/${slug}`)
  revalidatePath(`/student/${slug}/tests`)
}
