import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { messageService } from '@/lib/services/message.service'

type RouteProps = { params: Promise<{ slug: string; id: string }> }

export async function PATCH(_req: Request, { params }: RouteProps) {
  const { slug, id } = await params
  const session = await getServerSession(authConfig)
  const { user } = await requireAcademyMember(session, slug)

  await messageService.markRead(id, user.id)
  return NextResponse.json({ ok: true })
}
