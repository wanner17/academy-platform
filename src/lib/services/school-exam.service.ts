import {
  schoolExamRepository,
  type CreateSchoolExamInput,
  type UpdateSchoolExamInput,
} from '@/lib/repositories/school-exam.repository'

export const schoolExamService = {
  getByStudent(academyId: string, studentId: string) {
    return schoolExamRepository.findByStudent(academyId, studentId)
  },

  async getById(id: string, academyId: string) {
    const result = await schoolExamRepository.findById(id, academyId)
    if (!result) throw new Error('School exam result not found')
    return result
  },

  create(academyId: string, data: CreateSchoolExamInput) {
    validate(data)
    return schoolExamRepository.create(academyId, normalize(data))
  },

  async update(id: string, academyId: string, data: UpdateSchoolExamInput) {
    await this.getById(id, academyId)
    validate(data)
    return schoolExamRepository.update(id, academyId, normalize(data))
  },

  async delete(id: string, academyId: string) {
    await this.getById(id, academyId)
    return schoolExamRepository.delete(id, academyId)
  },

  getForAtRisk(academyId: string) {
    return schoolExamRepository.findForAtRisk(academyId)
  },

  getForTrend(academyId: string, since: Date) {
    return schoolExamRepository.findForTrend(academyId, since)
  },

  getDistinctMeta(academyId: string) {
    return schoolExamRepository.findDistinctMeta(academyId)
  },
}

function validate(data: CreateSchoolExamInput | UpdateSchoolExamInput) {
  if (!data.examType.trim()) throw new Error('시험 종류를 입력해주세요')
  if (!data.subject.trim()) throw new Error('과목을 입력해주세요')
  if (data.score == null && data.grade == null) throw new Error('점수 또는 등급 중 하나는 입력해주세요')
  if (data.grade != null && (data.grade < 1 || data.grade > 9)) throw new Error('등급은 1~9 사이여야 합니다')
  if (data.score != null && data.score < 0) throw new Error('점수는 0 이상이어야 합니다')
}

function normalize<T extends CreateSchoolExamInput | UpdateSchoolExamInput>(data: T): T {
  return {
    ...data,
    examType: data.examType.trim(),
    subject: data.subject.trim(),
    memo: data.memo?.trim() || undefined,
  }
}
