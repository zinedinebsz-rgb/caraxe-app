import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, getProfile } from './lib/supabase'
import { c, f, size } from './lib/theme'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

/* ── LOADER ── */
const Loader = ({ text = 'Chargement\u2026' }) => (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: c.bg, flexDirection: 'column', gap: '20px',
  }}>
    {/* Diamond spinner — Art Deco motif */}
    <div style={{
      width: 32, height: 32,
      border: `1.5px solid ${c.border}`,
      borderTopColor: c.red,
      transform: 'rotate(45deg)',
      animation: 'spin 1s linear infinite',
    }} />
    <span style={{
      color: c.textTertiary,
      fontFamily: f.mono,
      fontSize: size.xs,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>{text}</span>
  </div>
)

/* ── PROTECTED ROUTE ── */
function ProtectedRoute({ session, profile, loading, children, requiredRole }) {
  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Loader text="Chargement du profil\u2026" />
  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    try {
      const p = await getProfile(userId)
      setProfile(p)
    } catch (e) {
      console.error('Error loading profile:', e)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/'} replace /> : <Login />
        } />

        <Route path="/" element={
          <ProtectedRoute session={session} profile={profile} loading={loading}>
            {profile?.role === 'admin'
              ? <Navigate to="/admin" replace />
              : <Dashboard user={session?.user} profile={profile} onSignOut={handleSignOut} />
            }
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute session={session} profile={profile} loading={loading} requiredRole="admin">
            <Admin user={session?.user} profile={profile} onSignOut={handleSignOut} />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
