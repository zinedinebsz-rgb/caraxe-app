import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase, getProfile } from './lib/supabase'
import { c, f, size } from './lib/theme'
import { ToastProvider } from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'

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
function ProtectedRoute({ session, profile, loading, children, requiredRole, onRetry }) {
  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <ProfileError onRetry={onRetry} />
  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/" replace />
  return children
}

/* ── PROFILE ERROR ── */
const ProfileError = ({ onRetry }) => (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: c.bg, flexDirection: 'column', gap: '20px', padding: '20px',
  }}>
    <div style={{
      width: 32, height: 32,
      border: `1.5px solid ${c.red}`,
      transform: 'rotate(45deg)',
    }} />
    <span style={{
      color: c.text, fontFamily: f.display, fontSize: size.lg,
      textAlign: 'center',
    }}>Impossible de charger le profil</span>
    <span style={{
      color: c.textSecondary, fontFamily: f.body, fontSize: size.sm,
      textAlign: 'center', maxWidth: 320, lineHeight: 1.6,
    }}>
      Vérifiez votre connexion ou réessayez.
    </span>
    <div style={{ display: 'flex', gap: '12px' }}>
      <button onClick={onRetry} style={{
        padding: '10px 24px', background: c.red, border: `1px solid ${c.red}`,
        color: c.white, fontSize: size.sm, fontWeight: 600, cursor: 'pointer',
        fontFamily: f.body,
      }}>Réessayer</button>
      <button onClick={() => window.location.reload()} style={{
        padding: '10px 24px', background: c.bgSurface, border: `1px solid ${c.border}`,
        color: c.textSecondary, fontSize: size.sm, cursor: 'pointer',
        fontFamily: f.body,
      }}>Rafraîchir</button>
    </div>
  </div>
)

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

  // Check if client needs onboarding
  const needsOnboarding = profile && profile.role === 'client' && !profile.onboarding_done

  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/'} replace /> : <Login />
        } />

        <Route path="/settings" element={
          <ProtectedRoute session={session} profile={profile} loading={loading} onRetry={() => session?.user && loadProfile(session.user.id)}>
            <SettingsWrapper
              user={session?.user}
              profile={profile}
              onUpdate={() => loadProfile(session?.user?.id)}
            />
          </ProtectedRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute session={session} profile={profile} loading={loading} onRetry={() => session?.user && loadProfile(session.user.id)}>
            {profile?.role === 'admin'
              ? <Navigate to="/admin" replace />
              : needsOnboarding
                ? <Onboarding
                    user={session?.user}
                    profile={profile}
                    onComplete={() => loadProfile(session?.user?.id)}
                  />
                : <Dashboard
                    user={session?.user}
                    profile={profile}
                    onSignOut={handleSignOut}
                  />
            }
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute session={session} profile={profile} loading={loading} requiredRole="admin" onRetry={() => session?.user && loadProfile(session.user.id)}>
            <Admin user={session?.user} profile={profile} onSignOut={handleSignOut} />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  )
}

/* Settings wrapper to handle navigation */
function SettingsWrapper({ user, profile, onUpdate }) {
  const navigate = useNavigate()
  return (
    <Settings
      user={user}
      profile={profile}
      onBack={() => navigate('/')}
      onUpdate={onUpdate}
    />
  )
}
