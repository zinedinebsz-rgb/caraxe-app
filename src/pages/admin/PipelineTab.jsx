/* ── CARAXES Admin — Pipeline Tabs (Leads + Orders) ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, fmtMoney, parseBudget } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius, STATUSES } from '../../lib/theme'
import StatusPill from '../../components/StatusPill'
import { sendPushToUser } from '../../lib/push'

/* ════════════════════════════════════════════════
   LEADS PIPELINE TAB
   ════════════════════════════════════════════════ */
export function LeadsPipelineTab() {
  const {
    mainTab, leads, t, toast, tToast, loadAll, updateLead,
  } = useAdmin()

  if (mainTab !== 'pipeline') return null

  const PIPELINE_STAGES = [
    { key: 'form_submitted', label: 'Formulaire', color: c.textSecondary, icon: '📝' },
    { key: 'payment_pending', label: 'En attente paiement', color: c.amber, icon: '⏳' },
    { key: 'paid', label: 'Paye', color: c.green, icon: '✅' },
    { key: 'account_created', label: 'Compte cree', color: c.blue, icon: '👤' },
    { key: 'onboarding', label: 'Onboarding', color: c.gold, icon: '🎓' },
    { key: 'active', label: 'Actif', color: c.green, icon: '🔥' },
    { key: 'payment_failed', label: 'Echoue', color: c.red, icon: '❌' },
    { key: 'churned', label: 'Perdu', color: c.textTertiary, icon: '💀' },
  ]
  const leadsFiltered = leads
  const getStageLeads = (stageKey) => leadsFiltered.filter(l => l.status === stageKey)
  const totalValue = leads.filter(l => l.status === 'paid').reduce((sum, l) => sum + (l.amount_paid || 0), 0)
  const conversionRate = leads.length > 0 ? ((leads.filter(l => ['paid', 'account_created', 'onboarding', 'active'].includes(l.status)).length / leads.length) * 100).toFixed(0) : 0

  return (
  <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
    {/* Pipeline header */}
    <div style={{ marginBottom: sp[4] }}>
      <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: sp[2], display: 'flex', alignItems: 'center', gap: sp[2] }}>
        <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8" size={20} color={c.green} />
        Pipeline Commercial
      </h2>
      {/* Stats row */}
      <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.gold}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total prospects</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold }}>{leads.length}</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.green}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payes</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.green }}>{leads.filter(l => ['paid', 'account_created', 'onboarding', 'active'].includes(l.status)).length}</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.blue}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conversion</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.blue }}>{conversionRate}%</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.amber}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>CA Pipeline</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.amber }}>{fmtMoney(totalValue)}</div>
        </div>
      </div>
    </div>

    {/* Funnel visualization */}
    <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}` }}>
      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Conversion funnel</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
        {PIPELINE_STAGES.filter(s => !['payment_failed', 'churned'].includes(s.key)).map((stage, idx, arr) => {
          const count = getStageLeads(stage.key).length
          const percentage = leads.length > 0 ? (count / leads.length * 100).toFixed(0) : 0
          const width = percentage
          return (
            <div key={stage.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: stage.color }}>{stage.icon} {stage.label}</span>
                <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{count} ({percentage}%)</span>
              </div>
              <div style={{ height: 6, background: c.bg, border: `1px solid ${c.borderSubtle}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${width}%`, background: stage.color, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Kanban-style pipeline */}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.filter(s => !['churned'].includes(s.key)).length}, minmax(200px, 1fr))`, gap: sp[2], overflowX: 'auto', paddingBottom: sp[2] }}>
      {PIPELINE_STAGES.filter(s => s.key !== 'churned').map((stage, stageIdx) => {
        const stageLeads = getStageLeads(stage.key)
        const FLOW = ['form_submitted', 'payment_pending', 'paid', 'account_created', 'onboarding', 'active']
        const fi = FLOW.indexOf(stage.key)
        const nextKey = fi >= 0 ? (FLOW[fi + 1] || null) : (stage.key === 'payment_failed' ? 'payment_pending' : null)
        const prevKey = fi > 0 ? FLOW[fi - 1] : null
        const nextStage = nextKey ? PIPELINE_STAGES.find(s => s.key === nextKey) : null
        const prevStage = prevKey ? PIPELINE_STAGES.find(s => s.key === prevKey) : null
        return (
          <div key={stage.key} style={{ background: c.bgCard, border: `1px solid ${c.borderSubtle}`, minHeight: 300, display: 'flex', flexDirection: 'column', borderRadius: radius.sm, overflow: 'hidden' }}>
            {/* Stage header */}
            <div style={{ padding: `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${stage.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[1] }}>
                <span style={{ fontSize: size.xs, fontWeight: 700, color: stage.color, fontFamily: f.mono, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {stage.icon} {stage.label}
                </span>
                <span style={{ fontSize: '11px', fontFamily: f.display, fontWeight: 700, color: stage.color, background: `${stage.color}15`, padding: '2px 8px' }}>{stageLeads.length}</span>
              </div>
            </div>
            {/* Lead cards */}
            <div style={{ padding: sp[2], flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[1] }}>
              {stageLeads.length === 0 && (
                <div style={{ padding: sp[3], textAlign: 'center', color: c.textTertiary, fontSize: '10px', fontFamily: f.mono }}>—</div>
              )}
              {stageLeads.map(lead => {
                const daysSince = Math.floor((Date.now() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24))
                return (
                  <div key={lead.id} style={{
                    padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}`, borderRadius: radius.sm,
                    fontSize: size.xs, cursor: 'default', transition: `all 0.2s ${ease.smooth}`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.boxShadow = `0 0 0 2px ${stage.color}15` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ fontWeight: 700, color: c.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lead.full_name || lead.email?.split('@')[0] || 'Inconnu'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono }}>
                        {lead.service_type === 'creation' ? 'Boutique' : lead.service_type === 'formation' ? 'Formation' : lead.service_type}
                      </span>
                      {lead.amount_paid > 0 && <span style={{ fontSize: '9px', fontWeight: 700, color: c.gold }}>{lead.amount_paid}€</span>}
                    </div>
                    <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono, marginBottom: 6 }}>
                      {daysSince === 0 ? 'Aujourd\'hui' : `+${daysSince}j`}
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {prevStage && (
                        <button onClick={async () => { try { await updateLead(lead.id, { status: prevStage.key }); await loadAll(); toast.success(t('toast.leadMovedBackward')) } catch(e) { toast.error(e.message) } }} style={{
                          padding: '3px 6px', background: 'transparent', border: `1px solid ${c.border}30`, color: c.textTertiary, fontSize: '8px', fontFamily: f.mono, cursor: 'pointer', flex: 1,
                        }} title="Reculer">← Reculer</button>
                      )}
                      {nextStage && (
                        <button onClick={async () => { try { await updateLead(lead.id, { status: nextStage.key }); await loadAll(); toast.success(t('toast.leadMovedForward')) } catch(e) { toast.error(e.message) } }} style={{
                          padding: '3px 6px', background: 'transparent', border: `1px solid ${nextStage.color}40`, color: nextStage.color, fontSize: '8px', fontFamily: f.mono, cursor: 'pointer', flex: 1, fontWeight: 600,
                        }} title="Avancer">Avancer →</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>

    {/* Lost leads section */}
    {getStageLeads('churned').length > 0 && (
      <div style={{ marginTop: sp[3], padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}` }}>
        <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>
          Prospects perdus ({getStageLeads('churned').length})
        </div>
        <div style={{ display: 'flex', gap: sp[1], flexWrap: 'wrap' }}>
          {getStageLeads('churned').map(lead => (
            <span key={lead.id} style={{ padding: '2px 8px', background: c.bg, border: `1px solid ${c.borderSubtle}`, fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
              {lead.full_name || lead.email?.split('@')[0]} · {lead.service_type}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
  )
}


/* ════════════════════════════════════════════════
   ORDERS PIPELINE TAB
   ════════════════════════════════════════════════ */
export function OrdersPipelineTab() {
  const {
    mainTab, orders, allProfiles, t, toast, tToast, loadAll,
    updateOrder,
  } = useAdmin()

  // Local kanban state
  const [kanbanDrag, setKanbanDrag] = useState(null)
  const [kanbanHoverCol, setKanbanHoverCol] = useState(null)
  const [kanbanFilterClient, setKanbanFilterClient] = useState('all')
  const [kanbanFilterTier, setKanbanFilterTier] = useState('all')
  const [kanbanFilterPeriod, setKanbanFilterPeriod] = useState('all')
  const [kanbanSearch, setKanbanSearch] = useState('')

  if (mainTab !== 'orders_pipeline') return null

  // Build client-scoring map for tier filtering (top 20% = A, quartiles for B/C/D)
  const clientScoringMap = (() => {
    const map = {}
    try {
      const perClient = {}
      orders.forEach(o => {
        if (!o.client_id) return
        const s = typeof o.status === 'number' ? STATUSES[o.status]?.key : o.status
        if (!perClient[o.client_id]) perClient[o.client_id] = { ltv: 0, count: 0, last: 0 }
        perClient[o.client_id].count += 1
        if (s === 'delivered') perClient[o.client_id].ltv += parseBudget(o.budget)
        const t = new Date(o.created_at).getTime()
        if (t > perClient[o.client_id].last) perClient[o.client_id].last = t
      })
      const now = Date.now()
      const scores = Object.entries(perClient).map(([cid, v]) => {
        const daysSince = (now - v.last) / (1000 * 60 * 60 * 24)
        const recency = Math.max(0, 100 - daysSince)
        const freq = Math.min(100, v.count * 20)
        const ltvScore = Math.min(100, v.ltv / 100)
        const score = ltvScore * 0.40 + recency * 0.25 + freq * 0.20 + 25 * 0.15
        return { cid, score }
      })
      scores.sort((a, b) => b.score - a.score)
      const n = scores.length
      scores.forEach((s, idx) => {
        const pct = (idx + 1) / n
        let tier = 'D'
        if (pct <= 0.20) tier = 'A'
        else if (pct <= 0.45) tier = 'B'
        else if (pct <= 0.75) tier = 'C'
        map[s.cid] = { tier, score: s.score }
      })
    } catch (_) {}
    return map
  })()

  const periodCutoff = (() => {
    const now = Date.now()
    if (kanbanFilterPeriod === '7') return now - 7 * 86400000
    if (kanbanFilterPeriod === '30') return now - 30 * 86400000
    if (kanbanFilterPeriod === '90') return now - 90 * 86400000
    return 0
  })()

  const ordersFiltered = orders.filter(o => {
    // Client filter
    if (kanbanFilterClient !== 'all' && o.client_id !== kanbanFilterClient) return false
    // Tier filter
    if (kanbanFilterTier !== 'all') {
      const t = clientScoringMap[o.client_id]?.tier || 'D'
      if (t !== kanbanFilterTier) return false
    }
    // Period filter (based on created_at)
    if (periodCutoff > 0) {
      const ct = new Date(o.created_at).getTime()
      if (ct < periodCutoff) return false
    }
    // Search filter
    if (kanbanSearch) {
      const q = kanbanSearch.toLowerCase()
      const clientName = allProfiles.find(p => p.id === o.client_id)?.full_name || ''
      const clientEmail = allProfiles.find(p => p.id === o.client_id)?.email || ''
      const product = o.product || ''
      const ref = o.ref || ''
      const matches = clientName.toLowerCase().includes(q) ||
                      clientEmail.toLowerCase().includes(q) ||
                      product.toLowerCase().includes(q) ||
                      ref.toLowerCase().includes(q)
      if (!matches) return false
    }
    return true
  })

  const hasFilters = kanbanFilterClient !== 'all' || kanbanFilterTier !== 'all' || kanbanFilterPeriod !== 'all' || !!kanbanSearch
  const resetFilters = () => {
    setKanbanFilterClient('all')
    setKanbanFilterTier('all')
    setKanbanFilterPeriod('all')
    setKanbanSearch('')
  }

  const getOrdersByStatus = (statusKey) => ordersFiltered.filter(o => {
    const orderStatus = typeof o.status === 'number' ? STATUSES[o.status]?.key : o.status
    return orderStatus === statusKey
  })

  const totalOrderValue = orders.reduce((sum, o) => sum + parseBudget(o.budget), 0)
  const deliveredCount = orders.filter(o => {
    const orderStatus = typeof o.status === 'number' ? STATUSES[o.status]?.key : o.status
    return orderStatus === 'delivered'
  }).length
  const activeCount = orders.filter(o => {
    const orderStatus = typeof o.status === 'number' ? STATUSES[o.status]?.key : o.status
    return orderStatus !== 'delivered'
  }).length

  return (
  <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
    {/* Orders pipeline header */}
    <div style={{ marginBottom: sp[4] }}>
      <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: sp[1], display: 'flex', alignItems: 'center', gap: sp[2] }}>
        <span style={{ fontSize: size.xl }}>📦</span>
        {t('admin.pipelineOrders')}
      </h2>
      <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: sp[2] }}>
        {t('admin.kanbanSubtitle')}
      </div>
      {/* Stats row */}
      <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.gold}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('admin.totalOrders')}</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold }}>{orders.length}</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.red}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('admin.inProgress')}</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.red }}>{activeCount}</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.green}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('admin.delivered')}</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.green }}>{deliveredCount}</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.teal}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('admin.totalBudget')}</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.teal }}>{fmtMoney(totalOrderValue)}</div>
        </div>
      </div>
    </div>

    {/* Kanban filter bar */}
    <div style={{ marginBottom: sp[3], padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, borderInlineStart: `3px solid ${c.gold}`, borderRadius: radius.sm }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[2], flexWrap: 'wrap', gap: sp[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <span style={{ fontSize: size.sm }}>🔎</span>
          <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            {t('admin.filters')}
          </div>
          {hasFilters && (
            <span style={{ padding: '2px 8px', fontSize: '9px', fontFamily: f.mono, color: c.gold, background: `${c.gold}15`, border: `1px solid ${c.gold}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('admin.filtersActive')} · {ordersFiltered.length}/{orders.length}
            </span>
          )}
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${c.borderSubtle}`, color: c.textSecondary, fontSize: '10px', fontFamily: f.mono, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.color = c.textSecondary }}
          >
            ✕ {t('admin.clearFilters')}
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: sp[2] }}>
        {/* Search */}
        <input
          type="text"
          value={kanbanSearch}
          onChange={e => setKanbanSearch(e.target.value)}
          placeholder={t('admin.searchOrder')}
          style={{ padding: '8px 10px', background: c.bg, border: `1px solid ${c.borderSubtle}`, color: c.text, fontSize: size.xs, fontFamily: f.body, outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = c.gold }}
          onBlur={e => { e.currentTarget.style.borderColor = c.borderSubtle }}
        />
        {/* Client filter */}
        <select
          value={kanbanFilterClient}
          onChange={e => setKanbanFilterClient(e.target.value)}
          style={{ padding: '8px 10px', background: c.bg, border: `1px solid ${c.borderSubtle}`, color: c.text, fontSize: size.xs, fontFamily: f.body, outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">{t('admin.allClients')}</option>
          {allProfiles
            .filter(p => orders.some(o => o.client_id === p.id))
            .sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''))
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email?.split('@')[0] || 'Client'}
              </option>
            ))}
        </select>
        {/* Tier filter */}
        <select
          value={kanbanFilterTier}
          onChange={e => setKanbanFilterTier(e.target.value)}
          style={{ padding: '8px 10px', background: c.bg, border: `1px solid ${c.borderSubtle}`, color: c.text, fontSize: size.xs, fontFamily: f.body, outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">{t('admin.allTiers')}</option>
          <option value="A">A · {t('admin.top20')}</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
        {/* Period filter */}
        <select
          value={kanbanFilterPeriod}
          onChange={e => setKanbanFilterPeriod(e.target.value)}
          style={{ padding: '8px 10px', background: c.bg, border: `1px solid ${c.borderSubtle}`, color: c.text, fontSize: size.xs, fontFamily: f.body, outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">{t('admin.allPeriods')}</option>
          <option value="7">{t('admin.last7days')}</option>
          <option value="30">{t('admin.last30days')}</option>
          <option value="90">{t('admin.last90days')}</option>
        </select>
      </div>
    </div>

    {/* Funnel visualization */}
    <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: radius.sm, boxShadow: shadow.xs }}>
      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>{t('admin.distributionByStatus')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
        {STATUSES.map((status, idx) => {
          const count = getOrdersByStatus(status.key).length
          const percentage = orders.length > 0 ? (count / orders.length * 100).toFixed(0) : 0
          const width = percentage
          return (
            <div key={status.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: status.color }}>{status.label}</span>
                <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{count} ({percentage}%)</span>
              </div>
              <div style={{ height: 6, background: c.bg, border: `1px solid ${c.borderSubtle}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${width}%`, background: status.color, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Orders kanban pipeline */}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUSES.length}, minmax(240px, 1fr))`, gap: sp[3], overflowX: 'auto', paddingBottom: sp[2] }}>
      {STATUSES.map((statusObj, statusIdx) => {
        const statusOrders = getOrdersByStatus(statusObj.key)
        const nextStatus = STATUSES[statusIdx + 1]
        const prevStatus = statusIdx > 0 ? STATUSES[statusIdx - 1] : null
        const isHovered = kanbanHoverCol === statusObj.key && kanbanDrag && kanbanDrag.fromIdx !== statusIdx
        return (
          <div
            key={statusObj.key}
            onDragOver={(e) => { e.preventDefault(); if (kanbanHoverCol !== statusObj.key) setKanbanHoverCol(statusObj.key) }}
            onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setKanbanHoverCol(null) }}
            onDrop={async (e) => {
              e.preventDefault()
              setKanbanHoverCol(null)
              const data = kanbanDrag
              setKanbanDrag(null)
              if (!data || data.fromIdx === statusIdx) return
              try {
                await updateOrder(data.orderId, { status: statusIdx, progress: Math.round((statusIdx / (STATUSES.length - 1)) * 100) })
                // Fire-and-forget push notification to the order's client.
                try {
                  const draggedOrder = orders.find(o => o.id === data.orderId)
                  if (draggedOrder?.client_id) {
                    sendPushToUser({
                      userId: draggedOrder.client_id,
                      title: 'CARAXES — statut mis à jour',
                      body: `Votre commande ${draggedOrder.ref || draggedOrder.id?.slice(0, 8)} : ${statusObj.label}`,
                      url: '/',
                      tag: `order-${draggedOrder.id}`,
                    }).catch(() => {})
                  }
                } catch (_) {}
                await loadAll()
                toast.success(tToast('statusUpdatedWithLabel', { label: statusObj.label }))
              } catch (err) { toast.error(tToast('genericError', { error: err.message || t('toast.unknownError') })) }
            }}
            style={{
              background: isHovered ? `${statusObj.color}10` : c.bgCard,
              border: `1px solid ${isHovered ? statusObj.color : c.borderSubtle}`,
              borderTop: `3px solid ${statusObj.color}`,
              borderRadius: radius.sm,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 400,
              transition: `background 0.15s ${ease.smooth}, border-color 0.15s ${ease.smooth}`,
              overflow: 'hidden',
            }}>
            {/* Column header */}
            <div style={{
              padding: `${sp[2]} ${sp[3]}`,
              borderBottom: `1px solid ${c.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize: size.xs,
                  fontWeight: 700,
                  color: statusObj.color,
                  fontFamily: f.mono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {statusObj.label}
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontFamily: f.display,
                fontWeight: 700,
                color: statusObj.color,
                background: `${statusObj.color}15`,
                padding: '3px 8px',
              }}>
                {statusOrders.length}
              </span>
            </div>

            {/* Order cards */}
            <div style={{
              padding: sp[2],
              display: 'flex',
              flexDirection: 'column',
              gap: sp[2],
              flex: 1,
              overflowY: 'auto',
            }}>
              {statusOrders.length === 0 && (
                <div style={{
                  padding: sp[2],
                  textAlign: 'center',
                  color: c.textTertiary,
                  fontSize: '10px',
                  fontFamily: f.mono,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  —
                </div>
              )}
              {statusOrders.map(order => {
                const orderClient = allProfiles.find(p => p.id === order.client_id)
                const daysSince = Math.floor((Date.now() - new Date(order.created_at)) / (1000 * 60 * 60 * 24))
                const isBeingDragged = kanbanDrag && kanbanDrag.orderId === order.id
                return (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => {
                      setKanbanDrag({ orderId: order.id, fromIdx: statusIdx })
                      try { e.dataTransfer.setData('text/plain', order.id); e.dataTransfer.effectAllowed = 'move' } catch (_) {}
                    }}
                    onDragEnd={() => { setKanbanDrag(null); setKanbanHoverCol(null) }}
                    style={{
                      padding: sp[2],
                      background: c.bg,
                      border: `1px solid ${c.borderSubtle}`,
                      borderInlineStart: `3px solid ${statusObj.color}`,
                      borderRadius: radius.sm,
                      cursor: 'grab',
                      transition: `all 0.2s ${ease.smooth}`,
                      fontSize: size.xs,
                      opacity: isBeingDragged ? 0.45 : 1,
                      transform: isBeingDragged ? 'scale(0.98)' : 'none',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = statusObj.color
                      e.currentTarget.style.boxShadow = `0 4px 12px ${statusObj.color}22`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = c.borderSubtle
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Order reference */}
                    <div style={{
                      fontFamily: f.mono,
                      fontSize: '9px',
                      fontWeight: 700,
                      color: statusObj.color,
                      letterSpacing: '0.04em',
                      marginBottom: '4px',
                    }}>
                      {order.ref || 'CRX-' + order.id?.slice(0, 8)}
                    </div>

                    {/* Product name */}
                    <div style={{
                      fontWeight: 700,
                      color: c.text,
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                    }}>
                      {order.product || 'Produit'}
                    </div>

                    {/* Client name */}
                    <div style={{
                      fontSize: '9px',
                      color: c.textSecondary,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {orderClient?.full_name || 'Client inconnu'}
                    </div>

                    {/* Quantity + Budget */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '9px',
                    }}>
                      <span style={{ color: c.textTertiary, fontFamily: f.mono }}>{(order.quantity || 0).toLocaleString('fr-FR')}u</span>
                      {order.budget && <span style={{ color: c.gold, fontWeight: 700, fontFamily: f.mono }}>{order.budget}</span>}
                    </div>

                    {/* Days since creation + Risk indicator */}
                    <div style={{
                      fontSize: '9px',
                      color: daysSince > 21 ? c.red : daysSince > 14 ? c.amber : c.textTertiary,
                      fontFamily: f.mono,
                      fontWeight: daysSince > 14 ? 700 : 400,
                      marginBottom: '6px',
                      paddingBottom: '4px',
                      borderBottom: `1px solid ${daysSince > 21 ? c.redGlow : c.borderSubtle}`,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      {daysSince > 21 && <span title="Risque élevé — inactif depuis 21+ jours">🔴</span>}
                      {daysSince > 14 && daysSince <= 21 && <span title="Attention — inactif depuis 14+ jours">🟠</span>}
                      {daysSince === 0 ? 'Aujourd\'hui' : `+${daysSince}j`}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {prevStatus && (
                        <button onClick={async () => {
                          try {
                            await updateOrder(order.id, { status: statusIdx - 1, progress: Math.round(((statusIdx - 1) / (STATUSES.length - 1)) * 100) })
                            if (order.client_id) {
                              sendPushToUser({ userId: order.client_id, title: 'CARAXES — statut mis à jour', body: `Votre commande ${order.ref || order.id?.slice(0, 8)} : ${prevStatus.label}`, url: '/', tag: `order-${order.id}` }).catch(() => {})
                            }
                            await loadAll(); toast.success(t('toast.orderMovedBackward'))
                          } catch(e) { toast.error(tToast('genericError', { error: e.message })) }
                        }} style={{
                          padding: '3px 6px', background: 'transparent', border: `1px solid ${c.border}30`, color: c.textTertiary, fontSize: '8px', fontFamily: f.mono, cursor: 'pointer', flex: 1,
                        }} title="Reculer">← Reculer</button>
                      )}
                      {nextStatus && (
                        <button onClick={async () => {
                          try {
                            await updateOrder(order.id, { status: statusIdx + 1, progress: Math.round(((statusIdx + 1) / (STATUSES.length - 1)) * 100) })
                            if (order.client_id) {
                              sendPushToUser({ userId: order.client_id, title: 'CARAXES — statut mis à jour', body: `Votre commande ${order.ref || order.id?.slice(0, 8)} : ${nextStatus.label}`, url: '/', tag: `order-${order.id}` }).catch(() => {})
                            }
                            await loadAll(); toast.success(t('toast.orderMovedForward'))
                          } catch(e) { toast.error(tToast('genericError', { error: e.message })) }
                        }} style={{
                          padding: '3px 6px', background: 'transparent', border: `1px solid ${nextStatus.color}40`, color: nextStatus.color, fontSize: '8px', fontFamily: f.mono, cursor: 'pointer', flex: 1, fontWeight: 600,
                        }} title="Avancer">Avancer →</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  </div>
  )
}

export default OrdersPipelineTab
