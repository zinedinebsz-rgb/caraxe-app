/* ── CARAXES Admin — Overview Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, DragonMark, ArtDecoDivider, MiniSparkline, fmtDate, fmtMoney, parseBudget } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius, STATUSES } from '../../lib/theme'
import { VERIFIED_SUPPLIERS } from '../../lib/catalogsByProfile'
import { FORMATION_INTERNE, FORMATION_CLIENT } from '../../lib/formationData'
import { exportFullBackupJSON, exportBackupCSVs } from '../../lib/backup'
import StatusPill from '../../components/StatusPill'

/* ── DecoPattern (stub) ── */
const DecoPattern = () => null

/* ── DragonEmptyState ── */
const DragonEmptyState = ({ title, subtitle, action, actionLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: sp[6], gap: sp[2], textAlign: 'center', animation: 'cardReveal 0.4s ease', minHeight: 220 }}>
    <DragonMark s={28} />
    <h4 style={{ fontFamily: f.display, fontSize: size.base, marginBottom: 0, fontWeight: 600, color: c.text, letterSpacing: '0.04em' }}>{title}</h4>
    {subtitle && <p style={{ fontFamily: f.body, fontSize: size.xs, color: c.textTertiary, margin: 0, letterSpacing: '0.01em', maxWidth: '30ch', lineHeight: 1.5 }}>{subtitle}</p>}
    {action && (
      <button onClick={action} style={{
        marginTop: sp[1], padding: `${sp[1.5]} ${sp[4]}`, background: 'transparent',
        border: `1px solid ${c.gold}`, color: c.gold, fontFamily: f.mono, fontSize: '10px',
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
        transition: `all 0.3s ${ease.luxury}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = c.gold; e.currentTarget.style.color = c.bg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.gold }}>
        {actionLabel || 'INITIER ACTION'}
      </button>
    )}
  </div>
)

export default function OverviewTab() {
  const {
    orders, clients, allProfiles, shipments, inventory, products, shops, ecomServices, leads,
    mainTab, setMainTab, activeOrders, deliveredOrders, clientName,
    user, profile, t, tToast, toast, categories,
  } = useAdmin()

  /* ── Local state: CA widget month/year ── */
  const [caMonth, setCaMonth] = useState(new Date().getMonth())
  const [caYear, setCaYear] = useState(new Date().getFullYear())

  /* ── Helpers ── */
  const SHIP_STATUSES = ['production', 'QC', 'douanes', 'transit', 'livré']
  const normalizeShipStatus = (s) => typeof s === 'number' ? (SHIP_STATUSES[s] || 'production') : (s || 'production')

  /* ── Derived data ── */
  const shipmentsInTransit = shipments.filter(s => normalizeShipStatus(s.status) === 'transit')
  const shipmentsWaiting = shipments.filter(s => { const st = normalizeShipStatus(s.status); return st === 'production' || st === 'QC' || st === 'douanes' })
  const lowStockItems = inventory.filter(item => (item.quantity || 0) <= (item.alert_threshold || 0))
  const ecomClients = allProfiles.filter(p => p.client_tier === 'ecommerce')
  const stockClients = allProfiles.filter(p => (p.services_enabled || []).includes('stock'))
  const logisticsClients = allProfiles.filter(p => (p.services_enabled || []).includes('logistics'))
  const grossistes = allProfiles.filter(p => p.client_tier === 'grossiste')
  const detaillants = allProfiles.filter(p => p.client_tier === 'detaillant')
  const proClients = allProfiles.filter(p => p.client_tier === 'pro')
  const starterClients = allProfiles.filter(p => p.client_tier === 'starter')
  const thisMonth = orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth() && new Date(o.created_at).getFullYear() === new Date().getFullYear())
  const stockValue = inventory.reduce((acc, item) => acc + ((item.unit_price || 0) * (item.quantity || 0)), 0)
  const totalQty = inventory.reduce((acc, item) => acc + (item.quantity || 0), 0)
  // Note: messages/unreadMsgs not available from context for overview — using 0 as fallback
  const unreadMsgs = 0

  return (
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
      {/* Welcome + Backup */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: sp[5], marginBottom: sp[4], marginInlineStart: `-${sp[4]}`, marginInlineEnd: `-${sp[4]}`, marginTop: `-${sp[4]}`, background: `${c.bgCard}`, border: `1px solid ${c.borderSubtle}` }}>
        <DecoPattern color={c.gold} opacity={0.05} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gold, opacity: 0.4 }} />
        <div style={{ position: 'absolute', top: 16, right: 24, width: 40, height: 40, border: `1px solid ${c.gold}18`, transform: 'rotate(45deg)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, marginBottom: sp[1], letterSpacing: '-0.02em' }}>
              Bienvenue, {profile?.full_name?.split(' ')[0]}
            </h1>
            <p style={{ fontFamily: f.body, fontSize: size.sm, color: c.textSecondary }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: sp[1] }}>
          <button onClick={async () => {
            toast.success(t('toast.exportJSONInProgress'))
            try { const s = await exportFullBackupJSON(); toast.success(tToast('exportJSONSuccess', { clients: s.total_clients, orders: s.total_orders })) }
            catch (e) { toast.error(t('toast.exportJSONError')) }
          }} style={{
            padding: `8px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.gold}`,
            color: c.gold, fontFamily: f.mono, fontSize: '9px', fontWeight: 700,
            cursor: 'pointer', transition: `all 0.3s ${ease.luxury}`,
            letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.gold; e.currentTarget.style.color = c.bg; e.currentTarget.style.boxShadow = shadow.gold }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.gold; e.currentTarget.style.boxShadow = 'none' }}>
            <Icon d={icons.download} size={12} /> Backup JSON
          </button>
          <button onClick={async () => {
            toast.success(t('toast.exportCSVInProgress'))
            try { const s = await exportBackupCSVs(); toast.success(tToast('exportCSVSuccess', { clients: s.total_clients, orders: s.total_orders })) }
            catch (e) { toast.error(t('toast.exportCSVError')) }
          }} style={{
            padding: `8px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
            color: c.textTertiary, fontFamily: f.mono, fontSize: '9px', fontWeight: 600,
            cursor: 'pointer', transition: `all 0.3s ${ease.luxury}`,
            letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textTertiary }}>
            <Icon d={icons.download} size={12} /> CSV
          </button>
          </div>
        </div>
      </div>

      {/* ── ALERTES URGENTES ── */}
      {(lowStockItems.length > 0 || unreadMsgs > 0 || shipmentsWaiting.length > 0) && (
        <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[4], flexWrap: 'wrap' }}>
          {lowStockItems.length > 0 && (
            <div onClick={() => setMainTab('stock')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('stock') } }} style={{
              padding: `${sp[2]} ${sp[3]}`, background: `${c.red}10`, borderInlineStart: `3px solid ${c.red}`,
              display: 'flex', alignItems: 'center', gap: sp[2], cursor: 'pointer',
            }}>
              <span style={{ fontSize: '16px', color: c.gold, fontFamily: f.display }}>◆</span>
              <span style={{ fontSize: size.xs, color: c.red, fontWeight: 600, fontFamily: f.mono }}>{lowStockItems.length} alerte{lowStockItems.length > 1 ? 's' : ''} stock bas</span>
            </div>
          )}
          {unreadMsgs > 0 && (
            <div style={{
              padding: `${sp[2]} ${sp[3]}`, background: `${c.gold}10`, border: `1px solid ${c.gold}30`,
              display: 'flex', alignItems: 'center', gap: sp[2],
            }}>
              <Icon d={icons.msg} size={14} color={c.gold} />
              <span style={{ fontSize: size.xs, color: c.gold, fontWeight: 600 }}>{unreadMsgs} message{unreadMsgs > 1 ? 's' : ''} non lu{unreadMsgs > 1 ? 's' : ''}</span>
            </div>
          )}
          {shipmentsWaiting.length > 0 && (
            <div onClick={() => setMainTab('expedition')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('expedition') } }} style={{
              padding: `${sp[2]} ${sp[3]}`, background: `${c.teal}10`, border: `1px solid ${c.teal}30`,
              display: 'flex', alignItems: 'center', gap: sp[2], cursor: 'pointer',
            }}>
              <Icon d={icons.send} size={14} color={c.teal} />
              <span style={{ fontSize: size.xs, color: c.teal, fontWeight: 600 }}>{shipmentsWaiting.length} envoi{shipmentsWaiting.length > 1 ? 's' : ''} en attente</span>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIONS RAPIDES — Compact Command Style ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[4] }}>
        <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))} style={{
          padding: `10px ${sp[3]}`, background: c.bgCard, border: `1px solid ${c.borderSubtle}`,
          color: c.textTertiary, fontSize: '12px', fontFamily: f.body,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp[2],
          transition: `all 0.2s ${ease.luxury}`, flex: 1, maxWidth: 400,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = c.goldMuted; e.currentTarget.style.color = c.text }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.color = c.textTertiary }}>
          <Icon d={icons.search} size={14} color={c.goldMuted} />
          <span>Actions rapides...</span>
          <span style={{ marginInlineStart: 'auto', fontFamily: f.mono, fontSize: '9px', border: `1px solid ${c.borderSubtle}`, padding: '1px 6px', color: c.goldMuted }}>⌘K</span>
        </button>
        {/* Quick shortcut buttons */}
        {[
          { label: 'Commande', icon: icons.file, color: c.red, action: () => { setMainTab('commandes') } },
          { label: 'Client', icon: icons.users, color: c.gold, action: () => setMainTab('clients') },
          { label: 'Boutique', icon: icons.link, color: c.teal, action: () => setMainTab('boutiques') },
          { label: 'Service', icon: icons.shield, color: c.amber || c.gold, action: () => setMainTab('services') },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            padding: `8px ${sp[2]}`, background: 'transparent',
            border: `1px solid ${btn.color}25`, color: btn.color,
            fontSize: '10px', fontFamily: f.mono, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            letterSpacing: '0.04em', transition: `all 0.2s ${ease.luxury}`, whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${btn.color}10`; e.currentTarget.style.borderColor = btn.color }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${btn.color}25` }}>
            <span style={{ fontSize: '10px' }}>+</span> {btn.label}
          </button>
        ))}
      </div>

      {/* ── STATS PRINCIPALES — Dual Tier + Sparklines ── */}
      {(() => {
          const lastMonth = orders.filter(o => { const d = new Date(o.created_at); const lm = new Date(); lm.setMonth(lm.getMonth() - 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() })
          const trendClients = allProfiles.filter(p => { const d = new Date(p.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length
          const primaryStats = [
            { label: 'Clients', value: allProfiles.length, color: c.gold, sub: `${grossistes.length} grossistes · ${detaillants.length} détaillants · ${ecomClients.length} e-com${proClients.length > 0 ? ` · ${proClients.length} pro/BTP` : ''}${starterClients.length > 0 ? ` · ${starterClients.length} starter` : ''}`, click: () => setMainTab('clients'), trend: trendClients > 0 ? `+${trendClients}` : null, trendUp: true, sparkline: [3, 5, 8, 6, 10, 12, allProfiles.length] },
            { label: 'Commandes', value: orders.length, color: c.red, sub: `${activeOrders} en cours · ${deliveredOrders} livrées`, click: () => setMainTab('commandes'), trend: thisMonth.length > 0 ? `+${thisMonth.length} ce mois` : null, trendUp: thisMonth.length >= lastMonth.length, sparkline: [1, 2, 1, 3, 2, 4, orders.length] },
            { label: 'Ce mois', value: thisMonth.length, color: c.blue || c.teal, sub: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), click: () => setMainTab('commandes'), trend: lastMonth.length > 0 ? `vs ${lastMonth.length} préc.` : null, trendUp: thisMonth.length >= lastMonth.length, sparkline: [0, 1, 2, 1, 3, 2, thisMonth.length] },
          ]
          const secondaryStats = [
            { label: 'Expéditions', value: shipments.length, color: c.teal, sub: `${shipmentsInTransit.length} transit · ${shipmentsWaiting.length} attente`, click: () => setMainTab('expedition'), trend: shipmentsInTransit.length > 0 ? `${shipmentsInTransit.length} actives` : null, trendUp: true },
            { label: 'Stock', value: inventory.length, color: c.purple, sub: `${totalQty} unités · ${lowStockItems.length} alertes`, click: () => setMainTab('stock'), trend: lowStockItems.length > 0 ? `⚠ ${lowStockItems.length} bas` : '✓ OK', trendUp: lowStockItems.length === 0, alert: lowStockItems.length > 0 },
            { label: 'Boutiques', value: shops.length, color: c.gold, sub: `${shops.filter(s => s.status === 'active').length} actives`, click: () => setMainTab('boutiques') },
            { label: 'Fournisseurs', value: VERIFIED_SUPPLIERS.length, color: c.teal, sub: [...new Set(VERIFIED_SUPPLIERS.map(s => s.category))].length + ' cat.', click: () => setMainTab('fournisseurs') },
            { label: 'Formation', value: FORMATION_INTERNE.modules.length + FORMATION_CLIENT.modules.length, color: c.purple, sub: `${FORMATION_INTERNE.modules.reduce((a, m) => a + m.lessons.length, 0) + FORMATION_CLIENT.modules.reduce((a, m) => a + m.lessons.length, 0)} leçons`, click: () => setMainTab('formation') },
            { label: 'Véhicules', value: orders.filter(o => o.notes?.toLowerCase()?.includes('véhicule') || o.product?.toLowerCase()?.includes('véhicule')).length, color: c.red, sub: 'Export Afrique', click: () => setMainTab('vehicules') },
          ]
          return (
            <>
            {/* Primary KPI cards — large */}
            <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp[3], marginBottom: sp[3] }}>
              {primaryStats.map((stat, i) => (
                <div key={i} onClick={stat.click} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stat.click() } }} style={{
                  padding: sp[4], background: `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`, border: `1px solid ${c.borderSubtle}`,
                  borderRadius: radius.md, position: 'relative', overflow: 'hidden', cursor: 'pointer',
                  boxShadow: shadow.card, animation: `cardReveal 0.5s ${ease.smooth} ${0.05 * i}s backwards`,
                  transition: `all 0.35s ${ease.luxury}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = stat.color + '40'; e.currentTarget.style.boxShadow = shadow.cardHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.boxShadow = shadow.card; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.color, opacity: 0.5 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[2] }}>
                    <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{stat.label}</div>
                    {stat.trend && (
                      <div style={{ fontSize: '9px', fontFamily: f.mono, fontWeight: 700, color: stat.trendUp ? c.green : c.textTertiary, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '10px' }}>{stat.trendUp ? '↑' : '↓'}</span>{stat.trend}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono, marginTop: sp[1.5], letterSpacing: '0.02em' }}>{stat.sub}</div>
                    </div>
                    {stat.sparkline && <MiniSparkline data={stat.sparkline} color={stat.color} w={64} h={24} />}
                  </div>
                </div>
              ))}
            </div>
            {/* Secondary KPI cards — compact */}
            <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: sp[2], marginBottom: sp[4] }}>
              {secondaryStats.map((stat, i) => (
                <div key={i} onClick={stat.click} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stat.click() } }} style={{
                  padding: `${sp[2]} ${sp[3]}`, background: c.bgCard, border: `1px solid ${stat.alert ? `${c.red}30` : c.borderSubtle}`,
                  borderRadius: radius.sm, position: 'relative', overflow: 'hidden', cursor: 'pointer',
                  boxShadow: shadow.xs, animation: `cardReveal 0.5s ${ease.smooth} ${0.08 * i}s backwards`,
                  transition: `all 0.25s ${ease.luxury}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = stat.color + '35' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = stat.alert ? `${c.red}30` : c.borderSubtle }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: stat.color }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    </div>
                    {stat.trend && (
                      <div style={{ fontSize: '8px', fontFamily: f.mono, fontWeight: 700, color: stat.alert ? c.red : stat.trendUp ? c.green : c.textTertiary }}>
                        {stat.trend}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '8px', color: c.textTertiary, fontFamily: f.mono, marginTop: 4 }}>{stat.sub}</div>
                </div>
              ))}
            </div>
            </>
          )
      })()}

      {/* ── CA DU MOIS ── */}
      {(() => {
        const caOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at)
          return orderDate.getMonth() === caMonth && orderDate.getFullYear() === caYear
        })
        const prevMonth = caMonth === 0 ? 11 : caMonth - 1
        const prevYear = caMonth === 0 ? caYear - 1 : caYear
        const prevMonthOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at)
          return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear
        })
        const totalCA = caOrders.reduce((sum, o) => sum + parseBudget(o.budget), 0)
        const prevCA = prevMonthOrders.reduce((sum, o) => sum + parseBudget(o.budget), 0)
        const caDiff = prevCA === 0 ? 0 : ((totalCA - prevCA) / prevCA * 100)
        const avgOrderValue = caOrders.length > 0 ? totalCA / caOrders.length : 0
        const monthName = new Date(caYear, caMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

        return (
          <div style={{ marginBottom: sp[4], padding: sp[4], background: `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`, border: `1px solid ${c.border}`, borderRadius: radius.md, boxShadow: shadow.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
              <div>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 600, letterSpacing: '-0.01em' }}>Chiffre d'affaires</h3>
                <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono, marginTop: '2px', letterSpacing: '0.04em' }}>CA par mois</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                <button onClick={() => { setCaMonth(caMonth === 0 ? 11 : caMonth - 1); setCaYear(caMonth === 0 ? caYear - 1 : caYear) }} style={{ background: 'transparent', border: `1px solid ${c.border}`, padding: '6px 10px', cursor: 'pointer', fontSize: size.xs, color: c.textSecondary, fontFamily: f.mono }}>←</button>
                <span style={{ minWidth: 140, textAlign: 'center', fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: c.gold, textTransform: 'capitalize' }}>{monthName}</span>
                <button onClick={() => { setCaMonth(caMonth === 11 ? 0 : caMonth + 1); setCaYear(caMonth === 11 ? caYear + 1 : caYear) }} style={{ background: 'transparent', border: `1px solid ${c.border}`, padding: '6px 10px', cursor: 'pointer', fontSize: size.xs, color: c.textSecondary, fontFamily: f.mono }}>→</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[2] }}>
              <div style={{ padding: sp[3], background: c.bg, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.gold}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>CA Total</div>
                <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.gold, lineHeight: 1 }}>{fmtMoney(totalCA)}</div>
              </div>
              <div style={{ padding: sp[3], background: c.bg, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.red}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>Commandes</div>
                <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.red, lineHeight: 1 }}>{caOrders.length}</div>
              </div>
              <div style={{ padding: sp[3], background: c.bg, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${c.teal}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>Panier moyen</div>
                <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.teal, lineHeight: 1 }}>{fmtMoney(avgOrderValue)}</div>
              </div>
              <div style={{ padding: sp[3], background: c.bg, border: `1px solid ${c.borderSubtle}`, borderTop: `2px solid ${caDiff >= 0 ? c.green : c.red}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>vs mois dernier</div>
                <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: caDiff >= 0 ? c.green : c.red, lineHeight: 1 }}>{caDiff >= 0 ? '+' : ''}{caDiff.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── CLIENTS PAR SERVICE ── */}
      <div className="admin-service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[3], marginBottom: sp[4] }}>
        {[
          { label: 'Sourcing', desc: 'Recherche fournisseurs & négociation', count: allProfiles.length, iconD: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: c.red, note: 'Inclus pour tous' },
          { label: 'Expédition', desc: 'Logistique Chine → France', count: logisticsClients.length, iconD: 'M5 12h14M12 5l7 7-7 7', color: c.teal, note: `${logisticsClients.length} actif${logisticsClients.length > 1 ? 's' : ''}` },
          { label: 'Stock', desc: 'Entrepôt Chine + inventaire', count: stockClients.length, iconD: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', color: c.purple, note: `${inventory.length} réf.` },
          { label: 'Boutiques', desc: 'E-commerce clé en main', count: shops.length, iconD: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', color: c.gold, note: `${shops.filter(s => s.status === 'active').length} active${shops.filter(s => s.status === 'active').length > 1 ? 's' : ''}`, click: () => setMainTab('boutiques') },
        ].map((svc, i) => (
          <div key={i} style={{
            padding: sp[3], background: `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`, border: `1px solid ${c.borderSubtle}`,
            borderRadius: radius.md, position: 'relative', overflow: 'hidden', animation: `cardReveal 0.5s ${ease.smooth} ${0.05 * i}s backwards`,
            boxShadow: shadow.card, transition: `all 0.35s ${ease.luxury}`,
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: svc.color }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderTop: `2px solid ${c.gold}`, borderInlineStart: `2px solid ${c.gold}`, opacity: 0.35 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[1] }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={svc.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={svc.iconD}/></svg>
              <span style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: svc.color }}>{svc.label}</span>
            </div>
            <p style={{ fontSize: '10px', color: c.textSecondary, lineHeight: 1.4, margin: 0, marginBottom: sp[2] }}>{svc.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: sp[1], borderTop: `1px solid ${c.borderSubtle}` }}>
              <span style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: svc.color }}>{svc.count}</span>
              <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{svc.note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── PIPELINE ── */}
      <div style={{ marginBottom: sp[4], padding: sp[4], background: `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`, border: `1px solid ${c.border}`, borderRadius: radius.md, boxShadow: shadow.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
          <div>
            <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 600, letterSpacing: '-0.01em' }}>Pipeline Commandes</h3>
            <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono, marginTop: '2px', letterSpacing: '0.04em' }}>Répartition par statut</div>
          </div>
          <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.gold }}>{orders.length}</div>
        </div>
        <div style={{ display: 'flex', gap: '1px', height: '28px', overflow: 'hidden', marginBottom: sp[3] }}>
          {STATUSES.map((st, i) => {
            const count = orders.filter(o => o.status === i).length
            const percent = orders.length > 0 ? (count / orders.length) * 100 : 0
            return (
              <div key={i} style={{
                flex: percent || 0, background: st.color, minWidth: count > 0 ? '3px' : 0,
                position: 'relative', cursor: 'pointer',
                transition: `all 0.4s ${ease.out}`,
                opacity: count > 0 ? 1 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} title={`${st.label}: ${count}`}>
                {percent > 10 && <span style={{ fontSize: '10px', fontFamily: f.mono, fontWeight: 700, color: c.bg, letterSpacing: '0.02em' }}>{count}</span>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${sp[2]} ${sp[3]}` }}>
          {STATUSES.map((st, i) => {
            const count = orders.filter(o => o.status === i).length
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 7, height: 7, background: st.color, flexShrink: 0, transform: 'rotate(45deg)' }} />
                <span style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary, letterSpacing: '0.02em' }}>{st.label}</span>
                <span style={{ fontSize: '10px', fontFamily: f.mono, color: st.color, fontWeight: 700 }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── EXPÉDITIONS ACTIVES + STOCK E-COM (2 colonnes) ── */}
      <div className="admin-overview-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3], marginBottom: sp[4] }}>

        {/* Expéditions liées aux commandes */}
        <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderRadius: radius.sm, boxShadow: shadow.xs, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.teal, opacity: 0.6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
              <Icon d={icons.send} size={16} color={c.teal} />
              <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Expéditions</span>
            </div>
            <button onClick={() => setMainTab('expedition')} style={{
              padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
              color: c.teal, fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
              cursor: 'pointer',
            }}>
              Voir tout →
            </button>
          </div>
          <p style={{ fontSize: '10px', color: c.textTertiary, marginBottom: sp[2], lineHeight: 1.4 }}>
            Envois liés aux commandes en cours — suivi logistique Chine → France
          </p>
          {shipments.length === 0 ? (
            <div style={{ padding: sp[3], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
              Aucun envoi — créez un envoi depuis l'onglet Expédition
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {shipments.slice(0, 5).map((s, i) => (
                <div key={s.id || i} onClick={() => setMainTab('expedition')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('expedition') } }} style={{
                  padding: `${sp[1]} ${sp[2]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: c.bgElevated, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.teal, fontWeight: 600 }}>{s.tracking_number || '—'}</span>
                    <span style={{ fontSize: size.xs, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName(s.client_id)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{s.method || ''}</span>
                    <span style={{
                      padding: '2px 6px', fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
                      background: normalizeShipStatus(s.status) === 'livré' ? `${c.green}15` : normalizeShipStatus(s.status) === 'transit' ? `${c.gold}15` : `${c.red}15`,
                      color: normalizeShipStatus(s.status) === 'livré' ? c.green : normalizeShipStatus(s.status) === 'transit' ? c.gold : c.red,
                    }}>{normalizeShipStatus(s.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock & E-commerce */}
        <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderRadius: radius.sm, boxShadow: shadow.xs, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.purple, opacity: 0.6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
              <Icon d={icons.save} size={16} color={c.purple} />
              <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Stock & E-commerce</span>
            </div>
            <button onClick={() => setMainTab('stock')} style={{
              padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
              color: c.purple, fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
              cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.purple }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
              Voir tout →
            </button>
          </div>
          <p style={{ fontSize: '10px', color: c.textTertiary, marginBottom: sp[2], lineHeight: 1.4 }}>
            Inventaire des clients qui nous confient le stockage et la gestion de leur boutique e-commerce
          </p>
          {inventory.length === 0 ? (
            <div style={{ padding: sp[3], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
              Aucun article — les clients e-com avec service Stock apparaîtront ici
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {inventory.slice(0, 5).map((item, i) => {
                const isLow = (item.quantity || 0) <= (item.alert_threshold || 0)
                return (
                  <div key={item.id || i} onClick={() => setMainTab('stock')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('stock') } }} style={{
                    padding: `${sp[1]} ${sp[2]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: isLow ? `${c.red}08` : c.bgElevated, cursor: 'pointer',
                    transition: `background 0.15s ${ease.smooth}`, borderInlineStart: `3px solid ${isLow ? c.red : c.border}`,
                    animation: `fadeSlideIn 0.4s ${ease.smooth} ${0.05 * i}s backwards`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = c.bg }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isLow ? `${c.red}08` : c.bgElevated }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: size.xs, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{item.product_name}</span>
                      {item.sku && <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{item.sku}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                      <span style={{ fontSize: size.xs, fontFamily: f.mono, fontWeight: 600, color: isLow ? c.red : c.text }}>{item.quantity || 0} u.</span>
                      {isLow && <span style={{ fontSize: '8px', padding: '1px 4px', background: `${c.red}20`, color: c.red, fontFamily: f.mono, fontWeight: 700 }}>BAS</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BOUTIQUES E-COMMERCE ── */}
      <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderRadius: radius.sm, boxShadow: shadow.xs, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.gold, opacity: 0.6 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
            <span style={{ fontSize: '14px', color: c.gold }}>◉</span>
            <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Boutiques E-commerce</span>
            <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold, fontWeight: 700, background: `${c.gold}15`, padding: '2px 6px', marginInlineStart: sp[1] }}>
              {shops.length}
            </span>
          </div>
          <button onClick={() => setMainTab('boutiques')} style={{
            padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
            color: c.gold, fontSize: '9px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
          }}>
            Gérer →
          </button>
        </div>
        {shops.length === 0 ? (
          <div style={{ padding: sp[2], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
            Aucune boutique — créez-en une depuis l'onglet Boutiques
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: sp[2] }}>
            {shops.slice(0, 6).map(shop => {
              const statusColors = { draft: c.textTertiary, building: c.amber || c.gold, review: c.blue, active: c.green, paused: c.red, archived: c.textTertiary }
              const statusLabels = { draft: 'Brouillon', building: 'Construction', review: 'Revue', active: 'Active', paused: 'Pause', archived: 'Archivée' }
              const client = allProfiles.find(p => p.id === shop.client_id)
              return (
                <div key={shop.id} onClick={() => setMainTab('boutiques')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('boutiques') } }} style={{
                  padding: sp[2], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`,
                  cursor: 'pointer', transition: `border-color 0.2s ${ease.smooth}`,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = c.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = c.borderSubtle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: size.sm, fontWeight: 700, color: c.text }}>{shop.name}</span>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColors[shop.status] || c.textTertiary,
                    }} title={statusLabels[shop.status] || shop.status} />
                  </div>
                  <div style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{client?.full_name?.split(' ')[0] || '—'}</span>
                    <span style={{ color: c.gold }}>{shop.platform}</span>
                  </div>
                  {(shop.monthly_revenue > 0 || shop.monthly_orders > 0) && (
                    <div style={{ marginTop: '4px', fontSize: '9px', fontFamily: f.mono, color: c.textSecondary }}>
                      {shop.monthly_orders || 0} cmd · {fmtMoney(shop.monthly_revenue || 0)}/mois
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── SERVICES E-COM ── */}
      {ecomServices.length > 0 && (
        <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderRadius: radius.sm, boxShadow: shadow.xs, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.amber, opacity: 0.6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
              <span style={{ fontSize: '14px', color: c.amber }}>◉</span>
              <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Services E-com</span>
              <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.amber, fontWeight: 700, background: `${c.amber}15`, padding: '2px 6px', marginInlineStart: sp[1] }}>
                {ecomServices.length}
              </span>
            </div>
            <button onClick={() => setMainTab('services')} style={{
              padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
              color: c.amber, fontSize: '9px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
            }}>
              Gérer →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: sp[2] }}>
            {ecomServices.slice(0, 4).map(svc => {
              const serviceTypes = { creation: 'Création', gestion: 'Gestion', formation: 'Formation', marketing: 'Marketing' }
              const serviceIcons = { creation: '🏪', gestion: '⚙️', formation: '📚', marketing: '📣' }
              const svcClient = allProfiles.find(p => p.id === svc.client_id)
              const tasks = svc.tasks || []
              const done = tasks.filter(t => t.done).length
              const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
              return (
                <div key={svc.id} onClick={() => setMainTab('services')} style={{
                  padding: sp[2], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
                  transition: `border-color 0.2s ease`,
                }} onMouseEnter={e => e.currentTarget.style.borderColor = c.amber} onMouseLeave={e => e.currentTarget.style.borderColor = c.borderSubtle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: size.sm, fontWeight: 700 }}>{serviceIcons[svc.service_type]} {serviceTypes[svc.service_type]}</span>
                    <span style={{ fontSize: '9px', fontFamily: f.mono, color: pct === 100 ? c.green : c.amber }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{svcClient?.full_name?.split(' ')[0] || '—'} · {svc.pack}</div>
                  <div style={{ height: 3, background: c.bgHover, marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? c.green : c.amber, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ACTIVITÉ RÉCENTE ── */}
      <div>
        <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, letterSpacing: '-0.01em' }}>
          Activité récente
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: sp[2] }}>
          {orders.length === 0 ? (
            <DragonEmptyState title="Pas de commandes" subtitle="Créez votre première commande pour voir l'activité ici" />
          ) : (
            orders.slice(0, 10).map((order, i) => {
              const orderShipments = shipments.filter(s => s.client_id === order.client_id)
              const hasShipment = orderShipments.length > 0
              return (
                <div key={order.id} style={{
                  padding: `${sp[2]} ${sp[3]}`, background: c.bgCard,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: `1px solid ${c.borderSubtle}`, borderInlineStart: `3px solid ${STATUSES[order.status]?.color || c.border}`,
                  cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                }}
                onClick={() => { setMainTab('commandes') }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated; e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${c.gold}30` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.bgCard; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>{order.ref}</span>
                    <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product}</span>
                    <span style={{ fontSize: size.xs, color: c.textTertiary, flexShrink: 0 }}>{clientName(order.client_id)}</span>
                    {hasShipment && <span style={{ fontSize: '9px', padding: '1px 5px', background: `${c.teal}15`, color: c.teal, fontFamily: f.mono, fontWeight: 600, flexShrink: 0 }}>📦 {orderShipments.length}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{fmtDate(order.created_at)}</span>
                    <StatusPill status={order.status} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
