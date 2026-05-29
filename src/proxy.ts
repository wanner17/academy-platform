import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const DEFAULT_ACADEMY_SLUG = process.env.NEXT_PUBLIC_DEFAULT_ACADEMY_SLUG ?? 'demo'
const DEFAULT_STUDENT_PATHS = new Set([
  'messages',
])

const DEFAULT_ADMIN_PATHS = new Set([
  'attendance',
  'inquiries',
  'messages',
  'my',
  'notices',
  'profile',
  'programs',
  'quiz',
  'schedule',
  'settings',
  'students',
  'teachers',
  'tests',
])

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${pathname}`, req.url))
    }

    const slug = getAdminAcademySlug(pathname)
    if (token.academySlug !== slug && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  if (pathname === '/student' || pathname.startsWith('/student/')) {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${pathname}`, req.url))
    }

    const slugSegment = pathname.split('/')[2]
    const slug = !slugSegment || DEFAULT_STUDENT_PATHS.has(slugSegment) ? DEFAULT_ACADEMY_SLUG : slugSegment
    if (token.academySlug !== slug || token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

function getAdminAcademySlug(pathname: string) {
  const segment = pathname.split('/')[2]
  if (!segment || DEFAULT_ADMIN_PATHS.has(segment)) return DEFAULT_ACADEMY_SLUG
  return segment
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*'],
}
