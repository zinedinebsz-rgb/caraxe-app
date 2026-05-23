import { useNavigate } from 'react-router-dom'
import { c, f, size, sp, ease, radius, shadow } from '../lib/theme'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: c.bg,
      fontFamily: f.body,
      color: c.text,
      flexDirection: 'column',
      gap: sp[3],
      padding: sp[4],
      textAlign: 'center',
    }}>
      <div style={{
        background: c.bgCard,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        padding: sp[8],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: sp[3],
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.5 }}>
          <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.6"/>
          <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.8"/>
          <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.8"/>
        </svg>
        <div style={{
          fontFamily: f.display,
          fontSize: '48px',
          fontWeight: 700,
          color: c.gold,
          letterSpacing: '-0.02em'
        }}>
          404
        </div>
        <p style={{
          fontSize: size.sm,
          color: c.textSecondary,
          margin: 0,
          maxWidth: 320,
          lineHeight: 1.6
        }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: `${sp[2]} ${sp[4]}`,
            background: c.red,
            border: 'none',
            borderRadius: radius.lg,
            color: c.text,
            fontSize: size.sm,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: f.body,
            transition: `all 0.2s ${ease.smooth}`,
            marginTop: sp[1],
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
          onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}
        >
          Retour à l'accueil
        </button>
        <div style={{
          marginTop: sp[4],
          paddingTop: sp[3],
          borderTop: `1px solid ${c.border}`,
          width: '100%',
          maxWidth: 320,
        }}>
          <div style={{
            fontFamily: f.mono,
            fontSize: '10px',
            color: c.textTertiary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: sp[2],
            textAlign: 'center',
          }}>
            Accès rapide
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
            <a href="/" style={{ color: c.gold, fontSize: size.xs, textDecoration: 'none', padding: sp[1], borderRadius: radius.md }}>
              → Mon tableau de bord
            </a>
            <a href="/settings" style={{ color: c.textSecondary, fontSize: size.xs, textDecoration: 'none', padding: sp[1], borderRadius: radius.md }}>
              → Mes paramètres
            </a>
            <a href="https://wa.me/8613819652960" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontSize: size.xs, textDecoration: 'none', padding: sp[1], borderRadius: radius.md }}>
              → Contacter mon agent CARAXES
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
