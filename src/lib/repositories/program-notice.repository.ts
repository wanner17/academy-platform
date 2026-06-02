import { prisma } from '@/lib/db/prisma'
import type { ProgramNoticeType } from '@prisma/client'

export type CreateProgramNoticeInput = {
  authorId: string
  programId: string
  type: ProgramNoticeType
  title: string
  content?: string
  isVisible?: boolean
  makeupDate?: Date
  makeupStartTime?: string
  makeupEndTime?: string
  cancelDate?: Date
  changeDate?: Date
  changeFromTime?: string
  changeToTime?: string
  dayOfWeek?: number
  originalDate?: Date
}

export type UpdateProgramNoticeInput = Omit<CreateProgramNoticeInput, 'authorId' | 'programId'>

export const programNoticeRepository = {
  findByProgram(academyId: string, programId: string) {
    return prisma.programNotice.findMany({
      where: { academyId, programId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findVisibleByPrograms(academyId: string, programIds: string[]) {
    if (programIds.length === 0) return Promise.resolve([])
    return prisma.programNotice.findMany({
      where: { academyId, programId: { in: programIds }, isVisible: true },
      include: { program: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById(id: string, academyId: string) {
    return prisma.programNotice.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateProgramNoticeInput) {
    return prisma.programNotice.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateProgramNoticeInput) {
    return prisma.programNotice.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.programNotice.deleteMany({ where: { id, academyId } })
  },
}
