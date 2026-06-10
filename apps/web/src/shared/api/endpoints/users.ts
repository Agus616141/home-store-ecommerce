import { api } from '../client'
import type { UserSummary, UserListResponse, UserListParams } from '../dto.types'

function buildQuery(params: UserListParams): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

export const usersApi = {
  list: (params: UserListParams = {}) =>
    api.get<UserListResponse>(`/api/users/admin${buildQuery(params)}`),

  updateRole: (id: string, role: 'CUSTOMER' | 'ADMIN') =>
    api.patch<{ user: UserSummary }>(`/api/users/admin/${id}`, { role })
      .then(r => r.user),
}
