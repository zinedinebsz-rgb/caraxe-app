/* ── CARAXES Admin — À traiter aujourd'hui + Insights ── */
import { useMemo } from 'react'
import { c, f, size, sp, radius, ease } from '../../lib/theme'
import { useAdmin } from './AdminContext'
import StatusPill from '../../components/StatusPill'

const isActive = (s) => !(s === 6 || s === 'delivered' || s === 'livré' || s === 'completed')
const SHIP = ['production', 'QC', 'douanes', 'transit', 'livré']
const shipKey = (s) => (typeof s === 'number' ? (SHIP[s] || 'production') : (s || 'production'))
const eur = (n) => (Math.round(n || 0)).toLocaleString('fr-FR') + ' €'

function Stat({ label, value, accent }) {
  return (
    <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', borderTop: `2px solid ${accent || c.gold}` }}>
      <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, marginTop: sp[1] }}>{value}</div>
    </div>
  )
}

function Bucket({ title, count, accent, items, cta, onCta, empty }) {
  return (
    <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', padding: sp[3], display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
        <span style={{ fontFamily: f.mono, fontSize: size.xs, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSecondary }}>{title}</span>
        <span style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: count > 0 ? accent : c.textTertiary }}>{count}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: sp[1] }}>
        {items.length === 0 ? (
          <div style={{ fontSize: size.xs, color: c.textTertiary, padding: `${sp[2]} 0` }}>{empty}</div>
        ) : items.slice(0, 4).map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: sp[2], padding: `${sp[1]} 0`, borderBottom: i < Math.min(items.length, 4) - 1 ? `1px solid ${c.borderSubtle}` : 'none' }}>
            <span style={{ fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
            {it.right}
          </div>
        ))}
      </div>
      <button onClick={onCta} style={{ marginTop: sp[2], alignSelf: 'flex-start', background: 'transparent', border: `1px solid ${accent}44`, color: accent, fontFamily: f.mono, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: `7px ${sp[3]}`, cursor: 'pointer', borderRadius: '2px', transition: `all 0.2s ${ease.smooth}` }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}10`; e.currentTarget.style.borderColor = accent }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${accent}44` }}>
        {cta} →
      </button>
    </div>
  )
}

export default function TodoTab() {
  const { orders, leads, shipments, clients, notifications, setMainTab, clientName } = useAdmin()

  const stats = useMemo(() => {
    const total = leads.length
    const converted = leads.filter(l => ['paid', 'account_created', 'onboarding', 'active'].includes(l.status)).length
    const conv = total ? Math.round(converted / total * 100) : 0
    const revenue = leads.reduce((a, l) => a + (l.amount_paid || 0), 0)
    const act = orders.filter(o => isActive(o.status))
    const now = Date.now()
    const avgAge = act.length ? Math.round(act.reduce((a, o) => a + (o.created_at ? (now - new Date(o.created_at)) / 86400000 : 0), 0) / act.length) : 0
    return { conv, revenue, avgAge, nbClients: clients.length, nbActive: act.length }
  }, [leads, orders, clients])

  const leadsToCall = useMemo(() => leads.filter(l => ['form_submitted', 'payment_pending', 'payment_failed'].includes(l.status)), [leads])
  const ordersProd = useMemo(() => orders.filter(o => o.status === 4 || o.status === 'production'), [orders])
  const shipTransit = useMemo(() => shipments.filter(s => shipKey(s.status) !== 'livré'), [shipments])
  const unread = useMemo(() => (notifications || []).filter(n => !n.read), [notifications])

  const pill = (s) => <StatusPill status={s} size="sm" />

  return (
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
      <div style={{ marginBottom: sp[4] }}>
        <h2 style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>À traiter aujourd'hui</h2>
        <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>Vos actions prioritaires et le pouls de l'activité, en un coup d'œil.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: sp[3], marginBottom: sp[4] }}>
        <Stat label="Conversion leads" value={stats.conv + '%'} accent={c.green} />
        <Stat label="Revenu encaissé" value={eur(stats.revenue)} accent={c.gold} />
        <Stat label="Commandes actives" value={stats.nbActive} accent={c.red} />
        <Stat label="Âge moyen (j)" value={stats.avgAge} accent={c.teal} />
        <Stat label="Clients" value={stats.nbClients} accent={c.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: sp[3] }}>
        <Bucket title="Leads à rappeler" count={leadsToCall.length} accent={c.green}
          items={leadsToCall.map(l => ({ label: l.full_name || l.email || 'Lead', right: <span style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>{l.status}</span> }))}
          cta="Voir le pipeline" onCta={() => setMainTab('pipeline')} empty="Aucun lead en attente — bravo." />
        <Bucket title="Commandes en production" count={ordersProd.length} accent={c.red}
          items={ordersProd.map(o => ({ label: (o.ref ? o.ref + ' · ' : '') + clientName(o.client_id), right: pill(o.status) }))}
          cta="Voir les commandes" onCta={() => setMainTab('commandes')} empty="Rien en production." />
        <Bucket title="Expéditions en cours" count={shipTransit.length} accent={c.teal}
          items={shipTransit.map(s => ({ label: clientName(s.client_id) + (s.destination ? ' → ' + s.destination : ''), right: <span style={{ fontSize: size.xs, color: c.teal, fontFamily: f.mono }}>{shipKey(s.status)}</span> }))}
          cta="Voir les expéditions" onCta={() => setMainTab('expedition')} empty="Aucune expédition en cours." />
        <Bucket title="Messages non lus" count={unread.length} accent={c.gold}
          items={unread.map(n => ({ label: n.title || n.body || 'Notification', right: null }))}
          cta="Ouvrir les commandes" onCta={() => setMainTab('commandes')} empty="Boîte à jour." />
      </div>
    </div>
  )
}
