import { useState, useRef, useEffect } from 'react'
import { signInWithPassword, signUpWithPassword, resetPassword, signInWithEmail } from '../lib/supabase'
import { c, f, size, sp, ease, shadow, transition, radius } from '../lib/theme'

/* ── Dragon mark — refined CARAXES fierce dragon ── */
const DragonMark = ({ s = 44 }) => (
  <svg width={s} height={s} viewBox="0 0 44 44" fill="none" style={{ filter: `drop-shadow(0 0 12px oklch(55% 0.22 25 / 0.25))` }}>
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.85"/>
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill="none" stroke={c.gold} strokeWidth="0.5" opacity="0.3"/>
    <path d="M13 12L7 5M31 12L37 5" stroke={c.gold} strokeWidth="1.2" opacity="0.6"/>
    <path d="M17 8L15 3M27 8L29 3" stroke={c.gold} strokeWidth="0.8" opacity="0.35"/>
    <circle cx="17.5" cy="21" r="2.2" fill={c.gold} opacity="0.9"/>
    <circle cx="26.5" cy="21" r="2.2" fill={c.gold} opacity="0.9"/>
    <ellipse cx="17.5" cy="21" rx="0.9" ry="2" fill={c.black}/>
    <ellipse cx="26.5" cy="21" rx="0.9" ry="2" fill={c.black}/>
    <path d="M15 17L13 14.5M29 17L31 14.5" stroke={c.redDeep} strokeWidth="1.2" opacity="0.5"/>
  </svg>
)

/* ── Film grain overlay ── */
const FilmGrain = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.02, mixBlendMode: 'overlay' }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
)

/* ── Art Deco Divider — refined ── */
const ArtDecoDivider = ({ width = 100 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.25 }}>
    <div style={{ width: 5, height: 5, background: c.gold, transform: 'rotate(45deg)', border: `0.5px solid ${c.goldDim}` }} />
    <div style={{ width, height: '1px', background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
  </div>
)

/* ── Feature Item — premium ── */
const FeatureItem = ({ icon, label, delay }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: sp[2],
        animation: `featureReveal 0.7s ${ease.out} ${delay}s both`,
        cursor: 'default',
      }}
    >
      <div style={{
        width: 42, height: 42, flexShrink: 0,
        background: hovered ? c.bgElevated : c.bgSurface,
        border: `1px solid ${hovered ? c.borderGold : c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: transition.normal,
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? c.gold : c.red} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: transition.color }}>
          <path d={icon} />
        </svg>
      </div>
      <span style={{
        fontSize: size.sm, color: hovered ? c.text : c.textSecondary, lineHeight: 1.5,
        fontFamily: f.body, letterSpacing: '0.01em',
        transition: transition.color,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ── Premium Input ── */
const PremiumInput = ({ label, type = 'text', value, onChange, placeholder, focused, onFocus, onBlur, autoFocus, minLength, required = true }) => (
  <div style={{ marginBottom: sp[3] }}>
    <label style={{
      display: 'block', fontSize: '10px', fontWeight: 600,
      color: c.textTertiary, marginBottom: sp[1],
      fontFamily: f.mono, letterSpacing: '0.12em', textTransform: 'uppercase',
      transition: transition.color,
    }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input type={type} required={required} value={value}
        onChange={onChange} placeholder={placeholder}
        autoFocus={autoFocus} minLength={minLength}
        onFocus={onFocus} onBlur={onBlur}
        style={{
          width: '100%', padding: '15px 18px',
          background: focused ? c.bgElevated : c.bgSurface,
          border: `1px solid ${focused ? c.red : c.border}`,
          color: c.text, fontSize: size.sm, fontFamily: f.body,
          outline: 'none', boxSizing: 'border-box',
          transition: `border-color 0.3s ${ease.luxury}, box-shadow 0.3s ${ease.luxury}, background 0.3s ${ease.luxury}`,
          boxShadow: focused ? `0 0 0 3px ${c.redSoft}, ${shadow.inner}` : shadow.inner,
          letterSpacing: '0.01em',
        }}
      />
      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5px',
        background: c.red, transform: `scaleX(${focused ? 1 : 0})`,
        transition: `transform 0.4s ${ease.out}`, transformOrigin: 'left',
      }} />
    </div>
  </div>
)

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [focused, setFocused] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const resetForm = () => { setError(null); setSuccess(null); setSent(false) }
  const switchMode = (m) => { resetForm(); setMode(m) }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) {
      setError(error.message.includes('Invalid login')
        ? 'Email ou mot de passe incorrect.'
        : error.message.includes('Email not confirmed')
        ? 'Veuillez confirmer votre email avant de vous connecter.'
        : error.message)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caracteres.'); return }
    setLoading(true); setError(null)
    const { error } = await signUpWithPassword(email, password, fullName)
    setLoading(false)
    if (error) {
      setError(error.message.includes('already registered')
        ? 'Cet email est deja utilise. Connectez-vous ou reinitialisez votre mot de passe.'
        : error.message)
    } else {
      setSent(true)
      setSuccess('Compte cree ! Verifiez votre email pour confirmer votre inscription.')
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(error.message)
    else { setSent(true); setSuccess('Un email de reinitialisation a ete envoye.') }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else { setSent(true); setSuccess('Un lien de connexion a ete envoye a votre email.') }
  }

  const active = email.trim().length > 0

  const titles = {
    login: 'Connexion', signup: 'Creer un compte',
    forgot: 'Mot de passe oublie', magic: 'Lien magique',
  }

  const subtitles = {
    login: 'Accedez a votre espace de suivi.',
    signup: 'Rejoignez CARAXES pour gerer vos commandes.',
    forgot: 'Reinitialisez votre mot de passe par email.',
    magic: 'Connexion securisee sans mot de passe.',
  }

  const features = [
    { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Suivi en temps reel de vos commandes' },
    { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Messagerie directe avec votre agent' },
    { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Documents et factures centralises' },
  ]

  const linkBtn = (text, onClick, highlight = false) => (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', padding: 0,
      color: highlight ? c.red : c.textTertiary,
      fontSize: size.xs, cursor: 'pointer', fontFamily: f.body,
      fontWeight: highlight ? 600 : 400,
      transition: transition.color,
      borderBottom: `1px solid transparent`,
    }}
      onMouseEnter={(e) => { e.target.style.color = highlight ? c.gold : c.textSecondary; if (highlight) e.target.style.borderBottomColor = c.gold }}
      onMouseLeave={(e) => { e.target.style.color = highlight ? c.red : c.textTertiary; e.target.style.borderBottomColor = 'transparent' }}
    >{text}</button>
  )

  return (
    <div style={{
      minHeight: '100vh', background: c.bg,
      display: 'flex', position: 'relative', overflow: 'hidden',
      opacity: mounted ? 1 : 0, transition: `opacity 0.6s ${ease.luxury}`,
    }}>
      <FilmGrain />

      {/* Ambient glows — more diffuse and atmospheric */}
      <div style={{
        position: 'absolute', width: '900px', height: '900px',
        background: `radial-gradient(ellipse, oklch(55% 0.22 25 / 0.06) 0%, transparent 70%)`,
        top: '-300px', right: '-200px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: `radial-gradient(ellipse, oklch(75% 0.12 85 / 0.04) 0%, transparent 70%)`,
        bottom: '-250px', left: '-150px', pointerEvents: 'none',
      }} />
      {/* Subtle center glow */}
      <div style={{
        position: 'absolute', width: '500px', height: '800px',
        background: `radial-gradient(ellipse, oklch(55% 0.22 25 / 0.03) 0%, transparent 60%)`,
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* ── Left panel — Branding ── */}
      <div className="login-left" style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: `${sp[8]} ${sp[10]}`, position: 'relative',
        animation: `panelReveal 0.8s ${ease.out} both`,
      }}>
        {/* Logo group */}
        <div style={{ marginBottom: sp[8] }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[1.5],
          }}>
            <DragonMark />
            <div>
              <span style={{
                fontFamily: f.display, fontWeight: 600, fontSize: size.xl,
                letterSpacing: '0.10em', color: c.text, display: 'block',
              }}>
                CARAXE<span style={{ color: c.red }}>S</span>
              </span>
            </div>
          </div>
          <p style={{
            fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
            letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0,
          }}>
            Agent de Sourcing Chine
          </p>
        </div>

        {/* Headline — premium typography */}
        <h1 style={{
          fontFamily: f.display, fontSize: size.hero, fontWeight: 400,
          lineHeight: 1.05, color: c.text, maxWidth: '540px',
          letterSpacing: '-0.03em', margin: `0 0 ${sp[3]} 0`,
        }}>
          Votre sourcing,{' '}
          <em style={{
            fontStyle: 'italic', color: c.red,
            textShadow: `0 0 40px oklch(55% 0.22 25 / 0.15)`,
          }}>simplifie.</em>
        </h1>

        <p style={{
          fontSize: size.base, lineHeight: 1.75, color: c.textSecondary,
          maxWidth: '480px', fontFamily: f.body,
          margin: `0 0 ${sp[6]} 0`, fontWeight: 300,
        }}>
          Suivez vos commandes en temps reel, echangez avec votre agent
          et recevez vos documents{'\u00a0'}{'\u2014'}{'\u00a0'}depuis un seul espace.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3], maxWidth: '440px' }}>
          {features.map((item, i) => (
            <FeatureItem key={i} icon={item.icon} label={item.label} delay={0.3 + i * 0.12} />
          ))}
        </div>

        {/* Art Deco accent */}
        <div style={{ marginTop: sp[8] }}>
          <ArtDecoDivider width={80} />
        </div>

        {/* Trust line */}
        <div style={{ marginTop: sp[2], display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <p style={{
            fontFamily: f.mono, fontSize: '9px',
            color: c.textGhost, letterSpacing: '0.14em', textTransform: 'uppercase',
            margin: 0,
          }}>
            Yiwu &middot; Guangzhou &middot; Shenzhen
          </p>
        </div>
      </div>

      {/* ── Right panel — Auth form ── */}
      <div className="login-right" style={{
        width: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: sp[6], borderLeft: `1px solid ${c.borderSubtle}`,
        background: c.bgWarm, position: 'relative',
        animation: `formReveal 0.9s ${ease.out} 0.1s both`,
      }}>
        {/* Subtle vertical accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '1px', height: '100%',
          background: `linear-gradient(180deg, transparent 10%, ${c.redGlow} 50%, transparent 90%)`,
        }} />

        {/* Subtle top-right gold accent */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
          background: `radial-gradient(circle at top right, oklch(75% 0.12 85 / 0.04) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: '380px' }}>
          {sent ? (
            /* ── Confirmation state — premium ── */
            <div style={{
              textAlign: 'center',
              animation: `confirmReveal 0.5s ${ease.out}`,
            }}>
              <div style={{
                width: 60, height: 60,
                background: c.greenSoft,
                border: `1px solid oklch(72% 0.16 155 / 0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: `0 auto ${sp[3]}`,
                animation: `confirmPulse 2s ${ease.smooth} infinite`,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <h2 style={{
                fontFamily: f.display, fontSize: size.lg, fontWeight: 500,
                marginBottom: sp[1], color: c.text, margin: `0 0 ${sp[1]} 0`,
                letterSpacing: '-0.01em',
              }}>Verifiez votre email</h2>
              <p style={{
                fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6,
                margin: `0 0 ${sp[2]} 0`,
              }}>{success}</p>
              <p style={{
                fontFamily: f.mono, fontSize: size.xs, color: c.red,
                padding: `${sp[1]} ${sp[2]}`, background: c.redSoft,
                display: 'inline-block', margin: `0 0 ${sp[3]} 0`,
                letterSpacing: '0.03em', border: `1px solid ${c.redGlow}`,
              }}>{email}</p>
              <p style={{ fontSize: size.xs, color: c.textTertiary, lineHeight: 1.7, margin: 0 }}>
                {mode === 'signup'
                  ? 'Cliquez sur le lien dans l\u2019email pour activer votre compte.'
                  : mode === 'forgot'
                  ? 'Cliquez sur le lien pour definir un nouveau mot de passe.'
                  : 'Cliquez sur le lien dans l\u2019email pour acceder a votre espace.'}
              </p>
              <button onClick={() => { switchMode('login'); setEmail(''); setPassword('') }} style={{
                marginTop: sp[4], padding: `12px ${sp[4]}`,
                background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textSecondary, fontSize: size.xs, cursor: 'pointer',
                fontFamily: f.body, transition: transition.normal,
                letterSpacing: '0.02em',
              }}
                onMouseEnter={(e) => { e.target.style.borderColor = c.red; e.target.style.color = c.text }}
                onMouseLeave={(e) => { e.target.style.borderColor = c.border; e.target.style.color = c.textSecondary }}
              >Retour a la connexion</button>
            </div>
          ) : (
            <div style={{ animation: `formContentReveal 0.6s ${ease.out} 0.2s both` }}>
              {/* Mode indicator — refined */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: sp[4],
              }}>
                <div style={{ width: 28, height: '1.5px', background: `linear-gradient(90deg, ${c.red}, ${c.redMuted})` }} />
                <span style={{
                  fontFamily: f.mono, fontSize: '9px', color: c.red,
                  letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                }}>
                  {mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Inscription' : mode === 'forgot' ? 'Recuperation' : 'Lien magique'}
                </span>
              </div>

              <h2 style={{
                fontFamily: f.display, fontSize: size['2xl'], fontWeight: 400,
                margin: `0 0 ${sp[1]} 0`, color: c.text, letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}>{titles[mode]}</h2>
              <p style={{
                fontSize: size.sm, color: c.textSecondary, margin: `0 0 ${sp[5]} 0`,
                lineHeight: 1.6, fontFamily: f.body, fontWeight: 300,
              }}>
                {subtitles[mode]}
              </p>

              <form onSubmit={
                mode === 'login' ? handleLogin :
                mode === 'signup' ? handleSignup :
                mode === 'forgot' ? handleForgot :
                handleMagicLink
              }>
                {mode === 'signup' && (
                  <PremiumInput label="Nom complet" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom" focused={focused === 'name'}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />
                )}

                <PremiumInput label="Adresse email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com" autoFocus focused={focused === 'email'}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />

                {(mode === 'login' || mode === 'signup') && (
                  <PremiumInput label="Mot de passe" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min. 6 caracteres' : 'Votre mot de passe'}
                    minLength={mode === 'signup' ? 6 : undefined}
                    focused={focused === 'pass'}
                    onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)} />
                )}

                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginBottom: sp[3], marginTop: `-${sp[1]}` }}>
                    {linkBtn('Mot de passe oublie ?', () => switchMode('forgot'), true)}
                  </div>
                )}

                {error && (
                  <div style={{
                    fontSize: size.xs, color: c.red, marginBottom: sp[3],
                    padding: `${sp[1.5]} ${sp[2]}`, background: c.redSoft, lineHeight: 1.6,
                    border: `1px solid ${c.redGlow}`,
                    display: 'flex', alignItems: 'flex-start', gap: sp[1],
                    animation: `shakeError 0.4s ${ease.out}`,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.red} strokeWidth="1.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit button — premium treatment */}
                <button type="submit" disabled={loading || !active} style={{
                  width: '100%', padding: '16px', marginTop: sp[1],
                  background: active ? c.red : c.bgElevated,
                  color: active ? c.white : c.textTertiary,
                  border: `1px solid ${active ? 'transparent' : c.border}`,
                  fontSize: size.sm, fontWeight: 600,
                  fontFamily: f.body, letterSpacing: '0.04em',
                  cursor: active ? 'pointer' : 'default',
                  transition: `all 0.35s ${ease.luxury}`,
                  opacity: loading ? 0.7 : 1,
                  boxShadow: active ? `0 4px 20px oklch(55% 0.22 25 / 0.25)` : 'none',
                  textTransform: 'uppercase',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={(e) => {
                    if (active && !loading) {
                      e.target.style.background = c.redDeep
                      e.target.style.boxShadow = `0 6px 28px oklch(55% 0.22 25 / 0.35)`
                      e.target.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (active && !loading) {
                      e.target.style.background = c.red
                      e.target.style.boxShadow = `0 4px 20px oklch(55% 0.22 25 / 0.25)`
                      e.target.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[1] }}>
                      <span style={{
                        width: 14, height: 14,
                        border: `1.5px solid ${c.white}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        display: 'inline-block',
                      }} />
                      Chargement
                    </span>
                  ) : (
                    mode === 'login' ? 'Se connecter' :
                    mode === 'signup' ? 'Creer mon compte' :
                    mode === 'forgot' ? 'Envoyer le lien' :
                    'Envoyer le lien magique'
                  )}
                </button>
              </form>

              {/* ── Mode switchers — refined ── */}
              <div style={{
                marginTop: sp[5], textAlign: 'center',
                fontSize: size.xs, color: c.textTertiary, lineHeight: 2.2,
                fontFamily: f.body,
              }}>
                {mode === 'login' && (
                  <>
                    <span>Pas encore de compte ?{' '}</span>
                    {linkBtn('Creer un compte', () => switchMode('signup'), true)}
                    <br />
                    {linkBtn('Connexion sans mot de passe', () => switchMode('magic'))}
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <span>Deja un compte ?{' '}</span>
                    {linkBtn('Se connecter', () => switchMode('login'), true)}
                  </>
                )}
                {(mode === 'forgot' || mode === 'magic') && (
                  linkBtn('Retour a la connexion', () => switchMode('login'), true)
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes panelReveal {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes formReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes formContentReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes featureReveal {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes confirmReveal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes confirmPulse {
          0%, 100% { box-shadow: 0 0 0 0 oklch(72% 0.16 155 / 0.15); }
          50% { box-shadow: 0 0 0 8px oklch(72% 0.16 155 / 0); }
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-4px); }
          30% { transform: translateX(4px); }
          45% { transform: translateX(-2px); }
          60% { transform: translateX(2px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; border-left: none !important; min-height: 100vh; }
        }
        input::placeholder { color: ${c.textTertiary}; opacity: 0.5; }
      `}</style>
    </div>
  )
}
