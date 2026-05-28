import {
  homeworkRepository,
  type CreateHomeworkInput,
  type UpdateHomeworkInput,
} from '@/lib/repositories/homework.repository'

export const homeworkService = {
  getProgramHomeworks(academyId: string, programId: string) {
    return homeworkRepository.findByProgram(academyId, programId)
  },

  getVisibleHomeworksForPrograms(academyId: string, programIds: string[], studentId?: string) {
    if (programIds.length === 0) return []
    return homeworkRepository.findVisibleByPrograms(academyId, programIds, studentId)
  },

  getStudentHomeworksForMonth(academyId: string, studentId: string, programIds: string[], year: number, monthIndex: number) {
    if (programIds.length === 0) return Promise.resolve([])
    return homeworkRepository.findForStudentInMonth(academyId, studentId, programIds, year, monthIndex)
  },

  async getHomeworkById(id: string, academyId: string) {
    const homework = await homeworkRepository.findById(id, academyId)
    if (!homework) throw new Error('Homework not found')
    return homework
  },

  createHomework(academyId: string, data: CreateHomeworkInput) {
    return homeworkRepository.create(academyId, normalizeHomeworkInput(data))
  },

  async updateHomework(id: string, academyId: string, data: UpdateHomeworkInput) {
    await this.getHomeworkById(id, academyId)
    return homeworkRepository.update(id, academyId, normalizeHomeworkInput(data))
  },

  async deleteHomework(id: string, academyId: string) {
    await this.getHomeworkById(id, academyId)
    return homeworkRepository.delete(id, academyId)
  },

  async toggleStudentCompletion(homeworkId: string, academyId: string, studentId: string, isCompleted: boolean) {
    await this.getHomeworkById(homeworkId, academyId)
    return homeworkRepository.upsertCompletion(homeworkId, studentId, isCompleted)
  },
}

function normalizeHomeworkInput<T extends CreateHomeworkInput | UpdateHomeworkInput>(data: T) {
  const title = data.title.trim()
  const content = data.content.trim()
  const studentId = data.studentId?.trim() || undefined
  if (!title) throw new Error('Title is required')
  if (!content) throw new Error('Content is required')

  return { ...data, title, content, studentId }
}
