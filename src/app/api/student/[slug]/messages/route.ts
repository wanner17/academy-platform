import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { requireAcademyStudent } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { messageService } from '@/lib/services/message.service'

type RouteProps = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: RouteProps) {
  const { slug } = await params
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyStudent(session, slug)

  const inbox = await messageService.getInbox(academy.id, user.id)
  return NextResponse.json({ inbox })
}
