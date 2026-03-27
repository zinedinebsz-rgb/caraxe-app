import { useState } from 'react'
import { signInWithEmail } from '../lib/supabase'
import { c, f } from '../lib/theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c.bg, padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(ellipse at center, rgba(230,57,70,0.06) 0%, rgba(212,168,67,0.03) 40%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '420px', position: 'relative', zIndex: 2,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem',
          }}>
            <span style={{ color: c.red, fontSize: '1.5rem' }}>{'\u2666'}</span>
            <span style={{
              fontFamily: f.display, fontWeight: 900, fontSize: '2rem', letterSpacing: '0.08em', color: c.text,
            }}>CARAXE</span>
          </div>
          <p style={{
            fontFamily: f.mono, fontSize: '0.7rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: c.textMuted,
          }}>Espace client</p>
        </div>

        {/* Card */}
        <div style={{
          background: c.bgC, border: `1px solid ${c.border}`, padding: '2.5rem',
        }}>
          {!sent ? (
            <>
              <h1 style={{
                fontFamily: f.display, fontSize: '1.5rem', fontWeight: 700,
                marginBottom: '0.5rem', textAlign: 'center',
              }}>Connexion</h1>
              <p style={{
                color: c.textDim, fontSize: '0.9rem', textAlign: 'center',
                marginBottom: '2rem', lineHeight: 1.6,
              }}>
                Entrez votre email pour recevoir un lien de connexion. Pas de mot de passe.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{
                  display: 'block', fontFamily: f.mono, fontSize: '0.7rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: c.textMuted, marginBottom: '0.5rem',
                }}>Email</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  style={{
                    width: '100%', padding: '0.9rem 1rem', background: c.bg,
                    border: `1px solid ${c.border}`, color: c.text,
                    fontFamily: f.body, fontSize: '0.95rem', outline: 'none',
                    marginBottom: '1.25rem', borderRadius: '2px',
                  }}
                />
                {error && (
                  <p style={{
                    color: c.red, fontSize: '0.8rem', marginBottom: '1rem',
                  }}>{error}</p>
                )}
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '1rem', background: loading ? c.bgE : c.red,
                  color: '#fff', border: 'none', fontFamily: f.body, fontSize: '0.85rem',
                  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: loading ? 'wait' : 'pointer', borderRadius: '2px',
                  transition: 'all 0.3s',
                }}>
                  {loading ? 'Envoi en cours\u2026' : 'Recevoir le lien'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{'\u2709\uFE0F'}</div>
              <h2 style={{
                fontFamily: f.display, fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem',
              }}>V\u00e9rifiez vos emails</h2>
              <p style={{ color: c.textDim, fontSize: '0.9rem', lineHeight: 1.6 }}>
                Un lien de connexion a \u00e9t\u00e9 envoy\u00e9 \u00e0{' '}
                <strong style={{ color: c.gold }}>{email}</strong>.
                Cliquez dessus pour acc\u00e9der \u00e0 votre espace.
              </p>
              <button onClick={() => { setSent(false); setEmail('') }} style={{
                marginTop: '1.5rem', background: 'transparent',
                border: `1px solid ${c.border}`, color: c.textDim,
                padding: '0.6rem 1.5rem', fontFamily: f.body, fontSize: '0.8rem',
                cursor: 'pointer', borderRadius: '2px',
              }}>Renvoyer</button>
            </div>
          )}
        </div>

        <p style={{
          textAlign: 'center', fontSize: '0.75rem', color: c.textMuted,
          marginTop: '1.5rem',
        }}>
          Premi\u00e8re visite ? Le compte se cr\u00e9e automatiquement.
        </p>
      </div>
    </div>
  )
}