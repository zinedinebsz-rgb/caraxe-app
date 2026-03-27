import { f, STATUSES } from '../lib/theme'

export default function StatusPill({ status, size = 'sm' }) {
  const s = STATUSES[status] || STATUSES[0]
  const isSm = size === 'sm'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: isSm ? '0.25rem 0.6rem' : '0.35rem 0.85rem',
      fontSize: isSm ? '0.65rem' : '0.75rem',
      fontFamily: f.mono, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: `${s.color}14`, color: s.color,
      border: `1px solid ${s.color}28`, borderRadius: '2px', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: isSm ? '0.7rem' : '0.85rem' }}>{s.icon}</span>
      {s.label}
    </span>
  )
}

export function ProgressBar({ value, color, height = 4 }) {
  return (
    <div style={{ width: '100%', height, background: '#252220', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`, height: '100%',
        background: color, borderRadius: 2,
        transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  )
}