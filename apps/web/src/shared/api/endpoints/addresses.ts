import { api } from '../client'
import type { AddressSummary, CreateAddressRequest, UpdateAddressRequest } from '../dto.types'

export const addressesApi = {
  list: () =>
    api.get<{ addresses: AddressSummary[] }>('/api/users/me/addresses')
      .then(r => r.addresses),

  create: (body: CreateAddressRequest) =>
    api.post<{ address: AddressSummary }>('/api/users/me/addresses', body)
      .then(r => r.address),

  update: (id: string, body: UpdateAddressRequest) =>
    api.patch<{ address: AddressSummary }>(`/api/users/me/addresses/${id}`, body)
      .then(r => r.address),

  delete: (id: string) =>
    api.delete<void>(`/api/users/me/addresses/${id}`),

  setDefault: (id: string) =>
    api.patch<{ address: AddressSummary }>(`/api/users/me/addresses/${id}/default`, {})
      .then(r => r.address),
}
