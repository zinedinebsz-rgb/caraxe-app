/* ── CARAXES Admin — Shared Components ── */
import { c, f, size, sp, shadow, ease, transition, radius, gradient, STATUSES } from '../../lib/theme'

/* ── SVG ICONS ── */
export const Icon = ({ d, size: s = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  plus: 'M12 5v14m-7-7h14',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  calendar: 'M8 7V3m8 4V3m-9 8h14a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9a2 2 0 012-2z',
  trending: 'M23 6l-9.5 9.5-5-5L1 18',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  chevDown: 'M6 9l6 6 6-6',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://caraxes13.app.n8n.cloud/webhook'

/* ── FORMATTING ── */
export const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const fmtMoney = (v, decimals = 0) => {
  if (v == null || v === '' || v === 'À définir') return v || '–'
  if (typeof v === 'string' && /[€$¥£]|^\d+\s*[-–]\s*\d+/.test(v)) return v
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'))
  if (isNaN(n)) return v
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' €'
}
export const parseBudget = (b) => { if (typeof b === 'number') return b; if (!b) return 0; const n = parseFloat(String(b).replace(/[^\d.,-]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n }

/* ── CINEMATIC NOIR COMPONENTS ── */
export const DragonMark = ({ s = 28 }) => (
  <svg width={s} height={s} viewBox="0 0 44 44" fill="none">
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.85"/>
    <path d="M13 12L7 5M31 12L37 5" stroke={c.gold} strokeWidth="1" opacity="0.4"/>
    <circle cx="17.5" cy="21" r="2" fill={c.gold} opacity="0.9"/>
    <circle cx="26.5" cy="21" r="2" fill={c.gold} opacity="0.9"/>
  </svg>
)

export const ArtDecoDivider = ({ width = 100, color = c.gold }) => (
  <div style={{ width, height: '1px', background: color, opacity: 0.12, margin: `${sp[2]} 0` }} />
)

export const DragonEmptyState = ({ title, subtitle, action, actionLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: sp[6], gap: sp[2], textAlign: 'center', animation: 'cardReveal 0.4s ease', minHeight: 220 }}>
    <DragonMark s={28} />
    <h4 style={{ fontFamily: f.display, fontSize: size.base, marginBottom: 0, fontWeight: 600, color: c.text, letterSpacing: '0.04em' }}>{title}</h4>
    {subtitle && <p style={{ fontFamily: f.body, fontSize: size.xs, color: c.textTertiary, margin: 0, letterSpacing: '0.01em', maxWidth: '30ch', lineHeight: 1.5 }}>{subtitle}</p>}
    {action && (
      <button onClick={action} style={{
        marginTop: sp[1], padding: `${sp[1.5]} ${sp[4]}`, background: 'transparent',
        border: `1px solid ${c.gold}`, color: c.gold, fontFamily: f.mono, fontSize: '10px',
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
        transition: `all 0.3s ${ease.luxury}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = c.gold; e.currentTarget.style.color = c.bg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.gold }}>
        {actionLabel || 'INITIER ACTION'}
      </button>
    )}
  </div>
)

export const SkeletonCard = ({ lines = 3 }) => (
  <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `${c.gold}15` }} />
    <div style={{ width: 60, height: 8, background: `${c.gold}10`, marginBottom: sp[2], animation: 'skeletonPulse 1.5s ease infinite' }} />
    <div style={{ width: 80, height: 24, background: `${c.text}05`, marginBottom: sp[1.5], animation: 'skeletonPulse 1.5s ease infinite 0.2s' }} />
    {Array.from({ length: lines - 2 }).map((_, i) => (
      <div key={i} style={{ width: `${70 + Math.random() * 30}%`, height: 6, background: `${c.text}04`, marginBottom: 4, animation: `skeletonPulse 1.5s ease infinite ${0.1 * i}s` }} />
    ))}
  </div>
)

export const MiniSparkline = ({ data = [10, 40, 25, 70, 45, 60, 30], color = c.gold, w = 56, h = 18 }) => {
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} opacity="0.7" />
    </svg>
  )
}

/* ── SHARED STYLES ── */
export const focusGlow = `0 0 0 3px ${c.redSoft}`
export const inputStyle = {
  width: '100%', padding: `${sp[2]} ${sp[2]}`, background: c.bgInput,
  border: 'none', borderBottom: `1px solid ${c.border}`, color: c.text,
  fontSize: size.sm, outline: 'none', fontFamily: f.body,
  borderRadius: `${radius.xs} ${radius.xs} 0 0`,
  transition: `all 0.25s ${ease.expo}`,
}

export const labelStyle = {
  display: 'block', fontSize: size['2xs'], fontWeight: 600,
  color: c.textTertiary, marginBottom: '6px', fontFamily: f.mono,
  letterSpacing: '0.10em', textTransform: 'uppercase',
}

/* ── KEYFRAMES ── */
export const keyframes = `
@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes spin { to { transform:rotate(360deg) } }
@keyframes pulseGlow { 0%,100% { opacity:0.7 } 50% { opacity:1 } }
@keyframes barReveal { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes cardReveal { from { opacity:0; transform:translateY(8px) scale(0.99) } to { opacity:1; transform:translateY(0) scale(1) } }
@keyframes skeletonPulse { 0% { opacity:0.04 } 50% { opacity:0.08 } 100% { opacity:0.04 } }
@keyframes tooltipIn { from { opacity:0; transform:translateX(-3px) } to { opacity:1; transform:translateX(0) } }
@keyframes trackingPulse { 0%,100% { opacity:0.7 } 50% { opacity:1 } }
@keyframes staggerFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
@keyframes diamondSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes borderGlow { 0%,100% { border-color: rgba(196, 163, 90, 0.12) } 50% { border-color: rgba(196, 163, 90, 0.20) } }
`

export const scrollbarCSS = `
.admin-scroll::-webkit-scrollbar { width:5px }
.admin-scroll::-webkit-scrollbar-track { background:transparent }
.admin-scroll::-webkit-scrollbar-thumb { background:${c.borderSubtle}; border-radius:${radius.pill} }
.admin-scroll::-webkit-scrollbar-thumb:hover { background:${c.borderLight} }
* { transition: border-color 0.2s ${ease.luxury}, box-shadow 0.2s ${ease.luxury}; }
button, a, input, select, textarea { transition: all 0.25s ${ease.luxury}; }
`

/* ── Sidebar Tooltip ── */
export const SidebarTooltip = ({ label, visible }) => {
  if (!visible) return null
  return (
    <div style={{
      position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
      marginLeft: 8, padding: '4px 10px', background: c.bgElevated,
      border: `1px solid ${c.border}`, whiteSpace: 'nowrap', zIndex: 100,
      fontSize: '10px', fontFamily: f.mono, color: c.gold,
      animation: 'tooltipIn 0.15s ease',
      pointerEvents: 'none',
    }}>{label}</div>
  )
}
