export const VALID_LIMITS = [10, 20, 50, 100] as const
export type PageLimit = (typeof VALID_LIMITS)[number]

export function parsePaginationParams(searchParams: { page?: string; limit?: string }) {
  const limit = (VALID_LIMITS as readonly number[]).includes(Number(searchParams.limit))
    ? (Number(searchParams.limit) as PageLimit)
    : 10
  const page = Math.max(1, Number(searchParams.page) || 1)
  return { page, limit }
}

export function paginateArray<T>(items: T[], page: number, limit: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  return {
    items: items.slice(start, start + limit),
    page: safePage,
    total,
    totalPages,
  }
}
