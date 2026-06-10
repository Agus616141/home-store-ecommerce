import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useCartStore, selectCartCount } from '../shared/stores/cart.store'
import { useFavsStore } from '../shared/stores/favs.store'
import { useWishlistStore } from '../shared/stores/wishlist.store'
import { useAuthStore, selectIsAuthenticated, selectIsAdmin, selectUser } from '../shared/stores/auth.store'
import { authApi, cartApi } from '../shared/api/endpoints'
import { ScrollToTop } from '../app/ScrollToTop'

const NAV_LINKS = [
  { label: 'Tienda',      to: '/catalog' },
  { label: 'Living',      to: '/catalog/living' },
  { label: 'Dormitorio',  to: '/catalog/dormitorio' },
  { label: 'Decoración',  to: '/catalog/decoracion' },
  { label: 'Cocina',      to: '/catalog/cocina' },
]

const FOOTER_LINKS = {
  Empresa: [
    { label: 'Sobre Casa', to: '#' },
    { label: 'Sostenibilidad', to: '#' },
    { label: 'El taller', to: '#' },
    { label: 'Blog', to: '#' },
  ],
  Productos: [
    { label: 'Sillas', to: '/catalog?cat=sillas' },
    { label: 'Mesas', to: '/catalog?cat=mesas' },
    { label: 'Sofás', to: '/catalog?cat=sofas' },
    { label: 'Decoración', to: '/catalog?cat=decoracion' },
  ],
  Ayuda: [
    { label: 'Atención al cliente', to: '#' },
    { label: 'Rastrear pedido', to: '#' },
    { label: 'Envíos y devoluciones', to: '#' },
    { label: 'Garantía', to: '#' },
  ],
  Contacto: [
    { label: 'hola@casa.com', to: '#' },
    { label: '+52 55 1234 5678', to: '#' },
    { label: 'Mi cuenta', to: '/account' },
  ],
}

const PAYMENT_METHODS = ['VISA', 'MC', 'AMEX', 'PP', 'STRP']

export function DesktopLayout() {
  const [mnavOpen, setMnavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const cartCount = useCartStore(selectCartCount)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const user = useAuthStore(selectUser)

  // Sync user-owned collections from backend whenever the user authenticates.
  useEffect(() => {
    if (!isAuthenticated) return
    cartApi.get()
      .then(cart => useCartStore.getState().syncFromBackend(cart.items))
      .catch(() => {})
    useWishlistStore.getState().fetch().catch(() => {})
  }, [isAuthenticated])

  async function handleLogout() {
    setUserMenuOpen(false)
    setMnavOpen(false)
    try { await authApi.logout() } catch { /* limpiamos igual */ }
    useAuthStore.getState().clearSession()
    useCartStore.getState().clearCart()
    useFavsStore.getState().clearFavs()
    useWishlistStore.getState().clearLocal()
    navigate('/auth')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMnavOpen(false)
        setSearchOpen(false)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mnavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mnavOpen])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = searchTerm.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchTerm('')
    navigate(`/catalog?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main-content">Saltar al contenido</a>

      {/* Promo bar */}
      <div
        className="text-center text-[12.5px] tracking-[.04em] py-[9px] px-4"
        style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
      >
        Envío gratis desde <b style={{ color: 'var(--color-gold)' }}>$150</b>
        {' · '}Hasta <b style={{ color: 'var(--color-gold)' }}>30% OFF</b> en decoración seleccionada
        {' · '}<b style={{ color: 'var(--color-gold)' }}>5%</b> en crédito Casa
      </div>

      {/* Header / Nav */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--color-line)] backdrop-blur-[12px]"
        style={{ background: 'color-mix(in srgb, var(--color-cream) 86%, transparent)' }}
      >
        <div className="wrap-wide flex items-center justify-between h-[72px] gap-6">
          {/* Brand */}
          <Link
            to="/"
            className="font-serif font-semibold text-[27px] tracking-[-0.01em] flex items-center gap-[9px] shrink-0"
          >
            Casa
            <span
              className="inline-block rounded-full mb-[14px]"
              style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
              aria-hidden="true"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex gap-[30px] text-[14.5px] font-medium" aria-label="Navegación principal">
            {NAV_LINKS.map(link => (
              <NavLink key={link.to} to={link.to} className="nav-link">
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-[14px]">
            <button
              onClick={() => setSearchOpen(true)}
              className="icon-btn"
              aria-label="Buscar"
            >
              <IconSearch />
            </button>

            {/* User icon — dropdown si autenticado, link a /auth si no */}
            <div className="relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="icon-btn"
                    aria-label="Mi cuenta"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                  >
                    <IconUser />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[190]" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                      <div
                        className="absolute right-0 top-[calc(100%+10px)] z-[200] rounded-[16px] overflow-hidden min-w-[220px]"
                        style={{ background: 'var(--color-cream)', border: '1px solid var(--color-line)', boxShadow: 'var(--shadow-lg)' }}
                        role="menu"
                      >
                        {/* User header */}
                        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-line)', background: 'var(--color-cream-2)' }}>
                          <div className="font-semibold text-[14px]" style={{ color: 'var(--color-ink)' }}>
                            {user ? `${user.firstName} ${user.lastName}` : ''}
                          </div>
                          <div className="text-[12px] mt-[2px]" style={{ color: 'var(--color-ink-soft)' }}>
                            {user?.email ?? ''}
                          </div>
                        </div>

                        {/* Main items */}
                        <div className="py-1">
                          {[
                            { to: '/account?tab=orders', label: 'Mis pedidos', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 2h9l4 4v16H6z"/><path d="M9 11h7M9 15h7"/></svg> },
                            { to: '/account?tab=favs',   label: 'Favoritos',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                            { to: '/account',            label: 'Mi cuenta',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg> },
                          ].map(item => (
                            <Link
                              key={item.to}
                              to={item.to}
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-[10px] text-[14px] transition-colors hover:bg-[var(--color-cream-2)]"
                              style={{ color: 'var(--color-ink)' }}
                            >
                              <span style={{ color: 'var(--color-ink-soft)', flexShrink: 0 }}>{item.icon}</span>
                              {item.label}
                            </Link>
                          ))}
                        </div>

                        {/* Admin link */}
                        {isAdmin && (
                          <div className="border-t py-1" style={{ borderColor: 'var(--color-line)' }}>
                            <Link
                              to="/admin"
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-[10px] text-[14px] font-semibold transition-colors hover:bg-[var(--color-cream-2)]"
                              style={{ color: 'var(--color-terra)' }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
                              </svg>
                              Panel de Admin
                            </Link>
                          </div>
                        )}

                        {/* Logout */}
                        <div className="border-t py-1" style={{ borderColor: 'var(--color-line)' }}>
                          <button
                            role="menuitem"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-[10px] text-[14px] transition-colors hover:bg-[var(--color-cream-2)]"
                            style={{ color: 'var(--color-terra)' }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                              <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            </svg>
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link to="/auth" className="icon-btn" aria-label="Iniciar sesión">
                  <IconUser />
                </Link>
              )}
            </div>

            {isAuthenticated && (
              <Link
                to="/cart"
                className="icon-btn relative"
                aria-label={cartCount > 0 ? `Carrito, ${cartCount} productos` : 'Carrito'}
              >
                <IconCart />
                {cartCount > 0 && (
                  <i
                    className="absolute -top-[2px] -right-[2px] min-w-[17px] h-[17px] px-1 rounded-[9px] text-[10.5px] font-bold grid place-items-center not-italic leading-none"
                    style={{ background: 'var(--color-terra)', color: '#fff' }}
                  >
                    {cartCount}
                  </i>
                )}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden icon-btn"
              onClick={() => setMnavOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mnavOpen}
              aria-controls="mobile-nav"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <div
        id="mobile-nav"
        className={`fixed inset-0 z-[120] transition-[visibility] ${mnavOpen ? 'visible' : 'invisible'}`}
        aria-hidden={!mnavOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div
          className={`absolute inset-0 backdrop-blur-[2px] transition-opacity duration-[280ms] ${mnavOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(34,30,24,.45)' }}
          onClick={() => setMnavOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full overflow-y-auto flex flex-col p-[22px] shadow-[var(--shadow-lg)] transition-transform duration-300 cubic-bezier-[.3,.7,.2,1] ${mnavOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: 'min(86vw, 360px)', background: 'var(--color-cream)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <Link
              to="/"
              onClick={() => setMnavOpen(false)}
              className="font-serif font-semibold text-[24px] flex items-center gap-[9px]"
            >
              Casa
              <span
                className="inline-block rounded-full mb-[14px]"
                style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
                aria-hidden="true"
              />
            </Link>
            <button
              className="icon-btn"
              onClick={() => setMnavOpen(false)}
              aria-label="Cerrar menú"
            >
              <IconClose />
            </button>
          </div>

          <nav className="flex flex-col mt-[10px]">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMnavOpen(false)}
                className="font-serif font-semibold text-[26px] py-3 border-b flex justify-between items-center hover:text-[var(--color-terra)] transition-colors"
                style={{ borderColor: 'var(--color-line)' }}
              >
                {link.label}
                <IconArrow />
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-5 flex flex-col gap-3">
            <div className="flex gap-3">
              <Link
                to={isAuthenticated ? '/account' : '/auth'}
                onClick={() => setMnavOpen(false)}
                className="flex-1 text-center py-3 rounded-full border font-semibold text-sm transition-colors hover:border-[var(--color-ink)]"
                style={{ borderColor: 'var(--color-line-2)' }}
              >
                {isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/cart"
                  onClick={() => setMnavOpen(false)}
                  className="flex-1 text-center py-3 rounded-full font-semibold text-sm text-white transition-colors"
                  style={{ background: 'var(--color-ink)' }}
                >
                  Carrito
                </Link>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full text-center py-3 rounded-full border font-semibold text-sm transition-colors hover:border-[var(--color-terra)]"
                style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-terra)' }}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search overlay */}
      <div
        className={`fixed inset-0 z-[130] transition-[visibility] ${searchOpen ? 'visible' : 'invisible'}`}
        aria-hidden={!searchOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda"
      >
        <div
          className={`absolute inset-0 backdrop-blur-[3px] transition-opacity duration-[250ms] ${searchOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(34,30,24,.40)' }}
          onClick={() => setSearchOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 right-0 shadow-[var(--shadow-md)] transition-transform duration-[320ms] pb-9 pt-6`}
          style={{
            background: 'var(--color-cream)',
            paddingInline: 'clamp(20px,4vw,56px)',
            transform: searchOpen ? 'translateY(0)' : 'translateY(-100%)',
          }}
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-[14px] max-w-[1280px] mx-auto">
            <IconSearch className="text-[var(--color-ink-soft)] shrink-0" size={24} />
            <input
              ref={searchInputRef}
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="flex-1 border-0 bg-transparent font-serif font-medium text-[var(--color-ink)] outline-none"
              style={{ fontSize: 'clamp(24px,4vw,40px)', color: 'var(--color-ink)' }}
            />
            <button
              type="button"
              className="icon-btn shrink-0"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar búsqueda"
            >
              <IconClose />
            </button>
          </form>
        </div>
      </div>

      {/* Page content */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}>
        <div
          className="wrap-wide"
          style={{ paddingBlock: 'clamp(54px,7vw,90px) 32px' }}
        >
          <div
            className="grid gap-10"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
          >
            {/* Brand column */}
            <div style={{ gridColumn: 'span 1' }}>
              <Link
                to="/"
                className="font-serif font-semibold text-[27px] flex items-center gap-[9px]"
                style={{ color: 'var(--color-cream)' }}
              >
                Casa
                <span
                  className="inline-block rounded-full mb-[14px]"
                  style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
                  aria-hidden="true"
                />
              </Link>
              <p className="max-w-[300px] mt-4 text-[14px]" style={{ color: 'rgba(244,239,230,.70)' }}>
                Muebles y decoración de autor para una casa que dura. Diseñado y armado con cuidado.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS)
              .map(([title, links]) => [title, links.filter(link => link.to !== '#')] as const)
              .filter(([, links]) => links.length > 0)
              .map(([title, links]) => (
              <div key={title}>
                <h5
                  className="text-[12px] tracking-[.18em] uppercase mb-4 font-semibold"
                  style={{ color: 'var(--color-gold)' }}
                >
                  {title}
                </h5>
                <div className="flex flex-col gap-[11px]">
                  {links.map(link => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="text-[14px] transition-colors"
                      style={{ color: 'rgba(244,239,230,.75)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-cream)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,230,.75)')}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {title === 'Contacto' && isAdmin && (
                    <Link
                      to="/admin"
                      className="text-[14px] transition-colors"
                      style={{ color: 'var(--color-gold)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-cream)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-gold)')}
                    >
                      Panel de administración
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="flex justify-between items-center flex-wrap gap-4 mt-[46px] pt-6 text-[12.5px]"
            style={{
              borderTop: '1px solid rgba(255,255,255,.12)',
              color: 'rgba(244,239,230,.60)',
            }}
          >
            <span>© 2026 Casa. Todos los derechos reservados · Términos · Privacidad</span>
            <div className="flex gap-[7px]">
              {PAYMENT_METHODS.map(method => (
                <span
                  key={method}
                  className="rounded-[4px] grid place-items-center text-[8px] font-bold tracking-[.02em]"
                  style={{
                    width: 34,
                    height: 22,
                    background: 'rgba(255,255,255,.10)',
                    color: 'rgba(244,239,230,.80)',
                  }}
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

/* ---- Icon components ---- */

function IconSearch({ className = '', size = 19 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M6 6 5 3H2" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
