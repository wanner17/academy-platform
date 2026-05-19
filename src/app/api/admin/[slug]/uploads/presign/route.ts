import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { getR2StorageProvider } from '@/lib/storage'
import { assertAllowedUpload, sanitizeUploadName } from '@/lib/uploads/file-policy'

const maxFileSize = 1024 * 1024 * 1024

type PresignRouteProps = {
  params: Promise<{ slug: string }>
}

export async function POST(request: Request, { params }: PresignRouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  const { academy } = await requireAcademyAdmin(session, slug)
  const body = await request.json()
  const filename = sanitizeUploadName(String(body.filename ?? 'attachment'))
  const contentType = String(body.contentType ?? 'application/octet-stream')
  const size = Number(body.size ?? 0)

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: 'Invalid file size' }, { status: 400 })
  }
  if (size > maxFileSize) {
    return NextResponse.json({ error: 'File is too large' }, { status: 400 })
  }
  if (process.env.STORAGE_DRIVER !== 'r2') {
    return NextResponse.json({ error: 'R2 storage is not enabled' }, { status: 400 })
  }
  try {
    assertAllowedUpload(filename, contentType)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'File type is not allowed' }, { status: 400 })
  }

  const objectKey = `notices/${academy.id}/${randomUUID()}-${filename}`
  const upload = await getR2StorageProvider().createPresignedUploadUrl({
    objectKey,
    contentType,
  })

  return NextResponse.json({
    ...upload,
    displayName: filename,
    mimeType: contentType,
    size,
  })
}
