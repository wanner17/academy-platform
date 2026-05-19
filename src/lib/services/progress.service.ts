import {
  progressRepository,
  type CreateProgressLogInput,
} from '@/lib/repositories/progress.repository'

export const progressService = {
  getProgramProgressLogs(academyId: string, programId: string) {
    return progressRepository.findByProgram(academyId, programId)
  },

  getVisibleProgressLogsForPrograms(academyId: string, programIds: string[]) {
    if (programIds.length === 0) return []
    return progressRepository.findVisibleByPrograms(academyId, programIds)
  },

  async getProgressLogById(id: string, academyId: string) {
    const progressLog = await progressRepository.findById(id, academyId)
    if (!progressLog) throw new Error('Progress log not found')
    return progressLog
  },

  createProgressLog(academyId: string, data: CreateProgressLogInput) {
    const content = data.content.trim()
    const nextPlan = data.nextPlan?.trim() || undefined
    if (!content) throw new Error('Content is required')
    if (Number.isNaN(data.classDate.getTime())) throw new Error('Class date is invalid')

    return progressRepository.create(academyId, {
      ...data,
      content,
      nextPlan,
    })
  },

  async deleteProgressLog(id: string, academyId: string) {
    await this.getProgressLogById(id, academyId)
    return progressRepository.delete(id, academyId)
  },
}
