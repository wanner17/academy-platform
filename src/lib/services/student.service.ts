import {
  studentRepository,
  type CreateStudentInput,
  type UpdateStudentInput,
} from '@/lib/repositories/student.repository'

export const studentService = {
  getAdminStudents(academyId: string) {
    return studentRepository.findAdmin(academyId)
  },

  getDistinctSchools(academyId: string) {
    return studentRepository.findDistinctSchools(academyId)
  },

  async getStudentById(id: string, academyId: string) {
    const student = await studentRepository.findById(id, academyId)
    if (!student) throw new Error('Student not found')
    return student
  },

  async getStudentByUserId(userId: string, academyId: string) {
    const student = await studentRepository.findByUserId(userId, academyId)
    if (!student) throw new Error('Student not found')
    return student
  },

  createStudent(academyId: string, data: CreateStudentInput) {
    return studentRepository.create(academyId, normalizeStudentInput(data))
  },

  async updateStudent(id: string, academyId: string, data: UpdateStudentInput) {
    await this.getStudentById(id, academyId)
    return studentRepository.update(id, academyId, normalizeStudentInput(data))
  },

  async withdrawStudent(id: string, academyId: string) {
    await this.getStudentById(id, academyId)
    return studentRepository.withdraw(id, academyId)
  },

  async restoreStudent(id: string, academyId: string) {
    await this.getStudentById(id, academyId)
    return studentRepository.restore(id, academyId)
  },

  async deleteStudent(id: string, academyId: string) {
    await this.getStudentById(id, academyId)
    return studentRepository.delete(id, academyId)
  },

  async addEnrollment(academyId: string, studentId: string, programId: string) {
    await this.getStudentById(studentId, academyId)
    return studentRepository.upsertEnrollment(academyId, studentId, programId)
  },

  async removeEnrollment(academyId: string, studentId: string, programId: string) {
    await this.getStudentById(studentId, academyId)
    return studentRepository.deleteEnrollment(academyId, studentId, programId)
  },
}

function normalizeStudentInput<T extends CreateStudentInput | UpdateStudentInput>(data: T) {
  const name = data.name?.trim()
  const userId = data.userId?.trim() || undefined
  const schoolName = data.schoolName?.trim() || undefined
  const grade = data.grade?.trim() || undefined
  const phone = data.phone?.trim() || undefined
  const parentPhone = data.parentPhone?.trim() || undefined
  const memo = data.memo?.trim() || undefined

  if ('name' in data && !name) throw new Error('Name is required')

  return {
    ...data,
    ...(name !== undefined ? { name } : {}),
    userId,
    schoolName,
    grade,
    phone,
    parentPhone,
    memo,
  }
}
