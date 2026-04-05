import { c, f, size as sz, ease, STATUSES } from '../lib/theme'

export default function StatusPill({ status, size = 'sm' }) {
  const s = (typeof status === 'number' ? STATUSES[status] : STATUSES.find(x => x.key === status)) || STATUSES[0]
  const isSm = size === 'sm'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: isSm ? '3px 10px' : '5px 14px',
      fontSize: isSm ? sz.xs : sz.sm,
      fontFamily: f.mono, fontWeight: 500,
      letterSpacing: '0.04em',
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
    }}>
      <span style={{
        width: isSm ? 6 : 7, height: isSm ? 6 : 7,
        borderRadius: '50%', background: s.color,
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  )
}

export function ProgressBar({ value, color, height = 3 }) {
  return (
    <div style={{
      width: '100%', height,
      background: 'oklch(15% 0.008 50)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: color,
        transition: `width 0.8s ${ease.out}`,
      }} />
    </div>
  )
}
