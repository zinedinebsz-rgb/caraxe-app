// ─── CARAXE Design Tokens ───
export const c = {
  bg: '#0A0A0A', bgE: '#111111', bgC: '#181818', bgHover: '#1F1F1F',
  red: '#E63946', redGlow: 'rgba(230,57,70,0.15)',
  gold: '#D4A843', goldDim: '#A07D2E', goldGlow: 'rgba(212,168,67,0.1)',
  green: '#2ECC71', teal: '#4ECDC4', amber: '#E6B84D',
  text: '#EAE6E0', textDim: '#918C84', textMuted: '#5A5650',
  border: '#252220', borderLight: '#302D2A',
}

export const f = {
  display: "'Playfair Display',Georgia,serif",
  body: "'DM Sans','Helvetica Neue',sans-serif",
  mono: "'JetBrains Mono',monospace",
}

export const STATUSES = [
  { label: 'En attente',            icon: '\u23F3', color: '#8A857D' },
  { label: 'Recherche fournisseur', icon: '\uD83D\uDD0D', color: '#D4A843' },
  { label: 'N\u00e9gociation',      icon: '\uD83E\uDD1D', color: '#D4A843' },
  { label: '\u00c9chantillon',      icon: '\uD83D\uDCE6', color: '#E6B84D' },
  { label: 'Production',            icon: '\u2699\uFE0F', color: '#E63946' },
  { label: 'Exp\u00e9dition',       icon: '\uD83D\uDE22', color: '#4ECDC4' },
  { label: 'Livr\u00e9',            icon: '\u2705',       color: '#2ECC71' },
]