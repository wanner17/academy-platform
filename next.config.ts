import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async redirects() {
    const slug = process.env.NEXT_PUBLIC_DEFAULT_ACADEMY_SLUG ?? 'demo'

    return [
      { source: `/${slug}`, destination: '/', permanent: false },
      { source: `/${slug}/:path*`, destination: '/:path*', permanent: false },
      { source: `/admin/${slug}`, destination: '/admin', permanent: false },
      { source: `/admin/${slug}/:path*`, destination: '/admin/:path*', permanent: false },
      { source: `/student/${slug}`, destination: '/student', permanent: false },
      { source: `/student/${slug}/:path*`, destination: '/student/:path*', permanent: false },
    ]
  },
  async rewrites() {
    const slug = process.env.NEXT_PUBLIC_DEFAULT_ACADEMY_SLUG ?? 'demo'

    return {
      beforeFiles: [
        { source: '/', destination: `/${slug}` },
        { source: '/login', destination: `/${slug}/login` },
        { source: '/programs', destination: `/${slug}/programs` },
        { source: '/programs/:path*', destination: `/${slug}/programs/:path*` },
        { source: '/teachers', destination: `/${slug}/teachers` },
        { source: '/teachers/:path*', destination: `/${slug}/teachers/:path*` },
        { source: '/gallery', destination: `/${slug}/gallery` },
        { source: '/schedule', destination: `/${slug}/schedule` },
        { source: '/notices', destination: `/${slug}/notices` },
        { source: '/notices/:path*', destination: `/${slug}/notices/:path*` },
        { source: '/contact', destination: `/${slug}/contact` },
        { source: '/admin', destination: `/admin/${slug}` },
        { source: '/admin/settings/:path*', destination: `/admin/${slug}/settings/:path*` },
        { source: '/admin/programs/:path*', destination: `/admin/${slug}/programs/:path*` },
        { source: '/admin/attendance/:path*', destination: `/admin/${slug}/attendance/:path*` },
        { source: '/admin/tests/:path*', destination: `/admin/${slug}/tests/:path*` },
        { source: '/admin/teachers/:path*', destination: `/admin/${slug}/teachers/:path*` },
        { source: '/admin/students/:path*', destination: `/admin/${slug}/students/:path*` },
        { source: '/admin/notices/:path*', destination: `/admin/${slug}/notices/:path*` },
        { source: '/admin/inquiries/:path*', destination: `/admin/${slug}/inquiries/:path*` },
        { source: '/admin/profile/:path*', destination: `/admin/${slug}/profile/:path*` },
        { source: '/admin/schedule/:path*', destination: `/admin/${slug}/schedule/:path*` },
        { source: '/admin/my/:path*', destination: `/admin/${slug}/my/:path*` },
        { source: '/admin/messages', destination: `/admin/${slug}/messages` },
        { source: '/admin/messages/:path*', destination: `/admin/${slug}/messages/:path*` },
        { source: '/admin/analytics', destination: `/admin/${slug}/analytics` },
        { source: '/student', destination: `/student/${slug}` },
        { source: '/student/messages', destination: `/student/${slug}/messages` },
      ],
    }
  },
}

export default nextConfig
