import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { messageService } from '@/lib/services/message.service'

type RouteProps = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: RouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)

  const [inbox, sent] = await Promise.all([
    messageService.getInbox(academy.id, user.id),
    messageService.getSent(academy.id, user.id),
  ])
  return NextResponse.json({ inbox, sent })
}

export async function POST(req: Request, { params }: RouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)

  const body = await req.json()
  const { receiverIds, content } = body as { receiverIds: string[]; content: string }

  await messageService.sendMessage(academy.id, user.id, receiverIds, content)
  return NextResponse.json({ ok: true })
}
