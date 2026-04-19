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
          Cette page n'existe pas ou a ete deplacee.
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
          Retour a l'accueil
        </button>
      </div>
    </div>
  )
}
