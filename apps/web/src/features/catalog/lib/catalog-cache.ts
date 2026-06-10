import type { ProductListParams, ProductListResponse } from '../../../shared/api/dto.types'

const CACHE_TTL_MS = 5 * 60 * 1000

interface CatalogCacheEntry {
  data: ProductListResponse
  expiresAt: number
}

const pageCache = new Map<string, CatalogCacheEntry>()
const inflightRequests = new Map<string, Promise<ProductListResponse>>()

function normalizeParams(params: ProductListParams): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    normalized[key] = String(value)
  }
  return normalized
}

function makeCacheKey(params: ProductListParams): string {
  const normalized = normalizeParams(params)
  const query = new URLSearchParams()

  for (const key of Object.keys(normalized).sort()) {
    const value = normalized[key]
    if (value) query.set(key, value)
  }

  return query.toString()
}

function getFreshEntry(key: string): CatalogCacheEntry | undefined {
  const entry = pageCache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    pageCache.delete(key)
    return undefined
  }
  return entry
}

export function getCachedCatalogPage(params: ProductListParams): ProductListResponse | undefined {
  return getFreshEntry(makeCacheKey(params))?.data
}

export async function fetchCachedCatalogPage(
  params: ProductListParams,
  fetcher: (params: ProductListParams) => Promise<ProductListResponse>,
): Promise<ProductListResponse> {
  const key = makeCacheKey(params)
  const cached = getFreshEntry(key)
  if (cached) return cached.data

  const pending = inflightRequests.get(key)
  if (pending) return pending

  const request = fetcher(params)
    .then((data) => {
      pageCache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      })
      return data
    })
    .finally(() => {
      inflightRequests.delete(key)
    })

  inflightRequests.set(key, request)
  return request
}

export async function prefetchCatalogPage(
  params: ProductListParams,
  fetcher: (params: ProductListParams) => Promise<ProductListResponse>,
): Promise<void> {
  const key = makeCacheKey(params)
  if (getFreshEntry(key) || inflightRequests.has(key)) return
  await fetchCachedCatalogPage(params, fetcher)
}
