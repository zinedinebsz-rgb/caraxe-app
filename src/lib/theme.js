// ─── CARAXES Design System v8 — Cinematic Noir · Art Deco Premium ───
// Direction: Warm dark luxury × editorial type × selective gold richness.
// Depth through subtle shadows. Cinematic through restrained gradients.

export const c = {
  // Backgrounds — warm noir with perceptible layering
  bg:         '#0c0b09',
  bgWarm:     '#121110',
  bgSurface:  '#1a1816',
  bgElevated: '#221f1c',
  bgHover:    '#2a2724',
  bgOverlay:  'rgba(6, 5, 4, 0.92)',
  bgGlass:    'rgba(18, 17, 14, 0.75)',
  bgCard:     '#161413',
  bgInput:    '#100f0d',

  // Brand — Dragon Red
  red:        '#c43a2f',
  redDeep:    '#8b2920',
  redSoft:    'rgba(196, 58, 47, 0.10)',
  redGlow:    'rgba(196, 58, 47, 0.15)',
  redMuted:   '#6b3530',
  redVivid:   '#d94535',

  // Brand — Art Deco Gold
  gold:       '#c4a35a',
  goldDim:    '#9a7e45',
  goldSoft:   'rgba(196, 163, 90, 0.10)',
  goldGlow:   'rgba(196, 163, 90, 0.15)',
  goldMuted:  '#6e5c38',
  goldBright: '#d4b46a',
  goldLine:   'rgba(196, 163, 90, 0.18)',

  // Semantic — pipeline
  blue:       '#5a8ac4',
  blueSoft:   'rgba(90, 138, 196, 0.10)',
  purple:     '#8a6ac4',
  purpleSoft: 'rgba(138, 106, 196, 0.10)',
  amber:      '#c4a35a',
  amberSoft:  'rgba(196, 163, 90, 0.10)',
  teal:       '#5aaa8a',
  tealSoft:   'rgba(90, 170, 138, 0.10)',
  green:      '#5aaa6a',
  greenSoft:  'rgba(90, 170, 106, 0.10)',

  // Text — warm cream with better contrast range
  text:          '#f5f0e8',
  textSecondary: '#998f82',
  textTertiary:  '#80796f',
  textGhost:     '#5a554e',

  // Borders — warm with visible gold option
  border:       '#2e2a26',
  borderSubtle: '#221f1c',
  borderFocus:  '#c43a2f',
  borderGold:   'rgba(196, 163, 90, 0.22)',
  borderLight:  '#3a3632',
  borderAccent: 'rgba(196, 163, 90, 0.15)',

  // Utility
  white:     '#f5f0e8',
  black:     '#0c0b09',
}

export const f = {
  display: "'Playfair Display', 'Instrument Serif', Georgia, serif",
  body:    "'DM Sans', 'Plus Jakarta Sans', 'Helvetica Neue', sans-serif",
  mono:    "'Geist Mono', 'JetBrains Mono', 'SF Mono', monospace",
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
