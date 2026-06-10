import { api } from '../client'
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../dto.types'

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', body, { skipAuth: true }),

  register: (body: RegisterRequest) =>
    api.post<AuthResponse>('/api/auth/register', body, { skipAuth: true }),

  me: () =>
    api.get<{ user: AuthUser }>('/api/auth/me'),

  logout: () =>
    api.post<void>('/api/auth/logout'),
}
