'use server'

import { redirect } from 'next/navigation'
import { publicPath } from '@/lib/utils/public-path'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { inquiryService } from '@/lib/services/inquiry.service'

export async function createInquiryAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const academy = await getAcademyBySlug(slug)

  await inquiryService.createInquiry(academy.id, {
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    content: String(formData.get('content') ?? ''),
  })

  redirect(publicPath(slug, '/contact?submitted=1'))
}
