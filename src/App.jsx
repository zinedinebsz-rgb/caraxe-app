import { useState, useEffect } from 'react'
import { supabase, getProfile, signOut } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes (magic link callback, sign out, etc.)
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
    await signOut()
    setSession(null)
    setProfile(null)
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0A0A0A', color: '#5A5650',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#E63946', fontSize: '2rem', marginBottom: '1rem' }}>{'\u2666'}</div>
          Chargement...
        </div>
      </div>
    )
  }

  // Not logged in
  if (!session) return <Login />

  // Logged in but profile not loaded yet
  if (!profile) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0A0A0A', color: '#5A5650',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem',
      }}>
        Chargement du profil...
      </div>
    )
  }

  // Route based on role
  if (profile.role === 'admin') {
    return <Admin user={session.user} profile={profile} onSignOut={handleSignOut} />
  }

  return <Dashboard user={session.user} profile={profile} onSignOut={handleSignOut} />
}