import { prisma } from '@/lib/db/prisma'

export type CreateTestResultInput = {
  authorId: string
  categoryId?: string | null
  isPassed?: boolean | null
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
  q?: string
  qField?: string
  studentId?: string
  testName?: string
}

export const testResultRepository = {
  findAdmin(academyId: string, options: FindAdminTestResultsOptions = {}) {
    const q = options.q?.trim()
    const qField = options.qField

    const searchWhere = (() => {
      if (!q) return {}
      if (qField === 'testName') return { testName: { contains: q } }
      if (qField === 'studentName') return { student: { name: { contains: q } } }
      if (qField === 'programTitle') return { program: { title: { contains: q } } }
      if (qField === 'score') return { score: { contains: q } }
      if (qField === 'memo') return { memo: { contains: q } }
      return {
        OR: [
          { testName: { contains: q } },
          { score: { contains: q } },
          { memo: { contains: q } },
          { student: { name: { contains: q } } },
          { program: { title: { contains: q } } },
        ],
      }
    })()

    return prisma.testResult.findMany({
      where: {
        academyId,
        ...(options.programId ? { programId: options.programId } : {}),
        ...(options.studentId ? { studentId: options.studentId } : {}),
        ...(options.testName ? { testName: { contains: options.testName } } : {}),
        ...searchWhere,
      },
      include: { author: true, category: true, program: true, student: true },
      orderBy: [{ testedAt: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findVisibleByStudent(academyId: string, studentId: string) {
    return prisma.testResult.findMany({
      where: { academyId, studentId, isVisible: true },
      include: { category: true, program: true },
      orderBy: [{ testedAt: 'desc' }, { createdAt: 'desc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.testResult.findFirst({
      where: { id, academyId },
      include: { author: true, category: true, program: true, student: true },
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
