import { dailyQuizRepository } from '@/lib/repositories/daily-quiz.repository'
import { toStoredKoreaDate } from '@/lib/utils/korea-time'

export const dailyQuizService = {
  getTodayQuiz(academyId: string, programId: string) {
    return dailyQuizRepository.findByDate(programId, toStoredKoreaDate(new Date()))
  },

  getStudentAttempt(quizId: string, studentId: string) {
    return dailyQuizRepository.findAttempt(quizId, studentId)
  },

  async submitAnswer(academyId: string, programId: string, quizId: string, studentId: string, answer: boolean) {
    const existing = await dailyQuizRepository.findAttempt(quizId, studentId)
    if (existing) throw new Error('이미 오늘의 퀴즈에 답변했습니다.')

    const quiz = await dailyQuizRepository.findByDate(programId, toStoredKoreaDate(new Date()))
    if (!quiz || quiz.id !== quizId) throw new Error('오늘의 퀴즈를 찾을 수 없습니다.')

    const isCorrect = quiz.answer === answer
    return dailyQuizRepository.createAttempt(academyId, quizId, studentId, answer, isCorrect)
  },

  getRanking(programId: string) {
    return dailyQuizRepository.getRanking(programId)
  },

  listQuizzes(programId: string) {
    return dailyQuizRepository.findAllByProgram(programId)
  },

  async createQuiz(academyId: string, programId: string, data: { date: Date; question: string; answer: boolean; explanation?: string }) {
    const question = data.question.trim()
    if (!question) throw new Error('문제 내용을 입력하세요.')
    const existing = await dailyQuizRepository.findByDate(programId, data.date)
    if (existing) throw new Error('해당 날짜에 이미 퀴즈가 등록되어 있습니다.')
    return dailyQuizRepository.create(academyId, programId, { ...data, question })
  },

  deleteQuiz(id: string, academyId: string) {
    return dailyQuizRepository.delete(id, academyId)
  },
}
