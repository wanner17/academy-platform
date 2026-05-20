import {
  academyGalleryRepository,
  type GalleryImageInput,
} from '@/lib/repositories/academy-gallery.repository'

export const academyGalleryService = {
  getAdminImages(academyId: string) {
    return academyGalleryRepository.findAdmin(academyId)
  },

  getPublicImages(academyId: string) {
    return academyGalleryRepository.findPublic(academyId)
  },

  replaceImages(academyId: string, images: GalleryImageInput[]) {
    return academyGalleryRepository.replaceAll(academyId, normalizeImages(images))
  },
}

function normalizeImages(images: GalleryImageInput[]) {
  return images
    .map((image, index) => ({
      imageUrl: image.imageUrl.trim(),
      title: image.title?.trim() || undefined,
      description: image.description?.trim() || undefined,
      order: Number.isFinite(image.order) ? image.order : index,
      isActive: image.isActive ?? true,
    }))
    .filter((image) => image.imageUrl && isSafeImageUrl(image.imageUrl))
}

function isSafeImageUrl(value: string) {
  return /^(https?:\/\/|\/)/i.test(value) && !/^javascript:/i.test(value)
}
