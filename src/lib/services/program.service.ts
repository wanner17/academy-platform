import type { ProgramMode, TargetLevel } from '@prisma/client'
import {
  programRepository,
  type CreateProgramInput,
  type FindAdminProgramsOptions,
  type UpdateProgramInput,
} from '@/lib/repositories/program.repository'

const programModes: ProgramMode[] = ['SCHOOL_EXAM', 'LEVEL']
const targetLevels: TargetLevel[] = ['ELEMENTARY', 'MIDDLE', 'HIGH']

export const programService = {
  getPublicPrograms(academyId: string) {
    return programRepository.findPublic(academyId)
  },

  getAdminPrograms(academyId: string, options: FindAdminProgramsOptions = {}) {
    return programRepository.findAdmin(academyId, options)
  },

  async getProgramById(id: string, academyId: string) {
    const program = await programRepository.findById(id, academyId)
    if (!program) throw new Error('Program not found')
    return program
  },

  async getTeacherPrograms(academyId: string, userId: string) {
    const programs = await programRepository.findAdmin(academyId)
    return programs.filter((program) => program.teacher?.userId === userId)
  },

  createProgram(academyId: string, data: CreateProgramInput) {
    return programRepository.create(academyId, normalizeProgramInput(data))
  },

  async updateProgram(id: string, academyId: string, data: UpdateProgramInput) {
    await this.getProgramById(id, academyId)
    return programRepository.update(id, academyId, normalizeProgramInput(data))
  },

  async deleteProgram(id: string, academyId: string) {
    await this.getProgramById(id, academyId)
    return programRepository.deleteWithSchedules(id, academyId)
  },
}

function normalizeProgramInput<T extends CreateProgramInput | UpdateProgramInput>(data: T) {
  const title = data.title?.trim()
  const teacherId = data.teacherId?.trim() || undefined
  const isLevelProgram = data.mode === 'LEVEL'
  const schoolName = isLevelProgram ? undefined : data.schoolName?.trim() || undefined
  const grade = isLevelProgram ? undefined : data.grade?.trim() || undefined
  const subject = data.subject?.trim() || undefined
  const description = data.description?.trim() || undefined
  const order = Number.isFinite(data.order) ? data.order : 0

  if ('title' in data && !title) throw new Error('Title is required')
  if (data.mode && !programModes.includes(data.mode)) throw new Error('Program mode is invalid')
  if (data.targetLevel && !targetLevels.includes(data.targetLevel)) throw new Error('Target level is invalid')

  return {
    ...data,
    ...(title !== undefined ? { title } : {}),
    teacherId,
    schoolName,
    grade,
    subject,
    description,
    order,
  }
}
