import { prisma } from '@/lib/db/prisma'

export type CreateTeacherInput = {
  userId?: string
  name: string
  subject: string
  bio?: string
  profileImageUrl?: string
  introVideoUrl?: string
  introVideoUrls?: string
  order?: number
  isActive?: boolean
}

export type UpdateTeacherInput = Partial<CreateTeacherInput>

export const teacherRepository = {
  findPublic(academyId: string) {
    return prisma.teacher.findMany({
      where: { academyId, isActive: true },
      include: { user: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  findAdmin(academyId: string) {
    return prisma.teacher.findMany({
      where: { academyId },
      include: { user: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.teacher.findFirst({ where: { id, academyId }, include: { user: true, programs: true } })
  },

  findByUserId(userId: string, academyId: string) {
    return prisma.teacher.findFirst({ where: { userId, academyId }, include: { user: true, programs: true } })
  },

  findPublicById(id: string, academyId: string) {
    return prisma.teacher.findFirst({ where: { id, academyId, isActive: true }, include: { user: true } })
  },

  create(academyId: string, data: CreateTeacherInput) {
    return prisma.teacher.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateTeacherInput) {
    return prisma.teacher.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.teacher.deleteMany({ where: { id, academyId } })
  },
}
