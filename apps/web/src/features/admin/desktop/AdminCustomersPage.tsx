import { useState, useEffect, useRef } from 'react'
import { usersApi } from '../../../shared/api/endpoints'
import { Spinner } from '../../../shared/ui/Spinner'
import { formatDate } from '../../../shared/lib/format-date'
import { useAuthStore, selectUser } from '../../../shared/stores/auth.store'
import type { UserSummary } from '../../../shared/api/dto.types'

/* ── Role badge ─────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: UserSummary['role'] }) {
  const isAdmin = role === 'ADMIN'
  return (
    <span
      className="text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]"
      style={
        isAdmin
          ? { background: 'var(--color-ink)', color: 'var(--color-cream)' }
          : { background: 'var(--color-cream-2)', color: 'var(--color-ink-soft)' }
      }
    >
      {isAdmin ? 'Admin' : 'Cliente'}
    </span>
  )
}

/* ── Avatar initials ────────────────────────────────────────────────────── */
function Avatar({ user }: { user: UserSummary }) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
  // Deterministic hue from id
  const hue = Array.from(user.id).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-[13px] font-bold text-white"
      style={{ background: `hsl(${hue},40%,50%)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

/* ── Inline confirm ─────────────────────────────────────────────────────── */
function InlineConfirm({
  message,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  message: React.ReactNode
  confirmLabel: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[13px]" style={{ color: 'var(--color-ink)' }}>{message}</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="text-[12px] font-bold px-3 py-[5px] rounded-[8px] transition-colors disabled:opacity-50"
        style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
      >
        {loading ? '…' : confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[12px] font-medium px-3 py-[5px] rounded-[8px] border transition-colors"
        style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-soft)' }}
      >
        Cancelar
      </button>
    </div>
  )
}

/* ── User row ────────────────────────────────────────────────────────────── */
function UserRow({
  user,
  isSelf,
  onRoleChanged,
}: {
  user: UserSummary
  isSelf: boolean
  onRoleChanged: (id: string, newRole: UserSummary['role']) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy]             = useState(false)
  const [error, setError]           = useState('')

  const targetRole: UserSummary['role'] = user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN'

  async function handleConfirm() {
    setBusy(true)
    setError('')
    try {
      const updated = await usersApi.updateRole(user.id, targetRole)
      onRoleChanged(user.id, updated.role)
      setConfirming(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cambiar rol.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr
      className="border-b hover:bg-[var(--color-cream-2)] transition-colors"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper)' }}
    >
      {/* Avatar + nombre */}
      <td className="px-5 py-[13px]">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div>
            <div className="font-semibold text-[14px] flex items-center gap-2">
              {user.firstName} {user.lastName}
              {isSelf && (
                <span
                  className="text-[10.5px] font-bold uppercase px-[7px] py-[2px] rounded-full"
                  style={{ background: 'var(--color-terra-soft)', color: 'var(--color-terra)' }}
                >
                  Tú
                </span>
              )}
            </div>
            <div className="mono text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>
              {user.email}
            </div>
          </div>
        </div>
      </td>

      {/* Rol */}
      <td className="px-5 py-[13px]">
        <RoleBadge role={user.role} />
      </td>

      {/* Pedidos */}
      <td className="px-5 py-[13px] text-[14px] font-semibold text-center" style={{ color: 'var(--color-ink-2)' }}>
        {user._count?.orders ?? 0}
      </td>

      {/* Teléfono */}
      <td className="px-5 py-[13px] text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>
        {user.phone ?? '—'}
      </td>

      {/* Registro */}
      <td className="px-5 py-[13px] mono text-[12.5px]" style={{ color: 'var(--color-ink-soft)' }}>
        {formatDate(user.createdAt)}
      </td>

      {/* Acciones */}
      <td className="px-5 py-[13px]">
        {isSelf ? (
          <span className="text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>Tu cuenta</span>
        ) : confirming ? (
          <InlineConfirm
            message={
              <>¿Cambiar a <strong>{targetRole === 'ADMIN' ? 'Admin' : 'Cliente'}</strong>?</>
            }
            confirmLabel={targetRole === 'ADMIN' ? 'Sí, dar admin' : 'Sí, quitar admin'}
            loading={busy}
            onConfirm={handleConfirm}
            onCancel={() => { setConfirming(false); setError('') }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-[12.5px] font-semibold px-3 py-[6px] rounded-[8px] border transition-colors hover:border-[var(--color-ink)]"
            style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
          >
            {user.role === 'ADMIN' ? '↓ Quitar admin' : '↑ Hacer admin'}
          </button>
        )}
        {error && (
          <p className="text-[11.5px] mt-1" style={{ color: 'var(--color-terra)' }}>{error}</p>
        )}
      </td>
    </tr>
  )
}

/* ── KPI card ───────────────────────────────────────────────────────────── */
function Kpi({ value, label, loading }: { value: number; label: string; loading: boolean }) {
  return (
    <div className="rounded-[16px] p-5" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
      {loading
        ? <div className="h-9 flex items-center"><Spinner size="sm" /></div>
        : <div className="font-serif font-semibold text-[36px] leading-none">{value}</div>
      }
      <div className="text-[12.5px] mt-1" style={{ color: 'var(--color-ink-soft)' }}>{label}</div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 20

export function AdminCustomersPage() {
  const currentUser = useAuthStore(selectUser)

  const [users, setUsers]       = useState<UserSummary[]>([])
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [page, setPage]         = useState(1)
  const [q, setQ]               = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'' | 'CUSTOMER' | 'ADMIN'>('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(val: string) {
    setQ(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(val)
      setPage(1)
    }, 350)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    usersApi
      .list({
        page,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        role: roleFilter || undefined,
      })
      .then(res => {
        if (cancelled) return
        setUsers(res.users)
        setTotal(res.total)
        setPages(res.pages ?? Math.ceil(res.total / PAGE_SIZE))
      })
      .catch(e => {
        if (!cancelled) setError(e.message ?? 'Error al cargar usuarios.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, debouncedQ, roleFilter])

  function handleRoleChanged(id: string, newRole: UserSummary['role']) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
  }

  const adminCount    = users.filter(u => u.role === 'ADMIN').length
  const customerCount = users.filter(u => u.role === 'CUSTOMER').length

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      {/* Header */}
      <div className="mb-[24px]">
        <span className="eyebrow muted">Gestión</span>
        <h1 className="h2 mt-[6px]">Clientes</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-[28px]">
        <Kpi value={total}         label="Usuarios registrados" loading={loading} />
        <Kpi value={adminCount}    label="Admins (página actual)" loading={loading} />
        <Kpi value={customerCount} label="Clientes (página actual)" loading={loading} />
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center mb-[20px] flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-[380px]">
          <svg
            className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
            style={{ color: 'var(--color-ink-soft)' }} aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre o email…"
            value={q}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded-full text-[14px] font-sans outline-none"
            style={{
              background: 'var(--color-paper)',
              border: '1px solid var(--color-line-2)',
              padding: '10px 14px 10px 36px',
            }}
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value as '' | 'CUSTOMER' | 'ADMIN')
              setPage(1)
            }}
            className="appearance-none font-sans text-[14px] font-medium rounded-full cursor-pointer outline-none pr-[34px] pl-[14px] py-[10px]"
            style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)', color: 'var(--color-ink)' }}
          >
            <option value="">Todos los roles</option>
            <option value="CUSTOMER">Solo clientes</option>
            <option value="ADMIN">Solo admins</option>
          </select>
          <svg
            className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none"
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--color-ink-soft)' }} aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <span className="text-[13.5px] ml-auto" style={{ color: 'var(--color-ink-soft)' }}>
          {loading
            ? 'Cargando…'
            : <><strong style={{ color: 'var(--color-ink)' }}>{total}</strong> usuarios</>
          }
        </span>
      </div>

      {/* Table */}
      {error ? (
        <div
          className="rounded-[16px] p-8 text-center text-[14px]"
          style={{ border: '1px solid var(--color-line)', color: 'var(--color-terra)' }}
        >
          {error}
        </div>
      ) : (
        <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-cream-2)' }}>
                  {['Usuario', 'Rol', 'Pedidos', 'Teléfono', 'Registro', 'Acciones'].map(h => (
                    <th
                      key={h}
                      className="text-left text-[11.5px] tracking-[.06em] uppercase font-bold px-5 py-[13px] border-b"
                      style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-line)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-[60px] text-center">
                      <Spinner size="lg" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-[60px] text-center text-[14px]"
                      style={{ color: 'var(--color-ink-soft)' }}
                    >
                      {debouncedQ || roleFilter
                        ? 'Sin resultados para ese filtro.'
                        : 'No hay usuarios registrados aún.'}
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.id === currentUser?.id}
                      onRoleChanged={handleRoleChanged}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <nav className="flex justify-center gap-[6px] mt-[32px]" aria-label="Páginas">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="min-w-[40px] h-[40px] grid place-items-center rounded-[10px] border text-[14px] font-semibold transition-colors hover:border-[var(--color-ink)] disabled:opacity-30"
            style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
          >
            ‹
          </button>

          {(() => {
            const range: number[] = []
            const delta = 2
            for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
              range.push(i)
            }
            if (range[0]! > 1) range.unshift(1)
            if (range[range.length - 1]! < pages) range.push(pages)
            return range.map((p, i) => {
              const prev = range[i - 1]
              const gap = prev !== undefined && p - prev > 1
              return (
                <span key={p} className="flex items-center gap-[6px]">
                  {gap && (
                    <span className="min-w-[40px] h-[40px] grid place-items-center text-[14px]" style={{ color: 'var(--color-ink-soft)' }}>…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className="min-w-[40px] h-[40px] grid place-items-center rounded-[10px] border text-[14px] font-semibold transition-colors hover:border-[var(--color-ink)]"
                    style={
                      p === page
                        ? { background: 'var(--color-ink)', color: 'var(--color-cream)', borderColor: 'var(--color-ink)' }
                        : { borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }
                    }
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </span>
              )
            })
          })()}

          <button
            type="button"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="min-w-[40px] h-[40px] grid place-items-center rounded-[10px] border text-[14px] font-semibold transition-colors hover:border-[var(--color-ink)] disabled:opacity-30"
            style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
