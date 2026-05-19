import {
  homeworkRepository,
  type CreateHomeworkInput,
} from '@/lib/repositories/homework.repository'

export const homeworkService = {
  getProgramHomeworks(academyId: string, programId: string) {
    return homeworkRepository.findByProgram(academyId, programId)
  },

  getVisibleHomeworksForPrograms(academyId: string, programIds: string[]) {
    if (programIds.length === 0) return []
    return homeworkRepository.findVisibleByPrograms(academyId, programIds)
  },

  async getHomeworkById(id: string, academyId: string) {
    const homework = await homeworkRepository.findById(id, academyId)
    if (!homework) throw new Error('Homework not found')
    return homework
  },

  createHomework(academyId: string, data: CreateHomeworkInput) {
    const title = data.title.trim()
    const content = data.content.trim()
    if (!title) throw new Error('Title is required')
    if (!content) throw new Error('Content is required')

    return homeworkRepository.create(academyId, {
      ...data,
      title,
      content,
    })
  },

  async deleteHomework(id: string, academyId: string) {
    await this.getHomeworkById(id, academyId)
    return homeworkRepository.delete(id, academyId)
  },
}
