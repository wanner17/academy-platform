const allowedTags = new Set(['a', 'b', 'blockquote', 'br', 'div', 'em', 'h2', 'h3', 'img', 'li', 'ol', 'p', 'strong', 'u', 'ul'])

export function sanitizeRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (match, tagName, attributes) => {
      const tag = String(tagName).toLowerCase()
      if (!allowedTags.has(tag)) return ''
      if (tag === 'a' && !match.startsWith('</')) {
        const href = String(attributes).match(/\s+href=(["'])(.*?)\1/i)?.[2] ?? ''
        if (!href || /^javascript:/i.test(href)) return '<a>'
        return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
      }
      if (tag === 'img') {
        if (match.startsWith('</')) return ''
        const src = String(attributes).match(/\s+src=(["'])(.*?)\1/i)?.[2] ?? ''
        if (!isSafeImageSource(src)) return ''
        const alt = String(attributes).match(/\s+alt=(["'])(.*?)\1/i)?.[2] ?? ''
        return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" style="max-width:100%;height:auto;">`
      }
      return match.startsWith('</') ? `</${tag}>` : `<${tag}>`
    })
    .trim()
}

export function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h2|h3)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function isSafeImageSource(value: string) {
  return /^(https?:\/\/|\/)/i.test(value) && !/^javascript:/i.test(value)
}
