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
      border: `1px solid ${s.color}22`,
    }}>
      <span style={{
        width: isSm ? 5 : 6, height: isSm ? 5 : 6,
        background: s.color,
        flexShrink: 0,
        transform: 'rotate(45deg)',
      }} />
      {s.label}
    </span>
  )
}

export function ProgressBar({ value, color, height = 3 }) {
  return (
    <div style={{
      width: '100%', height,
      background: '#1c1a18',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: `width 0.8s ${ease.out}`,
      }} />
    </div>
  )
}

/* ── PIPELINE STEPPER — Art Deco styled ── */
export function PipelineStepper({ currentStatus, compact = false }) {
  const currentIdx = typeof currentStatus === 'number'
    ? currentStatus
    : STATUSES.findIndex(s => s.key === currentStatus)
  const idx = currentIdx >= 0 ? currentIdx : 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', width: '100%',
      gap: 0, padding: compact ? '12px 0' : '16px 0',
    }}>
      {STATUSES.map((step, i) => {
        const isDone = i <= idx
        const isCurrent = i === idx
        const isLast = i === STATUSES.length - 1

        return (
          <div key={step.key} style={{
            display: 'flex', alignItems: 'center',
            flex: isLast ? '0 0 auto' : 1,
          }}>
            {/* Step node */}
            <div style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* Glow ring for current */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  width: compact ? 28 : 34,
                  height: compact ? 28 : 34,
                  border: `1px solid ${step.color}44`,
                  transform: 'rotate(45deg)',
                  animation: 'pulseGlow 2.5s ease-in-out infinite',
                }} />
              )}
              {/* Diamond node */}
              <div style={{
                width: compact ? 18 : 22,
                height: compact ? 18 : 22,
                transform: 'rotate(45deg)',
                background: isDone ? step.color : 'transparent',
                border: `1.5px solid ${isDone ? step.color : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: `all 0.4s ${ease.out}`,
                boxShadow: isCurrent ? `0 0 12px ${step.color}33` : 'none',
              }}>
                {isDone && (
                  <svg width={compact ? 8 : 10} height={compact ? 8 : 10} viewBox="0 0 24 24"
                    fill="none" stroke={isDone && i < 6 ? '#131211' : c.white}
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: 'rotate(-45deg)' }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
              {/* Label below */}
              {!compact && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 8,
                  fontSize: '8.5px', fontFamily: f.mono,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: isDone ? step.color : c.textTertiary,
                  whiteSpace: 'nowrap', fontWeight: isCurrent ? 700 : 400,
                  transition: `color 0.3s ${ease.smooth}`,
                }}>{step.label}</div>
              )}
            </div>
            {/* Connector line */}
            {!isLast && (
              <div style={{
                flex: 1, height: 1.5, marginLeft: 4, marginRight: 4,
                background: c.border,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0,
                  width: i < idx ? '100%' : '0%',
                  height: '100%',
                  background: `linear-gradient(90deg, ${STATUSES[i].color}, ${STATUSES[Math.min(i + 1, STATUSES.length - 1)].color})`,
                  transition: `width 0.6s ${ease.out}`,
                }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
