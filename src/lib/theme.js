// ─── CARAXES Design System v9 — Ember Editorial · Refonte 2026 ───
// Direction: Warm dark luxury × editorial type × selective gold richness.
// Depth through subtle shadows. Cinematic through restrained gradients.

export const c = {
  // Backgrounds — warm noir with perceptible layering
  bg:         '#0a0806',
  bgWarm:     '#100c07',
  bgSurface:  '#15100a',
  bgElevated: '#1c160e',
  bgHover:    '#221b12',
  bgOverlay:  'rgba(6, 5, 4, 0.92)',
  bgGlass:    'rgba(18, 17, 14, 0.75)',
  bgCard:     '#141009',
  bgInput:    '#0e0a06',

  // Brand — Dragon Red
  red:        '#e04a3d',
  redDeep:    '#a8362b',
  redSoft:    'rgba(224, 74, 61, 0.10)',
  redGlow:    'rgba(224, 74, 61, 0.16)',
  redMuted:   '#7a3c34',
  redVivid:   '#ef5b4e',

  // Brand — Art Deco Gold
  gold:       '#d8ae5c',
  goldDim:    '#9a8049',
  goldSoft:   'rgba(216, 174, 92, 0.10)',
  goldGlow:   'rgba(216, 174, 92, 0.16)',
  goldMuted:  '#7a663d',
  goldBright: '#f1d99c',
  goldLine:   'rgba(216, 174, 92, 0.20)',

  // Semantic — pipeline
  blue:       '#5a8ac4',
  blueSoft:   'rgba(90, 138, 196, 0.10)',
  purple:     '#b3a3e6',
  purpleSoft: 'rgba(179, 163, 230, 0.12)',
  amber:      '#d8ae5c',
  amberSoft:  'rgba(216, 174, 92, 0.10)',
  teal:       '#56bcc4',
  tealSoft:   'rgba(86, 188, 196, 0.12)',
  green:      '#5fc47e',
  greenSoft:  'rgba(95, 196, 126, 0.12)',

  // Text — warm cream with better contrast range
  text:          '#f2ead9',
  textSecondary: '#aa9d88',
  textTertiary:  '#8a7f70',
  textGhost:     '#6f6554',

  // Borders — warm with visible gold option
  border:       '#292117',
  borderSubtle: '#1c160e',
  borderFocus:  '#e04a3d',
  borderGold:   'rgba(216, 174, 92, 0.24)',
  borderLight:  '#3d3122',
  borderAccent: 'rgba(216, 174, 92, 0.16)',

  // Utility
  white:     '#f2ead9',
  black:     '#0a0806',
}

export const f = {
  display: "'Fraunces', 'Playfair Display', Georgia, serif",
  body:    "'Inter', 'DM Sans', system-ui, sans-serif",
  mono:    "'JetBrains Mono', 'Geist Mono', 'SF Mono', monospace",
}

export const size = {
  '2xs': 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.625rem)',
  xs:    'clamp(0.6875rem, 0.6rem + 0.25vw, 0.75rem)',
  sm:    'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)',
  base:  'clamp(0.9375rem, 0.85rem + 0.3vw, 1rem)',
  md:    'clamp(1.0625rem, 0.95rem + 0.35vw, 1.125rem)',
  lg:    'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)',
  xl:    'clamp(1.5rem, 1.2rem + 0.8vw, 2rem)',
  '2xl': 'clamp(2rem, 1.5rem + 1.2vw, 2.75rem)',
  '3xl': 'clamp(2.5rem, 1.8rem + 1.8vw, 3.5rem)',
  hero:  'clamp(3rem, 2rem + 2.5vw, 4.5rem)',
}

// 8px spatial grid with extra half-steps for premium rhythm
export const sp = {
  0.5: '0.25rem',
  0.75: '0.375rem',
  1: '0.5rem',
  1.5: '0.75rem',
  2: '1rem',
  2.5: '1.25rem',
  3: '1.5rem',
  4: '2rem',
  5: '2.5rem',
  6: '3rem',
  8: '4rem',
  10: '5rem',
  12: '6rem',
  16: '8rem',
}

export const radius = {
  none: '0px',
  xs:   '2px',
  sm:   '3px',
  md:   '4px',
  lg:   '6px',
  xl:   '8px',
  '2xl': '12px',
  pill: '9999px',
}

export const shadow = {
  xs:    '0 1px 2px rgba(6,5,4,0.3)',
  sm:    '0 1px 3px rgba(6,5,4,0.35), 0 1px 2px rgba(6,5,4,0.25)',
  md:    '0 4px 16px rgba(6,5,4,0.3), 0 1px 4px rgba(6,5,4,0.2)',
  lg:    '0 8px 32px rgba(6,5,4,0.4), 0 2px 8px rgba(6,5,4,0.25)',
  xl:    '0 16px 48px rgba(6,5,4,0.45), 0 4px 12px rgba(6,5,4,0.2)',
  glow:  '0 0 20px rgba(196, 58, 47, 0.12)',
  gold:  '0 0 24px rgba(196, 163, 90, 0.10)',
  inner: 'inset 0 1px 2px rgba(6,5,4,0.3)',
  card:  '0 2px 12px rgba(6,5,4,0.35)',
  cardHover: '0 4px 20px rgba(6,5,4,0.4), 0 0 0 1px rgba(196, 163, 90, 0.08)',
  glass: '0 8px 32px rgba(6,5,4,0.25)',
}

export const ease = {
  out:    'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  luxury: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  expo:   'cubic-bezier(0.19, 1, 0.22, 1)',
}

export const transition = {
  fast:    'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  normal:  'all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)',
  slow:    'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  color:   'color 0.2s ease, border-color 0.2s ease',
  lift:    'transform 0.25s ease, box-shadow 0.25s ease',
}

// Glass — subtle depth, not flat
export const glass = {
  panel:   `background: ${c.bgCard}; box-shadow: 0 2px 12px rgba(6,5,4,0.3);`,
  surface: `background: ${c.bgSurface}; box-shadow: 0 1px 4px rgba(6,5,4,0.2);`,
  card:    `background: ${c.bgCard}; box-shadow: 0 2px 8px rgba(6,5,4,0.25);`,
  subtle:  `background: ${c.bgInput};`,
}

// Gradients — selective cinematic richness
export const gradient = {
  goldLine:  `linear-gradient(90deg, transparent, ${c.goldLine}, transparent)`,
  redFade:   `linear-gradient(135deg, ${c.redSoft}, transparent)`,
  surface:   `linear-gradient(180deg, ${c.bgSurface}, ${c.bgInput})`,
  hero:      `linear-gradient(180deg, ${c.bgSurface} 0%, ${c.bg} 100%)`,
  sidebar:   `linear-gradient(180deg, ${c.bgSurface}, ${c.bg})`,
  card:      `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`,
  goldShine: `linear-gradient(105deg, rgba(196,163,90,0.03) 0%, rgba(196,163,90,0.10) 50%, rgba(196,163,90,0.03) 100%)`,
  warmVeil:  `linear-gradient(180deg, rgba(196,163,90,0.03) 0%, transparent 60%)`,
}

export const STATUSES = [
  { key: 'pending',     label: 'En attente',             color: c.textSecondary, bg: 'rgba(100, 95, 88, 0.10)' },
  { key: 'sourcing',    label: 'Recherche fournisseur',  color: c.blue,          bg: c.blueSoft },
  { key: 'negotiation', label: 'Négociation',             color: c.purple,        bg: c.purpleSoft },
  { key: 'sample',      label: 'Échantillon',             color: c.amber,         bg: c.amberSoft },
  { key: 'production',  label: 'Production',               color: c.red,           bg: c.redSoft },
  { key: 'shipping',    label: 'Expédition',               color: c.teal,          bg: c.tealSoft },
  { key: 'delivered',   label: 'Livré',                    color: c.green,         bg: c.greenSoft },
]


// ─── STATUS HELPERS (shared) ───
export function statusKey(status) {
  if (typeof status === 'number') return STATUSES[status]?.key || STATUSES[0].key
  return STATUSES.find((s) => s.key === status)?.key || status || STATUSES[0].key
}
export function isDelivered(status) {
  return statusKey(status) === 'delivered' || status === 'livré'
}
