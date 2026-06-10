import { useAuthStore } from '../stores/auth.store'

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean; _isRetry?: boolean }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, _isRetry = false, ...init } = options

  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' })

  if (res.status === 401 && !skipAuth && !_isRetry) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true })
    }
    useAuthStore.getState().clearSession()
    throw new ApiError(401, 'Session expired')
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { message?: string }
      message = body.message ?? message
    } catch {
      // body no es JSON — usar statusText
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  const json = (await res.json()) as { data: T }
  return json.data
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const json = (await res.json()) as { data: { accessToken: string } }
    useAuthStore.getState().setAccessToken(json.data.accessToken)
    return true
  } catch {
    return false
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),

  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
