/* ── CARAXES Admin — Layout (Sidebar + Header + Command Bar) ── */
import { useState, useRef } from 'react'
import { useAdmin } from './AdminContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Icon, icons, DragonMark, ArtDecoDivider, SkeletonCard, SidebarTooltip, MiniSparkline, keyframes, scrollbarCSS } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius, gradient, STATUSES } from '../../lib/theme'
import { exportFullBackupJSON, exportBackupCSVs } from '../../lib/backup'
import LocaleAndPwaControls from '../../components/LocaleAndPwaControls.jsx'

/* DecoPattern — inert placeholder kept for visual grid consistency */
const DecoPattern = () => null

export default function AdminLayout({ children, commandesSidebar }) {
  const {
    // Props
    user, profile, onSignOut,
    // i18n
    t, isRtl,
    // Data
    orders, clients, allProfiles, products, shipments, inventory, categories, shops, ecomServices, leads,
    loading,
    // Navigation
    mainTab, setMainTab,
    // Notifications
    notifications, setNotifications, showNotifPanel, setShowNotifPanel,
    unreadNotifs, markAllRead, requestNotifPermission,
    // Team chat
    teamUnreadCount,
    // Toast
    toast,
    // Computed
    activeOrders, deliveredOrders,
  } = useAdmin()

  const isMobile = useIsMobile()

  /* ── Local layout state ── */
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hoveredTab, setHoveredTab] = useState(null)
  const [showCommandBar, setShowCommandBar] = useState(false)
  const [cmdSearch, setCmdSearch] = useState('')
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const cmdBarRef = useRef(null)

  /* ── Keyboard shortcut: Cmd+K for command bar ── */
  // (handled via global keydown in Admin.jsx or here if needed)

  /* ── Main tabs definition ── */
  const mainTabs = [
    { key: 'overview', label: t('admin.overview') || "Vue d'ensemble", icon: icons.trending },
    { key: 'commandes', label: t('nav.orders'), icon: icons.file },
    { key: 'catalogue', label: t('admin.catalogueSuppliers') || 'Catalogue & Fournisseurs', icon: icons.doc },
    { key: 'expedition', label: t('nav.shipping'), icon: icons.send, color: c.teal },
    { key: 'stock', label: t('nav.stock'), icon: icons.save, color: c.purple },
    { key: 'boutiques', label: t('admin.shops') || 'Boutiques', icon: icons.link, color: c.gold },
    { key: 'vehicules', label: t('admin.vehicles') || 'Véhicules', icon: 'M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0M3 11l1-9h12l1 9M3 11h14M3 11v5h1m13-5v5h-1M6 8h8', color: c.red },
    { key: 'formation', label: t('nav.formation'), icon: 'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', color: c.purple },
    { key: 'services', label: t('admin.services') || 'Services', icon: icons.shield, color: c.amber },
    { key: 'pipeline', label: t('admin.pipelineLeads') || 'Pipeline Leads', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8', color: c.green },
    { key: 'orders_pipeline', label: t('admin.pipelineOrders') || 'Pipeline Commandes', icon: '📦', color: c.teal },
    { key: 'clients', label: t('nav.clients'), icon: icons.users },
    { key: 'team_chat', label: 'Chat Équipe', icon: icons.msg, color: c.gold },
  ]

  /* ── Sidebar grouped sections ── */
  const sidebarGroups = [
    { label: null, items: ['overview'] },
    { label: 'OPÉRATIONS', items: ['commandes', 'expedition', 'stock', 'vehicules'] },
    { label: 'COMMERCE', items: ['catalogue', 'boutiques', 'services'] },
    { label: 'CRM', items: ['clients', 'pipeline', 'orders_pipeline'] },
    { label: 'ÉQUIPE', items: ['team_chat', 'formation'] },
  ]

  /* ── LOADING — Skeleton Layout ── */
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', background: c.bg, position: 'relative', overflow: 'hidden' }}>
      <style>{keyframes}</style>
      {/* Skeleton sidebar */}
      <div style={{ width: 240, background: c.bg, borderInlineEnd: `1px solid ${c.borderSubtle}`, padding: sp[3], display: 'flex', flexDirection: 'column', gap: sp[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[3] }}>
          <div style={{ width: 24, height: 24, background: `${c.red}15`, animation: 'skeletonPulse 1.5s ease infinite' }} />
          <div style={{ width: 80, height: 12, background: `${c.gold}10`, animation: 'skeletonPulse 1.5s ease infinite 0.1s' }} />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp[2], padding: '8px 0' }}>
            <div style={{ width: 16, height: 16, background: `${c.text}06`, animation: `skeletonPulse 1.5s ease infinite ${i * 0.05}s` }} />
            <div style={{ width: `${50 + Math.random() * 60}px`, height: 8, background: `${c.text}04`, animation: `skeletonPulse 1.5s ease infinite ${i * 0.08}s` }} />
          </div>
        ))}
      </div>
      {/* Skeleton main */}
      <div style={{ flex: 1, padding: sp[4], display: 'flex', flexDirection: 'column', gap: sp[3] }}>
        {/* Header skeleton */}
        <div style={{ height: 48, background: c.bgWarm, border: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'center', padding: `0 ${sp[3]}`, gap: sp[3] }}>
          <div style={{ width: 100, height: 10, background: `${c.text}06`, animation: 'skeletonPulse 1.5s ease infinite' }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 24, height: 24, background: `${c.text}04`, borderRadius: '50%', animation: 'skeletonPulse 1.5s ease infinite 0.2s' }} />
        </div>
        {/* Welcome skeleton */}
        <div style={{ padding: sp[4], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `${c.gold}15` }} />
          <div style={{ width: 200, height: 20, background: `${c.text}06`, marginBottom: sp[2], animation: 'skeletonPulse 1.5s ease infinite' }} />
          <div style={{ width: 140, height: 10, background: `${c.text}04`, animation: 'skeletonPulse 1.5s ease infinite 0.1s' }} />
        </div>
        {/* Stat cards skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: sp[3] }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
        {/* Center branding */}
        <div style={{ position: 'absolute', top: '50%', left: '55%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
          <div style={{ width: 120, height: 120, border: `1px solid ${c.gold}15`, transform: 'rotate(45deg)', animation: 'pulseGlow 3s ease infinite', position: 'absolute', top: -60, left: -60 }} />
          <div style={{ width: 36, height: 36, border: `2px solid ${c.border}`, borderTopColor: c.gold, animation: 'spin 1s linear infinite', margin: '0 auto', position: 'relative', zIndex: 2 }} />
          <div style={{ color: c.gold, fontFamily: f.display, fontSize: size.sm, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: sp[2], fontWeight: 600, position: 'relative', zIndex: 2 }}>CARAXES</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{keyframes}{scrollbarCSS}{`
        @media (max-width: 768px) {
          .admin-sidebar { position: fixed !important; inset-inline-start: 0 !important; top: 48px!important; width: ${sidebarOpen ? '260px' : '0'} !important; height: calc(100vh - 48px) !important; z-index: 40 !important; box-shadow: ${sidebarOpen ? (isRtl ? '-2px 0 8px rgba(6, 5, 4, 0.6)' : '8px 0 32px rgba(6, 5, 4, 0.5)') : 'none'} !important; overflow-y: auto !important; transition: width 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) !important; }
          .admin-sidebar-overlay { display: ${sidebarOpen ? 'block' : 'none'} !important; position: fixed !important; inset: 0 !important; background: rgba(6, 5, 4, 0.88) !important; z-index: 39 !important; top: 48px!important; backdrop-filter: blur(2px) !important; }
          .admin-main-panel { margin-inline-start: 0 !important; }
          .admin-sidebar-nav { width: 100% !important; }
          .admin-sidebar-nav button { justify-content: flex-start !important; min-height: 44px !important; }
          .admin-sidebar-nav span { display: inline !important; }
          .admin-sidebar-stats { display: grid !important; }
          .admin-detail { width: 100% !important; }
          .admin-scroll { padding: 12px !important; }
          .admin-product-grid { grid-template-columns: 1fr !important; }
          .admin-client-table { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .admin-service-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-overview-2col { grid-template-columns: 1fr !important; }
          .admin-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-notif-panel { width: calc(100vw - 32px) !important; right: -16px !important; max-height: 70vh !important; }
          .admin-modal-inner { max-width: 100% !important; width: 100% !important; border-radius: 0 !important; min-height: 100vh !important; }
          .admin-modal-overlay { align-items: flex-start !important; }
          .admin-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .admin-table-wrap table { min-width: 600px !important; }
        }
        @media (max-width: 480px) {
          .admin-scroll { padding: 8px !important; }
          .admin-sidebar { width: ${sidebarOpen ? '100%' : '0'} !important; }
          .admin-service-grid { grid-template-columns: 1fr !important; }
          .admin-stats-row { grid-template-columns: 1fr !important; }
          .admin-overview-2col { grid-template-columns: 1fr !important; }
          .admin-topbar-stats { display: none !important; }
        }
      `}</style>

      {/* SIDEBAR OVERLAY (MOBILE) */}
      <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      {/* ════════════ REDESIGNED TOP BAR ════════════ */}
      <header style={{
        padding: `0 ${sp[3]}`, height: '48px', borderBottom: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: c.bgSurface, flexShrink: 0,
        position: 'relative', zIndex: 41,
        boxShadow: '0 2px 8px rgba(6, 5, 4, 0.2)',
      }}>
        {/* Left: hamburger + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <button aria-label="Ouvrir/fermer le menu" onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', color: c.text, cursor: 'pointer', padding: sp[1],
            display: 'flex', alignItems: 'center',
          }}>
            <Icon d={icons.menu} size={16} color="currentColor" />
          </button>
          {/* Dynamic breadcrumb */}
          <div className="admin-topbar-stats" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: f.mono, fontSize: '11px', letterSpacing: '0.04em' }}>
            <span style={{ color: c.goldMuted }}>ADMIN</span>
            <span style={{ color: c.borderSubtle }}>/</span>
            <span style={{ color: c.gold, fontWeight: 600 }}>{(mainTabs.find(t => t.key === mainTab)?.label || 'Vue d\'ensemble').toUpperCase()}</span>
          </div>
        </div>

        {/* Center: search bar (hidden on mobile — use hamburger menu) */}
        <button aria-label="Recherche" onClick={() => setShowCommandBar(true)} style={{
          display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: sp[2], padding: `6px ${sp[3]}`,
          background: c.bgInput, border: 'none', borderBottom: `1px solid ${c.border}`,
          cursor: 'pointer', transition: `all 0.25s ${ease.expo}`, minWidth: 220,
          borderRadius: `${radius.sm} ${radius.sm} 0 0`,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = c.goldMuted }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle }}>
          <Icon d={icons.search} size={13} color={c.textTertiary} />
          <span style={{ color: c.textTertiary, fontSize: '11px', fontFamily: f.body, flex: 1, textAlign: 'start' }}>Rechercher...</span>
          <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, border: `1px solid ${c.borderSubtle}`, padding: '1px 5px', letterSpacing: '0.04em' }}>⌘K</span>
        </button>

        {/* Right: stats + notif + avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[3] }}>
          {/* Compact stats */}
          <div className="admin-topbar-stats" style={{ display: 'flex', alignItems: 'center', gap: sp[2], fontFamily: f.mono, fontSize: '10px' }}>
            <span style={{ color: c.red, fontWeight: 700 }}>{activeOrders}</span>
            <span style={{ color: c.textTertiary }}>actif</span>
            <span style={{ color: c.borderSubtle }}>·</span>
            <span style={{ color: c.green, fontWeight: 700 }}>{deliveredOrders}</span>
            <span style={{ color: c.textTertiary }}>livré</span>
          </div>
          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button aria-label="Notifications" onClick={() => { requestNotifPermission(); setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) markAllRead() }} style={{
              background: 'transparent', border: `1px solid ${unreadNotifs > 0 ? c.borderGold : c.borderSubtle}`,
              width: 34, height: 34, display: 'flex', borderRadius: radius.md,
              alignItems: 'center', justifyContent: 'center', color: unreadNotifs > 0 ? c.gold : c.textTertiary, cursor: 'pointer',
              transition: `all 0.25s ${ease.expo}`, position: 'relative',
            }}>
              <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" size={15} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: c.red, color: '#fff', fontSize: '9px', fontWeight: 700,
                  width: 16, height: 16, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: f.mono, animation: 'pulseGlow 2s ease infinite',
                }}>{unreadNotifs}</span>
              )}
            </button>
            {/* Notification dropdown */}
            {showNotifPanel && (
              <div className="admin-notif-panel" style={{
                position: 'absolute', top: '100%', right: 0, marginTop: sp[1],
                width: 360, maxHeight: 500, overflowY: 'auto',
                background: c.bgCard, border: `1px solid ${c.border}`,
                boxShadow: shadow.xs, borderRadius: radius.sm,
                zIndex: 100, padding: sp[2], display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2], paddingBottom: sp[2], borderBottom: `1px solid ${c.borderSubtle}` }}>
                  <span style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold, letterSpacing: '0.04em' }}>Notifications</span>
                  <div style={{ display: 'flex', gap: sp[1], alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono }}>{notifications.length} total</span>
                    {notifications.length > 0 && (
                      <button onClick={() => {
                        // Clear all notifications
                      }} style={{
                        padding: '2px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                        color: c.textTertiary, cursor: 'pointer', fontSize: '8px', fontFamily: f.mono,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>Effacer tout</button>
                    )}
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: sp[4], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
                    <p style={{ margin: '0 0 ' + sp[1] }}>Aucune notification</p>
                    <p style={{ margin: 0, fontSize: '9px' }}>Vous êtes à jour!</p>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[1] }}>
                    {notifications.slice(0, 20).map(n => {
                      const typeConfig = {
                        client: { color: c.gold, icon: '◆', label: 'Client' },
                        order: { color: c.red, icon: '📦', label: 'Commande' },
                        ecom: { color: c.teal, icon: '🏪', label: 'Service' },
                        lead: { color: c.green, icon: '✓', label: 'Prospect' },
                      }
                      const config = typeConfig[n.type] || { color: c.gold, icon: '●', label: 'Info' }
                      const timeNow = new Date()
                      const timeDiff = Math.floor((timeNow - n.time) / 1000)
                      let timeString = ''
                      if (timeDiff < 60) timeString = 'À l\'instant'
                      else if (timeDiff < 3600) timeString = `il y a ${Math.floor(timeDiff / 60)}m`
                      else if (timeDiff < 86400) timeString = `il y a ${Math.floor(timeDiff / 3600)}h`
                      else timeString = `il y a ${Math.floor(timeDiff / 86400)}j`

                      return (
                        <div key={n.id} onClick={() => {
                          if (n.type === 'client') setMainTab('clients')
                          else if (n.type === 'order') setMainTab('commandes')
                          else if (n.type === 'ecom') setMainTab('services')
                          else if (n.type === 'lead') setMainTab('pipeline')
                          setShowNotifPanel(false)
                        }} style={{
                          padding: sp[2], marginBottom: '2px',
                          background: n.read ? 'transparent' : `${config.color}12`,
                          border: `1px solid ${n.read ? c.borderSubtle : config.color}30`,
                          borderInlineStart: `3px solid ${config.color}`,
                          fontSize: size.xs, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${config.color}15`; e.currentTarget.style.transform = 'translateX(2px)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : `${config.color}12`; e.currentTarget.style.transform = 'translateX(0)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp[1] }}>
                            <span style={{ fontSize: '14px', marginTop: 2 }}>{config.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp[1] }}>
                                <div style={{ fontWeight: 600, color: c.text }}>{n.title}</div>
                                <span style={{ fontSize: '8px', color: c.textTertiary, fontFamily: f.mono, whiteSpace: 'nowrap' }}>{timeString}</span>
                              </div>
                              <div style={{ color: c.textSecondary, marginTop: 4, fontSize: '11px', lineHeight: 1.4 }}>{n.detail}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Admin avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
            {!isMobile && (
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: '11px', color: c.text, fontWeight: 600, lineHeight: 1.2 }}>{profile?.full_name?.split(' ')[0] || 'Admin'}</div>
                <div style={{ fontSize: '8px', color: c.goldMuted, fontFamily: f.mono, letterSpacing: '0.06em' }}>SUPER ADMIN</div>
              </div>
            )}
            <div style={{
              width: 32, height: 32, background: c.gold, color: c.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontFamily: f.display, fontSize: '13px',
            }}>{(profile?.full_name || 'A')[0].toUpperCase()}</div>
          </div>
          {/* Logout */}
          <button aria-label="Déconnexion" onClick={onSignOut} style={{
            background: 'transparent', border: `1px solid ${c.border}`,
            width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: c.textTertiary, cursor: 'pointer',
            transition: `border-color 0.2s ${ease.smooth}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.color = c.red }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textTertiary }}>
            <Icon d={icons.logout} size={14} />
          </button>
        </div>
      </header>


      {/* ════════════ COMMAND BAR (Raycast Style) ════════════ */}
      {showCommandBar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '18vh' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCommandBar(false); setCmdSearch('') } }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.85)', backdropFilter: 'blur(4px)' }} />
          <div ref={cmdBarRef} style={{
            width: isMobile ? '100%' : 520, position: 'relative', zIndex: 1,
            maxWidth: isMobile ? '100%' : undefined,
            background: c.bgCard,
            border: `1px solid ${c.border}`, boxShadow: shadow.xs,
            animation: 'fadeSlideIn 0.2s ease',
          }}>
            <div style={{ padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'center', gap: sp[2] }}>
              <span style={{ color: c.gold, fontFamily: f.mono, fontSize: '14px' }}>{'>'}</span>
              <input
                autoFocus
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                placeholder="Chercher une action, un client, une commande..."
                style={{ background: 'none', border: 'none', outline: 'none', color: c.text, width: '100%', fontFamily: f.body, fontSize: '14px' }}
                onKeyDown={e => { if (e.key === 'Escape') { setShowCommandBar(false); setCmdSearch('') } }}
              />
              <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, border: `1px solid ${c.borderSubtle}`, padding: '2px 6px', whiteSpace: 'nowrap' }}>ESC</span>
            </div>
            <div style={{ padding: sp[1], maxHeight: 320, overflowY: 'auto' }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, padding: `${sp[1]} ${sp[2]}`, letterSpacing: '0.12em' }}>ACTIONS</div>
              {[
                { label: 'Nouvelle commande', key: 'commandes', icon: icons.file, shortcut: '⌘1', action: () => { setMainTab('commandes') } },
                { label: 'Ajouter un client', key: 'clients', icon: icons.users, shortcut: '⌘2', action: () => setMainTab('clients') },
                { label: 'Créer boutique', key: 'boutiques', icon: icons.link, shortcut: '⌘3', action: () => setMainTab('boutiques') },
                { label: 'Ajouter expédition', key: 'expedition', icon: icons.send, shortcut: '⌘4', action: () => setMainTab('expedition') },
                { label: 'Nouveau service e-com', key: 'services', icon: icons.shield, shortcut: '⌘5', action: () => setMainTab('services') },
                { label: 'Export backup JSON', key: 'backup', icon: icons.download, shortcut: '⌘6', action: async () => { toast.success(t('toast.exportJSONStart')); await exportFullBackupJSON() } },
              ].filter(a => !cmdSearch || a.label.toLowerCase().includes(cmdSearch.toLowerCase())).map((act, i) => (
                <div key={act.label} onClick={() => { act.action(); setShowCommandBar(false); setCmdSearch('') }}
                  style={{
                    padding: `${sp[1.5]} ${sp[2]}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: i === 0 ? `${c.gold}08` : 'transparent',
                    transition: `all 0.15s ${ease.smooth}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${c.gold}10`}
                  onMouseLeave={e => e.currentTarget.style.background = i === 0 ? `${c.gold}08` : 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                    <Icon d={act.icon} size={14} color={i === 0 ? c.gold : c.textTertiary} />
                    <span style={{ fontSize: '13px', color: i === 0 ? c.text : c.textSecondary }}>{act.label}</span>
                  </div>
                  <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, border: `1px solid ${c.borderSubtle}`, padding: '1px 5px' }}>{act.shortcut}</span>
                </div>
              ))}
              {/* Quick nav to tabs */}
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, padding: `${sp[2]} ${sp[2]} ${sp[1]}`, letterSpacing: '0.12em', borderTop: `1px solid ${c.borderSubtle}`, marginTop: sp[1] }}>NAVIGATION</div>
              {mainTabs.filter(t => !cmdSearch || t.label.toLowerCase().includes(cmdSearch.toLowerCase())).slice(0, 6).map((t) => (
                <div key={t.key} onClick={() => { setMainTab(t.key); setShowCommandBar(false); setCmdSearch('') }}
                  style={{ padding: `${sp[1]} ${sp[2]}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp[2], transition: `background 0.15s` }}
                  onMouseEnter={e => e.currentTarget.style.background = `${c.gold}08`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon d={t.icon} size={13} color={c.textTertiary} />
                  <span style={{ fontSize: '12px', color: c.textSecondary }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ════════════ VERTICAL SIDEBAR — Collapsible ════════════ */}
        <aside className="admin-sidebar" style={{
          width: sidebarCollapsed ? '56px' : '220px', background: `linear-gradient(180deg, ${c.bgSurface}, ${c.bg})`, borderInlineEnd: `1px solid ${c.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative',
          transition: `width 0.35s ${ease.luxury}`, overflowX: 'hidden', overflowY: 'auto',
          minHeight: 0, boxShadow: '4px 0 16px rgba(6, 5, 4, 0.25)',
        }}>
          <DecoPattern color={c.gold} opacity={0.025} />
          {/* Brand header + collapse toggle */}
          <div style={{ padding: sidebarCollapsed ? `${sp[2]} ${sp[1]}` : `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.borderSubtle}`, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1.5], marginBottom: sidebarCollapsed ? 0 : sp[1.5], justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
              <DragonMark s={20} />
              {!sidebarCollapsed && (
                <div>
                  <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.xs, letterSpacing: '0.10em' }}>CARAXES</div>
                  <div style={{ fontSize: '8px', color: c.gold, fontFamily: f.mono, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ADMIN</div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && <ArtDecoDivider width={80} />}
            {!sidebarCollapsed && (
              <div style={{ marginTop: sp[2] }}>
                <LocaleAndPwaControls compact />
              </div>
            )}
            {/* Collapse button */}
            <button aria-label="Réduire le menu" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
              position: 'absolute', top: sidebarCollapsed ? 12 : 12, right: sidebarCollapsed ? 'auto' : 8,
              left: sidebarCollapsed ? '50%' : 'auto',
              transform: sidebarCollapsed ? 'translateX(-50%)' : 'none',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
              color: c.textTertiary, transition: `all 0.2s ${ease.smooth}`, display: sidebarCollapsed ? 'none' : 'flex',
            }}
            onMouseEnter={e => e.currentTarget.style.color = c.gold}
            onMouseLeave={e => e.currentTarget.style.color = c.textTertiary}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Nav items — Grouped */}
          <nav className="admin-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flex: 0, gap: '0px', padding: sidebarCollapsed ? `${sp[2]} 4px` : `${sp[2]}`, position: 'relative', zIndex: 1 }}>
            {sidebarCollapsed && (
              <button aria-label="Déployer le menu" onClick={() => setSidebarCollapsed(false)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0',
                background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginBottom: 4,
              }}
              onMouseEnter={e => e.currentTarget.firstChild.style.color = c.gold}
              onMouseLeave={e => e.currentTarget.firstChild.style.color = c.textTertiary}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: `color 0.2s ${ease.smooth}` }}>
                  <path d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {sidebarGroups.map((group, gi) => {
              const groupTabs = group.items.map(key => mainTabs.find(t => t.key === key)).filter(Boolean)
              return (
                <div key={gi} style={{ marginBottom: gi < sidebarGroups.length - 1 ? sp[1] : 0 }}>
                  {/* Section header */}
                  {group.label && !sidebarCollapsed && (
                    <div style={{
                      fontFamily: f.mono, fontSize: '9px', letterSpacing: '0.15em', color: c.goldMuted,
                      padding: `${sp[1.5]} ${sp[3]} 4px`, marginTop: gi > 0 ? sp[1] : 0,
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span>{group.label}</span>
                      <div style={{ flex: 1, height: '1px', background: c.borderSubtle }} />
                    </div>
                  )}
                  {sidebarCollapsed && gi > 0 && group.label && (
                    <div style={{ height: '1px', background: `${c.borderSubtle}`, margin: `${sp[1]} 8px` }} />
                  )}
                  {groupTabs.map(tab => {
                    const badge = tab.key === 'commandes' ? activeOrders : tab.key === 'stock' ? inventory.filter(i => i.quantity < (i.alert_threshold || 10)).length : tab.key === 'services' ? ecomServices.filter(s => s.status === 'pending').length : tab.key === 'pipeline' ? leads.filter(l => l.status === 'new' || l.status === 'pending').length : tab.key === 'team_chat' ? teamUnreadCount : 0
                    return (
                      <button key={tab.key}
                        onClick={() => { setMainTab(tab.key); if (isMobile) setSidebarOpen(false) }}
                        onMouseEnter={() => setHoveredTab(tab.key)}
                        onMouseLeave={() => setHoveredTab(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : sp[2],
                          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                          padding: sidebarCollapsed ? '10px 0' : `8px ${sp[3]}`,
                          background: mainTab === tab.key ? c.bgHover : 'transparent',
                          border: 'none',
                          borderInlineStart: `2px solid ${mainTab === tab.key ? c.gold : 'transparent'}`,
                          boxShadow: mainTab === tab.key ? `inset 3px 0 8px rgba(196, 163, 90, 0.08)` : 'none',
                          color: mainTab === tab.key ? c.text : c.textTertiary,
                          fontSize: size.xs, fontWeight: mainTab === tab.key ? 700 : 500,
                          cursor: 'pointer', fontFamily: f.body,
                          transition: `all 0.25s ${ease.expo}`,
                          width: '100%', textAlign: 'start', position: 'relative',
                          borderRadius: radius.sm,
                        }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Icon d={tab.icon} size={18} color={mainTab === tab.key ? (tab.color || c.gold) : c.textTertiary} sw={1.5} />
                          {badge > 0 && sidebarCollapsed && (
                            <div style={{
                              position: 'absolute', top: -4, right: -6,
                              width: 14, height: 14, borderRadius: '50%',
                              background: tab.key === 'stock' ? c.red : c.gold,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '7px', fontWeight: 800, color: c.bg, fontFamily: f.mono,
                            }}>{badge > 9 ? '9+' : badge}</div>
                          )}
                        </div>
                        {!sidebarCollapsed && <span>{tab.label}</span>}
                        {!sidebarCollapsed && badge > 0 && (
                          <span style={{
                            marginInlineStart: 'auto', padding: '1px 6px', fontSize: '9px', fontWeight: 700,
                            fontFamily: f.mono, background: tab.key === 'stock' ? `${c.red}20` : `${c.gold}15`,
                            color: tab.key === 'stock' ? c.red : c.gold, letterSpacing: '0.02em',
                          }}>{badge}</span>
                        )}
                        {sidebarCollapsed && hoveredTab === tab.key && <SidebarTooltip label={tab.label} visible />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Stats summary — enriched */}
          {!sidebarCollapsed && (
          <div className="admin-sidebar-stats" style={{
            padding: `${sp[3]}`, borderTop: `1px solid ${c.borderSubtle}`,
            borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCard, position: 'relative', zIndex: 1,
            borderRadius: radius.sm, margin: sp[1.5],
          }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', letterSpacing: '0.04em', color: c.textTertiary, marginBottom: sp[2] }}>RÉSUMÉ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
              <div>
                <div style={{ fontWeight: 700, color: c.red, fontSize: size.sm }}>{activeOrders}</div>
                <div style={{ fontSize: '8px', color: c.textTertiary }}>en cours</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: c.green, fontSize: size.sm }}>{deliveredOrders}</div>
                <div style={{ fontSize: '8px', color: c.textTertiary }}>livrées</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: c.teal, fontSize: size.sm }}>{shipments.filter(s => s.status === 'en_transit' || s.status === 'shipped').length}</div>
                <div style={{ fontSize: '8px', color: c.textTertiary }}>en transit</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: inventory.some(i => i.quantity < (i.alert_threshold || 10)) ? c.red : c.purple, fontSize: size.sm }}>{inventory.filter(i => i.quantity < (i.alert_threshold || 10)).length}</div>
                <div style={{ fontSize: '8px', color: c.textTertiary }}>alertes stock</div>
              </div>
            </div>
          </div>
          )}

          {/* Tools — Backup + Logout */}
          <div style={{ padding: `${sp[2]}`, position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: f.mono, fontSize: '8px', letterSpacing: '0.06em', color: c.textTertiary, marginBottom: sp[1], padding: `0 ${sp[1]}` }}>OUTILS</div>
            <div style={{ display: 'flex', gap: sp[1], marginBottom: sp[1] }}>
              <button onClick={async () => {
                toast.success('Export JSON en cours…')
                try { await exportFullBackupJSON() } catch (e) { toast.error('Erreur export JSON') }
              }} style={{
                flex: 1, padding: `6px ${sp[1]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                color: c.textSecondary, fontSize: '9px', fontFamily: f.mono, cursor: 'pointer',
                transition: `all 0.2s ${ease.smooth}`, textAlign: 'center', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}
              ><Icon d={icons.download} size={10} color="currentColor" /> JSON</button>
              <button onClick={async () => {
                toast.success('Export CSV en cours…')
                try { await exportBackupCSVs() } catch (e) { toast.error('Erreur export CSV') }
              }} style={{
                flex: 1, padding: `6px ${sp[1]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                color: c.textSecondary, fontSize: '9px', fontFamily: f.mono, cursor: 'pointer',
                transition: `all 0.2s ${ease.smooth}`, textAlign: 'center', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}
              ><Icon d={icons.download} size={10} color="currentColor" /> CSV</button>
            </div>
            <button aria-label="Déconnexion" onClick={onSignOut} style={{
              width: '100%', padding: `6px ${sp[2]}`,
              background: 'transparent', border: `1px solid ${c.border}`,
              color: c.textTertiary, fontSize: '9px', fontFamily: f.mono, cursor: 'pointer',
              transition: `all 0.2s ${ease.smooth}`,
              textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.color = c.red }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textTertiary }}
            ><Icon d={icons.logout} size={12} color="currentColor" /> Déconnecter</button>
          </div>
        </aside>

        {/* ════════════ COMMANDES SIDEBAR (optional) ════════════ */}
        {commandesSidebar}

        {/* ════════════ MAIN CONTENT ════════════ */}
        {children}

      </div>
    </div>
  )
}
