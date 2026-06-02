import {
  progressRepository,
  type CreateProgressLogInput,
  type UpdateProgressLogInput,
} from '@/lib/repositories/progress.repository'

export const progressService = {
  getProgramProgressLogs(academyId: string, programId: string) {
    return progressRepository.findByProgram(academyId, programId)
  },

  getVisibleProgressLogsForPrograms(academyId: string, programIds: string[], studentId?: string) {
    if (programIds.length === 0) return []
    return progressRepository.findVisibleByPrograms(academyId, programIds, studentId)
  },

  async getProgressLogById(id: string, academyId: string) {
    const progressLog = await progressRepository.findById(id, academyId)
    if (!progressLog) throw new Error('Progress log not found')
    return progressLog
  },

  createProgressLog(academyId: string, data: CreateProgressLogInput) {
    return progressRepository.create(academyId, normalizeProgressLogInput(data))
  },

  async updateProgressLog(id: string, academyId: string, data: UpdateProgressLogInput) {
    await this.getProgressLogById(id, academyId)
    return progressRepository.update(id, academyId, normalizeProgressLogInput(data))
  },

  async deleteProgressLog(id: string, academyId: string) {
    await this.getProgressLogById(id, academyId)
    return progressRepository.delete(id, academyId)
  },

  countStudentLogsForMonth(academyId: string, studentId: string, year: number, month: number) {
    return progressRepository.countStudentLogsForMonth(academyId, studentId, year, month)
  },
}

function normalizeProgressLogInput<T extends CreateProgressLogInput | UpdateProgressLogInput>(data: T) {
  const content = data.content.trim()
  const nextPlan = data.nextPlan?.trim() || undefined
  const studentId = data.studentId?.trim() || undefined
  if (!content) throw new Error('Content is required')
  if (Number.isNaN(data.classDate.getTime())) throw new Error('Class date is invalid')

  return { ...data, content, nextPlan, studentId }
}
