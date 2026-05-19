import { cache } from 'react'
import { academyRepository } from '@/lib/repositories/academy.repository'

export const getAcademyBySlug = cache(async (slug: string) => {
  const academy = await academyRepository.findBySlug(slug)
  if (!academy) throw new Error('Academy not found')
  return academy
})
