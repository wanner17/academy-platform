import { prisma } from '@/lib/db/prisma'

export type CreateStudentInput = {
  grade?: string
  isActive?: boolean
  memo?: string
  name: string
  parentPhone?: string
  phone?: string
  schoolName?: string
  userId?: string
}

export type UpdateStudentInput = Partial<CreateStudentInput>

export const studentRepository = {
  async findDistinctSchools(academyId: string): Promise<string[]> {
    const rows = await prisma.student.findMany({
      where: { academyId, schoolName: { not: null } },
      select: { schoolName: true },
      distinct: ['schoolName'],
      orderBy: { schoolName: 'asc' },
    })
    return rows.map((r) => r.schoolName as string)
  },

  findAdmin(academyId: string) {
    return prisma.student.findMany({
      where: { academyId },
      include: { user: true, enrollments: { include: { program: true } } },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.student.findFirst({
      where: { id, academyId },
      include: { user: true, enrollments: { include: { program: true } } },
    })
  },

  findByUserId(userId: string, academyId: string) {
    return prisma.student.findFirst({
      where: { userId, academyId },
      include: { user: true, enrollments: { include: { program: { include: { teacher: true } } } } },
    })
  },

  create(academyId: string, data: CreateStudentInput) {
    return prisma.student.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateStudentInput) {
    return prisma.student.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.student.deleteMany({ where: { id, academyId } })
  },

  upsertEnrollment(academyId: string, studentId: string, programId: string) {
    return prisma.enrollment.upsert({
      where: { studentId_programId: { studentId, programId } },
      update: { status: 'ACTIVE' },
      create: { academyId, studentId, programId },
    })
  },

  deleteEnrollment(academyId: string, studentId: string, programId: string) {
    return prisma.enrollment.deleteMany({ where: { academyId, studentId, programId } })
  },
}
