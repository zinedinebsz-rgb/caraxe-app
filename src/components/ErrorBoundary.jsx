import { Component } from 'react'
import { c, f, size, sp, ease } from '../lib/theme'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CARAXES] Crash caught:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, fontFamily: f.body, color: c.text, flexDirection: 'column',
        gap: sp[4], padding: sp[4], textAlign: 'center',
      }}>
        {/* Dragon icon */}
        <svg width="48" height="48" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.7 }}>
          <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.8"/>
          <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.9"/>
          <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.9"/>
        </svg>

        <div>
          <h1 style={{
            fontFamily: f.display, fontSize: size.xl, fontWeight: 700,
            margin: 0, marginBottom: sp[1], color: c.text,
          }}>
            Quelque chose s'est mal passe
          </h1>
          <p style={{
            fontSize: size.sm, color: c.textSecondary, margin: 0,
            maxWidth: 400, lineHeight: 1.6,
          }}>
            Une erreur inattendue est survenue. Vos donnees sont en securite.
          </p>
        </div>

        {/* Error detail (dev only) */}
        {this.state.error && (
          <div style={{
            padding: sp[2], background: c.bgSurface, border: `1px solid ${c.border}`,
            maxWidth: 500, width: '100%', textAlign: 'left',
          }}>
            <code style={{
              fontFamily: f.mono, fontSize: '11px', color: c.red,
              wordBreak: 'break-all', lineHeight: 1.5,
            }}>
              {this.state.error.message}
            </code>
          </div>
        )}

        <div style={{ display: 'flex', gap: sp[2] }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: `${sp[2]} ${sp[4]}`, background: c.red,
              border: 'none', color: c.text, fontSize: size.sm,
              fontWeight: 700, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`,
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
            onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}
          >
            Recharger l'application
          </button>
          <button
            onClick={() => { window.location.href = '/login' }}
            style={{
              padding: `${sp[2]} ${sp[4]}`, background: 'transparent',
              border: `1px solid ${c.border}`, color: c.textSecondary,
              fontSize: size.sm, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.text }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}
          >
            Retour au login
          </button>
        </div>

        <span style={{
          fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
          letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: sp[2],
        }}>
          CARAXES v1.0 — Erreur capturee
        </span>
      </div>
    )
  }
}
