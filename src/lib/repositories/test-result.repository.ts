import { prisma } from '@/lib/db/prisma'

export type CreateTestResultInput = {
  authorId: string
  isVisible?: boolean
  memo?: string
  programId: string
  score: string
  studentId: string
  testedAt: Date
  testName: string
}

export type UpdateTestResultInput = Omit<CreateTestResultInput, 'authorId' | 'programId'>

export type FindAdminTestResultsOptions = {
  programId?: string
  query?: string
  studentId?: string
  testName?: string
}

export const testResultRepository = {
  findAdmin(academyId: string, options: FindAdminTestResultsOptions = {}) {
    const query = options.query?.trim()
    return prisma.testResult.findMany({
      where: {
        academyId,
        ...(options.programId ? { programId: options.programId } : {}),
        ...(options.studentId ? { studentId: options.studentId } : {}),
        ...(options.testName ? { testName: options.testName } : {}),
        ...(query
          ? {
              OR: [
                { testName: { contains: query } },
                { score: { contains: query } },
                { memo: { contains: query } },
                { student: { name: { contains: query } } },
                { program: { title: { contains: query } } },
              ],
            }
          : {}),
      },
      include: { author: true, program: true, student: true },
      orderBy: [{ testedAt: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findVisibleByStudent(academyId: string, studentId: string) {
    return prisma.testResult.findMany({
      where: { academyId, studentId, isVisible: true },
      include: { program: true },
      orderBy: [{ testedAt: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.testResult.findFirst({
      where: { id, academyId },
      include: { author: true, program: true, student: true },
    })
  },

  create(academyId: string, data: CreateTestResultInput) {
    return prisma.testResult.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateTestResultInput) {
    return prisma.testResult.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.testResult.deleteMany({ where: { id, academyId } })
  },
}
