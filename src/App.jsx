import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase, getProfile } from './lib/supabase'
import { c, f, size, sp, ease } from './lib/theme'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'

/* ── LAZY LOADED PAGES ── */
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Settings = lazy(() => import('./pages/Settings'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

/* ── LOADER ── */
const Loader = ({ text = 'Chargement\u2026' }) => (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: c.bg, flexDirection: 'column', gap: '20px',
  }}>
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

/* ── 404 PAGE ── */
const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c.bg, fontFamily: f.body, color: c.text, flexDirection: 'column',
      gap: sp[3], padding: sp[4], textAlign: 'center',
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.5 }}>
        <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.6"/>
        <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.8"/>
        <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.8"/>
      </svg>
      <div style={{ fontFamily: f.display, fontSize: '48px', fontWeight: 700, color: c.gold, letterSpacing: '-0.02em' }}>
        404
      </div>
      <p style={{ fontSize: size.sm, color: c.textSecondary, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
        Cette page n'existe pas ou a ete deplacee.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: `${sp[2]} ${sp[4]}`, background: c.red, border: 'none',
          color: c.text, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
          fontFamily: f.body, transition: `all 0.2s ${ease.smooth}`,
          marginTop: sp[1],
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
        onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}
      >
        Retour a l'accueil
      </button>
    </div>
  )
}

/* ── PROTECTED ROUTE ── */
function ProtectedRoute({ session, profile, loading, children, requiredRole, onRetry }) {
  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <ProfileError onRetry={onRetry} />
  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/" replace />
  return <Suspense fallback={<Loader />}>{children}</Suspense>
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
      Verifiez votre connexion ou reessayez.
    </span>
    <div style={{ display: 'flex', gap: '12px' }}>
      <button onClick={onRetry} style={{
        padding: '10px 24px', background: c.red, border: `1px solid ${c.red}`,
        color: c.white, fontSize: size.sm, fontWeight: 600, cursor: 'pointer',
        fontFamily: f.body,
      }}>Reessayer</button>
      <button onClick={() => window.location.reload()} style={{
        padding: '10px 24px', background: c.bgSurface, border: `1px solid ${c.border}`,
        color: c.textSecondary, fontSize: size.sm, cursor: 'pointer',
        fontFamily: f.body,
      }}>Rafraichir</button>
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // On password recovery, redirect to the reset page and don't auto-login
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        setLoading(false)
        return
      }
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

  const needsOnboarding = profile && profile.role === 'client' && !profile.onboarding_done

  return (
    <ErrorBoundary>
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/'} replace /> : <Login />
        } />

        <Route path="/reset-password" element={
          <Suspense fallback={<Loader />}><ResetPassword /></Suspense>
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
    </ErrorBoundary>
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
