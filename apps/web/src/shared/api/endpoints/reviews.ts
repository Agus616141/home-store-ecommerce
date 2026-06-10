import { api } from '../client'
import type { ReviewListResponse, Review } from '../dto.types'

interface CreateReviewBody {
  rating: number
  title?: string
  body?: string
}

export const reviewsApi = {
  list: (productId: string, page = 1) =>
    api.get<ReviewListResponse>(`/api/products/${productId}/reviews?page=${page}&limit=50`),

  create: (productId: string, body: CreateReviewBody) =>
    api.post<{ review: Review }>(`/api/products/${productId}/reviews`, body),

  delete: (reviewId: string) =>
    api.delete<void>(`/api/reviews/${reviewId}`),
}
