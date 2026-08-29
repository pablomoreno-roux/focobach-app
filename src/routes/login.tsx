import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login, signup, AuthError, MissingIdentityError } from '@netlify/identity'
import { useIdentity } from '../lib/identity-context'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const PAPER = '#0A1830'
const CARD = '#132A4E'
const BORDER = '#25406B'
const ACCENT = '#2FBFAC'
const INK = '#EAF0F5'
const INK_SOFT = '#8FA5C4'
const DANGER = '#F0645C'
const NAVY_DEEP = '#081326'
const SERIF = "'Fraunces', serif"

function LoginPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && user) {
    navigate({ to: '/' })
    return null
  }

  const describeError = (err: unknown) => {
    if (err instanceof MissingIdentityError) {
      return 'El inicio de sesión aún no está disponible en este entorno. Prueba en el sitio publicado.'
    }
    if (err instanceof AuthError) {
      switch (err.status) {
        case 401:
          return 'Email o contraseña incorrectos.'
        case 403:
          return 'Los registros nuevos no están permitidos ahora mismo.'
        case 422:
          return 'Revisa el email y usa una contraseña de al menos 6 caracteres.'
        case 404:
          return 'No existe ninguna cuenta con ese email.'
        default:
          return err.message
      }
    }
    return 'Ha ocurrido un error inesperado.'
  }

  const submit = async () => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate({ to: '/' })
      } else {
        const result = await signup(email, password, { full_name: name })
        if (result && (result as any).emailVerified) {
          navigate({ to: '/' })
        } else {
          setInfo('Cuenta creada. Revisa tu email para confirmar la cuenta antes de entrar.')
        }
      }
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: NAVY_DEEP, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: ACCENT, letterSpacing: '-0.03em' }}>FB</span>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: INK, margin: '14px 0 2px' }}>FocoBach</p>
          <p style={{ fontSize: 12, color: INK_SOFT, margin: 0 }}>Tu cuaderno del Bachillerato Internacional</p>
        </div>

        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
          <button onClick={() => { setMode('login'); setError(''); setInfo('') }} style={{ flex: 1, fontSize: 13, fontWeight: 500, padding: '10px 0', background: 'transparent', border: 'none', borderBottom: mode === 'login' ? `2px solid ${ACCENT}` : '2px solid transparent', color: mode === 'login' ? INK : INK_SOFT, cursor: 'pointer' }}>Iniciar sesión</button>
          <button onClick={() => { setMode('signup'); setError(''); setInfo('') }} style={{ flex: 1, fontSize: 13, fontWeight: 500, padding: '10px 0', background: 'transparent', border: 'none', borderBottom: mode === 'signup' ? `2px solid ${ACCENT}` : '2px solid transparent', color: mode === 'signup' ? INK : INK_SOFT, cursor: 'pointer' }}>Crear cuenta</button>
        </div>

        {mode === 'signup' && (
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: INK_SOFT, marginBottom: 4 }}>Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
              style={{ width: '100%', fontSize: 14, color: INK, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px' }} />
          </label>
        )}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: INK_SOFT, marginBottom: 4 }}>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoFocus
            style={{ width: '100%', fontSize: 14, color: INK, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: INK_SOFT, marginBottom: 4 }}>Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            style={{ width: '100%', fontSize: 14, color: INK, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px' }} />
        </label>

        {error && <p style={{ fontSize: 12, color: DANGER, margin: '0 0 12px' }}>{error}</p>}
        {info && <p style={{ fontSize: 12, color: ACCENT, margin: '0 0 12px' }}>{info}</p>}

        <button onClick={submit} disabled={busy || !email || !password} style={{ width: '100%', fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, border: 'none', background: ACCENT, color: NAVY_DEEP }}>
          {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <p style={{ fontSize: 11, color: INK_SOFT, margin: '16px 0 0', textAlign: 'center' }}>
          Tus datos se guardan en tu cuenta, protegidos por email y contraseña.
        </p>
      </div>
    </div>
  )
}
