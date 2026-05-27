import { prisma } from '@/lib/db/prisma'

export type CreateMessageInput = {
  receiverIds: string[]
  content: string
  link?: string
}

export const messageRepository = {
  async createMany(academyId: string, senderId: string, input: CreateMessageInput) {
    const data = input.receiverIds.map((receiverId) => ({
      academyId,
      senderId,
      receiverId,
      content: input.content,
      link: input.link,
    }))
    return prisma.message.createMany({ data })
  },

  async findInbox(academyId: string, receiverId: string) {
    return prisma.message.findMany({
      where: { academyId, receiverId, deletedByReceiver: false },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    })
  },

  async findSent(academyId: string, senderId: string) {
    return prisma.message.findMany({
      where: { academyId, senderId, deletedBySender: false },
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: { select: { id: true, name: true, role: true } },
      },
    })
  },

  async markRead(id: string, receiverId: string) {
    return prisma.message.updateMany({
      where: { id, receiverId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  },

  async countUnread(receiverId: string, academyId: string) {
    return prisma.message.count({ where: { receiverId, academyId, isRead: false, deletedByReceiver: false } })
  },

  async deleteForReceiver(id: string, receiverId: string) {
    return prisma.message.updateMany({
      where: { id, receiverId },
      data: { deletedByReceiver: true },
    })
  },

  async deleteForSender(id: string, senderId: string) {
    const msg = await prisma.message.findFirst({ where: { id, senderId } })
    if (!msg) return
    return prisma.message.update({
      where: { id },
      data: {
        deletedBySender: true,
        ...(!msg.isRead && { deletedByReceiver: true }),
      },
    })
  },
}
