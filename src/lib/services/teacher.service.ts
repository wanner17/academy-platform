import {
  teacherRepository,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from '@/lib/repositories/teacher.repository'

export const teacherService = {
  getPublicTeachers(academyId: string) {
    return teacherRepository.findPublic(academyId)
  },

  getAdminTeachers(academyId: string) {
    return teacherRepository.findAdmin(academyId)
  },

  async getTeacherById(id: string, academyId: string) {
    const teacher = await teacherRepository.findById(id, academyId)
    if (!teacher) throw new Error('Teacher not found')
    return teacher
  },

  async getTeacherByUserId(userId: string, academyId: string) {
    const teacher = await teacherRepository.findByUserId(userId, academyId)
    if (!teacher) throw new Error('Teacher not found')
    return teacher
  },

  createTeacher(academyId: string, data: CreateTeacherInput) {
    return teacherRepository.create(academyId, normalizeTeacherInput(data))
  },

  async updateTeacher(id: string, academyId: string, data: UpdateTeacherInput) {
    await this.getTeacherById(id, academyId)
    return teacherRepository.update(id, academyId, normalizeTeacherInput(data))
  },

  async deleteTeacher(id: string, academyId: string) {
    await this.getTeacherById(id, academyId)
    return teacherRepository.delete(id, academyId)
  },
}

function normalizeTeacherInput<T extends CreateTeacherInput | UpdateTeacherInput>(data: T) {
  const name = data.name?.trim()
  const userId = data.userId?.trim() || undefined
  const subject = data.subject?.trim()
  const bio = data.bio?.trim() || undefined
  const order = Number.isFinite(data.order) ? data.order : undefined

  if ('name' in data && !name) throw new Error('Name is required')
  if ('subject' in data && !subject) throw new Error('Subject is required')

  return {
    ...data,
    ...(name !== undefined ? { name } : {}),
    userId,
    ...(subject !== undefined ? { subject } : {}),
    bio,
    ...(order !== undefined ? { order } : {}),
  }
}
