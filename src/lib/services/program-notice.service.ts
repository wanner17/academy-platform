import {
  programNoticeRepository,
  type CreateProgramNoticeInput,
  type UpdateProgramNoticeInput,
} from '@/lib/repositories/program-notice.repository'

export const programNoticeService = {
  getProgramNotices(academyId: string, programId: string) {
    return programNoticeRepository.findByProgram(academyId, programId)
  },

  getVisibleNoticesForPrograms(academyId: string, programIds: string[]) {
    if (programIds.length === 0) return Promise.resolve([])
    return programNoticeRepository.findVisibleByPrograms(academyId, programIds)
  },

  async getProgramNoticeById(id: string, academyId: string) {
    const notice = await programNoticeRepository.findById(id, academyId)
    if (!notice) throw new Error('Program notice not found')
    return notice
  },

  createProgramNotice(academyId: string, data: CreateProgramNoticeInput) {
    return programNoticeRepository.create(academyId, normalizeProgramNoticeInput(data))
  },

  async updateProgramNotice(id: string, academyId: string, data: UpdateProgramNoticeInput) {
    await this.getProgramNoticeById(id, academyId)
    return programNoticeRepository.update(id, academyId, normalizeProgramNoticeInput(data))
  },

  async deleteProgramNotice(id: string, academyId: string) {
    await this.getProgramNoticeById(id, academyId)
    return programNoticeRepository.delete(id, academyId)
  },
}

function normalizeProgramNoticeInput<T extends CreateProgramNoticeInput | UpdateProgramNoticeInput>(data: T): T {
  const title = data.title.trim()
  if (!title) throw new Error('제목을 입력해주세요')

  switch (data.type) {
    case 'MAKEUP':
      if (!data.makeupDate || !data.makeupStartTime?.trim() || !data.makeupEndTime?.trim())
        throw new Error('보충 공지에는 날짜와 시작/종료 시간이 필요합니다')
      return { ...data, title, cancelDate: undefined, changeDate: undefined, changeFromTime: undefined, changeToTime: undefined, dayOfWeek: undefined }
    case 'CANCEL':
      if (!data.cancelDate) throw new Error('휴강 공지에는 휴강일이 필요합니다')
      return { ...data, title, makeupDate: undefined, makeupStartTime: undefined, makeupEndTime: undefined, changeDate: undefined, changeFromTime: undefined, changeToTime: undefined, dayOfWeek: undefined }
    case 'SCHEDULE_CHANGE':
      if (!data.originalDate || !data.changeDate || !data.changeFromTime?.trim() || !data.changeToTime?.trim())
        throw new Error('시간표변경 공지에는 원래 날짜, 이동할 날짜와 시간이 필요합니다')
      return { ...data, title, makeupDate: undefined, makeupStartTime: undefined, makeupEndTime: undefined, cancelDate: undefined }
    case 'OTHER':
      return { ...data, title, makeupDate: undefined, makeupStartTime: undefined, makeupEndTime: undefined, cancelDate: undefined, changeDate: undefined, changeFromTime: undefined, changeToTime: undefined, dayOfWeek: undefined, originalDate: undefined }
    default:
      throw new Error('알 수 없는 공지 유형입니다')
  }
}
