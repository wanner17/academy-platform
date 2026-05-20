import { prisma } from '@/lib/db/prisma'

export type GalleryImageInput = {
  description?: string
  imageUrl: string
  isActive?: boolean
  order?: number
  title?: string
}

export const academyGalleryRepository = {
  findAdmin(academyId: string) {
    return prisma.academyGalleryImage.findMany({
      where: { academyId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  findPublic(academyId: string) {
    return prisma.academyGalleryImage.findMany({
      where: { academyId, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
  },

  replaceAll(academyId: string, images: GalleryImageInput[]) {
    return prisma.$transaction([
      prisma.academyGalleryImage.deleteMany({ where: { academyId } }),
      prisma.academyGalleryImage.createMany({
        data: images.map((image, index) => ({
          academyId,
          description: image.description,
          imageUrl: image.imageUrl,
          isActive: image.isActive ?? true,
          order: image.order ?? index,
          title: image.title,
        })),
      }),
    ])
  },
}
