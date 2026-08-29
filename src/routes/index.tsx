import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useIdentity } from '../lib/identity-context'
import FocoBach from '../components/FocoBach'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { user, ready, logout } = useIdentity()
  const navigate = useNavigate()

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1830', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8FA5C4', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Cargando FocoBach…
      </div>
    )
  }

  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return <FocoBach userLabel={user.email} onLogout={handleLogout} />
}
