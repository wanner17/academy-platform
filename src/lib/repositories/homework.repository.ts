import { prisma } from '@/lib/db/prisma'

export type CreateHomeworkInput = {
  authorId: string
  content: string
  dueDate?: Date
  isVisible?: boolean
  programId: string
  studentId?: string
  title: string
}

export type UpdateHomeworkInput = Omit<CreateHomeworkInput, 'authorId' | 'programId'>

export const homeworkRepository = {
  findByProgram(academyId: string, programId: string) {
    return prisma.homework.findMany({
      where: { academyId, programId },
      include: { author: true, student: true },
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
}
