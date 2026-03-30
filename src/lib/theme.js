// ─── CARAXES Design System v4 — Cinematic Noir + Art Deco (OKLCH) ───

export const c = {
  // Backgrounds — warm noir, never pure black
  bg:         'oklch(7% 0.005 50)',
  bgWarm:     'oklch(9% 0.006 50)',
  bgSurface:  'oklch(12% 0.007 50)',
  bgElevated: 'oklch(15% 0.008 50)',
  bgHover:    'oklch(18% 0.008 50)',
  bgOverlay:  'oklch(5% 0.005 50 / 0.75)',

  // Brand — Dragon Red
  red:        'oklch(55% 0.22 25)',
  redDeep:    'oklch(45% 0.20 25)',
  redSoft:    'oklch(55% 0.22 25 / 0.10)',
  redGlow:    'oklch(55% 0.22 25 / 0.15)',

  // Brand — Art Deco Gold
  gold:       'oklch(75% 0.12 85)',
  goldDim:    'oklch(65% 0.10 85)',
  goldSoft:   'oklch(75% 0.12 85 / 0.10)',
  goldGlow:   'oklch(75% 0.12 85 / 0.12)',

  // Semantic — status pipeline
  blue:       'oklch(68% 0.15 250)',
  blueSoft:   'oklch(68% 0.15 250 / 0.10)',
  purple:     'oklch(62% 0.18 300)',
  purpleSoft: 'oklch(62% 0.18 300 / 0.10)',
  amber:      'oklch(78% 0.15 80)',
  amberSoft:  'oklch(78% 0.15 80 / 0.10)',
  teal:       'oklch(72% 0.12 180)',
  tealSoft:   'oklch(72% 0.12 180 / 0.10)',
  green:      'oklch(72% 0.16 155)',
  greenSoft:  'oklch(72% 0.16 155 / 0.10)',

  // Text — warm cream hierarchy
  text:          'oklch(93% 0.01 70)',
  textSecondary: 'oklch(62% 0.015 60)',
  textTertiary:  'oklch(45% 0.01 55)',

  // Borders — warm, never blue-grey
  border:       'oklch(22% 0.008 50)',
  borderSubtle: 'oklch(18% 0.006 50)',
  borderFocus:  'oklch(55% 0.22 25)',

  // Utility
  white:     'oklch(98% 0.005 70)',
  black:     'oklch(5% 0.005 50)',
}

export const f = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', 'Helvetica Neue', sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', monospace",
}

export const size = {
  xs:   'clamp(0.6875rem, 0.6rem + 0.25vw, 0.75rem)',
  sm:   'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)',
  base: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1rem)',
  md:   'clamp(1.0625rem, 0.95rem + 0.35vw, 1.125rem)',
  lg:   'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)',
  xl:   'clamp(1.5rem, 1.2rem + 0.8vw, 2rem)',
  '2xl':'clamp(2rem, 1.5rem + 1.2vw, 2.75rem)',
  '3xl':'clamp(2.5rem, 1.8rem + 1.8vw, 3.5rem)',
  hero: 'clamp(3rem, 2rem + 2.5vw, 4.5rem)',
}

// 8px spatial grid
export const sp = {
  1: '0.5rem',   // 8px
  2: '1rem',     // 16px
  3: '1.5rem',   // 24px
  4: '2rem',     // 32px
  5: '2.5rem',   // 40px
  6: '3rem',     // 48px
  8: '4rem',     // 64px
  10: '5rem',    // 80px
  12: '6rem',    // 96px
  16: '8rem',    // 128px
}

export const radius = {
  none: '0px',
  sm:   '2px',
  md:   '4px',
  pill: '9999px',
}

export const shadow = {
  sm:   '0 1px 3px oklch(5% 0.005 50 / 0.3)',
  md:   '0 4px 16px oklch(5% 0.005 50 / 0.25)',
  lg:   '0 8px 32px oklch(5% 0.005 50 / 0.35)',
  glow: '0 0 24px oklch(55% 0.22 25 / 0.15)',
}

export const ease = {
  out:    'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
}

export const STATUSES = [
  { key: 'pending',     label: 'En attente',             color: c.textSecondary, bg: 'oklch(62% 0.015 60 / 0.10)' },
  { key: 'sourcing',    label: 'Recherche fournisseur',  color: c.blue,          bg: c.blueSoft },
  { key: 'negotiation', label: 'N\u00e9gociation',      color: c.purple,        bg: c.purpleSoft },
  { key: 'sample',      label: '\u00c9chantillon',       color: c.amber,         bg: c.amberSoft },
  { key: 'production',  label: 'Production',             color: c.red,           bg: c.redSoft },
  { key: 'shipping',    label: 'Exp\u00e9dition',        color: c.teal,          bg: c.tealSoft },
  { key: 'delivered',   label: 'Livr\u00e9',             color: c.green,         bg: c.greenSoft },
]
