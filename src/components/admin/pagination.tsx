import { VALID_LIMITS } from '@/lib/utils/pagination'

type PaginationProps = {
  basePath: string
  limit: number
  page: number
  searchParams: Record<string, string | undefined>
  total: number
  totalPages: number
}

function buildUrl(basePath: string, params: Record<string, string | undefined>, overrides: Record<string, string>) {
  const merged = { ...params, ...overrides }
  const query = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&')
  return query ? `${basePath}?${query}` : basePath
}

function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function Pagination({ basePath, limit, page, searchParams, total, totalPages }: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pages = pageNumbers(page, totalPages)

  const linkClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded border px-2 text-sm hover:bg-slate-50'
  const activeClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded border border-blue-700 bg-blue-700 px-2 text-sm text-white'
  const disabledClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded border px-2 text-sm text-slate-300 pointer-events-none'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span>페이지당</span>
        {VALID_LIMITS.map((l) => (
          l === limit ? (
            <span key={l} className="rounded border border-blue-700 bg-blue-700 px-2 py-0.5 text-xs font-medium text-white">{l}</span>
          ) : (
            <a key={l} className="rounded border px-2 py-0.5 text-xs hover:bg-slate-50" href={buildUrl(basePath, searchParams, { limit: String(l), page: '1' })}>
              {l}
            </a>
          )
        ))}
        <span className="ml-1 text-slate-400">{start}–{end} / 총 {total}개</span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <a className={linkClass} href={buildUrl(basePath, searchParams, { page: String(page - 1) })}>‹</a>
          ) : (
            <span className={disabledClass}>‹</span>
          )}

          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1">…</span>
            ) : p === page ? (
              <span key={p} className={activeClass}>{p}</span>
            ) : (
              <a key={p} className={linkClass} href={buildUrl(basePath, searchParams, { page: String(p) })}>
                {p}
              </a>
            )
          )}

          {page < totalPages ? (
            <a className={linkClass} href={buildUrl(basePath, searchParams, { page: String(page + 1) })}>›</a>
          ) : (
            <span className={disabledClass}>›</span>
          )}
        </div>
      )}
    </div>
  )
}
