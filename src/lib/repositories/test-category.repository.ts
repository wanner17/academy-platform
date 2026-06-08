import { prisma } from '@/lib/db/prisma'

export type CreateTestCategoryInput = {
  name: string
  color: string
  authorId: string
  order?: number
}

export type UpdateTestCategoryInput = Partial<Omit<CreateTestCategoryInput, 'authorId'>>

export const testCategoryRepository = {
  findByUser(academyId: string, authorId: string) {
    return prisma.testCategory.findMany({
      where: { academyId, authorId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  findById(id: string, academyId: string) {
    return prisma.testCategory.findFirst({ where: { id, academyId } })
  },

  create(academyId: string, data: CreateTestCategoryInput) {
    return prisma.testCategory.create({ data: { ...data, academyId } })
  },

  update(id: string, academyId: string, data: UpdateTestCategoryInput) {
    return prisma.testCategory.updateMany({ where: { id, academyId }, data })
  },

  delete(id: string, academyId: string) {
    return prisma.testCategory.deleteMany({ where: { id, academyId } })
  },
}
