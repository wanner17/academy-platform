import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${pathname}`, req.url))
    }

    const slug = pathname.split('/')[2]
    if (token.academySlug !== slug && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  if (pathname.startsWith('/student/')) {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${pathname}`, req.url))
    }

    const slug = pathname.split('/')[2]
    if (token.academySlug !== slug || token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*'],
}
