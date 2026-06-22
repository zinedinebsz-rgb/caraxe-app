/* ── CARAXES Admin — Poste de pilotage ── */
import { useMemo } from 'react'
import { c, f, size, sp, ease } from '../../lib/theme'
import { useAdmin } from './AdminContext'
import StatusPill from '../../components/StatusPill'

const parseBudget = (b) => {
  if (typeof b === 'number') return b
  const n = parseFloat(String(b || '').replace(/[^\d.,]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
const isActive = (s) => !(s === 6 || s === 'delivered' || s === 'livré' || s === 'completed')
const SHIP = ['production', 'QC', 'douanes', 'transit', 'livré']
const shipKey = (s) => (typeof s === 'number' ? (SHIP[s] || 'production') : (s || 'production'))
const eur = (n) => (Math.round(n || 0)).toLocaleString('fr-FR') + ' €'
const OBJECTIF = 25000

function Kpi({ label, value, accent, delta }) {
  return (
    <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '4px', padding: sp[3], borderTop: `2px solid ${accent}` }}>
      <div style={{ fontFamily: f.mono, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textTertiary }}>{label}</div>
      <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, marginTop: sp[1], lineHeight: 1 }}>{value}</div>
      {delta != null && <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.green, marginTop: sp[1] }}>▲ {delta}</div>}
    </div>
  )
}
function Card({ title, extra, children }) {
  return (
    <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '4px', padding: sp[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
        <span style={{ fontFamily: f.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary }}>{title}</span>
        {extra}
      </div>
      {children}
    </div>
  )
}

export default function TodoTab() {
  const { orders, leads, shipments, clients, notifications, setMainTab, clientName } = useAdmin()
  const now = new Date()

  const k = useMemo(() => {
    const caMonth = orders.filter(o => { const d = new Date(o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((a, o) => a + parseBudget(o.budget), 0)
    const leads30 = leads.filter(l => l.created_at && (now - new Date(l.created_at)) / 86400000 <= 30).length
    const conv = leads.length ? Math.round(leads.filter(l => ['paid', 'account_created', 'onboarding', 'active'].includes(l.status)).length / leads.length * 100) : 0
    const transit = shipments.filter(s => shipKey(s.status) !== 'livré').length
    return { caMonth, active: orders.filter(o => isActive(o.status)).length, leads30, conv, transit }
  }, [orders, leads, shipments])

  const funnel = useMemo(() => {
    const cnt = (keys) => leads.filter(l => keys.includes(l.status)).length
    const rows = [
      { l: 'Formulaire', v: leads.length, color: c.borderLight },
      { l: 'Paiement', v: cnt(['payment_pending', 'paid', 'account_created', 'onboarding', 'active']), color: c.purple },
      { l: 'Compte créé', v: cnt(['account_created', 'onboarding', 'active']), color: c.teal },
      { l: 'Onboarding', v: cnt(['onboarding', 'active']), color: c.gold },
      { l: 'Actif', v: cnt(['active']), color: c.green },
    ]
    const max = Math.max(1, ...rows.map(r => r.v))
    return rows.map(r => ({ ...r, pct: Math.round(r.v / max * 100) }))
  }, [leads])

  const buckets = useMemo(() => ({
    leadsToCall: leads.filter(l => ['form_submitted', 'payment_pending', 'payment_failed'].includes(l.status)),
    prod: orders.filter(o => o.status === 4 || o.status === 'production'),
    transit: shipments.filter(s => shipKey(s.status) !== 'livré'),
    unread: (notifications || []).filter(n => !n.read),
  }), [leads, orders, shipments, notifications])

  const activity = useMemo(() => {
    const ev = []
    orders.forEach(o => ev.push({ t: o.created_at, color: c.gold, ref: o.ref || 'CMD', label: o.product || 'Commande' }))
    shipments.forEach(s => ev.push({ t: s.created_at, color: c.teal, ref: s.tracking_number || 'EXP', label: 'Expédition ' + (s.destination || '') }))
    leads.forEach(l => ev.push({ t: l.created_at, color: c.purple, ref: 'LEAD', label: l.full_name || l.email || 'Nouveau lead' }))
    return ev.filter(e => e.t).sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 6)
  }, [orders, shipments, leads])

  const fmtT = (t) => { try { return new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) } catch { return '' } }
  const objPct = Math.min(100, Math.round(k.caMonth / OBJECTIF * 100))

  const miniBucket = (label, items, color, tab) => (
    <div style={{ borderBottom: `1px solid ${c.borderSubtle}`, padding: `${sp[1.5]} 0`, cursor: 'pointer' }} onClick={() => setMainTab(tab)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: size.sm, color: c.text }}>{label}</span>
        <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: items > 0 ? color : c.textTertiary }}>{items}</span>
      </div>
    </div>
  )

  return (
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
      <div style={{ marginBottom: sp[3] }}>
        <h2 style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>Poste de pilotage</h2>
        <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
        <Kpi label="CA ce mois" value={eur(k.caMonth)} accent={c.gold} />
        <Kpi label="Commandes actives" value={k.active} accent={c.red} />
        <Kpi label="Leads (30j)" value={k.leads30} accent={c.green} />
        <Kpi label="Conversion" value={k.conv + '%'} accent={c.teal} />
        <Kpi label="En transit" value={k.transit} accent={c.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr 1fr', gap: sp[2], marginBottom: sp[3] }}>
        <Card title="À traiter" extra={<span style={{ fontFamily: f.display, fontWeight: 700, color: c.red }}>{buckets.leadsToCall.length + buckets.prod.length + buckets.transit.length + buckets.unread.length}</span>}>
          {miniBucket('Leads à rappeler', buckets.leadsToCall.length, c.green, 'pipeline')}
          {miniBucket('Commandes en production', buckets.prod.length, c.red, 'commandes')}
          {miniBucket('Expéditions en cours', buckets.transit.length, c.teal, 'expedition')}
          {miniBucket('Messages non lus', buckets.unread.length, c.gold, 'commandes')}
        </Card>

        <Card title="Pipeline leads">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {funnel.map((r) => (
              <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.textSecondary, width: 78, flexShrink: 0 }}>{r.l}</span>
                <div style={{ flex: 1, height: 22, background: c.bgInput, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: r.pct + '%', height: '100%', background: r.color, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6, fontFamily: f.mono, fontSize: '10px', color: '#1a140a', fontWeight: 600, transition: `width 0.8s ${ease.out}`, minWidth: 22 }}>{r.v}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Objectif du mois">
          <div style={{ textAlign: 'center', padding: `${sp[1]} 0` }}>
            <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.gold, lineHeight: 1 }}>{eur(k.caMonth)}</div>
            <div style={{ height: 8, borderRadius: '8px', background: c.borderLight, margin: `${sp[2]} 0 ${sp[1]}`, overflow: 'hidden' }}>
              <div style={{ width: objPct + '%', height: '100%', background: `linear-gradient(90deg, ${c.gold}, ${c.red})`, borderRadius: '8px', transition: `width 0.9s ${ease.out}` }} />
            </div>
            <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary }}>{objPct}% de l'objectif · {eur(OBJECTIF)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${c.border}`, marginTop: sp[2], paddingTop: sp[2] }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontFamily: f.display, fontSize: size.lg, color: c.text }}>{clients.length}</div><div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase' }}>Clients</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontFamily: f.display, fontSize: size.lg, color: c.gold }}>{eur(orders.length ? orders.reduce((a, o) => a + parseBudget(o.budget), 0) / orders.length : 0)}</div><div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase' }}>Panier moyen</div></div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: sp[2] }}>
        <Card title="Flux logistique" extra={<span style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary }}>Chine → France</span>}>
          <div style={{ position: 'relative', background: 'linear-gradient(160deg,#0c0a07,#070504)', borderRadius: '6px', overflow: 'hidden' }}>
            <svg viewBox="0 0 700 200" style={{ width: '100%', display: 'block' }}>
              <path d="M470 60 q60 -22 110 8 q34 24 16 70 q-18 48 -78 54 q-66 6 -90 -32 q-22 -48 6 -88 z" fill="#16110a" stroke="#2a2218" />
              <path d="M70 80 q52 -28 104 -4 q36 20 24 64 q-12 44 -70 50 q-58 6 -80 -28 q-22 -46 22 -82 z" fill="#15100a" stroke="#2a2218" />
              <text x="492" y="56" fill="#6f6554" fontSize="10" fontFamily="monospace">CHINE</text>
              <text x="80" y="74" fill="#6f6554" fontSize="10" fontFamily="monospace">EUROPE</text>
              <path d="M470 102 C380 184,250 188,140 114" fill="none" stroke="#56bcc4" strokeWidth="1.4" strokeDasharray="3 5" opacity="0.5" />
              <path d="M462 88 C360 36,230 40,150 90" fill="none" stroke="#d8ae5c" strokeWidth="1.4" strokeDasharray="3 5" opacity="0.5" />
              <circle cx="470" cy="96" r="4.5" fill="#d8ae5c"><animate attributeName="opacity" values="1;.5;1" dur="2.4s" repeatCount="indefinite" /></circle>
              <text x="478" y="110" fill="#aa9d88" fontSize="9" fontFamily="monospace">Yiwu</text>
              <circle cx="140" cy="108" r="4.5" fill="#56bcc4"><animate attributeName="opacity" values="1;.5;1" dur="2.4s" begin="-1s" repeatCount="indefinite" /></circle>
              <text x="86" y="127" fill="#aa9d88" fontSize="9" fontFamily="monospace">Le Havre</text>
              <g><circle r="4.5" fill="#56bcc4"><animateMotion dur="7s" repeatCount="indefinite" path="M470 102 C380 184,250 188,140 114" /></circle></g>
              <g><circle r="4" fill="#d8ae5c"><animateMotion dur="5.5s" repeatCount="indefinite" path="M462 88 C360 36,230 40,150 90" /></circle></g>
            </svg>
          </div>
        </Card>

        <Card title="Activité récente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {activity.length === 0 ? (
              <div style={{ fontSize: size.xs, color: c.textTertiary, padding: `${sp[2]} 0` }}>Aucune activité récente.</div>
            ) : activity.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: sp[1], alignItems: 'flex-start', padding: '7px 8px', background: c.bgInput, border: `1px solid ${c.borderSubtle}`, borderRadius: '6px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: e.color }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ fontFamily: f.mono, color: c.gold, fontSize: '10.5px' }}>{e.ref}</span> · {e.label}</div>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>{fmtT(e.t)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
