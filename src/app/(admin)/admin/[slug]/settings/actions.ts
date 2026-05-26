'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { academyGalleryService } from '@/lib/services/academy-gallery.service'
import { academyService } from '@/lib/services/academy.service'
import { parseStatCounters, parseTestimonials } from '@/lib/homepage-sections'

export async function updateAcademySettingsAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)

  try {
    await academyService.updateAcademy(academy.id, {
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      address: String(formData.get('address') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      mapUrl: String(formData.get('mapUrl') ?? ''),
      mapLatitude: formData.get('mapLatitude') ? Number(formData.get('mapLatitude')) : null,
      mapLongitude: formData.get('mapLongitude') ? Number(formData.get('mapLongitude')) : null,
      heroImageUrl: String(formData.get('heroImageUrl') ?? ''),
      naverBlogUrl: String(formData.get('naverBlogUrl') ?? ''),
      instagramUrl: String(formData.get('instagramUrl') ?? ''),
      showStatCounters: formData.get('showStatCounters') === 'on',
      statCounters: JSON.stringify(parseStatCounters(String(formData.get('statCounters') ?? '[]'))),
      showTestimonials: formData.get('showTestimonials') === 'on',
      testimonials: JSON.stringify(parseTestimonials(String(formData.get('testimonials') ?? '[]'))),
    })
    await academyGalleryService.replaceImages(academy.id, parseGalleryImages(String(formData.get('galleryImages') ?? '[]')))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Save failed'
    redirect(`/admin/${slug}/settings?error=${encodeURIComponent(message)}`)
  }

  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/contact`)
  revalidatePath(`/admin/${slug}`)
  revalidatePath(`/admin/${slug}/settings`)
  redirect(`/admin/${slug}/settings?saved=1`)
}

type GalleryFormImage = {
  description?: unknown
  imageUrl?: unknown
  isActive?: unknown
  order?: unknown
  title?: unknown
}

function parseGalleryImages(value: string) {
  const parsed = JSON.parse(value) as GalleryFormImage[]
  if (!Array.isArray(parsed)) return []

  return parsed.map((image, index) => ({
    description: String(image.description ?? ''),
    imageUrl: String(image.imageUrl ?? ''),
    isActive: image.isActive === true,
    order: Number(image.order ?? index),
    title: String(image.title ?? ''),
  }))
}
