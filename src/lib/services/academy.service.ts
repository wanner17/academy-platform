import {
  academyRepository,
  type UpdateAcademyInput,
} from '@/lib/repositories/academy.repository'

export const academyService = {
  async updateAcademy(id: string, data: UpdateAcademyInput) {
    const name = data.name.trim()
    const description = data.description?.trim() || undefined
    const address = data.address?.trim() || undefined
    const phone = data.phone?.trim() || undefined
    const email = data.email?.trim() || undefined
    const mapUrl = normalizeOptionalUrl(data.mapUrl)

    if (!name) throw new Error('Name is required')
    if (email && !email.includes('@')) throw new Error('Email is invalid')

    return academyRepository.update(id, {
      name,
      description,
      address,
      phone,
      email,
      mapUrl,
    })
  },
}

function normalizeOptionalUrl(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}
