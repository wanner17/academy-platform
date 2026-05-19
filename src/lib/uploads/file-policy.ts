const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/vnd.hancom.hwpx',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const allowedExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'pdf',
  'docx',
  'xlsx',
  'pptx',
  'hwp',
  'hwpx',
  'mp4',
  'webm',
  'mov',
])

export function assertAllowedUpload(filename: string, mimeType: string) {
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''
  if (!allowedMimeTypes.has(mimeType) && !allowedExtensions.has(extension)) {
    throw new Error('This file type is not allowed')
  }
}

export function sanitizeUploadName(name: string) {
  return (name || 'attachment').replace(/[^a-zA-Z0-9가-힣._ -]/g, '_').trim().slice(0, 120) || 'attachment'
}
