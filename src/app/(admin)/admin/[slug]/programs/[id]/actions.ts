'use server'

import type { ProgramMode, TargetLevel } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAcademyAdminRole, requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { homeworkService } from '@/lib/services/homework.service'
import { progressService } from '@/lib/services/progress.service'
import { programService } from '@/lib/services/program.service'
import { scheduleService } from '@/lib/services/schedule.service'
import { studentService } from '@/lib/services/student.service'

export async function updateProgramInfoAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  const isAdmin = isAcademyAdminRole(user.role)
  assertProgramWritable(program, user)

  await programService.updateProgram(programId, academy.id, {
    title: String(formData.get('title') ?? ''),
    teacherId: isAdmin ? String(formData.get('teacherId') ?? '') : program.teacherId ?? undefined,
    mode: String(formData.get('mode') ?? 'SCHOOL_EXAM') as ProgramMode,
    targetLevel: String(formData.get('targetLevel') ?? 'MIDDLE') as TargetLevel,
    schoolName: String(formData.get('schoolName') ?? ''),
    grade: String(formData.get('grade') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    description: String(formData.get('description') ?? ''),
    order: isAdmin ? Number(formData.get('order') ?? 0) : program.order,
    isActive: isAdmin ? formData.get('isActive') === 'true' : program.isActive,
  })

  revalidateProgramSchedulePaths(slug, programId)
  revalidatePath(`/admin/${slug}/programs`)
  redirect(`/admin/${slug}/programs/${programId}`)
}

export async function createProgramScheduleAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)

  await scheduleService.createSchedule(academy.id, readScheduleForm(formData, programId))

  revalidateProgramSchedulePaths(slug, programId)
  redirect(`/admin/${slug}/programs/${programId}/schedule`)
}

export async function updateProgramScheduleAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const scheduleId = String(formData.get('id') ?? '')
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)
  const schedule = await scheduleService.getScheduleById(scheduleId, academy.id)
  if (schedule.programId !== programId) throw new Error('Schedule does not belong to this program')

  await scheduleService.updateSchedule(scheduleId, academy.id, readScheduleForm(formData, programId))

  revalidateProgramSchedulePaths(slug, programId)
  redirect(`/admin/${slug}/programs/${programId}/schedule`)
}

export async function deleteProgramScheduleAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const scheduleId = String(formData.get('id') ?? '')
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)
  const schedule = await scheduleService.getScheduleById(scheduleId, academy.id)
  if (schedule.programId !== programId) throw new Error('Schedule does not belong to this program')

  await scheduleService.deleteSchedule(scheduleId, academy.id)

  revalidateProgramSchedulePaths(slug, programId)
  redirect(`/admin/${slug}/programs/${programId}/schedule`)
}

async function readProgramScheduleContext(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const programId = String(formData.get('programId') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)
  return { slug, programId, academy, user }
}

function assertProgramWritable(
  program: Awaited<ReturnType<typeof programService.getProgramById>>,
  user: { id: string; role: string },
) {
  if (isAcademyAdminRole(user.role)) return
  if (program.teacher?.userId === user.id) return
  throw new Error('Forbidden')
}

function readScheduleForm(formData: FormData, programId: string) {
  return {
    programId,
    title: String(formData.get('title') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    teacher: String(formData.get('teacher') ?? ''),
    room: String(formData.get('room') ?? ''),
    dayOfWeek: Number(formData.get('dayOfWeek') ?? 0),
    startTime: String(formData.get('startTime') ?? ''),
    endTime: String(formData.get('endTime') ?? ''),
    color: String(formData.get('color') ?? ''),
    isActive: formData.get('isActive') === 'true',
  }
}

function revalidateProgramSchedulePaths(slug: string, programId: string) {
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/programs`)
  revalidatePath(`/${slug}/programs/${programId}`)
  revalidatePath(`/${slug}/schedule`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/schedule`)
  revalidatePath(`/admin/${slug}/programs/${programId}`)
}

export async function createHomeworkAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)
  const studentId = await readStudentScope(academy.id, programId, formData)

  await homeworkService.createHomework(academy.id, {
    authorId: user.id,
    programId,
    studentId,
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
    startDate: formData.get('startDate') ? new Date(String(formData.get('startDate'))) : undefined,
    dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : undefined,
    isCompleted: formData.get('isCompleted') === 'true',
    isVisible: formData.get('isVisible') !== 'false',
  })

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/homeworks`)
}

export async function updateHomeworkAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const id = String(formData.get('id') ?? '')
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)
  const homework = await homeworkService.getHomeworkById(id, academy.id)
  if (homework.programId !== programId) throw new Error('Homework does not belong to this program')
  const studentId = await readStudentScope(academy.id, programId, formData)

  await homeworkService.updateHomework(id, academy.id, {
    studentId,
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
    startDate: formData.get('startDate') ? new Date(String(formData.get('startDate'))) : undefined,
    dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : undefined,
    isCompleted: formData.get('isCompleted') === 'true',
    isVisible: formData.get('isVisible') !== 'false',
  })

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/homeworks`)
}

export async function deleteHomeworkAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)

  await homeworkService.deleteHomework(String(formData.get('id') ?? ''), academy.id)

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/homeworks`)
}

export async function createProgressLogAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)
  const studentId = await readStudentScope(academy.id, programId, formData)

  await progressService.createProgressLog(academy.id, {
    authorId: user.id,
    programId,
    studentId,
    classDate: new Date(String(formData.get('classDate') ?? '')),
    content: String(formData.get('content') ?? ''),
    nextPlan: String(formData.get('nextPlan') ?? '') || undefined,
    isVisible: formData.get('isVisible') !== 'false',
  })

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/progress`)
}

export async function updateProgressLogAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const id = String(formData.get('id') ?? '')
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)
  const progressLog = await progressService.getProgressLogById(id, academy.id)
  if (progressLog.programId !== programId) throw new Error('Progress log does not belong to this program')
  const studentId = await readStudentScope(academy.id, programId, formData)

  await progressService.updateProgressLog(id, academy.id, {
    studentId,
    classDate: new Date(String(formData.get('classDate') ?? '')),
    content: String(formData.get('content') ?? ''),
    nextPlan: String(formData.get('nextPlan') ?? '') || undefined,
    isVisible: formData.get('isVisible') !== 'false',
  })

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/progress`)
}

export async function deleteProgressLogAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)

  await progressService.deleteProgressLog(String(formData.get('id') ?? ''), academy.id)

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/progress`)
}

type BulkHomeworkRow = {
  title: string
  content: string
  studentName?: string
  startDate?: string
  dueDate?: string
  isCompleted?: boolean
  isVisible?: boolean
}

export async function bulkCreateHomeworksAction(formData: FormData) {
  const { slug, programId, academy, user } = await readProgramScheduleContext(formData)
  const program = await programService.getProgramById(programId, academy.id)
  assertProgramWritable(program, user)

  const rowsJson = String(formData.get('rows') ?? '[]')
  const rows: BulkHomeworkRow[] = JSON.parse(rowsJson)
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('행 데이터가 없습니다')

  const students = await studentService.getAdminStudents(academy.id)
  const enrolledStudents = students.filter((s) =>
    s.enrollments.some((e) => e.programId === programId && e.status === 'ACTIVE'),
  )

  await Promise.all(
    rows.map(async (row) => {
      let studentId: string | undefined
      if (row.studentName?.trim()) {
        const matched = enrolledStudents.find((s) => s.name === row.studentName!.trim())
        if (!matched) throw new Error(`학생을 찾을 수 없습니다: ${row.studentName}`)
        studentId = matched.id
      }
      await homeworkService.createHomework(academy.id, {
        authorId: user.id,
        programId,
        studentId,
        title: row.title,
        content: row.content,
        startDate: row.startDate ? new Date(row.startDate) : undefined,
        dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
        isCompleted: row.isCompleted ?? false,
        isVisible: row.isVisible ?? true,
      })
    }),
  )

  revalidatePath(`/admin/${slug}/programs/${programId}`)
  redirect(`/admin/${slug}/programs/${programId}/homeworks`)
}

async function readStudentScope(academyId: string, programId: string, formData: FormData) {
  const studentId = String(formData.get('studentId') ?? '').trim()
  if (!studentId) return undefined

  const student = await studentService.getStudentById(studentId, academyId)
  const isEnrolled = student.enrollments.some((enrollment) => enrollment.programId === programId && enrollment.status === 'ACTIVE')
  if (!isEnrolled) throw new Error('Student is not enrolled in this program')

  return studentId
}
