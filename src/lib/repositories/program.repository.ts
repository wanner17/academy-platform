import { prisma } from '@/lib/db/prisma'
import type { ProgramMode, TargetLevel } from '@prisma/client'

export type CreateProgramInput = {
  teacherId?: string
  title: string
  mode: ProgramMode
  targetLevel: TargetLevel
  schoolName?: string
  grade?: string
  subject?: string
  description?: string
  order?: number
  isActive?: boolean
}

export type UpdateProgramInput = Partial<CreateProgramInput>

export type FindAdminProgramsOptions = {
  isActive?: boolean
  mode?: ProgramMode
  query?: string
  subject?: string
  targetLevel?: TargetLevel
  teacherId?: string
}

export const programRepository = {
  findPublic(academyId: string) {
    return prisma.program.findMany({
      where: { academyId, isActive: true },
      include: { teacher: true },
      orderBy: [{ subject: 'asc' }, { mode: 'asc' }, { targetLevel: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  findAdmin(academyId: string, options: FindAdminProgramsOptions = {}) {
    const query = options.query?.trim()
    const subject = options.subject?.trim()
    const where = {
      academyId,
      ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
      ...(options.mode ? { mode: options.mode } : {}),
      ...(subject ? { subject } : {}),
      ...(options.targetLevel ? { targetLevel: options.targetLevel } : {}),
      ...(options.teacherId ? { teacherId: options.teacherId } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { schoolName: { contains: query } },
              { grade: { contains: query } },
              { subject: { contains: query } },
              { description: { contains: query } },
            ],
          }
        : {}),
    }

    return prisma.program.findMany({
      where,
      include: { teacher: true },
      orderBy: [{ subject: 'asc' }, { mode: 'asc' }, { targetLevel: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.program.findFirst({ where: { id, academyId }, include: { teacher: true, schedules: true } })
  },

  create(academyId: string, data: CreateProgramInput) {
    return prisma.program.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateProgramInput) {
    return prisma.program.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.program.deleteMany({ where: { id, academyId } })
  },

  deleteWithSchedules(id: string, academyId: string) {
    return prisma.$transaction([
      prisma.schedule.deleteMany({ where: { academyId, programId: id } }),
      prisma.program.deleteMany({ where: { id, academyId } }),
    ])
  },
}
