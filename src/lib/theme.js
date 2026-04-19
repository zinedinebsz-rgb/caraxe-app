// ─── CARAXES Design System v6 — Cinematic Noir + Art Deco Moderne (OKLCH) ───
// Direction: Art Deco premium × modern editorial. Jamais "IA-generated".

export const c = {
  // Backgrounds — layered warm noir with depth
  bg:         'oklch(6.5% 0.006 50)',
  bgWarm:     'oklch(8.5% 0.007 50)',
  bgSurface:  'oklch(11% 0.008 50)',
  bgElevated: 'oklch(14% 0.009 50)',
  bgHover:    'oklch(17% 0.010 50)',
  bgOverlay:  'oklch(4% 0.005 50 / 0.85)',
  bgGlass:    'oklch(10% 0.006 50 / 0.55)',
  bgCard:     'oklch(10.5% 0.007 50)',
  bgInput:    'oklch(8% 0.006 50)',

  // Brand — Dragon Red (cinema rouge profond)
  red:        'oklch(55% 0.22 25)',
  redDeep:    'oklch(42% 0.20 25)',
  redSoft:    'oklch(55% 0.22 25 / 0.08)',
  redGlow:    'oklch(55% 0.22 25 / 0.12)',
  redMuted:   'oklch(38% 0.12 25)',
  redVivid:   'oklch(60% 0.25 25)',

  // Brand — Art Deco Gold (warm luxe)
  gold:       'oklch(76% 0.13 85)',
  goldDim:    'oklch(64% 0.10 85)',
  goldSoft:   'oklch(76% 0.13 85 / 0.08)',
  goldGlow:   'oklch(76% 0.13 85 / 0.10)',
  goldMuted:  'oklch(52% 0.08 85)',
  goldBright: 'oklch(82% 0.14 85)',
  goldLine:   'oklch(76% 0.13 85 / 0.15)',

  // Semantic — status pipeline (légèrement désaturés, plus élégants)
  blue:       'oklch(68% 0.13 250)',
  blueSoft:   'oklch(68% 0.13 250 / 0.08)',
  purple:     'oklch(62% 0.15 300)',
  purpleSoft: 'oklch(62% 0.15 300 / 0.08)',
  amber:      'oklch(78% 0.13 80)',
  amberSoft:  'oklch(78% 0.13 80 / 0.08)',
  teal:       'oklch(72% 0.10 180)',
  tealSoft:   'oklch(72% 0.10 180 / 0.08)',
  green:      'oklch(72% 0.14 155)',
  greenSoft:  'oklch(72% 0.14 155 / 0.08)',

  // Text — warm cream hierarchy, plus contrasté
  text:          'oklch(94% 0.008 70)',
  textSecondary: 'oklch(60% 0.012 60)',
  textTertiary:  'oklch(42% 0.010 55)',
  textGhost:     'oklch(30% 0.008 55)',

  // Borders — warm, refined
  border:       'oklch(20% 0.008 50)',
  borderSubtle: 'oklch(16% 0.006 50)',
  borderFocus:  'oklch(55% 0.22 25)',
  borderGold:   'oklch(76% 0.13 85 / 0.18)',
  borderLight:  'oklch(25% 0.008 50)',

  // Utility
  white:     'oklch(97% 0.005 70)',
  black:     'oklch(5% 0.005 50)',
}

export const f = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', 'Helvetica Neue', sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', monospace",
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

// 8px spatial grid
export const sp = {
  0.5: '0.25rem', // 4px
  1: '0.5rem',    // 8px
  1.5: '0.75rem', // 12px
  2: '1rem',      // 16px
  3: '1.5rem',    // 24px
  4: '2rem',      // 32px
  5: '2.5rem',    // 40px
  6: '3rem',      // 48px
  8: '4rem',      // 64px
  10: '5rem',     // 80px
  12: '6rem',     // 96px
  16: '8rem',     // 128px
}

export const radius = {
  none: '0px',
  xs:   '2px',
  sm:   '4px',
  md:   '6px',
  lg:   '10px',
  xl:   '14px',
  '2xl': '20px',
  pill: '9999px',
}

export const shadow = {
  xs:    '0 1px 2px oklch(5% 0.005 50 / 0.20)',
  sm:    '0 1px 3px oklch(5% 0.005 50 / 0.25), 0 1px 2px oklch(5% 0.005 50 / 0.15)',
  md:    '0 4px 16px oklch(5% 0.005 50 / 0.20), 0 1px 4px oklch(5% 0.005 50 / 0.10)',
  lg:    '0 8px 32px oklch(5% 0.005 50 / 0.30), 0 2px 8px oklch(5% 0.005 50 / 0.15)',
  xl:    '0 16px 48px oklch(5% 0.005 50 / 0.35), 0 4px 12px oklch(5% 0.005 50 / 0.10)',
  glow:  '0 0 20px oklch(55% 0.22 25 / 0.12)',
  gold:  '0 0 16px oklch(76% 0.13 85 / 0.08)',
  inner: 'inset 0 1px 2px oklch(5% 0.005 50 / 0.20)',
  // Premium layered — subtler, more refined
  card:  '0 1px 2px oklch(5% 0.005 50 / 0.12), 0 4px 16px oklch(5% 0.005 50 / 0.08)',
  cardHover: '0 2px 4px oklch(5% 0.005 50 / 0.15), 0 8px 32px oklch(5% 0.005 50 / 0.12)',
  // Glass panel shadow
  glass: '0 8px 32px oklch(5% 0.005 50 / 0.25), inset 0 1px 0 oklch(98% 0.005 70 / 0.03)',
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
  color:   'color 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  lift:    'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
}

// Glass effect presets
export const glass = {
  panel:   `background: oklch(10% 0.006 50 / 0.55); backdrop-filter: blur(20px) saturate(1.2); -webkit-backdrop-filter: blur(20px) saturate(1.2);`,
  surface: `background: oklch(12% 0.007 50 / 0.65); backdrop-filter: blur(12px) saturate(1.1); -webkit-backdrop-filter: blur(12px) saturate(1.1);`,
  card:    `background: oklch(11% 0.008 50 / 0.70); backdrop-filter: blur(16px) saturate(1.15); -webkit-backdrop-filter: blur(16px) saturate(1.15);`,
  subtle:  `background: oklch(8% 0.006 50 / 0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);`,
}

// Gradient presets (art deco + modern)
export const gradient = {
  goldLine:  `linear-gradient(90deg, transparent, oklch(76% 0.13 85 / 0.3), transparent)`,
  redFade:   `linear-gradient(135deg, oklch(55% 0.22 25 / 0.08), transparent)`,
  surface:   `linear-gradient(180deg, oklch(12% 0.008 50), oklch(8% 0.006 50))`,
  hero:      `radial-gradient(ellipse 80% 60% at 50% 0%, oklch(55% 0.22 25 / 0.06), transparent)`,
  sidebar:   `linear-gradient(180deg, oklch(9% 0.007 50), oklch(7% 0.005 50))`,
  card:      `linear-gradient(160deg, oklch(12% 0.008 50), oklch(10% 0.007 50))`,
  goldShine: `linear-gradient(105deg, oklch(76% 0.13 85 / 0), oklch(76% 0.13 85 / 0.05) 40%, oklch(76% 0.13 85 / 0) 60%)`,
}

export const STATUSES = [
  { key: 'pending',     label: 'En attente',             color: c.textSecondary, bg: 'oklch(62% 0.015 60 / 0.08)' },
  { key: 'sourcing',    label: 'Recherche fournisseur',  color: c.blue,          bg: c.blueSoft },
  { key: 'negotiation', label: 'Négociation',             color: c.purple,        bg: c.purpleSoft },
  { key: 'sample',      label: 'Échantillon',             color: c.amber,         bg: c.amberSoft },
  { key: 'production',  label: 'Production',               color: c.red,           bg: c.redSoft },
  { key: 'shipping',    label: 'Expédition',               color: c.teal,          bg: c.tealSoft },
  { key: 'delivered',   label: 'Livré',                    color: c.green,         bg: c.greenSoft },
]
