/* ── CARAXES Admin — Journal d'audit (lecture seule) ── */
import { useState, useEffect } from 'react'
import { c, f, size, sp, radius } from '../../lib/theme'
import { fmtDate, DragonEmptyState } from './AdminShared'
import { useAdmin } from './AdminContext'
import { getAuditLog } from '../../lib/supabase'

const EVENT_LABELS = { role_change: 'Changement de rôle' }

export default function AuditLogTab() {
  const { clientName } = useAdmin()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getAuditLog()
      .then((rows) => { if (active) setLogs(rows || []) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div>
      <div style={{ marginBottom: sp[5] }}>
        <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.goldDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: sp[1] }}>Sécurité</div>
        <h2 style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>Journal d'audit</h2>
        <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1], lineHeight: 1.6 }}>Traçabilité des changements sensibles (rôles utilisateurs). Lecture seule, alimenté automatiquement.</p>
      </div>

      {loading ? (
        <div style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: size.xs, letterSpacing: '0.08em', padding: sp[6] }}>CHARGEMENT…</div>
      ) : logs.length === 0 ? (
        <DragonEmptyState title="Aucun événement" subtitle="Les changements de rôle s'afficheront ici dès qu'ils surviennent." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
          {logs.map((log) => {
            const before = (log.before_state && log.before_state.role) || '—'
            const after = (log.after_state && log.after_state.role) || '—'
            return (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: sp[3], alignItems: 'center', padding: sp[3], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderRadius: radius.sm }}>
                <span style={{ width: 6, height: 6, background: c.red, transform: 'rotate(45deg)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: size.sm, color: c.text, fontWeight: 600 }}>{EVENT_LABELS[log.event_type] || log.event_type}</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: 2 }}>
                    <span style={{ color: c.textTertiary }}>Cible :</span> {clientName(log.target_id)} · <span style={{ color: c.textTertiary }}>par</span> {clientName(log.actor_id)}
                  </div>
                  <div style={{ fontSize: size.xs, fontFamily: f.mono, color: c.gold, marginTop: 2 }}>{before} → {after}</div>
                </div>
                <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, whiteSpace: 'nowrap' }}>{fmtDate(log.created_at)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
