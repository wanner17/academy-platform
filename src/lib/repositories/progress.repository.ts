import { prisma } from '@/lib/db/prisma'

export type CreateProgressLogInput = {
  authorId: string
  classDate: Date
  content: string
  isVisible?: boolean
  nextPlan?: string
  programId: string
}

export const progressRepository = {
  findByProgram(academyId: string, programId: string) {
    return prisma.progressLog.findMany({
      where: { academyId, programId },
      include: { author: true },
      orderBy: [{ classDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findVisibleByPrograms(academyId: string, programIds: string[]) {
    return prisma.progressLog.findMany({
      where: { academyId, programId: { in: programIds }, isVisible: true },
      include: { program: true },
      orderBy: [{ classDate: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.progressLog.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateProgressLogInput) {
    return prisma.progressLog.create({ data: { ...data, academyId } })
  },

  delete(id: string, academyId: string) {
    return prisma.progressLog.deleteMany({ where: { id, academyId } })
  },
}
