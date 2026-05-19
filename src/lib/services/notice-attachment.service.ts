import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { getStorageProvider } from '@/lib/storage'
import { assertAllowedUpload, sanitizeUploadName } from '@/lib/uploads/file-policy'

const maxFiles = 5
const maxFileSize = 10 * 1024 * 1024
const storage = getStorageProvider()

export const noticeAttachmentService = {
  async attachUploadedObjects(
    academyId: string,
    noticeId: string,
    uploaderId: string,
    attachments: Array<{ displayName: string; mimeType: string; objectKey: string; publicUrl: string; size: number }>,
  ) {
    for (const attachment of attachments) {
      assertAllowedUpload(attachment.displayName, attachment.mimeType)
      await prisma.fileAsset.create({
        data: {
          academyId,
          noticeId,
          uploaderId,
          objectKey: attachment.objectKey,
          displayName: attachment.displayName,
          publicUrl: attachment.publicUrl,
          mimeType: attachment.mimeType,
          size: attachment.size,
          purpose: 'NOTICE_ATTACHMENT',
        },
      })
    }
  },

  async saveAttachments(academyId: string, noticeId: string, uploaderId: string, files: File[]) {
    const uploadable = files.filter((file) => file.size > 0).slice(0, maxFiles)
    if (uploadable.some((file) => file.size > maxFileSize)) throw new Error('Attachment is too large')

    for (const file of uploadable) {
      const originalName = sanitizeUploadName(file.name || 'attachment')
      const contentType = file.type || 'application/octet-stream'
      assertAllowedUpload(originalName, contentType)
      const objectKey = `notices/${academyId}/${randomUUID()}-${originalName}`
      const stored = await storage.saveObject({
        objectKey,
        data: Buffer.from(await file.arrayBuffer()),
        contentType,
      })

      await prisma.fileAsset.create({
        data: {
          academyId,
          noticeId,
          uploaderId,
          objectKey: stored.objectKey,
          displayName: originalName,
          publicUrl: stored.publicUrl,
          mimeType: contentType,
          size: file.size,
          purpose: 'NOTICE_ATTACHMENT',
        },
      })
    }
  },

  async deleteAttachment(id: string, academyId: string, noticeId: string) {
    const attachment = await prisma.fileAsset.findFirst({ where: { id, academyId, noticeId } })
    if (!attachment) throw new Error('Attachment not found')

    await prisma.fileAsset.delete({ where: { id } })
    await storage.deleteObject(attachment.objectKey)
  },

  async deleteNoticeFiles(academyId: string, noticeId: string) {
    const attachments = await prisma.fileAsset.findMany({ where: { academyId, noticeId } })
    await prisma.fileAsset.deleteMany({ where: { academyId, noticeId } })
    await Promise.all(attachments.map((attachment) => storage.deleteObject(attachment.objectKey)))
  },
}
