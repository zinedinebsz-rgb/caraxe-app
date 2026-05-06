/* ── CARAXES Admin — Clients Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, ArtDecoDivider, DragonEmptyState, fmtMoney, parseBudget, inputStyle, labelStyle, focusGlow } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius, STATUSES } from '../../lib/theme'
import { TIERS, getTierByKey, DEFAULT_TIER } from '../../lib/clientTiers'
import { scoreCohort, SCORE_BAND_COLOR } from '../../lib/clientScoring'
import StatusPill from '../../components/StatusPill'
import { Modal } from '../../components/Toast'

export default function ClientsTab() {
  const {
    mainTab, orders, allProfiles, setMainTab,
    t, toast, tToast, loadAll,
    updateProfile, resetPassword,
    getClientOrderCount, getClientLastOrderDate,
    setConfirmDialog,
  } = useAdmin()

  // Local state
  const [search, setSearch] = useState('')
  const [selectedClientTab, setSelectedClientTab] = useState(null)
  const [clientPasswordModal, setClientPasswordModal] = useState(null)
  const [newTempPassword, setNewTempPassword] = useState('')
  const [passwordAction, setPasswordAction] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [lastSetPassword, setLastSetPassword] = useState('')
  const [clientTierFilter, setClientTierFilter] = useState(null)

  if (mainTab !== 'clients') return null

  // Navigate to commandes tab (optionally pre-selecting a client)
  const openCreateOrder = (clientId) => {
    // TODO: pass clientId as pre-filter when commandes tab supports it
    setMainTab('commandes')
  }
  // Feature toggles — placeholder until modal is implemented
  const openClientFeatures = (client) => {
    // TODO: implement feature toggles modal in AdminContext
    console.info('[CARAXES] Feature toggles not yet implemented for client:', client.id)
  }

  const filteredClients = allProfiles.filter(cl => {
    if (clientTierFilter && (cl.client_tier || DEFAULT_TIER) !== clientTierFilter) return false
    if (search && !(cl.full_name || '').toLowerCase().includes(search.toLowerCase()) && !(cl.email || '').toLowerCase().includes(search.toLowerCase()) && !(cl.company || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  // Compute scores for the cohort + create a lookup by id.
  const scored = scoreCohort(filteredClients, orders)
  const scoreById = new Map(scored.map((s) => [s.client.id, s]))
  // Sort clients by score descending (top-revenue first).
  const sortedClients = [...filteredClients].sort((a, b) => {
    const sa = scoreById.get(a.id)?.score || 0
    const sb = scoreById.get(b.id)?.score || 0
    return sb - sa
  })
  const top20Count = scored.filter((s) => s.isTop20).length
  const top20LTV = scored.filter((s) => s.isTop20).reduce((sum, s) => sum + s.ltv, 0)
  const totalLTV = scored.reduce((sum, s) => sum + s.ltv, 0)

  return (
  <>
  <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
      <div>
        <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Clients
        </h2>
        <ArtDecoDivider width={80} />
        <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
          {filteredClients.length}/{allProfiles.length} profil{allProfiles.length > 1 ? 's' : ''}
        </p>
      </div>
      <button onClick={() => openCreateOrder('')} style={{
        padding: `10px ${sp[3]}`, background: c.red, color: c.text, border: 'none',
        fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
        transition: `all 0.35s ${ease.luxury}`, display: 'flex', alignItems: 'center', gap: '6px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
      onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
        <Icon d={icons.plus} size={14} color={c.text} />
        Nouvelle commande
      </button>
    </div>

    {/* Filters bar */}
    <div style={{
      display: 'flex', gap: sp[2], marginBottom: sp[3], flexWrap: 'wrap', alignItems: 'center',
      padding: `${sp[2]} ${sp[3]}`, background: c.bgCard, border: `1px solid ${c.border}`,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon d={icons.search} size={12} color={c.textTertiary} />
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          style={{
            width: '100%', padding: '8px 10px 8px 30px', background: c.bgElevated,
            border: `1px solid ${c.border}`, color: c.text, fontSize: size.xs,
            fontFamily: f.body, outline: 'none', boxSizing: 'border-box',
            transition: `border-color 0.2s ${ease.smooth}`,
          }}
          onFocus={e => e.target.style.borderColor = c.gold}
          onBlur={e => e.target.style.borderColor = c.border} />
      </div>

      {/* Tier filter pills */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={() => setClientTierFilter(null)} style={{
          padding: '6px 12px', fontSize: '9px', fontFamily: f.mono, fontWeight: !clientTierFilter ? 700 : 500,
          background: !clientTierFilter ? c.gold : 'transparent', color: !clientTierFilter ? c.bg : c.textTertiary,
          border: `1px solid ${!clientTierFilter ? c.gold : c.border}`, cursor: 'pointer',
          letterSpacing: '0.04em', textTransform: 'uppercase', transition: `all 0.15s ${ease.smooth}`,
        }}>Tous</button>
        {TIERS.map(tier => (
          <button key={tier.key} onClick={() => setClientTierFilter(clientTierFilter === tier.key ? null : tier.key)} style={{
            padding: '6px 12px', fontSize: '9px', fontFamily: f.mono, fontWeight: clientTierFilter === tier.key ? 700 : 500,
            background: clientTierFilter === tier.key ? tier.color : 'transparent',
            color: clientTierFilter === tier.key ? c.bg : c.textTertiary,
            border: `1px solid ${clientTierFilter === tier.key ? tier.color : c.border}`, cursor: 'pointer',
            letterSpacing: '0.04em', textTransform: 'uppercase', transition: `all 0.15s ${ease.smooth}`,
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span style={{ fontSize: '12px' }}>{tier.icon}</span> {tier.label}
            <span style={{ opacity: 0.7, fontSize: '8px' }}>{allProfiles.filter(p => (p.client_tier || DEFAULT_TIER) === tier.key).length}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Scoring summary banner */}
    {filteredClients.length > 0 && (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: sp[2],
        marginBottom: sp[3],
      }}>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.gold}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>LTV total</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold }}>{fmtMoney(totalLTV)}</div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.green}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top 20% → LTV</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.green }}>{fmtMoney(top20LTV)}</div>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>
            {top20Count} client{top20Count > 1 ? 's' : ''} · {totalLTV > 0 ? Math.round((top20LTV / totalLTV) * 100) : 0}% du CA
          </div>
        </div>
        <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.teal}`, borderRadius: radius.sm }}>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score moyen</div>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.teal }}>
            {scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : 0}
            <span style={{ fontSize: '11px', color: c.textTertiary, fontFamily: f.mono, marginInlineStart: 4 }}>/ 100</span>
          </div>
        </div>
      </div>
    )}

    {filteredClients.length === 0 ? (
      <DragonEmptyState title="Aucun client" subtitle={search || clientTierFilter ? 'Aucun résultat pour ces filtres' : 'Invitez des clients pour commencer'} />
    ) : (
      /* ── CLIENT TABLE ── */
      <div className="admin-client-table" style={{ background: c.bgCard, border: `1px solid ${c.border}`, overflow: 'hidden', borderRadius: radius.sm, boxShadow: shadow.xs }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1fr 1.3fr 0.8fr 0.8fr 1fr',
          padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.border}`, background: c.bgElevated,
          gap: sp[2],
        }}>
          {['Client', 'Score', 'Profil', 'Services', 'Commandes', 'Dernière', 'Actions'].map(h => (
            <div key={h} style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</div>
          ))}
        </div>

        {/* Table rows */}
        {sortedClients.map((client, i) => {
          const orderCount = getClientOrderCount(client.id)
          const lastOrderDate = getClientLastOrderDate(client.id)
          const initial = (client.full_name || client.email).charAt(0).toUpperCase()
          const tier = getTierByKey(client.client_tier || DEFAULT_TIER)
          const isSelected = selectedClientTab === client.id
          const sc = scoreById.get(client.id) || { score: 0, band: 'D', ltv: 0, isTop20: false, recencyDays: null }
          const bandColor = SCORE_BAND_COLOR[sc.band] || c.textTertiary
          return (
            <div key={client.id}>
              {/* Main row */}
              <div
                onClick={() => setSelectedClientTab(isSelected ? null : client.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1fr 1.3fr 0.8fr 0.8fr 1fr',
                  padding: `${sp[2]} ${sp[3]}`, gap: sp[2],
                  borderBottom: `1px solid ${isSelected ? tier.color + '33' : c.borderSubtle}`,
                  background: isSelected ? `${tier.color}08` : 'transparent',
                  cursor: 'pointer', alignItems: 'center',
                }}>

                {/* Client identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: `${tier.color}15`, border: `2px solid ${tier.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: tier.color,
                  }}>{initial}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.full_name || client.email}
                      </span>
                      {client.role === 'admin' && (
                        <span style={{
                          padding: '1px 5px', background: `${c.purple}20`, border: `1px solid ${c.purple}40`,
                          fontSize: '7px', fontFamily: f.mono, fontWeight: 700, color: c.purple,
                          letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                        }}>ADMIN</span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: c.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.email}
                      {client.company && <span style={{ color: c.textSecondary }}> &middot; {client.company}</span>}
                    </div>
                  </div>
                </div>

                {/* Score cell */}
                <div title={`LTV ${fmtMoney(sc.ltv)} · ${sc.recencyDays == null ? 'Aucune commande' : `dernière il y a ${sc.recencyDays}j`} · fréquence ${sc.frequencyPerMonth?.toFixed(1) || 0}/mois`}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px',
                    border: `1px solid ${bandColor}44`,
                    background: `${bandColor}14`,
                    color: bandColor,
                    fontFamily: f.mono,
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}>
                    <span style={{ fontFamily: f.display, fontSize: '13px', fontWeight: 700 }}>{sc.score}</span>
                    <span style={{ opacity: 0.7 }}>·</span>
                    <span>{sc.band}</span>
                    {sc.isTop20 && (
                      <span style={{ color: c.gold, fontSize: '10px', marginInlineStart: 2 }}>★</span>
                    )}
                  </div>
                </div>

                {/* Tier pill */}
                <div>
                  <span style={{
                    padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: `${tier.color}15`, border: `1px solid ${tier.color}33`,
                    fontSize: '9px', fontFamily: f.mono, fontWeight: 700, color: tier.color,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    <span style={{ fontSize: '11px' }}>{tier.icon}</span>
                    {tier.label}
                  </span>
                </div>

                {/* Services */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'sourcing', label: 'Sourcing', color: c.red },
                    { key: 'logistics', label: 'Logistique', color: c.teal },
                    { key: 'stock', label: 'Stock', color: c.purple },
                  ].map(svc => {
                    const enabled = (client.services_enabled || ['sourcing']).includes(svc.key)
                    return enabled ? (
                      <span key={svc.key} style={{
                        padding: '2px 6px', background: `${svc.color}12`, border: `1px solid ${svc.color}30`,
                        fontSize: '8px', fontFamily: f.mono, fontWeight: 600, color: svc.color,
                        letterSpacing: '0.03em',
                      }}>{svc.label}</span>
                    ) : null
                  })}
                </div>

                {/* Orders count */}
                <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: orderCount > 0 ? c.gold : c.textTertiary }}>
                  {orderCount}
                </div>

                {/* Last order */}
                <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
                  {lastOrderDate ? lastOrderDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '–'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openCreateOrder(client.id)} style={{
                    padding: '5px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                    color: c.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                    fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
                    letterSpacing: '0.03em',
                  }}>
                    <Icon d={icons.plus} size={10} color="currentColor" /> CMD
                  </button>
                  <button onClick={() => { setClientPasswordModal(client); setPasswordAction(null); setNewTempPassword('') }} style={{
                    padding: '5px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                    color: c.textTertiary, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    transition: `all 0.2s ${ease.smooth}`,
                  }}
                  >
                    <Icon d={icons.lock} size={12} color="currentColor" />
                  </button>
                </div>
              </div>

              {/* ── EXPANDED CLIENT DETAIL ── */}
              {isSelected && (
                <div style={{
                  padding: `${sp[3]} ${sp[4]}`, background: `${tier.color}05`,
                  borderBottom: `2px solid ${tier.color}33`,
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  {/* ── CLIENT SCORE + QUICK STATS ── */}
                  {(() => {
                    const clientOrders = orders.filter(o => o.client_id === client.id)
                    const clientRevenue = clientOrders.reduce((sum, o) => sum + parseBudget(o.budget), 0)
                    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(client.created_at).getTime()) / 86400000))
                    const orderFreq = clientOrders.length / Math.max(1, daysSinceCreation / 30)
                    const reliabilityScore = Math.min(100, Math.round(
                      (clientOrders.length > 0 ? 30 : 0) +
                      (clientRevenue > 1000 ? 25 : clientRevenue > 500 ? 15 : clientRevenue > 0 ? 5 : 0) +
                      (orderFreq > 1 ? 25 : orderFreq > 0.3 ? 15 : 5) +
                      ((client.services_enabled || []).length > 1 ? 20 : 10)
                    ))
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp[4], marginBottom: sp[3], paddingBottom: sp[3], borderBottom: `1px solid ${c.borderSubtle}` }}>
                        {/* Score circle */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ position: 'relative', width: 72, height: 72 }}>
                            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: 72, height: 72 }}>
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={c.bgElevated} strokeWidth="2" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={tier.color} strokeWidth="2" strokeDasharray={`${reliabilityScore}, 100`} strokeLinecap="butt" />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: tier.color }}>{reliabilityScore}</div>
                          </div>
                          <div style={{ fontFamily: f.mono, fontSize: '7px', color: c.goldMuted, letterSpacing: '0.10em', marginTop: 4 }}>SCORE CLIENT</div>
                        </div>
                        {/* Quick client stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp[3], flex: 1 }}>
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text }}>{clientOrders.length}</div>
                            <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, letterSpacing: '0.06em' }}>COMMANDES</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold }}>{clientRevenue > 0 ? `${(clientRevenue / 1000).toFixed(1)}k €` : fmtMoney(0)}</div>
                            <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, letterSpacing: '0.06em' }}>REVENUE</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.teal }}>{daysSinceCreation}j</div>
                            <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, letterSpacing: '0.06em' }}>ANCIENNETÉ</div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[4] }}>
                    {/* Left: Profile + Tier management */}
                    <div>
                      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>
                        Profil & Services
                      </div>

                      {/* Contact details */}
                      <div style={{ marginBottom: sp[3] }}>
                        {client.company && <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text, marginBottom: '4px' }}>{client.company}</div>}
                        {client.phone && <div style={{ fontSize: size.xs, color: c.textSecondary, marginBottom: '2px' }}>Tel: {client.phone}</div>}
                        {client.city && <div style={{ fontSize: size.xs, color: c.textSecondary }}>Ville: {client.city}</div>}
                        {!client.company && !client.phone && !client.city && (
                          <div style={{ fontSize: size.xs, color: c.textTertiary, fontStyle: 'italic' }}>Aucune info de contact renseign&eacute;e</div>
                        )}
                      </div>

                      {/* Tier selector */}
                      <div style={{ marginBottom: sp[3] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Changer le profil</div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {TIERS.map(tier => (
                            <button key={tier.key} onClick={() => {
                              updateProfile(client.id, { client_tier: tier.key }).then(() => loadAll()).catch(err => console.error('Error:', err))
                            }} style={{
                              flex: 1, padding: '6px 4px',
                              background: (client.client_tier || DEFAULT_TIER) === tier.key ? tier.color : c.bgElevated,
                              border: `1px solid ${(client.client_tier || DEFAULT_TIER) === tier.key ? tier.color : c.border}`,
                              color: (client.client_tier || DEFAULT_TIER) === tier.key ? c.bg : c.textTertiary,
                              fontSize: '9px', fontFamily: f.mono, fontWeight: (client.client_tier || DEFAULT_TIER) === tier.key ? 700 : 400,
                              cursor: 'pointer', transition: `all 0.15s ${ease.smooth}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                            }}
                            onMouseEnter={e => { if ((client.client_tier || DEFAULT_TIER) !== tier.key) { e.currentTarget.style.borderColor = tier.color; e.currentTarget.style.color = tier.color } }}
                            onMouseLeave={e => { if ((client.client_tier || DEFAULT_TIER) !== tier.key) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textTertiary } }}>
                              <span style={{ fontSize: '12px' }}>{tier.icon}</span> {tier.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Services toggles */}
                      <div>
                        <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Services actifs</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {[
                            { key: 'sourcing', label: 'Sourcing Chine', color: c.red, icon: '◆', desc: 'Inclus — recherche fournisseurs', free: true },
                            { key: 'logistics', label: 'Expédition & Logistique', color: c.teal, icon: '▸', desc: 'Fret maritime, aérien, express' },
                            { key: 'stock', label: 'Stock & E-commerce', color: c.purple, icon: '⬡', desc: 'Stockage Yiwu + boutique en ligne' },
                          ].map(svc => {
                            const enabled = (client.services_enabled || ['sourcing']).includes(svc.key)
                            return (
                              <button key={svc.key} onClick={() => {
                                if (svc.free) return
                                const current = client.services_enabled || ['sourcing']
                                const next = enabled ? current.filter(s => s !== svc.key) : [...current, svc.key]
                                updateProfile(client.id, { services_enabled: next }).then(() => loadAll()).catch(err => { toast.error(tToast('genericError', { error: err.message || 'Inconnue' })); console.error('Error:', err) })
                              }} style={{
                                padding: `${sp[1]} ${sp[2]}`, textAlign: 'start',
                                background: enabled ? `${svc.color}08` : 'transparent',
                                border: `1px solid ${enabled ? svc.color + '30' : c.borderSubtle}`,
                                cursor: svc.free ? 'default' : 'pointer',
                                transition: `all 0.2s ${ease.smooth}`,
                                display: 'flex', alignItems: 'center', gap: sp[2],
                              }}>
                                <div style={{
                                  width: 20, height: 20, flexShrink: 0,
                                  background: enabled ? svc.color : c.bgElevated,
                                  border: `1px solid ${enabled ? svc.color : c.border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', color: enabled ? c.bg : c.textTertiary,
                                }}>{enabled ? '✓' : ''}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: size.xs, fontWeight: 600, color: enabled ? svc.color : c.textSecondary }}>{svc.label}</div>
                                  <div style={{ fontSize: '9px', color: c.textTertiary }}>{svc.desc}</div>
                                </div>
                                {svc.free && <span style={{ fontSize: '8px', fontFamily: f.mono, color: c.textTertiary, opacity: 0.6 }}>INCLUS</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* ── FEATURE TOGGLES BUTTON ── */}
                      <div style={{ marginTop: sp[2] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Dashboard du client</div>
                        <button onClick={() => openClientFeatures(client)} style={{
                          padding: `${sp[1]} ${sp[2]}`, width: '100%',
                          background: c.bgElevated, border: `1px solid ${c.teal}22`,
                          color: c.text, fontSize: size.xs, fontFamily: f.body, cursor: 'pointer',
                          textAlign: 'start', display: 'flex', alignItems: 'center', gap: sp[2],
                          transition: `all 0.2s ${ease.smooth}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.teal; e.currentTarget.style.background = `${c.teal}08` }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.teal}22`; e.currentTarget.style.background = c.bgElevated }}>
                          <Icon d={icons.edit} size={12} color={c.teal} />
                          Gérer les fonctionnalités du Dashboard
                        </button>
                      </div>
                    </div>

                    {/* Right: Orders */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[2] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Commandes ({orderCount})
                        </div>
                      </div>
                      {orders.filter(o => o.client_id === client.id).length === 0 ? (
                        <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`, textAlign: 'center' }}>
                          <div style={{ fontSize: size.xs, color: c.textTertiary }}>Aucune commande</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 220, overflowY: 'auto' }}>
                          {orders.filter(o => o.client_id === client.id).slice(0, 8).map(order => {
                            const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]
                            return (
                              <div key={order.id} style={{
                                padding: `${sp[1]} ${sp[2]}`, background: c.bgElevated,
                                border: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: sp[2],
                                transition: `all 0.2s ${ease.smooth}`,
                              }}
                              onClick={() => { setMainTab('commandes'); /* setSelectedId handled by parent via tab switch */ }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.bgCard }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.background = c.bgElevated }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: size.xs, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product}</div>
                                  <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono }}>{order.ref} &middot; {(order.quantity || 0).toLocaleString('fr-FR')}u</div>
                                </div>
                                <StatusPill status={order.status} />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>

  {/* ════════════ MODAL: Client Password ════════════ */}
  <Modal open={!!clientPasswordModal} onClose={() => setClientPasswordModal(null)} title="Gestion du compte" maxWidth={440}>
        {clientPasswordModal && <>
        <div style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3] }}>{clientPasswordModal.full_name || clientPasswordModal.email}</div></>}

        {/* Client info */}
        {clientPasswordModal && <div style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
            <div>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Email</div>
              <div style={{ fontSize: size.sm, color: c.text, fontWeight: 600 }}>{clientPasswordModal.email}</div>
            </div>
            <div>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Inscrit le</div>
              <div style={{ fontSize: size.sm, color: c.text }}>{clientPasswordModal.created_at ? new Date(clientPasswordModal.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '–'}</div>
            </div>
          </div>
        </div>}

        {/* Actions */}
        {!passwordAction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
            <button onClick={() => setPasswordAction('reset')} style={{
              width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
              color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'start',
              display: 'flex', alignItems: 'center', gap: sp[2], transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.goldSoft }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
              <Icon d={icons.refresh} size={16} color={c.gold} />
              <div>
                <div style={{ fontWeight: 700 }}>Réinitialiser le mot de passe</div>
                <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>Envoie un email de réinitialisation au client</div>
              </div>
            </button>

            <button onClick={() => setPasswordAction('set')} style={{
              width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
              color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'start',
              display: 'flex', alignItems: 'center', gap: sp[2], transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.background = `${c.red}10` }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
              <Icon d={icons.edit} size={16} color={c.red} />
              <div>
                <div style={{ fontWeight: 700 }}>Définir un mot de passe temporaire</div>
                <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>Crée un nouveau mot de passe que vous communiquez au client</div>
              </div>
            </button>

            <div style={{ height: 1, background: c.border, margin: `${sp[1]} 0` }} />

            <button onClick={() => setPasswordAction('reset-account')} style={{
              width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
              color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'start',
              display: 'flex', alignItems: 'center', gap: sp[2], transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c43a2f'; e.currentTarget.style.background = 'rgba(196, 58, 47, 0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
              <Icon d={icons.refresh} size={16} color="#c43a2f" />
              <div>
                <div style={{ fontWeight: 700 }}>Réinitialiser le compte</div>
                <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>Remet l'onboarding à zéro — le client devra reconfigurer son profil</div>
              </div>
            </button>

            <div style={{ height: 1, background: c.border, margin: `${sp[1]} 0` }} />

            {/* Toggle admin role */}
            <button onClick={async () => {
              const isAdmin = clientPasswordModal.role === 'admin'
              const newRole = isAdmin ? 'client' : 'admin'
              try {
                await updateProfile(clientPasswordModal.id, { role: newRole })
                toast.success(isAdmin ? t('toast.accountToggledClient') : t('toast.accountToggledAdmin'))
                setClientPasswordModal(null)
                await loadAll()
              } catch (err) {
                toast.error(tToast('genericError', { error: err.message || 'Inconnue' }))
              }
            }} style={{
              width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
              color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'start',
              display: 'flex', alignItems: 'center', gap: sp[2], transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.purple; e.currentTarget.style.background = `${c.purple}10` }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
              <Icon d={icons.shield} size={16} color={c.purple} />
              <div>
                <div style={{ fontWeight: 700 }}>{clientPasswordModal.role === 'admin' ? 'Retirer les droits admin' : 'Passer en admin'}</div>
                <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>
                  {clientPasswordModal.role === 'admin'
                    ? 'Ce compte redeviendra un compte client standard'
                    : 'Ce compte aura accès au panel d\'administration'
                  }
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Reset password flow */}
        {passwordAction === 'reset' && (
          <div style={{  }}>
            <div style={{
              padding: sp[3], background: c.goldSoft, border: `1px solid ${c.gold}33`, marginBottom: sp[3],
            }}>
              <p style={{ fontSize: size.sm, color: c.text, lineHeight: 1.6, margin: 0 }}>
                Un email de réinitialisation sera envoyé à <strong>{clientPasswordModal.email}</strong>. Le client pourra choisir un nouveau mot de passe via le lien reçu.
              </p>
            </div>
            <div style={{ display: 'flex', gap: sp[2] }}>
              <button onClick={() => setPasswordAction(null)} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textTertiary, fontSize: size.sm, fontFamily: f.body, fontWeight: 600, cursor: 'pointer',
              }}>Retour</button>
              <button onClick={async () => {
                setPasswordLoading(true)
                try {
                  const { error } = await resetPassword(clientPasswordModal.email)
                  if (error) throw error
                  toast.success(t('toast.resetEmailSent'))
                  setClientPasswordModal(null)
                } catch (err) {
                  toast.error(tToast('genericError', { error: err.message }))
                } finally { setPasswordLoading(false) }
              }} disabled={passwordLoading} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: c.gold, border: 'none',
                color: c.bg, fontSize: size.sm, fontFamily: f.body, fontWeight: 700, cursor: passwordLoading ? 'wait' : 'pointer',
                opacity: passwordLoading ? 0.6 : 1,
              }}>
                {passwordLoading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </div>
          </div>
        )}

        {/* Set temp password flow */}
        {passwordAction === 'set' && (
          <div style={{  }}>
            <div style={{
              padding: sp[3], background: `${c.red}10`, border: `1px solid ${c.red}33`, marginBottom: sp[3],
            }}>
              <p style={{ fontSize: size.sm, color: c.text, lineHeight: 1.6, margin: 0 }}>
                Ce mot de passe temporaire remplacera l'ancien. Communiquez-le au client de manière sécurisée.
              </p>
            </div>
            <div style={{ marginBottom: sp[3] }}>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: sp[1] }}>Nouveau mot de passe</label>
              <div style={{ display: 'flex', gap: sp[1] }}>
                <input type="text" value={newTempPassword} onChange={(e) => setNewTempPassword(e.target.value)} placeholder="Min. 8 caractères" style={{
                  flex: 1, padding: `8px ${sp[2]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                  color: c.text, fontFamily: f.mono, fontSize: size.sm, outline: 'none',
                }} />
                <button onClick={() => {
                  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
                  let pwd = ''
                  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
                  setNewTempPassword(pwd)
                }} style={{
                  padding: `8px ${sp[2]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                  color: c.gold, fontSize: size.xs, fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>Générer</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: sp[2] }}>
              <button onClick={() => { setPasswordAction(null); setNewTempPassword('') }} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textTertiary, fontSize: size.sm, fontFamily: f.body, fontWeight: 600, cursor: 'pointer',
              }}>Retour</button>
              <button onClick={async () => {
                if (newTempPassword.length < 8) { toast.error(t('toast.passwordMinLength')); return }
                setPasswordLoading(true)
                try {
                  const { error } = await resetPassword(clientPasswordModal.email)
                  if (error) throw error
                  toast.success(tToast('resetEmailSentTo', { email: clientPasswordModal.email }))
                  setPasswordAction('done')
                  setLastSetPassword('')
                } catch (err) {
                  toast.error(tToast('genericError', { error: err.message || 'Inconnue' }))
                } finally { setPasswordLoading(false) }
              }} disabled={passwordLoading || newTempPassword.length < 8} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: newTempPassword.length >= 8 ? c.red : c.bgElevated,
                border: 'none', color: newTempPassword.length >= 8 ? c.white : c.textTertiary,
                fontSize: size.sm, fontFamily: f.body, fontWeight: 700,
                cursor: passwordLoading || newTempPassword.length < 8 ? 'not-allowed' : 'pointer',
                opacity: passwordLoading ? 0.6 : 1,
              }}>
                {passwordLoading ? 'Mise à jour...' : 'Appliquer'}
              </button>
            </div>
          </div>
        )}

        {/* Password just set — display for copy */}
        {passwordAction === 'done' && lastSetPassword && (
          <div style={{  }}>
            <div style={{
              padding: sp[3], background: 'rgba(50, 120, 70, 0.12)', border: '1px solid rgba(60, 140, 80, 0.3)', marginBottom: sp[3],
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Mot de passe défini</div>
              <div style={{
                fontFamily: f.mono, fontSize: size.lg, fontWeight: 700, color: c.text,
                padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                userSelect: 'all', cursor: 'text', letterSpacing: '0.05em',
              }}>{lastSetPassword}</div>
              <p style={{ fontSize: size.xs, color: c.textTertiary, margin: `${sp[2]} 0 0`, lineHeight: 1.5 }}>
                Communiquez ce mot de passe au client. Il ne sera plus visible apr&egrave;s fermeture.
              </p>
            </div>
            <div style={{ display: 'flex', gap: sp[2] }}>
              <button onClick={() => {
                navigator.clipboard.writeText(lastSetPassword)
                toast.success(t('toast.passwordCopied'))
              }} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: c.gold, border: 'none',
                color: c.bg, fontSize: size.sm, fontFamily: f.body, fontWeight: 700, cursor: 'pointer',
              }}>Copier le mot de passe</button>
              <button onClick={() => {
                setClientPasswordModal(null); setLastSetPassword(''); setNewTempPassword('')
              }} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textTertiary, fontSize: size.sm, fontFamily: f.body, fontWeight: 600, cursor: 'pointer',
              }}>Fermer</button>
            </div>
          </div>
        )}

        {/* Reset account flow */}
        {passwordAction === 'reset-account' && (
          <div style={{  }}>
            <div style={{
              padding: sp[3], background: 'rgba(196, 58, 47, 0.08)', border: '1px solid rgba(196, 58, 47, 0.25)', marginBottom: sp[3],
            }}>
              <p style={{ fontSize: size.sm, color: c.text, lineHeight: 1.6, margin: 0 }}>
                <strong>Attention :</strong> Cette action remet le compte de <strong>{clientPasswordModal.full_name || clientPasswordModal.email}</strong> à zéro.
                Le client devra refaire l'onboarding (choix du profil, catalogue, infos de contact).
              </p>
            </div>
            <div style={{
              padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3],
              fontSize: size.xs, color: c.textTertiary, lineHeight: 1.5,
            }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1], color: c.textTertiary }}>Ce qui sera réinitialisé</div>
              <div>&#x25C6; Onboarding remis à « non complété »</div>
              <div>&#x25C6; Profil client (tier, contact, société) vidé</div>
              <div style={{ marginTop: sp[1], color: c.gold }}>&#x25C6; Les commandes existantes sont conservées</div>
            </div>
            <div style={{ display: 'flex', gap: sp[2] }}>
              <button onClick={() => setPasswordAction(null)} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textTertiary, fontSize: size.sm, fontFamily: f.body, fontWeight: 600, cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={async () => {
                setPasswordLoading(true)
                try {
                  await updateProfile(clientPasswordModal.id, {
                    onboarding_done: false,
                    client_tier: null,
                    company_name: null,
                    phone: null,
                    city: null,
                  })
                  toast.success(t('toast.accountReset'))
                  setClientPasswordModal(null)
                  loadAll()
                } catch (err) {
                  toast.error(tToast('genericError', { error: err.message || 'Inconnue' }))
                } finally { setPasswordLoading(false) }
              }} disabled={passwordLoading} style={{
                flex: 1, padding: `10px ${sp[2]}`, background: '#c43a2f', border: 'none',
                color: c.white, fontSize: size.sm, fontFamily: f.body, fontWeight: 700,
                cursor: passwordLoading ? 'wait' : 'pointer', opacity: passwordLoading ? 0.6 : 1,
              }}>
                {passwordLoading ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
              </button>
            </div>
          </div>
        )}
  </Modal>
  </>
  )
}
