import { prisma } from '@/lib/db/prisma'

export type UpdateAcademyInput = {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  mapUrl?: string
  mapLatitude?: number | null
  mapLongitude?: number | null
  heroImageUrl?: string
  naverBlogUrl?: string
  showStatCounters?: boolean
  statCounters?: string
  showTestimonials?: boolean
  testimonials?: string
  instagramUrl?: string
}

export const academyRepository = {
  findBySlug(slug: string) {
    return prisma.academy.findUnique({
      where: { slug },
      include: { theme: true, features: true },
    })
  },

  update(id: string, data: UpdateAcademyInput) {
    return prisma.academy.update({
      where: { id },
      data,
      include: { theme: true, features: true },
    })
  },
}
