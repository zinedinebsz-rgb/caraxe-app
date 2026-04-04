import { useState } from 'react'
import { signInWithPassword, signUpWithPassword, resetPassword, signInWithEmail } from '../lib/supabase'
import { c, f, size, sp, ease } from '../lib/theme'

/* ── Dragon mark — CARAXES fierce dragon icon ── */
const DragonMark = ({ s = 36 }) => (
  <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
    <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.9"/>
    <path d="M12 11L7 5M28 11L33 5" stroke={c.gold || '#D4A843'} strokeWidth="1.5" opacity="0.8"/>
    <path d="M16 7L14 3M24 7L26 3" stroke={c.gold || '#D4A843'} strokeWidth="1" opacity="0.5"/>
    <circle cx="16" cy="19" r="2" fill="#FFD700" opacity="0.9"/>
    <circle cx="24" cy="19" r="2" fill="#FFD700" opacity="0.9"/>
    <ellipse cx="16" cy="19" rx="0.8" ry="1.8" fill="#0D0D0D"/>
    <ellipse cx="24" cy="19" rx="0.8" ry="1.8" fill="#0D0D0D"/>
    <path d="M14 15L12 13M26 15L28 13" stroke="#4A0A10" strokeWidth="1.5" opacity="0.6"/>
  </svg>
)

/* ── Film grain overlay ── */
const FilmGrain = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.03 }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
)

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [focused, setFocused] = useState(null)

  const resetForm = () => {
    setError(null)
    setSuccess(null)
    setSent(false)
  }

  const switchMode = (newMode) => {
    resetForm()
    setMode(newMode)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.')
      } else {
        setError(error.message)
      }
    }
    // Auth state change will handle redirect via App.jsx
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caract\u00e8res.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await signUpWithPassword(email, password, fullName)
    setLoading(false)
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Cet email est d\u00e9j\u00e0 utilis\u00e9. Connectez-vous ou r\u00e9initialisez votre mot de passe.')
      } else {
        setError(error.message)
      }
    } else {
      setSent(true)
      setSuccess('Compte cr\u00e9\u00e9 ! V\u00e9rifiez votre email pour confirmer votre inscription.')
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSent(true)
      setSuccess('Un email de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9.')
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSent(true)
      setSuccess('Un lien de connexion a \u00e9t\u00e9 envoy\u00e9 \u00e0 votre email.')
    }
  }

  const active = email.trim().length > 0

  const inputStyle = (field) => ({
    width: '100%', padding: '14px 16px',
    background: c.bgSurface,
    border: `1px solid ${focused === field ? c.red : c.border}`,
    color: c.text, fontSize: size.sm, fontFamily: f.body,
    outline: 'none', transition: `border-color 0.2s ${ease.smooth}`,
    boxSizing: 'border-box',
  })

  const labelStyle = {
    display: 'block', fontSize: size.xs, fontWeight: 500,
    color: c.textTertiary, marginBottom: sp[1],
    fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  const titles = {
    login: 'Connexion',
    signup: 'Cr\u00e9er un compte',
    forgot: 'Mot de passe oubli\u00e9',
    magic: 'Lien magique',
  }

  const subtitles = {
    login: 'Connectez-vous \u00e0 votre espace client.',
    signup: 'Inscrivez-vous pour suivre vos commandes.',
    forgot: 'Entrez votre email pour r\u00e9initialiser votre mot de passe.',
    magic: 'Recevez un lien de connexion s\u00e9curis\u00e9 par email.',
  }

  return (
    <div style={{
      minHeight: '100vh', background: c.bg,
      display: 'flex', position: 'relative', overflow: 'hidden',
    }}>
      <FilmGrain />

      {/* Ambient red glow — top right */}
      <div style={{
        position: 'absolute', width: '700px', height: '700px',
        background: `radial-gradient(circle, ${c.redGlow} 0%, transparent 70%)`,
        top: '-250px', right: '-150px', pointerEvents: 'none',
      }} />
      {/* Ambient gold glow — bottom left */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        background: `radial-gradient(circle, ${c.goldGlow} 0%, transparent 70%)`,
        bottom: '-200px', left: '-100px', pointerEvents: 'none',
      }} />

      {/* ── Left panel — Branding ── */}
      <div className="login-left" style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: `${sp[8]} ${sp[10]}`, position: 'relative',
      }}>
        {/* Logo block */}
        <div style={{ marginBottom: sp[6] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[1] }}>
            <DragonMark />
            <span style={{
              fontFamily: f.display, fontWeight: 600, fontSize: size.xl,
              letterSpacing: '0.08em', color: c.text,
            }}>
              CARAXE<span style={{ color: c.red }}>S</span>
            </span>
          </div>
          <p style={{
            fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            Sourcing Platform
          </p>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: f.display, fontSize: size.hero, fontWeight: 500,
          lineHeight: 1.1, color: c.text, maxWidth: '520px', marginBottom: sp[3],
          letterSpacing: '-0.03em',
        }}>
          Votre sourcing Chine,{' '}
          <em style={{ fontStyle: 'italic', color: c.red }}>simplifi{'\u00e9'}.</em>
        </h1>

        <p style={{
          fontSize: size.base, lineHeight: 1.7, color: c.textSecondary,
          maxWidth: '460px', marginBottom: sp[6], fontFamily: f.body,
        }}>
          Suivez vos commandes en temps r{'\u00e9'}el, communiquez avec votre agent
          et recevez vos documents{'\u00a0'}{'\u2014'} le tout depuis un seul espace.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], maxWidth: '400px' }}>
          {[
            { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Suivi en temps r\u00e9el de vos commandes' },
            { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Messagerie directe avec votre agent' },
            { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Documents et factures centralis\u00e9s' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: sp[2],
              animation: `fadeIn 0.5s ${ease.out} ${0.2 + i * 0.1}s both`,
            }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: c.bgElevated, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.red} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </div>
              <span style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.5, fontFamily: f.body }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Art Deco decorative line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginTop: sp[6], opacity: 0.35 }}>
          <div style={{ width: 6, height: 6, background: c.gold, transform: 'rotate(45deg)' }} />
          <div style={{ width: 48, height: '1px', background: c.gold }} />
        </div>
      </div>

      {/* ── Right panel — Auth form ── */}
      <div className="login-right" style={{
        width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: sp[5], borderLeft: `1px solid ${c.borderSubtle}`,
        background: c.bgWarm,
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          {sent ? (
            /* ── Confirmation state ── */
            <div style={{ textAlign: 'center', animation: `fadeIn 0.4s ${ease.out}` }}>
              <div style={{
                width: 56, height: 56,
                background: c.greenSoft,
                border: `1px solid oklch(72% 0.16 155 / 0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: `0 auto ${sp[3]}`,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="2" strokeLinecap="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <h2 style={{
                fontFamily: f.display, fontSize: size.lg, fontWeight: 500,
                marginBottom: sp[1], color: c.text,
              }}>V{'\u00e9'}rifiez votre email</h2>
              <p style={{
                fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6,
                marginBottom: sp[1],
              }}>
                {success}
              </p>
              <p style={{
                fontFamily: f.mono, fontSize: size.xs, color: c.red,
                padding: `${sp[1]} ${sp[2]}`, background: c.redSoft,
                display: 'inline-block', marginBottom: sp[3],
                letterSpacing: '0.02em',
              }}>{email}</p>
              <p style={{ fontSize: size.xs, color: c.textTertiary, lineHeight: 1.6 }}>
                {mode === 'signup'
                  ? 'Cliquez sur le lien dans l\u2019email pour activer votre compte.'
                  : mode === 'forgot'
                  ? 'Cliquez sur le lien pour d\u00e9finir un nouveau mot de passe.'
                  : 'Cliquez sur le lien dans l\u2019email pour acc\u00e9der \u00e0 votre espace.'}
              </p>
              <button onClick={() => { switchMode('login'); setEmail(''); setPassword('') }} style={{
                marginTop: sp[3], padding: `${sp[1]} ${sp[3]}`,
                background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textSecondary, fontSize: size.xs, cursor: 'pointer',
                fontFamily: f.body, transition: `border-color 0.2s ${ease.smooth}`,
              }}
                onMouseEnter={(e) => e.target.style.borderColor = c.textSecondary}
                onMouseLeave={(e) => e.target.style.borderColor = c.border}
              >Retour {'\u00e0'} la connexion</button>
            </div>
          ) : (
            <>
              <h2 style={{
                fontFamily: f.display, fontSize: size.lg, fontWeight: 500,
                marginBottom: sp[1], color: c.text, letterSpacing: '-0.01em',
              }}>{titles[mode]}</h2>
              <p style={{
                fontSize: size.sm, color: c.textSecondary, marginBottom: sp[4],
                lineHeight: 1.6, fontFamily: f.body,
              }}>
                {subtitles[mode]}
              </p>

              <form onSubmit={
                mode === 'login' ? handleLogin :
                mode === 'signup' ? handleSignup :
                mode === 'forgot' ? handleForgot :
                handleMagicLink
              }>
                {/* Full name — only on signup */}
                {mode === 'signup' && (
                  <div style={{ marginBottom: sp[2] }}>
                    <label style={labelStyle}>Nom complet</label>
                    <input type="text" required value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Votre nom"
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('name')}
                    />
                  </div>
                )}

                {/* Email — always */}
                <div style={{ marginBottom: sp[2] }}>
                  <label style={labelStyle}>Adresse email</label>
                  <input type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com" autoFocus
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('email')}
                  />
                </div>

                {/* Password — on login and signup */}
                {(mode === 'login' || mode === 'signup') && (
                  <div style={{ marginBottom: sp[1] }}>
                    <label style={labelStyle}>Mot de passe</label>
                    <input type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Min. 6 caract\u00e8res' : 'Votre mot de passe'}
                      minLength={mode === 'signup' ? 6 : undefined}
                      onFocus={() => setFocused('pass')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('pass')}
                    />
                  </div>
                )}

                {/* Forgot password link — on login */}
                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginBottom: sp[2] }}>
                    <button type="button" onClick={() => switchMode('forgot')} style={{
                      background: 'none', border: 'none', padding: 0,
                      color: c.red, fontSize: size.xs, cursor: 'pointer',
                      fontFamily: f.body, opacity: 0.8,
                      transition: `opacity 0.2s ${ease.smooth}`,
                    }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.8}
                    >Mot de passe oubli{'\u00e9'} ?</button>
                  </div>
                )}

                {error && (
                  <p style={{
                    fontSize: size.xs, color: c.red, marginTop: sp[1], marginBottom: sp[1],
                    padding: `${sp[1]} ${sp[2]}`, background: c.redSoft, lineHeight: 1.5,
                    border: `1px solid ${c.redGlow}`,
                  }}>{error}</p>
                )}

                <button type="submit" disabled={loading || !active} style={{
                  width: '100%', padding: '14px', marginTop: sp[2],
                  background: active ? c.red : c.bgElevated,
                  color: active ? c.white : c.textTertiary,
                  border: 'none', fontSize: size.sm, fontWeight: 600,
                  fontFamily: f.body, letterSpacing: '0.02em',
                  cursor: active ? 'pointer' : 'default',
                  transition: `all 0.25s ${ease.smooth}`,
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Chargement\u2026' :
                   mode === 'login' ? 'Se connecter' :
                   mode === 'signup' ? 'Cr\u00e9er mon compte' :
                   mode === 'forgot' ? 'Envoyer le lien' :
                   'Envoyer le lien magique'}
                </button>
              </form>

              {/* ── Mode switchers ── */}
              <div style={{
                marginTop: sp[3], textAlign: 'center',
                fontSize: size.xs, color: c.textTertiary, lineHeight: 1.8,
                fontFamily: f.body,
              }}>
                {mode === 'login' && (
                  <>
                    <span>Pas encore de compte ?{' '}</span>
                    <button type="button" onClick={() => switchMode('signup')} style={{
                      background: 'none', border: 'none', padding: 0,
                      color: c.red, cursor: 'pointer', fontFamily: f.body,
                      fontSize: size.xs, fontWeight: 500,
                    }}>Cr{'\u00e9'}er un compte</button>
                    <br />
                    <button type="button" onClick={() => switchMode('magic')} style={{
                      background: 'none', border: 'none', padding: 0,
                      color: c.textTertiary, cursor: 'pointer', fontFamily: f.body,
                      fontSize: size.xs, opacity: 0.7,
                      transition: `opacity 0.2s ${ease.smooth}`,
                    }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.7}
                    >Connexion sans mot de passe</button>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <span>D{'\u00e9'}j{'\u00e0'} un compte ?{' '}</span>
                    <button type="button" onClick={() => switchMode('login')} style={{
                      background: 'none', border: 'none', padding: 0,
                      color: c.red, cursor: 'pointer', fontFamily: f.body,
                      fontSize: size.xs, fontWeight: 500,
                    }}>Se connecter</button>
                  </>
                )}
                {(mode === 'forgot' || mode === 'magic') && (
                  <>
                    <button type="button" onClick={() => switchMode('login')} style={{
                      background: 'none', border: 'none', padding: 0,
                      color: c.red, cursor: 'pointer', fontFamily: f.body,
                      fontSize: size.xs, fontWeight: 500,
                    }}>Retour {'\u00e0'} la connexion</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; border-left: none !important; min-height: 100vh; }
        }
      `}</style>
    </div>
  )
}
