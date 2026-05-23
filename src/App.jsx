import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase, getProfile } from './lib/supabase'
import { c, f, size, sp, ease } from './lib/theme'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import { I18nProvider } from './lib/i18n.jsx'
import CookieBanner from './components/CookieBanner'
import { useSEO } from './hooks/useSEO'
/* ── LAZY LOADED PAGES ── */
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Settings = lazy(() => import('./pages/Settings'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Catalogue = lazy(() => import('./pages/Catalogue'))
const NotFound = lazy(() => import('./pages/NotFound'))
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'))
const PolitiqueConfidentialite = lazy(() => import('./pages/PolitiqueConfidentialite'))
const CGV = lazy(() => import('./pages/CGV'))

/* ── SCROLL TO TOP + DYNAMIC SEO ON ROUTE CHANGE ── */
function ScrollToTop() {
  const { pathname } = useLocation()
  useSEO()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/* ── LOADER ── */
const Loader = ({ text = 'Chargement…' }) => (
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // On password recovery, redirect to the reset page and don't auto-login
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        setLoading(false)
        window.location.replace('/reset-password')
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
    <I18nProvider>
    <ToastProvider>
    <BrowserRouter>
      <ScrollToTop />
      <CookieBanner />
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/'} replace /> : <Suspense fallback={<Loader />}><Login /></Suspense>
        } />

        <Route path="/reset-password" element={
          <Suspense fallback={<Loader />}><ResetPassword /></Suspense>
        } />

        <Route path="/catalogue" element={
          <Suspense fallback={<Loader />}><Catalogue /></Suspense>
        } />

        <Route path="/mentions-legales" element={
          <Suspense fallback={<Loader />}><MentionsLegales /></Suspense>
        } />

        <Route path="/politique-confidentialite" element={
          <Suspense fallback={<Loader />}><PolitiqueConfidentialite /></Suspense>
        } />

        <Route path="/cgv" element={
          <Suspense fallback={<Loader />}><CGV /></Suspense>
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
                ? <ErrorBoundary name="Onboarding"><Onboarding
                    user={session?.user}
                    profile={profile}
                    onComplete={() => loadProfile(session?.user?.id)}
                  /></ErrorBoundary>
                : <ErrorBoundary name="Dashboard"><Dashboard
                    user={session?.user}
                    profile={profile}
                    onSignOut={handleSignOut}
                  /></ErrorBoundary>
            }
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute session={session} profile={profile} loading={loading} requiredRole="admin" onRetry={() => session?.user && loadProfile(session.user.id)}>
            <ErrorBoundary name="Admin"><Admin user={session?.user} profile={profile} onSignOut={handleSignOut} /></ErrorBoundary>
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <Suspense fallback={<Loader />}><NotFound /></Suspense>
        } />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
    </I18nProvider>
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
