/* ── CARAXES Admin — Boutiques Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, ArtDecoDivider, DragonEmptyState, N8N_WEBHOOK_URL, fmtDate, fmtMoney, inputStyle, labelStyle, focusGlow } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'

export default function BoutiquesTab() {
  const {
    shops, allProfiles, loadAll, toast, t, tToast,
    createShop, updateShop, deleteShop,
    setConfirmDialog,
  } = useAdmin()

  // ── Local state ──
  const [shopForm, setShopForm] = useState({ name: '', platform: 'shopify', domain: '', template: 'classic', notes: '', client_id: '', logo_url: '', products_synced: 0, monthly_orders: 0, monthly_revenue: 0 })
  const [showShopModal, setShowShopModal] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [selectedShopId, setSelectedShopId] = useState(null)
  const [shopSearch, setShopSearch] = useState('')
  const [shopStatusFilter, setShopStatusFilter] = useState(null)
  const [shopCreationLoading, setShopCreationLoading] = useState(false)

  const statusColors = { draft: c.textTertiary, building: c.amber, review: c.blue, active: c.green, paused: c.red, archived: c.textTertiary }
  const statusLabels = { draft: 'Brouillon', building: 'En construction', review: 'En revue', active: 'Active', paused: 'En pause', archived: 'Archivée' }
  const platformLabels = { shopify: 'Shopify', woocommerce: 'WooCommerce', prestashop: 'PrestaShop', custom: 'Sur mesure' }
  const templateLabels = { classic: 'Classic', modern: 'Modern', minimal: 'Minimal', editorial: 'Éditorial' }
  const filteredShops = shops.filter(s => {
    if (shopStatusFilter && s.status !== shopStatusFilter) return false
    if (shopSearch) {
      const q = shopSearch.toLowerCase()
      const client = allProfiles.find(p => p.id === s.client_id)
      if (!(s.name || '').toLowerCase().includes(q) && !(s.domain || '').toLowerCase().includes(q) && !(client?.full_name || '').toLowerCase().includes(q) && !(client?.email || '').toLowerCase().includes(q)) return false
    }
    return true
  })
  const totalRevenue = shops.reduce((sum, s) => sum + (parseFloat(s.monthly_revenue) || 0), 0)
  const totalProducts = shops.reduce((sum, s) => sum + (s.products_synced || 0), 0)
  const totalOrders = shops.reduce((sum, s) => sum + (s.monthly_orders || 0), 0)
  const selectedShop = selectedShopId ? shops.find(s => s.id === selectedShopId) : null
  const selectedShopClient = selectedShop ? allProfiles.find(p => p.id === selectedShop.client_id) : null

  // Setup progress steps
  const setupSteps = [
    { key: 'draft', label: 'Création', desc: 'Projet initialisé' },
    { key: 'building', label: 'Construction', desc: 'Design et développement' },
    { key: 'review', label: 'Revue client', desc: 'Validation du client' },
    { key: 'active', label: 'En ligne', desc: 'Boutique publiée' },
  ]
  const statusOrder = ['draft', 'building', 'review', 'active']
  const getStepIndex = (status) => { const idx = statusOrder.indexOf(status); return idx >= 0 ? idx : -1 }

  return (
    <>
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* ── LEFT: SHOP LIST ── */}
      <div className="admin-scroll admin-sidebar" style={{ width: selectedShop ? '380px' : '100%', flexShrink: 0, overflowY: 'auto', padding: sp[4], borderInlineEnd: selectedShop ? `1px solid ${c.border}` : 'none', transition: 'width 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
          <div>
            <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Boutiques E-commerce
            </h2>
            <ArtDecoDivider width={50} />
            <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1], lineHeight: 1.5 }}>
              {filteredShops.length}/{shops.length} boutique{shops.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => { setEditingShop(null); setShopForm({ name: '', platform: 'shopify', domain: '', template: 'classic', notes: '', client_id: '', logo_url: '', products_synced: 0, monthly_orders: 0, monthly_revenue: 0 }); setShowShopModal(true) }} style={{
            padding: `10px ${sp[3]}`, background: c.gold, color: c.bg, border: 'none',
            fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Icon d={icons.plus} size={16} color={c.bg} />
            Nouvelle boutique
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedShop ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
          {[
            { label: 'Boutiques', value: shops.length, color: c.gold, sub: `${shops.filter(s => s.status === 'active').length} actives` },
            { label: 'Revenus/mois', value: fmtMoney(totalRevenue), color: c.green, sub: `${totalOrders} commandes` },
            ...(!selectedShop ? [
              { label: 'Produits sync.', value: totalProducts, color: c.teal, sub: `${[...new Set(shops.map(s => s.platform))].length} plateformes` },
              { label: 'En construction', value: shops.filter(s => s.status === 'building' || s.status === 'draft').length, color: c.amber, sub: `${shops.filter(s => s.status === 'review').length} en revue` },
            ] : []),
          ].map((stat, i) => (
            <div key={i} style={{ padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}` }}>
              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginTop: '2px' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[3], flexWrap: 'wrap', alignItems: 'center', padding: `${sp[1]} ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div style={{ position: 'relative', flex: '1 1 140px', minWidth: 120 }}>
            <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Icon d={icons.search} size={11} color={c.textTertiary} />
            </div>
            <input type="text" value={shopSearch} onChange={e => setShopSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{ width: '100%', padding: '6px 8px 6px 26px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontSize: '10px', fontFamily: f.body, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = c.gold}
              onBlur={e => e.target.style.borderColor = c.border} />
          </div>
          <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
            {[null, 'active', 'building', 'draft', 'review', 'paused'].map(st => (
              <button key={st || 'all'} onClick={() => setShopStatusFilter(shopStatusFilter === st ? null : st)} style={{
                padding: '4px 8px', fontSize: '8px', fontFamily: f.mono, fontWeight: shopStatusFilter === st ? 700 : 500,
                background: shopStatusFilter === st ? (statusColors[st] || c.gold) : 'transparent',
                color: shopStatusFilter === st ? c.bg : c.textTertiary,
                border: `1px solid ${shopStatusFilter === st ? (statusColors[st] || c.gold) : c.border}`,
                cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{st ? (statusLabels[st]?.split(' ')[0] || st) : 'Tous'}</button>
            ))}
          </div>
        </div>

        {/* Shop list */}
        {filteredShops.length === 0 ? (
          <DragonEmptyState title="Aucune boutique" subtitle={shopSearch || shopStatusFilter ? 'Aucun résultat pour ces filtres' : 'Créez une boutique pour commencer'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {filteredShops.map(shop => {
              const client = allProfiles.find(p => p.id === shop.client_id)
              const isSelected = selectedShopId === shop.id
              return (
                <div key={shop.id} onClick={() => setSelectedShopId(isSelected ? null : shop.id)} style={{
                  padding: `${sp[2]} ${sp[3]}`, background: isSelected ? `${c.gold}08` : c.bgCard,
                  borderBottom: `1px solid ${isSelected ? `${c.gold}33` : c.borderSubtle}`,
                  borderInlineStart: isSelected ? `3px solid ${c.gold}` : '3px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: `all 0.15s ${ease.smooth}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, flexShrink: 0,
                      background: `${c.gold}12`, border: `1.5px solid ${c.gold}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold,
                    }}>{(shop.name || '?')[0].toUpperCase()}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</span>
                        <span style={{
                          padding: '2px 6px', fontSize: '7px', fontFamily: f.mono, fontWeight: 700,
                          color: statusColors[shop.status] || c.textTertiary,
                          background: `${statusColors[shop.status] || c.textTertiary}15`,
                          letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                        }}>{statusLabels[shop.status]?.split(' ')[0] || shop.status}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px', display: 'flex', gap: sp[1] }}>
                        <span>{client?.full_name?.split(' ')[0] || client?.email?.split('@')[0] || '—'}</span>
                        <span style={{ color: c.gold }}>{platformLabels[shop.platform] || shop.platform}</span>
                        {(shop.monthly_revenue > 0) && <span style={{ color: c.green }}>{fmtMoney(shop.monthly_revenue)}/m</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button onClick={async (e) => {
                      e.stopPropagation()
                      setShopCreationLoading(true)
                      try {
                        const clientData = allProfiles.find(p => p.id === shop.client_id)
                        await fetch(`${N8N_WEBHOOK_URL}/create-shop`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...shop, client: clientData }),
                        })
                        toast.success(tToast('productCreationN8N', { name: shop.name }))
                      } catch (err) { toast.error(tToast('n8nError', { error: err.message })) }
                      finally { setShopCreationLoading(false) }
                    }} title="Lancer création via N8N" style={{
                      padding: '4px 8px', background: `${c.teal}12`, border: `1px solid ${c.teal}40`,
                      color: c.teal, fontSize: '8px', fontFamily: f.mono, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                      letterSpacing: '0.04em', transition: `all 0.2s ${ease.smooth}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${c.teal}25`; e.currentTarget.style.borderColor = c.teal }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${c.teal}12`; e.currentTarget.style.borderColor = `${c.teal}40` }}>
                      <Icon d="M13 10V3L4 14h7v7l9-11h-7z" size={10} color={c.teal} /> N8N
                    </button>
                    <span style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono }}>{shop.products_synced || 0} prod.</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── RIGHT: SHOP DETAIL ── */}
      {selectedShop && (
        <div className="admin-scroll admin-detail" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
          {/* Detail header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4] }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[1] }}>
                <div style={{
                  width: 48, height: 48,
                  background: `${c.gold}15`, border: `2px solid ${c.gold}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold,
                }}>{(selectedShop?.name || '?')[0].toUpperCase()}</div>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>{selectedShop.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginTop: '4px' }}>
                    <span style={{
                      padding: '3px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                      color: statusColors[selectedShop.status], background: `${statusColors[selectedShop.status]}15`,
                      border: `1px solid ${statusColors[selectedShop.status]}33`, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{statusLabels[selectedShop.status] || selectedShop.status}</span>
                    <span style={{ padding: '3px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 600, color: c.gold, background: `${c.gold}12`, border: `1px solid ${c.gold}25` }}>
                      {platformLabels[selectedShop.platform] || selectedShop.platform}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: sp[1] }}>
              <button onClick={() => {
                setEditingShop(selectedShop)
                setShopForm({
                  name: selectedShop.name || '', platform: selectedShop.platform || 'shopify',
                  domain: selectedShop.domain || '', template: selectedShop.template || 'classic',
                  notes: selectedShop.notes || '', client_id: selectedShop.client_id || '',
                  logo_url: selectedShop.logo_url || '', products_synced: selectedShop.products_synced || 0,
                  monthly_orders: selectedShop.monthly_orders || 0, monthly_revenue: selectedShop.monthly_revenue || 0,
                })
                setShowShopModal(true)
              }} style={{
                padding: `8px ${sp[3]}`, background: c.gold, color: c.bg, border: 'none',
                fontFamily: f.body, fontSize: size.xs, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <Icon d={icons.edit} size={13} color={c.bg} /> Modifier
              </button>
              <button onClick={() => setSelectedShopId(null)} style={{
                padding: '8px', background: 'transparent', border: `1px solid ${c.border}`,
                color: c.textTertiary, cursor: 'pointer',
              }}>
                <Icon d={icons.close} size={14} />
              </button>
            </div>
          </div>

          {/* Setup progress */}
          <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Progression</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {setupSteps.map((step, i) => {
                const currentIdx = getStepIndex(selectedShop.status)
                const isPaused = selectedShop.status === 'paused' || selectedShop.status === 'archived'
                const isCompleted = !isPaused && i <= currentIdx
                const isCurrent = !isPaused && i === currentIdx
                return (
                  <div key={step.key} style={{ flex: 1, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 28, height: 28, flexShrink: 0,
                        background: isCompleted ? (isCurrent ? c.gold : `${c.gold}30`) : c.bgElevated,
                        border: `2px solid ${isCompleted ? c.gold : c.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: f.mono, fontSize: '10px', fontWeight: 700,
                        color: isCompleted ? (isCurrent ? c.bg : c.gold) : c.textTertiary,
                        transition: 'all 0.3s ease',
                      }}>
                        {isCompleted && !isCurrent ? '✓' : i + 1}
                      </div>
                      {i < setupSteps.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: isCompleted && i < currentIdx ? c.gold : c.border, margin: '0 4px', transition: 'background 0.3s ease' }} />
                      )}
                    </div>
                    <div style={{ marginTop: '6px', paddingInlineEnd: sp[2] }}>
                      <div style={{ fontSize: '10px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? c.gold : c.textSecondary }}>{step.label}</div>
                      <div style={{ fontSize: '8px', color: c.textTertiary, marginTop: '1px' }}>{step.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {(selectedShop.status === 'paused' || selectedShop.status === 'archived') && (
              <div style={{ marginTop: sp[2], padding: `${sp[1]} ${sp[2]}`, background: `${c.red}10`, border: `1px solid ${c.red}25`, fontSize: '10px', color: c.red, fontWeight: 600 }}>
                Boutique {selectedShop.status === 'paused' ? 'en pause' : 'archivée'}
              </div>
            )}
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[2], marginBottom: sp[3] }}>
            {[
              { label: 'Produits', value: selectedShop.products_synced || 0, color: c.teal, icon: '📦' },
              { label: 'Commandes/mois', value: selectedShop.monthly_orders || 0, color: c.blue, icon: '🛒' },
              { label: 'Revenus/mois', value: fmtMoney(selectedShop.monthly_revenue || 0), color: c.green, icon: '💰' },
              { label: 'Template', value: templateLabels[selectedShop.template] || selectedShop.template || '—', color: c.gold, icon: '🎨' },
            ].map((kpi, i) => (
              <div key={i} style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>{kpi.icon}</div>
                <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3], marginBottom: sp[3] }}>
            {/* Client info */}
            <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Client</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                <div style={{
                  width: 40, height: 40,
                  background: `${c.gold}12`, border: `1.5px solid ${c.gold}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold,
                }}>{(selectedShopClient?.full_name || selectedShopClient?.email || '?')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{selectedShopClient?.full_name || '—'}</div>
                  <div style={{ fontSize: size.xs, color: c.textTertiary }}>{selectedShopClient?.email || '—'}</div>
                  {selectedShopClient?.company && <div style={{ fontSize: '10px', color: c.textSecondary, marginTop: '2px' }}>{selectedShopClient.company}</div>}
                </div>
              </div>
            </div>

            {/* Tech info */}
            <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Configuration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                  <span style={{ color: c.textTertiary }}>Plateforme</span>
                  <span style={{ color: c.gold, fontWeight: 600 }}>{platformLabels[selectedShop.platform] || selectedShop.platform}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                  <span style={{ color: c.textTertiary }}>Template</span>
                  <span style={{ color: c.text }}>{templateLabels[selectedShop.template] || selectedShop.template || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                  <span style={{ color: c.textTertiary }}>Domaine</span>
                  {selectedShop.domain ? (
                    <span style={{ color: c.teal, fontWeight: 500, cursor: 'pointer' }} onClick={() => window.open(`https://${selectedShop.domain}`, '_blank')}>{selectedShop.domain} ↗</span>
                  ) : (
                    <span style={{ color: c.textTertiary, fontStyle: 'italic' }}>Non configuré</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                  <span style={{ color: c.textTertiary }}>Créée le</span>
                  <span style={{ color: c.text }}>{selectedShop.created_at ? new Date(selectedShop.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                  <span style={{ color: c.textTertiary }}>Mise à jour</span>
                  <span style={{ color: c.text }}>{selectedShop.updated_at ? fmtDate(selectedShop.updated_at) : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme config preview */}
          {selectedShop.theme_config && typeof selectedShop.theme_config === 'object' && Object.keys(selectedShop.theme_config).length > 0 && (
            <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Thème</div>
              <div style={{ display: 'flex', gap: sp[3], flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedShop.theme_config.primary_color && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <div style={{ width: 20, height: 20, background: selectedShop.theme_config.primary_color, border: `1px solid ${c.border}` }} />
                    <span style={{ fontSize: size.xs, color: c.textSecondary }}>Primaire</span>
                  </div>
                )}
                {selectedShop.theme_config.secondary_color && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <div style={{ width: 20, height: 20, background: selectedShop.theme_config.secondary_color, border: `1px solid ${c.border}` }} />
                    <span style={{ fontSize: size.xs, color: c.textSecondary }}>Secondaire</span>
                  </div>
                )}
                {selectedShop.theme_config.font && (
                  <span style={{ fontSize: size.xs, color: c.textSecondary }}>Police : <span style={{ fontWeight: 600, color: c.text }}>{selectedShop.theme_config.font}</span></span>
                )}
                {selectedShop.theme_config.style && (
                  <span style={{ padding: '3px 8px', fontSize: '9px', fontFamily: f.mono, color: c.gold, background: `${c.gold}12`, border: `1px solid ${c.gold}25`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{selectedShop.theme_config.style}</span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedShop.notes && (
            <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Notes internes</div>
              <p style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{selectedShop.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2] }}>
            {selectedShop.domain && (
              <button onClick={() => window.open(`https://${selectedShop.domain}`, '_blank')} style={{
                padding: `8px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.teal}40`,
                color: c.teal, fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <Icon d={icons.link} size={13} color={c.teal} /> Visiter le site
              </button>
            )}
            <button onClick={async () => {
              setShopCreationLoading(true)
              try {
                const clientData = allProfiles.find(p => p.id === selectedShop.client_id)
                const shopData = { ...selectedShop, client: clientData }
                const response = await fetch(`${N8N_WEBHOOK_URL}/create-shop`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(shopData),
                })
                if (response.ok) {
                  toast.success(t('toast.shopCreationStartedN8N'))
                } else {
                  toast.error(t('toast.shopN8NCallError'))
                }
              } catch (err) {
                toast.error(tToast('genericError', { error: err.message }))
              } finally {
                setShopCreationLoading(false)
              }
            }} disabled={shopCreationLoading} style={{
              padding: `8px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.teal}40`,
              color: c.teal, fontSize: size.xs, fontWeight: 600, cursor: shopCreationLoading ? 'not-allowed' : 'pointer', fontFamily: f.body,
              display: 'flex', alignItems: 'center', gap: '4px', opacity: shopCreationLoading ? 0.6 : 1,
            }}>
              <Icon d="M13 10V3L4 14h7v7l9-11h-7z" size={13} color={c.teal} /> {shopCreationLoading ? 'Lancement...' : 'Créer N8N'}
            </button>
            <button onClick={async () => {
              setConfirmDialog({
                open: true,
                title: 'Supprimer',
                message: 'Supprimer cette boutique ?',
                onConfirm: async () => {
                  try { await deleteShop(selectedShop.id); setSelectedShopId(null); await loadAll(); toast.success(t('toast.shopDeleted')) }
                  catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                }
              })
              return
            }} style={{
              padding: `8px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.red}33`,
              color: c.red, fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Icon d={icons.trash} size={13} color={c.red} /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>

    {/* ── BOUTIQUE MODAL ── */}
    {showShopModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      }} onClick={() => setShowShopModal(false)}>
        <div style={{
          background: c.bgCard, border: `1px solid ${c.borderLight}`, padding: sp[4],
          maxWidth: '520px', width: '90%', maxHeight: '85vh', overflowY: 'auto', borderRadius: radius.sm, boxShadow: shadow.xs,
        }} onClick={e => e.stopPropagation()} className="admin-scroll">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700 }}>
              {editingShop ? 'Modifier la boutique' : 'Nouvelle boutique'}
            </h2>
            <button onClick={() => setShowShopModal(false)} style={{ background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer' }}>
              <Icon d={icons.close} size={16} />
            </button>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!shopForm.name.trim() || !shopForm.client_id) { toast.error(t('toast.shopRequired')); return }
            try {
              if (editingShop) {
                await updateShop(editingShop.id, shopForm)
                toast.success(t('toast.shopUpdated'))
              } else {
                await createShop(shopForm)
                toast.success(t('toast.shopCreated'))
              }
              setShowShopModal(false)
              await loadAll()
            } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
          }} style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>

            <div>
              <label style={labelStyle}>Client *</label>
              <select value={shopForm.client_id} onChange={e => setShopForm({...shopForm, client_id: e.target.value})} style={inputStyle}>
                <option value="">Sélectionner un client</option>
                {allProfiles.filter(p => p.role !== 'admin').map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Nom de la boutique *</label>
              <input type="text" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})}
                placeholder="Ex: La Boutique de Fatima" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
              <div>
                <label style={labelStyle}>Plateforme</label>
                <select value={shopForm.platform} onChange={e => setShopForm({...shopForm, platform: e.target.value})} style={inputStyle}>
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="prestashop">PrestaShop</option>
                  <option value="custom">Sur mesure</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Template</label>
                <select value={shopForm.template} onChange={e => setShopForm({...shopForm, template: e.target.value})} style={inputStyle}>
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="editorial">Éditorial</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Domaine</label>
              <input type="text" value={shopForm.domain} onChange={e => setShopForm({...shopForm, domain: e.target.value})}
                placeholder="maboutique.myshopify.com" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
            </div>

            {editingShop && (
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={editingShop.status} onChange={async (e) => {
                  try {
                    await updateShop(editingShop.id, { status: e.target.value })
                    setEditingShop({ ...editingShop, status: e.target.value })
                    toast.success(t('toast.statusUpdated'))
                    await loadAll()
                  } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                }} style={inputStyle}>
                  <option value="draft">Brouillon</option>
                  <option value="building">En construction</option>
                  <option value="review">En revue client</option>
                  <option value="active">Active</option>
                  <option value="paused">En pause</option>
                  <option value="archived">Archivée</option>
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>URL du logo</label>
              <input type="text" value={shopForm.logo_url} onChange={e => setShopForm({...shopForm, logo_url: e.target.value})}
                placeholder="https://..." style={inputStyle}
                onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
              <div>
                <label style={labelStyle}>Produits sync.</label>
                <input type="number" min="0" value={shopForm.products_synced} onChange={e => setShopForm({...shopForm, products_synced: parseInt(e.target.value) || 0})}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Cmd/mois</label>
                <input type="number" min="0" value={shopForm.monthly_orders} onChange={e => setShopForm({...shopForm, monthly_orders: parseInt(e.target.value) || 0})}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Revenu/mois (€)</label>
                <input type="number" min="0" step="0.01" value={shopForm.monthly_revenue} onChange={e => setShopForm({...shopForm, monthly_revenue: parseFloat(e.target.value) || 0})}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={shopForm.notes} onChange={e => setShopForm({...shopForm, notes: e.target.value})}
                placeholder="Notes internes..." style={{ ...inputStyle, minHeight: 60, fontFamily: f.body }}
                onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
              {editingShop && (
                <button type="button" onClick={async () => {
                  setConfirmDialog({
                    open: true,
                    title: 'Supprimer',
                    message: 'Supprimer cette boutique ?',
                    onConfirm: async () => {
                      try { await deleteShop(editingShop.id); setShowShopModal(false); await loadAll(); toast.success(t('toast.shopDeleted')) }
                      catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                    }
                  })
                  return
                }} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                  border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Supprimer</button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowShopModal(false)} style={{
                padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
              }}>Annuler</button>
              <button type="submit" style={{
                padding: `10px ${sp[3]}`, background: c.gold, color: c.bg,
                border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
              }}>{editingShop ? 'Sauvegarder' : 'Créer la boutique'}</button>
              {!editingShop && (
                <button type="button" onClick={async () => {
                  if (!shopForm.name.trim() || !shopForm.client_id) { toast.error(t('toast.shopRequired')); return }
                  try {
                    const newShop = await createShop(shopForm)
                    toast.success(t('toast.shopCreated'))
                    // Lancer N8N automatiquement
                    setShopCreationLoading(true)
                    const clientData = allProfiles.find(p => p.id === shopForm.client_id)
                    await fetch(`${N8N_WEBHOOK_URL}/create-shop`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...newShop, ...shopForm, client: clientData }),
                    })
                    toast.success(t('toast.shopCreationN8N'))
                    setShopCreationLoading(false)
                    setShowShopModal(false)
                    await loadAll()
                  } catch (err) { setShopCreationLoading(false); toast.error(tToast('genericError', { error: err.message })) }
                }} disabled={shopCreationLoading} style={{
                  padding: `10px ${sp[3]}`, background: c.teal, color: c.bg,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: shopCreationLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: shopCreationLoading ? 0.6 : 1,
                }}>
                  <Icon d="M13 10V3L4 14h7v7l9-11h-7z" size={14} color={c.bg} />
                  {shopCreationLoading ? 'Lancement...' : 'Créer + N8N'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
