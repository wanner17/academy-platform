import { prisma } from '@/lib/db/prisma'

export type CreateHomeworkInput = {
  authorId: string
  content: string
  dueDate?: Date
  isCompleted?: boolean
  isVisible?: boolean
  programId: string
  startDate?: Date
  studentId?: string
  title: string
}

export type UpdateHomeworkInput = Omit<CreateHomeworkInput, 'authorId' | 'programId'>

export const homeworkRepository = {
  findByProgram(academyId: string, programId: string) {
    return prisma.homework.findMany({
      where: { academyId, programId },
      include: { author: true, student: true, completions: { include: { student: true } } },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findVisibleByPrograms(academyId: string, programIds: string[], studentId?: string) {
    return prisma.homework.findMany({
      where: {
        academyId,
        programId: { in: programIds },
        isVisible: true,
        OR: [{ studentId: null }, ...(studentId ? [{ studentId }] : [])],
      },
      include: { program: true, student: true },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findForStudentInMonth(academyId: string, studentId: string, programIds: string[], year: number, monthIndex: number) {
    const start = new Date(Date.UTC(year, monthIndex, 1))
    const end = new Date(Date.UTC(year, monthIndex + 1, 1))
    return prisma.homework.findMany({
      where: {
        academyId,
        OR: [{ studentId }, { studentId: null, programId: { in: programIds } }],
        dueDate: { gte: start, lt: end },
      },
      include: { program: true, student: true },
      orderBy: { dueDate: 'asc' },
    })
  },

  findById(id: string, academyId: string) {
    return prisma.homework.findFirst({ where: { id, academyId }, include: { student: true } })
  },

  create(academyId: string, data: CreateHomeworkInput) {
    return prisma.homework.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateHomeworkInput) {
    return prisma.homework.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.homework.deleteMany({ where: { id, academyId } })
  },

  upsertCompletion(homeworkId: string, studentId: string, isCompleted: boolean) {
    return prisma.homeworkCompletion.upsert({
      where: { homeworkId_studentId: { homeworkId, studentId } },
      create: { homeworkId, studentId, isCompleted },
      update: { isCompleted },
    })
  },
}
