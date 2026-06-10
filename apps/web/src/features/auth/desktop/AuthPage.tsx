import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../../shared/ui/Input'
import { useLoginController } from '../controllers/useLoginController'
import { useRegisterController } from '../controllers/useRegisterController'

type Tab = 'login' | 'register'

/* ---- Formulario de Login ---- */

function LoginForm() {
  const { loading, error, submit } = useLoginController()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    submit(fd.get('email') as string, fd.get('password') as string)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="h2">Bienvenido de vuelta</h1>
      <p className="text-[15px] mt-[6px] mb-[26px]" style={{ color: 'var(--color-ink-soft)' }}>
        Accede para ver tus pedidos y favoritos.
      </p>

      {error && (
        <div
          role="alert"
          className="text-[13.5px] font-medium rounded-[8px] px-4 py-3 mb-4"
          style={{ background: 'var(--color-terra-soft)', color: 'var(--color-terra)' }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />

        <div>
          <div className="flex justify-between items-center mb-[7px]">
            <label htmlFor="password" className="text-[13px] font-semibold" style={{ color: 'var(--color-ink-2)' }}>
              Contraseña
            </label>
            <Link
              to="/auth"
              className="text-[12.5px] font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-terra)' }}
            >
              ¿La olvidaste?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <label className="flex items-center gap-[9px] text-[13.5px] cursor-pointer select-none" style={{ color: 'var(--color-ink-2)' }}>
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--color-terra)' }}
          />
          Mantener sesión iniciada
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
        >
          {loading && (
            <span className="w-4 h-4 rounded-full border-2 border-cream/40 border-t-cream animate-spin" aria-hidden="true" />
          )}
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </div>

      <OrDivider />
      <SocialButtons />

      <p className="text-[12px] text-center mt-6 leading-[1.5]" style={{ color: 'var(--color-ink-soft)' }}>
        Protegemos tu sesión: el token vive solo en memoria, nunca en almacenamiento expuesto.
      </p>
    </form>
  )
}

/* ---- Formulario de Registro ---- */

function RegisterForm() {
  const { loading, error, submit } = useRegisterController()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    submit(
      fd.get('firstName') as string,
      fd.get('lastName') as string,
      fd.get('email') as string,
      fd.get('password') as string,
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="h2">Crea tu cuenta</h1>
      <p className="text-[15px] mt-[6px] mb-[26px]" style={{ color: 'var(--color-ink-soft)' }}>
        Únete y obtén <strong>10%</strong> en tu primera compra.
      </p>

      {error && (
        <div
          role="alert"
          className="text-[13.5px] font-medium rounded-[8px] px-4 py-3 mb-4"
          style={{ background: 'var(--color-terra-soft)', color: 'var(--color-terra)' }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Input
            label="Nombre"
            type="text"
            name="firstName"
            placeholder="Tu nombre"
            autoComplete="given-name"
            required
          />
          <Input
            label="Apellido"
            type="text"
            name="lastName"
            placeholder="Tu apellido"
            autoComplete="family-name"
            required
          />
        </div>
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          minLength={8}
          required
          hint="Al menos 8 caracteres"
        />

        <label className="flex items-start gap-[9px] text-[13.5px] cursor-pointer select-none leading-[1.4]" style={{ color: 'var(--color-ink-2)' }}>
          <input
            type="checkbox"
            required
            className="w-4 h-4 rounded mt-[2px] shrink-0"
            style={{ accentColor: 'var(--color-terra)' }}
          />
          <span>
            Acepto los{' '}
            <Link to="/404" className="underline hover:text-[var(--color-terra)]">Términos</Link>
            {' '}y la{' '}
            <Link to="/404" className="underline hover:text-[var(--color-terra)]">Política de Privacidad</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-terra)' }}
        >
          {loading && (
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
          )}
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </div>

      <OrDivider />
      <SocialButtons />

      <p className="text-[12px] text-center mt-6 leading-[1.5]" style={{ color: 'var(--color-ink-soft)' }}>
        Al registrarte aceptas recibir correos de Casa.{' '}
        <Link to="/404" className="underline" style={{ color: 'var(--color-ink-2)' }}>
          Darte de baja
        </Link>
        {' '}cuando quieras.
      </p>
    </form>
  )
}

/* ---- Componentes compartidos del card ---- */

function OrDivider() {
  return (
    <div
      className="flex items-center gap-[14px] my-[22px] text-[13px]"
      style={{ color: 'var(--color-ink-soft)' }}
      role="separator"
      aria-label="o continúa con"
    >
      <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
      o continúa con
      <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
    </div>
  )
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Google', icon: '◉' },
        { label: 'Apple', icon: '' },
      ].map(({ label, icon }) => (
        <button
          key={label}
          type="button"
          className="inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-4 py-[11px] rounded-full border transition-colors hover:bg-white"
          style={{
            background: 'var(--color-paper)',
            borderColor: 'var(--color-line-2)',
            color: 'var(--color-ink)',
          }}
        >
          <span aria-hidden="true">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  )
}

/* ---- Página ---- */

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <>
      {/* Segmented control */}
      <div
        className="flex rounded-full p-[4px] mb-[30px]"
        style={{ background: 'var(--color-cream-2)' }}
        role="tablist"
        aria-label="Modo de acceso"
      >
        {(['login', 'register'] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            onClick={() => setTab(t)}
            className="flex-1 py-[11px] rounded-full font-semibold text-[14.5px] transition-all duration-150"
            style={
              tab === t
                ? { background: 'var(--color-paper)', color: 'var(--color-ink)', boxShadow: 'var(--shadow-sm)' }
                : { background: 'transparent', color: 'var(--color-ink-soft)' }
            }
          >
            {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <div id="panel-login" role="tabpanel" hidden={tab !== 'login'}>
        {tab === 'login' && <LoginForm />}
      </div>
      <div id="panel-register" role="tabpanel" hidden={tab !== 'register'}>
        {tab === 'register' && <RegisterForm />}
      </div>
    </>
  )
}
