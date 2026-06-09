import { prisma } from '@/lib/db/prisma'

export type CreateQuizInput = {
  date: Date
  question: string
  answer: boolean
  explanation?: string
}

export const dailyQuizRepository = {
  findByDate(programId: string, date: Date) {
    return prisma.dailyQuiz.findUnique({
      where: { programId_date: { programId, date } },
    })
  },

  findAllByProgram(programId: string) {
    return prisma.dailyQuiz.findMany({
      where: { programId },
      include: { _count: { select: { attempts: true } } },
      orderBy: { date: 'desc' },
    })
  },

  findAttempt(quizId: string, studentId: string) {
    return prisma.dailyQuizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
    })
  },

  create(academyId: string, programId: string, data: CreateQuizInput) {
    return prisma.dailyQuiz.create({ data: { ...data, academyId, programId } })
  },

  createAttempt(academyId: string, quizId: string, studentId: string, answer: boolean, isCorrect: boolean) {
    return prisma.dailyQuizAttempt.create({
      data: { academyId, quizId, studentId, answer, isCorrect },
    })
  },

  delete(id: string, academyId: string) {
    return prisma.dailyQuiz.delete({ where: { id, academyId } })
  },

  async getRanking(programId: string) {
    const quizIds = await prisma.dailyQuiz.findMany({
      where: { programId },
      select: { id: true },
    })

    const [enrollments, correctAttempts] = await Promise.all([
      prisma.enrollment.findMany({
        where: { programId, status: 'ACTIVE' },
        include: { student: { select: { id: true, name: true } } },
      }),
      prisma.dailyQuizAttempt.groupBy({
        by: ['studentId'],
        where: { quizId: { in: quizIds.map((q) => q.id) }, isCorrect: true },
        _count: { id: true },
      }),
    ])

    const pointsMap = new Map(correctAttempts.map((a) => [a.studentId, a._count.id]))

    return enrollments
      .map((e) => ({ id: e.student.id, name: e.student.name, points: pointsMap.get(e.student.id) ?? 0 }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'ko'))
  },
}
