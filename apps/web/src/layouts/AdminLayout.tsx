import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuthStore, selectUser } from '../shared/stores/auth.store'
import { ScrollToTop } from '../app/ScrollToTop'

const ADMIN_NAV = [
  {
    label: 'Dashboard',
    to: '/admin',
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
]

const ADMIN_NAV_CATALOG = [
  {
    label: 'Productos',
    to: '/admin/products',
    count: 248,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 7l9-4 9 4-9 4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    ),
  },
  {
    label: 'Categorías',
    to: '/admin/categories',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    label: 'Inventario',
    to: '/admin/inventory',
    countAlert: 7,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M20 7L4 7M16 12H4M12 17H4" />
      </svg>
    ),
  },
]

const ADMIN_NAV_SALES = [
  {
    label: 'Pedidos',
    to: '/admin/orders',
    count: 38,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 2h9l4 4v16H6z" />
        <path d="M9 7h5M9 11h7M9 15h7" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    to: '/admin/customers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 21c0-3.5 3-5.5 6-5.5s6 2 6 5.5" />
        <path d="M16 15.5c2.5.3 5 2.2 5 5.5" />
      </svg>
    ),
  },
]

type NavItem = {
  label: string
  to: string
  end?: boolean
  count?: number
  countAlert?: number
  icon: React.ReactNode
}

function AdminNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-[10px] rounded-[9px] text-[14px] font-medium transition-colors ${
          isActive
            ? 'text-white'
            : 'hover:bg-white/[.06]'
        }`
      }
      style={({ isActive }) => ({
        color: isActive ? '#fff' : 'rgba(244,239,230,.72)',
        background: isActive ? 'var(--color-terra)' : undefined,
      })}
    >
      <span style={{ opacity: 0.8 }}>{item.icon}</span>
      {item.label}
      {item.count !== undefined && (
        <span
          className="ml-auto text-[11px] rounded-[20px] px-[7px] py-[1px] font-semibold"
          style={{ background: 'rgba(255,255,255,.14)' }}
        >
          {item.count}
        </span>
      )}
      {item.countAlert !== undefined && (
        <span
          className="ml-auto text-[11px] rounded-[20px] px-[7px] py-[1px] font-semibold text-white"
          style={{ background: 'var(--color-terra)' }}
        >
          {item.countAlert}
        </span>
      )}
    </NavLink>
  )
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore(selectUser)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-cream)' }}>
      <ScrollToTop />

      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col sticky top-0 h-screen shrink-0"
        style={{
          width: 248,
          background: 'var(--color-ink)',
          color: 'var(--color-cream)',
          padding: '24px 16px',
        }}
      >
        <Link
          to="/admin"
          className="font-serif font-semibold text-[24px] flex items-center gap-[9px] pb-[22px]"
          style={{ color: 'var(--color-cream)' }}
        >
          Casa
          <span
            className="inline-block rounded-full mb-[14px]"
            style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
            aria-hidden="true"
          />
          <span
            className="font-sans text-[10px] tracking-[.18em] block mt-[2px] font-semibold"
            style={{ color: 'var(--color-gold)', marginBottom: 14 }}
          >
            Panel admin
          </span>
        </Link>

        <nav className="flex flex-col gap-[3px] flex-1" aria-label="Navegación del panel">
          {ADMIN_NAV.map(item => <AdminNavItem key={item.to} item={item} />)}

          <span
            className="text-[10.5px] tracking-[.16em] uppercase px-3 pt-[14px] pb-[6px] font-semibold"
            style={{ color: 'rgba(244,239,230,.40)' }}
          >
            Catálogo
          </span>
          {ADMIN_NAV_CATALOG.map(item => <AdminNavItem key={item.to} item={item} />)}

          <span
            className="text-[10.5px] tracking-[.16em] uppercase px-3 pt-[14px] pb-[6px] font-semibold"
            style={{ color: 'rgba(244,239,230,.40)' }}
          >
            Ventas
          </span>
          {ADMIN_NAV_SALES.map(item => <AdminNavItem key={item.to} item={item} />)}
        </nav>

        {/* User */}
        <div
          className="flex gap-[10px] items-center px-2 pt-3 mt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,.10)' }}
        >
          <div
            className="w-[34px] h-[34px] rounded-full shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-terra-soft), #d8a98c)' }}
            aria-hidden="true"
          />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--color-cream)' }}>
              {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(244,239,230,.50)' }}>
              Administrador
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="flex justify-between items-center sticky top-0 z-10"
          style={{
            padding: '18px 32px',
            background: 'var(--color-paper)',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          {/* Mobile menu button */}
          <button
            className="md:hidden mr-3 p-2 rounded-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir menú admin"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-[320px]">
            <svg
              className="absolute left-[13px] top-1/2 -translate-y-1/2"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
              style={{ color: 'var(--color-ink-soft)' }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder="Buscar producto, pedido o cliente…"
              className="w-full rounded-full text-[14px] font-sans outline-none"
              style={{
                background: 'var(--color-cream)',
                border: '1px solid var(--color-line-2)',
                padding: '10px 14px 10px 38px',
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-[13px] font-semibold px-4 py-2 rounded-full border transition-colors hover:border-[var(--color-ink)]"
              style={{ borderColor: 'var(--color-line-2)' }}
            >
              Ver tienda ↗
            </Link>
            <Link
              to="/admin/products/new"
              className="text-[13px] font-semibold px-4 py-2 rounded-full text-white transition-colors"
              style={{ background: 'var(--color-terra)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-terra-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-terra)')}
            >
              + Nuevo producto
            </Link>
          </div>
        </div>

        {/* Content */}
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
