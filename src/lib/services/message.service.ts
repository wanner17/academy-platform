import { prisma } from '@/lib/db/prisma'
import { messageRepository } from '@/lib/repositories/message.repository'

export const messageService = {
  async sendMessage(academyId: string, senderId: string, receiverIds: string[], content: string, link?: string) {
    if (!content.trim()) throw new Error('내용을 입력해주세요')
    if (!receiverIds.length) throw new Error('수신자를 선택해주세요')
    return messageRepository.createMany(academyId, senderId, {
      receiverIds,
      content: content.trim(),
      link,
    })
  },

  getInbox(academyId: string, userId: string) {
    return messageRepository.findInbox(academyId, userId)
  },

  getSent(academyId: string, userId: string) {
    return messageRepository.findSent(academyId, userId)
  },

  markRead(id: string, userId: string) {
    return messageRepository.markRead(id, userId)
  },

  countUnread(userId: string, academyId: string) {
    return messageRepository.countUnread(userId, academyId)
  },

  deleteForReceiver(id: string, userId: string) {
    return messageRepository.deleteForReceiver(id, userId)
  },

  deleteForSender(id: string, userId: string) {
    return messageRepository.deleteForSender(id, userId)
  },

  async getRecipients(academyId: string, senderRole: string, senderUserId: string) {
    if (senderRole === 'TEACHER') {
      // 담당 수업에 등록된 학생만
      const teacher = await prisma.teacher.findFirst({
        where: { academyId, userId: senderUserId },
      })
      if (!teacher) return []
      const enrollments = await prisma.enrollment.findMany({
        where: {
          status: 'ACTIVE',
          program: { teacherId: teacher.id },
        },
        include: {
          student: { include: { user: { select: { id: true, name: true } } } },
        },
      })
      return enrollments
        .filter((e) => e.student.userId)
        .map((e) => ({ id: e.student.userId!, name: e.student.name, group: '학생' }))
        .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    }

    // ADMIN/STAFF: 모든 강사 + 학생
    const [teachers, students] = await Promise.all([
      prisma.teacher.findMany({
        where: { academyId, userId: { not: null } },
        select: { userId: true, name: true },
      }),
      prisma.student.findMany({
        where: { academyId, userId: { not: null }, isActive: true },
        select: { userId: true, name: true },
      }),
    ])
    return [
      ...teachers.map((t) => ({ id: t.userId!, name: t.name, group: '강사' })),
      ...students.map((s) => ({ id: s.userId!, name: s.name, group: '학생' })),
    ]
  },
}
