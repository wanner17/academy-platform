export type VideoPreview =
  | { kind: 'embed'; src: string }
  | { kind: 'file'; src: string }
  | null

export function getVideoPreview(url: string | null | undefined): VideoPreview {
  const value = url?.trim()
  if (!value) return null

  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? { kind: 'embed', src: `https://www.youtube.com/embed/${id}` } : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v') ?? parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1]
      return id ? { kind: 'embed', src: `https://www.youtube.com/embed/${id}` } : null
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}` } : null
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(value)) {
      return { kind: 'file', src: value }
    }
  } catch {
    if (/^\/.+\.(mp4|webm|ogg)(\?.*)?$/i.test(value)) return { kind: 'file', src: value }
  }

  return null
}

export function parseVideoUrls(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
}
