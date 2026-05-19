import { prisma } from '@/lib/db/prisma'
import type { PostStatus } from '@prisma/client'

export type CreateNoticeInput = {
  title: string
  content: string
  isPinned?: boolean
  status?: PostStatus
}

export type UpdateNoticeInput = Partial<CreateNoticeInput>

export const noticeRepository = {
  async findPublic(academyId: string, page = 1, limit = 20) {
    const where = { academyId, status: 'PUBLISHED' as const }
    const [items, total] = await prisma.$transaction([
      prisma.notice.findMany({
        where,
        include: { attachments: true },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.notice.count({ where }),
    ])
    return { items, total }
  },

  async findAdmin(academyId: string, page = 1, limit = 50) {
    const [items, total] = await prisma.$transaction([
      prisma.notice.findMany({
        where: { academyId },
        include: { attachments: true },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.notice.count({ where: { academyId } }),
    ])
    return { items, total }
  },

  findById(id: string, academyId: string) {
    return prisma.notice.findFirst({ where: { id, academyId }, include: { attachments: true } })
  },

  countPinned(academyId: string) {
    return prisma.notice.count({ where: { academyId, isPinned: true } })
  },

  create(academyId: string, data: CreateNoticeInput) {
    return prisma.notice.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateNoticeInput) {
    return prisma.notice.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.notice.deleteMany({ where: { id, academyId } })
  },
}
