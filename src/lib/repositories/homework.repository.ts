import { prisma } from '@/lib/db/prisma'

export type CreateHomeworkInput = {
  authorId: string
  content: string
  dueDate?: Date
  isVisible?: boolean
  programId: string
  title: string
}

export const homeworkRepository = {
  findByProgram(academyId: string, programId: string) {
    return prisma.homework.findMany({
      where: { academyId, programId },
      include: { author: true },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findVisibleByPrograms(academyId: string, programIds: string[]) {
    return prisma.homework.findMany({
      where: { academyId, programId: { in: programIds }, isVisible: true },
      include: { program: true },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.homework.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateHomeworkInput) {
    return prisma.homework.create({ data: { ...data, academyId } })
  },

  delete(id: string, academyId: string) {
    return prisma.homework.deleteMany({ where: { id, academyId } })
  },
}
