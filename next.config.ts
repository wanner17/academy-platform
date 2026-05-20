import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
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
      ],
    }
  },
}

export default nextConfig
