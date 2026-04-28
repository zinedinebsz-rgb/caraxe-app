// ─── CARAXES Shared Cinematic UI Components ───
// Extracted from Dashboard.jsx & Admin.jsx to ensure visual consistency
import { c, f, size, sp } from '../lib/theme'

/* ── DRAGON MARK ── */
export function DragonMark({ s = 40, glow = true }) {
  return (
    <svg width={s} height={s} viewBox="0 0 44 44" fill="none" style={{
      filter: glow ? `drop-shadow(0 0 12px rgba(196, 58, 47, 0.25))` : 'none',
      transition: 'filter 0.3s ease',
    }}>
      <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.9"/>
      <path d="M13 12L7 5M31 12L37 5" stroke={c.gold} strokeWidth="1" opacity="0.4"/>
      <circle cx="17.5" cy="21" r="2.2" fill={c.gold} opacity="0.95"/>
      <circle cx="26.5" cy="21" r="2.2" fill={c.gold} opacity="0.95"/>
      <path d="M22 27 Q20 30 18 32" stroke={c.gold} strokeWidth="0.8" opacity="0.5"/>
    </svg>
  )
}

/* ── FILM GRAIN OVERLAY ── */
export function FilmGrain({ id = 'grain', opacity: op = 0.035 }) {
  return (
    <svg style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', opacity: op, mixBlendMode: 'overlay', zIndex: 1,
    }}>
      <defs>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" seed="2"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${id})`}/>
    </svg>
  )
}

/* ── ART DECO DIVIDER ── */
export function ArtDecoDivider({ width = 80, opacity: op = 0.3, color = c.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: op }}>
      <div style={{ width: 5, height: 5, background: color, transform: 'rotate(45deg)', opacity: 0.8 }} />
      <div style={{ width, height: '1px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  )
}

/* ── DECO PATTERN (diamond grid background) ── */
export function DecoPattern({ color = c.gold, opacity: op = 0.06, id = 'deco-grid' }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: op }} viewBox="0 0 200 200" preserveAspectRatio="none">
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4"/>
          <circle cx="20" cy="20" r="1.5" fill={color} opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="200" height="200" fill={`url(#${id})`}/>
    </svg>
  )
}

/* ── SECTION BANNER ── */
export function SectionBanner({ title, subtitle, accentColor = c.gold, icon, patternId = 'section-deco' }) {
  return (
    <div style={{
      height: 100, marginBottom: sp[4], position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${c.bgElevated}, ${c.bg})`,
      border: `1px solid ${c.borderSubtle}`,
    }}>
      <DecoPattern color={accentColor} opacity={0.08} id={patternId} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent 60%)` }} />
      <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, border: `1px solid ${accentColor}22`, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', bottom: -8, right: 40, width: 16, height: 16, border: `1px solid ${accentColor}15`, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp[5]}`, zIndex: 1 }}>
        <div>
          {subtitle && <p style={{ fontFamily: f.mono, fontSize: '10px', color: accentColor, letterSpacing: '0.12em', textTransform: 'uppercase', margin: `0 0 ${sp[1]}`, fontWeight: 600 }}>◆ {subtitle}</p>}
          <h1 style={{ fontSize: size['2xl'], fontFamily: f.display, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        </div>
        {icon && <div style={{ opacity: 0.15, fontSize: 48 }}>{icon}</div>}
      </div>
    </div>
  )
}

/* ── DRAGON EMPTY STATE ── */
export function DragonEmptyState({ title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: sp[6], gap: sp[3], textAlign: 'center', animation: 'fadeSlideUp 0.6s ease',
    }}>
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 80, height: 80, border: `1px solid ${c.gold}22`, transform: 'rotate(45deg)' }} />
        <DragonMark s={36} glow={false} />
      </div>
      <h4 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, color: c.text, letterSpacing: '0.04em' }}>{title}</h4>
      {subtitle && <p style={{ fontFamily: f.body, fontSize: size.xs, color: c.textTertiary, margin: 0, letterSpacing: '0.01em' }}>{subtitle}</p>}
    </div>
  )
}

/* ── STAT CARD (redesigned) ── */
export function StatCard({ label, value, sublabel, accentColor = c.red, icon, delay = 0 }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: c.bgSurface,
      border: `1px solid ${c.borderSubtle}`,
      padding: `${sp[4]} ${sp[4]}`,
      minWidth: 180,
      animation: `fadeSlideUp 0.5s ease ${delay}s both`,
    }}>
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accentColor}, transparent 70%)`,
      }} />
      {/* Corner diamond */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 20, height: 20,
        border: `1px solid ${accentColor}18`,
        transform: 'rotate(45deg)',
      }} />

      {/* Label */}
      <div style={{
        fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[2],
        display: 'flex', alignItems: 'center', gap: sp[1.5],
      }}>
        {label}
        {icon && <span style={{ opacity: 0.5 }}>{icon}</span>}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700,
        color: accentColor, letterSpacing: '-0.02em', lineHeight: 1,
        marginBottom: sp[1.5],
      }}>
        {value}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div style={{
          fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
          letterSpacing: '0.04em',
        }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

/* ── ORDER CARD (redesigned) ── */
export function OrderCard({ id, name, qty, price, status, accentColor = c.green, onClick, delay = 0 }) {
  const statusColors = {
    'Livré': c.green,
    'En production': c.blue,
    'Expédié': c.teal,
    'En transit': c.purple,
    'Confirmé': c.amber,
    'En attente': c.textTertiary,
    'Nouveau': c.red,
  }
  const statusColor = statusColors[status] || c.green

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        background: c.bgSurface,
        border: `1px solid ${c.borderSubtle}`,
        padding: sp[4],
        transition: 'border-color 0.2s ease, background 0.2s ease',
        animation: `fadeSlideUp 0.4s ease ${delay}s both`,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = statusColor + '40'; e.currentTarget.style.background = c.bgElevated }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.background = c.bgSurface }}
    >
      {/* Status bar top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${statusColor}, transparent 60%)`,
      }} />

      {/* Order ID */}
      <p style={{
        fontFamily: f.mono, fontSize: '10px', color: c.gold,
        letterSpacing: '0.08em', margin: `0 0 ${sp[2]}`,
      }}>◆ {id}</p>

      {/* Product name */}
      <h4 style={{
        fontFamily: f.body, fontSize: size.base, fontWeight: 600,
        color: c.text, margin: `0 0 ${sp[2]}`, lineHeight: 1.3,
      }}>{name}</h4>

      {/* Meta row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: sp[3],
      }}>
        <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textSecondary }}>
          {qty} unités
        </span>
        <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textSecondary }}>
          {price}
        </span>
      </div>

      {/* Status pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px',
        background: statusColor + '12',
        border: `1px solid ${statusColor}25`,
        fontFamily: f.mono, fontSize: '10px', color: statusColor,
        letterSpacing: '0.04em',
      }}>
        <div style={{ width: 5, height: 5, background: statusColor, transform: 'rotate(45deg)' }} />
        {status}
      </div>
    </div>
  )
}

/* ── CATALOGUE CATEGORY CARD (redesigned — no emojis) ── */
const categoryIcons = {
  'Gadgets Tendance': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  'Accessoires Tech': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  'Bijoux & Accessoires': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
    </svg>
  ),
  'Cosmétique & Beauté': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  'Textile & Mode': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2 12 5 8 2 3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
    </svg>
  ),
  'Maison & Déco': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
}

export function getCategoryIcon(name) {
  return categoryIcons[name] || (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

export function CatalogueCard({ name, description, moq, icon, onOrder, delay = 0 }) {
  const iconElement = getCategoryIcon(name)

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: c.bgSurface,
      border: `1px solid ${c.borderSubtle}`,
      padding: sp[4],
      display: 'flex', flexDirection: 'column', gap: sp[3],
      transition: 'border-color 0.2s ease',
      animation: `fadeSlideUp 0.4s ease ${delay}s both`,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = c.gold + '30'}
      onMouseLeave={e => e.currentTarget.style.borderColor = c.borderSubtle}
    >
      {/* Icon area */}
      <div style={{
        width: 48, height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c.gold,
        border: `1px solid ${c.gold}20`,
        background: c.gold + '08',
        transform: 'rotate(0deg)',
      }}>
        {icon || iconElement}
      </div>

      {/* Tag */}
      <span style={{
        fontFamily: f.mono, fontSize: '9px', color: c.gold,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>◆ CAT</span>

      {/* Name */}
      <h3 style={{
        fontFamily: f.display, fontSize: size.md, fontWeight: 600,
        color: c.text, margin: 0, fontStyle: 'italic',
      }}>{name}</h3>

      {/* Description */}
      <p style={{
        fontFamily: f.body, fontSize: size.xs, color: c.textSecondary,
        margin: 0, lineHeight: 1.5, flex: 1,
      }}>{description}</p>

      {/* Footer: MOQ + CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: sp[2],
        borderTop: `1px solid ${c.borderSubtle}`,
      }}>
        <span style={{
          fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
          letterSpacing: '0.06em',
        }}>MOQ: {moq}</span>

        <button
          onClick={onOrder}
          style={{
            fontFamily: f.mono, fontSize: '10px',
            color: c.gold, background: 'transparent',
            border: `1px solid ${c.gold}30`,
            padding: '6px 14px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.target.style.background = c.gold + '12'; e.target.style.borderColor = c.gold + '50' }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = c.gold + '30' }}
        >
          Commander →
        </button>
      </div>
    </div>
  )
}

/* ── SHARED KEYFRAMES ── */
export const sharedKeyframes = `
@keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes spin { to { transform:rotate(360deg) } }
@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(196, 58, 47, 0) } 50% { box-shadow: 0 0 12px 2px rgba(196, 58, 47, 0.15) } }
@keyframes barReveal { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes cardReveal { from { opacity:0; transform:translateY(12px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
`

/* ── SHARED SCROLLBAR CSS ── */
export const scrollbarCSS = `
.caraxes-scroll::-webkit-scrollbar { width:5px }
.caraxes-scroll::-webkit-scrollbar-track { background:transparent }
.caraxes-scroll::-webkit-scrollbar-thumb { background:#3a3733; border-radius:0 }
.caraxes-scroll::-webkit-scrollbar-thumb:hover { background:#4d4a46 }
`
