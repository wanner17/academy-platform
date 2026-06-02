import { prisma } from '@/lib/db/prisma'

export type CreateProgressLogInput = {
  authorId: string
  classDate: Date
  content: string
  homeworkRate?: number
  isVisible?: boolean
  nextPlan?: string
  programId: string
  studentId?: string
}

export type UpdateProgressLogInput = Omit<CreateProgressLogInput, 'authorId' | 'programId'>

export const progressRepository = {
  findByProgram(academyId: string, programId: string) {
    return prisma.progressLog.findMany({
      where: { academyId, programId },
      include: { author: true, student: true },
      orderBy: [{ classDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findVisibleByPrograms(academyId: string, programIds: string[], studentId?: string) {
    return prisma.progressLog.findMany({
      where: {
        academyId,
        programId: { in: programIds },
        isVisible: true,
        OR: [{ studentId: null }, ...(studentId ? [{ studentId }] : [])],
      },
      include: { program: true, student: true },
      orderBy: [{ classDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.progressLog.findFirst({ where: { id, academyId }, include: { student: true } })
  },

  create(academyId: string, data: CreateProgressLogInput) {
    return prisma.progressLog.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateProgressLogInput) {
    return prisma.progressLog.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.progressLog.deleteMany({ where: { id, academyId } })
  },

  countStudentLogsForMonth(academyId: string, studentId: string, year: number, month: number) {
    return prisma.progressLog.count({
      where: {
        academyId,
        studentId,
        classDate: {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        },
      },
    })
  },
}
