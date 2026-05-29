import { prisma } from '@/lib/db/prisma'

export type CreateQuizInput = {
  date: Date
  question: string
  answer: boolean
  explanation?: string
}

export const dailyQuizRepository = {
  findByDate(academyId: string, date: Date) {
    return prisma.dailyQuiz.findUnique({
      where: { academyId_date: { academyId, date } },
    })
  },

  findAllByAcademy(academyId: string) {
    return prisma.dailyQuiz.findMany({
      where: { academyId },
      include: { _count: { select: { attempts: true } } },
      orderBy: { date: 'desc' },
    })
  },

  findAttempt(quizId: string, studentId: string) {
    return prisma.dailyQuizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
    })
  },

  create(academyId: string, data: CreateQuizInput) {
    return prisma.dailyQuiz.create({ data: { ...data, academyId } })
  },

  createAttempt(academyId: string, quizId: string, studentId: string, answer: boolean, isCorrect: boolean) {
    return prisma.dailyQuizAttempt.create({
      data: { academyId, quizId, studentId, answer, isCorrect },
    })
  },

  delete(id: string, academyId: string) {
    return prisma.dailyQuiz.delete({ where: { id, academyId } })
  },

  async getRanking(academyId: string) {
    const [students, correctAttempts] = await Promise.all([
      prisma.student.findMany({
        where: { academyId, isActive: true },
        select: { id: true, name: true },
      }),
      prisma.dailyQuizAttempt.groupBy({
        by: ['studentId'],
        where: { academyId, isCorrect: true },
        _count: { id: true },
      }),
    ])

    const pointsMap = new Map(correctAttempts.map((a) => [a.studentId, a._count.id]))

    return students
      .map((s) => ({ id: s.id, name: s.name, points: pointsMap.get(s.id) ?? 0 }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'ko'))
  },
}
