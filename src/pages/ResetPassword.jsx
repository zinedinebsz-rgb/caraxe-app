import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateUserPassword, supabase } from '../lib/supabase'
import { c, f, size, sp, ease, shadow, transition } from '../lib/theme'

/* Dragon Mark */
const DragonMark = ({ s = 44 }) => (
  <svg width={s} height={s} viewBox="0 0 44 44" fill="none" style={{ filter: `drop-shadow(0 0 12px oklch(55% 0.22 25 / 0.25))` }}>
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.85"/>
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill="none" stroke={c.gold} strokeWidth="0.5" opacity="0.3"/>
    <circle cx="17.5" cy="21" r="2.2" fill={c.gold} opacity="0.9"/>
    <circle cx="26.5" cy="21" r="2.2" fill={c.gold} opacity="0.9"/>
    <ellipse cx="17.5" cy="21" rx="0.9" ry="2" fill={c.black || '#000'}/>
    <ellipse cx="26.5" cy="21" rx="0.9" ry="2" fill={c.black || '#000'}/>
  </svg>
)

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [focused, setFocused] = useState(null)

  useEffect(() => {
    // Supabase auto-detects the recovery token from the URL hash
    // and fires PASSWORD_RECOVERY event. We just need to wait for the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Also check if we already have a session (token was already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // Fallback: if the URL has recovery params, mark as ready after a short delay
    const hash = window.location.hash
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      setTimeout(() => setReady(true), 1500)
    }

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error: updateError } = await updateUserPassword(password)
    setLoading(false)

    if (updateError) {
      if (updateError.message.toLowerCase().includes('same')) {
        setError('Le nouveau mot de passe doit etre different de l\'ancien.')
      } else if (updateError.message.toLowerCase().includes('session')) {
        setError('Le lien a expire. Demandez un nouveau lien de reinitialisation.')
      } else {
        setError(updateError.message)
      }
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    }
  }

  const inputStyle = {
    width: '100%', padding: '15px 18px',
    background: c.bgSurface, border: `1px solid ${c.border}`,
    color: c.text, fontSize: size.sm, fontFamily: f.body,
    outline: 'none', boxSizing: 'border-box',
    transition: `border-color 0.3s ${ease.luxury || ease.out}, box-shadow 0.3s ${ease.luxury || ease.out}, background 0.3s ${ease.luxury || ease.out}`,
    letterSpacing: '0.01em',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c.bg, fontFamily: f.body, color: c.text, padding: sp[4],
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: c.bgSurface,
        border: `1px solid ${c.border}`, padding: sp[5],
        animation: 'fadeSlideIn 0.5s ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: sp[4] }}>
          <DragonMark s={36} />
          <div style={{
            fontFamily: f.mono, fontSize: '9px', color: c.red,
            letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
            marginTop: sp[2], marginBottom: sp[1],
          }}>
            Reinitialisation
          </div>
          <h2 style={{
            fontFamily: f.display, fontSize: size.xl, fontWeight: 400,
            margin: 0, letterSpacing: '-0.02em',
          }}>
            Nouveau mot de passe
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', opacity: 0.25, marginTop: sp[2] }}>
            <div style={{ width: 5, height: 5, background: c.gold, transform: 'rotate(45deg)' }} />
            <div style={{ width: 60, height: '1px', background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: c.greenSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', marginBottom: sp[3],
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 style={{ fontFamily: f.display, fontSize: size.lg, margin: 0, marginBottom: sp[2] }}>
              Mot de passe mis a jour
            </h3>
            <p style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6 }}>
              Votre mot de passe a ete modifie avec succes. Vous allez etre redirige vers la connexion...
            </p>
            <button onClick={() => navigate('/login')} style={{
              marginTop: sp[3], padding: `12px ${sp[4]}`,
              background: c.red, color: c.text, border: 'none',
              fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
              cursor: 'pointer', width: '100%',
            }}>
              Se connecter
            </button>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', padding: sp[4] }}>
            <div style={{
              width: 28, height: 28, border: `1.5px solid ${c.border}`,
              borderTopColor: c.red, transform: 'rotate(45deg)',
              animation: 'spin 1s linear infinite', margin: '0 auto', marginBottom: sp[3],
            }} />
            <p style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6 }}>
              Verification du lien de reinitialisation...
            </p>
            <p style={{ fontSize: size.xs, color: c.textTertiary, lineHeight: 1.5, marginTop: sp[2] }}>
              Si rien ne se passe, le lien a peut-etre expire.{' '}
              <span onClick={() => navigate('/login')} style={{ color: c.red, cursor: 'pointer', textDecoration: 'underline' }}>
                Demander un nouveau lien
              </span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: size.sm, color: c.textSecondary, marginBottom: sp[3], lineHeight: 1.6 }}>
              Choisissez un nouveau mot de passe pour votre compte CARAXES.
            </p>

            <div style={{ marginBottom: sp[3] }}>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 600,
                color: c.textTertiary, marginBottom: sp[1],
                fontFamily: f.mono, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password" required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 caracteres"
                  autoFocus
                  onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle,
                    background: focused === 'pw' ? c.bgElevated : c.bgSurface,
                    borderColor: focused === 'pw' ? c.red : c.border,
                    boxShadow: focused === 'pw' ? `0 0 0 3px ${c.redSoft}` : 'none',
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5px',
                  background: c.red, transform: `scaleX(${focused === 'pw' ? 1 : 0})`,
                  transition: `transform 0.4s ${ease.out}`, transformOrigin: 'left',
                }} />
              </div>
            </div>

            <div style={{ marginBottom: sp[3] }}>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 600,
                color: c.textTertiary, marginBottom: sp[1],
                fontFamily: f.mono, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password" required minLength={6}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  onFocus={() => setFocused('pw2')} onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle,
                    background: focused === 'pw2' ? c.bgElevated : c.bgSurface,
                    borderColor: focused === 'pw2' ? c.red : c.border,
                    boxShadow: focused === 'pw2' ? `0 0 0 3px ${c.redSoft}` : 'none',
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5px',
                  background: c.red, transform: `scaleX(${focused === 'pw2' ? 1 : 0})`,
                  transition: `transform 0.4s ${ease.out}`, transformOrigin: 'left',
                }} />
              </div>
            </div>

            {/* Password match indicator */}
            {confirmPassword && (
              <div style={{
                fontSize: size.xs, marginBottom: sp[3], display: 'flex', alignItems: 'center', gap: '6px',
                color: password === confirmPassword ? c.green : c.red,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={password === confirmPassword ? 'M20 6L9 17l-5-5' : 'M18 6L6 18M6 6l12 12'} />
                </svg>
                {password === confirmPassword ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
              </div>
            )}

            {error && (
              <div style={{
                padding: `${sp[2]} ${sp[3]}`, background: c.redSoft,
                border: `1px solid ${c.redGlow}`, fontSize: size.xs,
                color: c.red, marginBottom: sp[3], lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px', background: c.red, color: c.text,
              border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              transition: `all 0.3s ${ease.out}`, letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = c.redDeep }}
            onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}
            >
              {loading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
            </button>

            <div style={{ textAlign: 'center', marginTop: sp[3] }}>
              <span onClick={() => navigate('/login')} style={{
                fontSize: size.xs, color: c.textTertiary, cursor: 'pointer',
                transition: transition.color,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = c.red }}
              onMouseLeave={(e) => { e.currentTarget.style.color = c.textTertiary }}
              >
                Retour a la connexion
              </span>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}
