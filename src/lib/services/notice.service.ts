import {
  noticeRepository,
  type CreateNoticeInput,
  type UpdateNoticeInput,
} from '@/lib/repositories/notice.repository'

export const noticeService = {
  getPublicNotices(academyId: string, page = 1, limit = 20) {
    return noticeRepository.findPublic(academyId, page, limit)
  },

  getAdminNotices(academyId: string, page = 1, limit = 50) {
    return noticeRepository.findAdmin(academyId, page, limit)
  },

  async getNoticeById(id: string, academyId: string) {
    const notice = await noticeRepository.findById(id, academyId)
    if (!notice) throw new Error('Notice not found')
    return notice
  },

  async getPublicNoticeById(id: string, academyId: string) {
    const notice = await this.getNoticeById(id, academyId)
    if (notice.status !== 'PUBLISHED') throw new Error('Notice not found')
    return notice
  },

  async createNotice(academyId: string, data: CreateNoticeInput) {
    if (!data.title.trim()) throw new Error('Title is required')
    if (!data.content.trim()) throw new Error('Content is required')

    if (data.isPinned) {
      const pinnedCount = await noticeRepository.countPinned(academyId)
      if (pinnedCount >= 3) throw new Error('Pinned notices are limited to 3')
    }

    return noticeRepository.create(academyId, data)
  },

  async updateNotice(id: string, academyId: string, data: UpdateNoticeInput) {
    await this.getNoticeById(id, academyId)

    if (data.title !== undefined && !data.title.trim()) throw new Error('Title is required')
    if (data.content !== undefined && !data.content.trim()) throw new Error('Content is required')

    if (data.isPinned) {
      const current = await this.getNoticeById(id, academyId)
      const pinnedCount = await noticeRepository.countPinned(academyId)
      if (!current.isPinned && pinnedCount >= 3) throw new Error('Pinned notices are limited to 3')
    }

    return noticeRepository.update(id, academyId, data)
  },

  async deleteNotice(id: string, academyId: string) {
    await this.getNoticeById(id, academyId)
    return noticeRepository.delete(id, academyId)
  },
}
