import {
  testResultRepository,
  type CreateTestResultInput,
  type FindAdminTestResultsOptions,
  type UpdateTestResultInput,
} from '@/lib/repositories/test-result.repository'

export const testResultService = {
  getAdminTestResults(academyId: string, options: FindAdminTestResultsOptions = {}) {
    return testResultRepository.findAdmin(academyId, options)
  },

  getStudentVisibleTestResults(academyId: string, studentId: string) {
    return testResultRepository.findVisibleByStudent(academyId, studentId)
  },

  async getTestResultById(id: string, academyId: string) {
    const result = await testResultRepository.findById(id, academyId)
    if (!result) throw new Error('Test result not found')
    return result
  },

  createTestResult(academyId: string, data: CreateTestResultInput) {
    return testResultRepository.create(academyId, normalizeTestResultInput(data))
  },

  async updateTestResult(id: string, academyId: string, data: UpdateTestResultInput) {
    await this.getTestResultById(id, academyId)
    return testResultRepository.update(id, academyId, normalizeTestResultInput(data))
  },

  async deleteTestResult(id: string, academyId: string) {
    await this.getTestResultById(id, academyId)
    return testResultRepository.delete(id, academyId)
  },
}

function normalizeTestResultInput<T extends CreateTestResultInput | UpdateTestResultInput>(data: T) {
  const testName = data.testName.trim()
  const score = data.score.trim()
  const memo = data.memo?.trim() || undefined
  if (!testName) throw new Error('Test name is required')
  if (!score) throw new Error('Score is required')
  if (Number.isNaN(data.testedAt.getTime())) throw new Error('Test date is invalid')

  return { ...data, testName, score, memo }
}
