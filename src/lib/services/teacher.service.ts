import {
  teacherRepository,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from '@/lib/repositories/teacher.repository'
import { parseVideoUrls } from '@/lib/utils/video'

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

  async getPublicTeacherById(id: string, academyId: string) {
    const teacher = await teacherRepository.findPublicById(id, academyId)
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
  const profileImageUrl = data.profileImageUrl?.trim() || undefined
  const introVideoUrl = data.introVideoUrl?.trim() || undefined
  const videoUrls = parseVideoUrls(data.introVideoUrls ?? introVideoUrl)
  const introVideoUrls = videoUrls.length > 0 ? videoUrls.join('\n') : undefined
  const order = Number.isFinite(data.order) ? data.order : undefined

  if ('name' in data && !name) throw new Error('Name is required')
  if ('subject' in data && !subject) throw new Error('Subject is required')
  if (profileImageUrl && !isSafeMediaUrl(profileImageUrl)) throw new Error('Profile image URL is invalid')
  if (introVideoUrl && !isSafeMediaUrl(introVideoUrl)) throw new Error('Intro video URL is invalid')
  if (videoUrls.some((url) => !isSafeMediaUrl(url))) throw new Error('Intro video URL is invalid')

  return {
    ...data,
    ...(name !== undefined ? { name } : {}),
    userId,
    ...(subject !== undefined ? { subject } : {}),
    bio,
    profileImageUrl,
    introVideoUrl: videoUrls[0] ?? undefined,
    introVideoUrls,
    ...(order !== undefined ? { order } : {}),
  }
}

function isSafeMediaUrl(value: string) {
  return /^(https?:\/\/|\/)/i.test(value) && !/^javascript:/i.test(value)
}
