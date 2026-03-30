import { useState } from 'react'
import { signInWithEmail } from '../lib/supabase'
import { c, f, size, sp, ease } from '../lib/theme'

/* ── Dragon mark — Art Deco diamond ── */
const DragonMark = ({ s = 36 }) => (
  <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
    <rect x="2" y="2" width="32" height="32" fill={c.red} />
    <path d="M10 18L18 10L26 18L18 26Z" fill="oklch(98% 0.005 70)" opacity="0.9"/>
    <path d="M14 18L18 14L22 18L18 22Z" fill={c.red} />
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
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  const active = email.trim().length > 0

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

      {/* ── Right panel — Login form ── */}
      <div className="login-right" style={{
        width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: sp[5], borderLeft: `1px solid ${c.borderSubtle}`,
        background: c.bgWarm,
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          {!sent ? (
            <>
              <h2 style={{
                fontFamily: f.display, fontSize: size.lg, fontWeight: 500,
                marginBottom: sp[1], color: c.text, letterSpacing: '-0.01em',
              }}>Connexion</h2>
              <p style={{
                fontSize: size.sm, color: c.textSecondary, marginBottom: sp[4],
                lineHeight: 1.6, fontFamily: f.body,
              }}>
                Entrez votre email pour recevoir un lien de connexion s{'\u00e9'}curis{'\u00e9'}.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{
                  display: 'block', fontSize: size.xs, fontWeight: 500,
                  color: c.textTertiary, marginBottom: sp[1],
                  fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>Adresse email</label>
                <input type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com" autoFocus
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: c.bgSurface,
                    border: `1px solid ${focused ? c.red : c.border}`,
                    color: c.text, fontSize: size.sm, fontFamily: f.body,
                    outline: 'none', transition: `border-color 0.2s ${ease.smooth}`,
                  }}
                />

                {error && (
                  <p style={{
                    fontSize: size.xs, color: c.red, marginTop: sp[1],
                    padding: `${sp[1]} ${sp[2]}`, background: c.redSoft, lineHeight: 1.5,
                    border: `1px solid ${c.redGlow}`,
                  }}>{error}</p>
                )}

                <button type="submit" disabled={loading || !active} style={{
                  width: '100%', padding: '14px', marginTop: sp[3],
                  background: active ? c.red : c.bgElevated,
                  color: active ? c.white : c.textTertiary,
                  border: 'none', fontSize: size.sm, fontWeight: 600,
                  fontFamily: f.body, letterSpacing: '0.02em',
                  cursor: active ? 'pointer' : 'default',
                  transition: `all 0.25s ${ease.smooth}`,
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Envoi\u2026' : 'Continuer'}
                </button>
              </form>

              <p style={{
                fontSize: size.xs, color: c.textTertiary, marginTop: sp[3],
                textAlign: 'center', lineHeight: 1.7, fontFamily: f.body,
              }}>
                Pas de mot de passe requis. Un lien s{'\u00e9'}curis{'\u00e9'} vous sera envoy{'\u00e9'} par email.
              </p>
            </>
          ) : (
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
                Un lien de connexion a {'\u00e9'}t{'\u00e9'} envoy{'\u00e9'} {'\u00e0'}
              </p>
              <p style={{
                fontFamily: f.mono, fontSize: size.xs, color: c.red,
                padding: `${sp[1]} ${sp[2]}`, background: c.redSoft,
                display: 'inline-block', marginBottom: sp[3],
                letterSpacing: '0.02em',
              }}>{email}</p>
              <p style={{ fontSize: size.xs, color: c.textTertiary, lineHeight: 1.6 }}>
                Cliquez sur le lien dans l{'\u2019'}email pour acc{'\u00e9'}der {'\u00e0'} votre espace.
              </p>
              <button onClick={() => { setSent(false); setEmail('') }} style={{
                marginTop: sp[3], padding: `${sp[1]} ${sp[3]}`,
                background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textSecondary, fontSize: size.xs, cursor: 'pointer',
                fontFamily: f.body, transition: `border-color 0.2s ${ease.smooth}`,
              }}
                onMouseEnter={(e) => e.target.style.borderColor = c.textSecondary}
                onMouseLeave={(e) => e.target.style.borderColor = c.border}
              >Utiliser un autre email</button>
            </div>
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
