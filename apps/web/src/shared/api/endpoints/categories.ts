import { api } from '../client'
import type { CategoryListResponse, CategorySummary, CreateCategoryRequest } from '../dto.types'

export const categoriesApi = {
  list: () => api.get<CategoryListResponse>('/api/categories'),

  create: (body: CreateCategoryRequest) =>
    api.post<{ category: CategorySummary }>('/api/categories', body)
      .then(r => r.category),

  delete: (id: string) =>
    api.delete<void>(`/api/categories/${id}`),
}
