import {
  scheduleRepository,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from '@/lib/repositories/schedule.repository'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const scheduleService = {
  getPublicSchedules(academyId: string) {
    return scheduleRepository.findPublic(academyId)
  },

  getAdminSchedules(academyId: string) {
    return scheduleRepository.findAdmin(academyId)
  },

  getProgramSchedules(academyId: string, programId: string) {
    return scheduleRepository.findByProgram(academyId, programId)
  },

  getPublicProgramSchedules(academyId: string, programId: string) {
    return scheduleRepository.findPublicByProgram(academyId, programId)
  },

  async getScheduleById(id: string, academyId: string) {
    const schedule = await scheduleRepository.findById(id, academyId)
    if (!schedule) throw new Error('Schedule not found')
    return schedule
  },

  createSchedule(academyId: string, data: CreateScheduleInput) {
    return scheduleRepository.create(academyId, normalizeScheduleInput(data))
  },

  async updateSchedule(id: string, academyId: string, data: UpdateScheduleInput) {
    await this.getScheduleById(id, academyId)
    return scheduleRepository.update(id, academyId, normalizeScheduleInput(data))
  },

  async deleteSchedule(id: string, academyId: string) {
    await this.getScheduleById(id, academyId)
    return scheduleRepository.delete(id, academyId)
  },
}

function normalizeScheduleInput<T extends CreateScheduleInput | UpdateScheduleInput>(data: T) {
  const title = data.title?.trim()
  const programId = data.programId?.trim() || undefined
  const subject = data.subject?.trim() || undefined
  const teacher = data.teacher?.trim() || undefined
  const room = data.room?.trim() || undefined
  const color = normalizeColor(data.color)
  const dayOfWeek = Number(data.dayOfWeek ?? 0)
  const startTime = data.startTime?.trim()
  const endTime = data.endTime?.trim()

  if ('title' in data && !title) throw new Error('Title is required')
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) throw new Error('Day is invalid')
  if ('startTime' in data && (!startTime || !timePattern.test(startTime))) throw new Error('Start time is invalid')
  if ('endTime' in data && (!endTime || !timePattern.test(endTime))) throw new Error('End time is invalid')
  if (startTime && endTime && startTime >= endTime) throw new Error('End time must be after start time')

  return {
    ...data,
    ...(title !== undefined ? { title } : {}),
    programId,
    subject,
    teacher,
    room,
    color,
    dayOfWeek,
    ...(startTime !== undefined ? { startTime } : {}),
    ...(endTime !== undefined ? { endTime } : {}),
  }
}

function normalizeColor(value?: string) {
  const color = value?.trim()
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#2563EB'
}
