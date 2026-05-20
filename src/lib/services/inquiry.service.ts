import {
  inquiryRepository,
  type CreateInquiryInput,
  type FindAdminInquiriesOptions,
} from '@/lib/repositories/inquiry.repository'
import type { InquiryStatus } from '@prisma/client'

const phonePattern = /^[0-9+\-\s()]{8,20}$/

export const inquiryService = {
  getAdminInquiries(academyId: string, page = 1, limit = 50, options: FindAdminInquiriesOptions = {}) {
    return inquiryRepository.findAdmin(academyId, page, limit, options)
  },

  async createInquiry(academyId: string, data: CreateInquiryInput) {
    const name = data.name.trim()
    const phone = data.phone.trim()
    const email = data.email?.trim() || undefined
    const subject = data.subject?.trim() || undefined
    const content = data.content.trim()

    if (!name) throw new Error('Name is required')
    if (!phonePattern.test(phone)) throw new Error('Phone is invalid')
    if (!content) throw new Error('Content is required')
    if (email && !email.includes('@')) throw new Error('Email is invalid')

    return inquiryRepository.create(academyId, {
      name,
      phone,
      email,
      subject,
      content,
    })
  },

  async updateInquiryStatus(id: string, academyId: string, status: InquiryStatus) {
    const inquiry = await inquiryRepository.findById(id, academyId)
    if (!inquiry) throw new Error('Inquiry not found')
    return inquiryRepository.updateStatus(id, academyId, status)
  },

  async updateInquiryMemo(id: string, academyId: string, memo: string) {
    const inquiry = await inquiryRepository.findById(id, academyId)
    if (!inquiry) throw new Error('Inquiry not found')
    return inquiryRepository.updateMemo(id, academyId, memo.trim() || undefined)
  },
}
