export const DEFAULT_PUBLIC_SLUG = process.env.NEXT_PUBLIC_DEFAULT_ACADEMY_SLUG ?? 'demo'

export function publicPath(slug: string, path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : ''
  if (slug === DEFAULT_PUBLIC_SLUG) return normalizedPath || '/'
  return `/${slug}${normalizedPath}`
}

export function adminPath(slug: string, path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : ''
  if (slug === DEFAULT_PUBLIC_SLUG) return `/admin${normalizedPath}`
  return `/admin/${slug}${normalizedPath}`
}

export function studentPath(slug: string, path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : ''
  if (slug === DEFAULT_PUBLIC_SLUG) return `/student${normalizedPath}`
  return `/student/${slug}${normalizedPath}`
}
