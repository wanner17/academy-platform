import { prisma } from '@/lib/db/prisma'

export type CreateScheduleInput = {
  programId?: string
  title: string
  subject?: string
  teacher?: string
  room?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  color?: string
  isActive?: boolean
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>

export const scheduleRepository = {
  findPublic(academyId: string) {
    return prisma.schedule.findMany({
      where: { academyId, isActive: true },
      include: { program: { include: { teacher: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  },

  findAdmin(academyId: string) {
    return prisma.schedule.findMany({
      where: { academyId },
      include: { program: { include: { teacher: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  },

  findByProgram(academyId: string, programId: string) {
    return prisma.schedule.findMany({
      where: { academyId, programId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  },

  findPublicByProgram(academyId: string, programId: string) {
    return prisma.schedule.findMany({
      where: { academyId, programId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.schedule.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateScheduleInput) {
    return prisma.schedule.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateScheduleInput) {
    return prisma.schedule.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.schedule.deleteMany({ where: { id, academyId } })
  },
}
