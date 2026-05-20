import { prisma } from '@/lib/db/prisma'
import type { InquiryStatus } from '@prisma/client'

export type CreateInquiryInput = {
  name: string
  phone: string
  email?: string
  subject?: string
  content: string
}

export type FindAdminInquiriesOptions = {
  query?: string
  status?: InquiryStatus
}

export const inquiryRepository = {
  async findAdmin(academyId: string, page = 1, limit = 50, options: FindAdminInquiriesOptions = {}) {
    const query = options.query?.trim()
    const where = {
      academyId,
      ...(options.status ? { status: options.status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } },
              { subject: { contains: query } },
              { content: { contains: query } },
            ],
          }
        : {}),
    }

    const [items, total] = await prisma.$transaction([
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.inquiry.count({ where }),
    ])
    return { items, total }
  },

  findById(id: string, academyId: string) {
    return prisma.inquiry.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateInquiryInput) {
    return prisma.inquiry.create({ data: { ...data, academyId } })
  },

  updateStatus(id: string, academyId: string, status: InquiryStatus) {
    return prisma.inquiry.updateMany({ where: { id, academyId }, data: { status } })
  },

  updateMemo(id: string, academyId: string, memo?: string) {
    return prisma.inquiry.updateMany({ where: { id, academyId }, data: { memo } })
  },
}
