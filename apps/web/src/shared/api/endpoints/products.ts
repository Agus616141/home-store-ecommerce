import { api } from '../client'
import type {
  ProductDetail,
  ProductSummary,
  ProductListParams,
  ProductListResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '../dto.types'

function buildQuery(params: ProductListParams): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

export const productsApi = {
  list: (params: ProductListParams = {}) =>
    api.get<ProductListResponse>(`/api/products${buildQuery(params)}`),

  listAll: async (params: ProductListParams = {}, maxItems = 1000) => {
    const limit = Math.min(params.limit ?? 100, 100)
    const first = await productsApi.list({ ...params, page: 1, limit })
    const products = [...first.products]
    const totalPages = Math.ceil(first.total / limit)

    for (let page = 2; page <= totalPages && products.length < maxItems; page += 1) {
      const next = await productsApi.list({ ...params, page, limit })
      products.push(...next.products)
    }

    return {
      ...first,
      products: products.slice(0, maxItems),
      total: first.total,
      page: 1,
      limit,
    }
  },

  getFeatured: () =>
    api.get<{ product: ProductSummary }>('/api/products/featured')
      .then(r => r.product),

  getBySlug: (slug: string) =>
    api.get<{ product: ProductDetail }>(`/api/products/${slug}`)
      .then(r => r.product),

  create: (body: CreateProductRequest) =>
    api.post<{ product: ProductSummary }>('/api/products', body)
      .then(r => r.product),

  update: (id: string, body: UpdateProductRequest) =>
    api.patch<{ product: ProductSummary }>(`/api/products/${id}`, body)
      .then(r => r.product),

  remove: (id: string) =>
    api.delete<void>(`/api/products/${id}`),
}
