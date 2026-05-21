import { prisma } from '@/lib/db/prisma'

export type CreateSchoolExamInput = {
  studentId: string
  examType: string
  subject: string
  score?: number | null
  grade?: number | null
  examYear: number
  semester: number
  schoolYear?: number | null
  memo?: string
}

export type UpdateSchoolExamInput = Omit<CreateSchoolExamInput, 'studentId'>

export const schoolExamRepository = {
  findByStudent(academyId: string, studentId: string) {
    return prisma.schoolExamResult.findMany({
      where: { academyId, studentId },
      orderBy: [{ examYear: 'desc' }, { semester: 'desc' }, { subject: 'asc' }],
    })
  },

  findForAtRisk(academyId: string) {
    return prisma.schoolExamResult.findMany({
      where: { academyId, score: { not: null } },
      select: { studentId: true, subject: true, score: true, examYear: true, semester: true },
      orderBy: [{ studentId: 'asc' }, { subject: 'asc' }, { examYear: 'asc' }, { semester: 'asc' }],
    })
  },

  findForTrend(academyId: string, since: Date) {
    return prisma.schoolExamResult.findMany({
      where: { academyId, createdAt: { gte: since }, score: { not: null } },
      select: {
        subject: true,
        score: true,
        examYear: true,
        semester: true,
        student: { select: { schoolName: true, grade: true } },
      },
    })
  },

  findDistinctMeta(academyId: string) {
    return prisma.schoolExamResult.findMany({
      where: { academyId },
      select: { examType: true, subject: true },
      distinct: ['examType', 'subject'],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.schoolExamResult.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateSchoolExamInput) {
    return prisma.schoolExamResult.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateSchoolExamInput) {
    return prisma.schoolExamResult.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.schoolExamResult.deleteMany({ where: { id, academyId } })
  },
}
