/* ── CARAXES Admin — Services E-com Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, ArtDecoDivider, DragonEmptyState, n8nFetch, fmtMoney, inputStyle, labelStyle } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'

export default function ServicesTab() {
  const {
    shops, allProfiles, ecomServices, loadAll, toast, t, tToast,
    createEcomService, updateEcomService, deleteEcomService,
    updateProfile,
    setConfirmDialog,
  } = useAdmin()

  // ── Local state ──
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [serviceForm, setServiceForm] = useState({ client_id: '', service_type: 'creation', pack: 'starter', platform: 'shopify', price: '', notes: '', shop_id: '' })
  const [serviceFilter, setServiceFilter] = useState(null)
  const [serviceSearch, setServiceSearch] = useState('')

  // ── Send Formation modal ──
  const [showSendFormationModal, setShowSendFormationModal] = useState(false)
  const [sendFormationData, setSendFormationData] = useState({ clientIds: [], formationType: 'interne', deliveryMethod: ['email'] })
  const [sendFormationLoading, setSendFormationLoading] = useState(false)

  // ── Site Creation modal ──
  const [showSiteCreationModal, setShowSiteCreationModal] = useState(false)
  const [siteCreationData, setSiteCreationData] = useState({ launchMethod: 'n8n' })
  const [siteCreationLoading, setSiteCreationLoading] = useState(false)
  const [selectedEcomServiceForCreation, setSelectedEcomServiceForCreation] = useState(null)

  // ── Client Features modal ──
  const [showClientFeaturesModal, setShowClientFeaturesModal] = useState(false)
  const [editingClientFeatures, setEditingClientFeatures] = useState(null)
  const [clientFeatures, setClientFeatures] = useState({})

  // ── Quick Launch modal ──
  const [showQuickLaunchModal, setShowQuickLaunchModal] = useState(false)
  const [quickLaunchForm, setQuickLaunchForm] = useState({ client_id: '', platform: 'shopify', shopName: '', pack: 'starter', category: '', branding: 'none', launchMethod: 'n8n', notes: '', domain: '', budget: '', template: 'classic', priority: 'normal' })
  const [quickLaunchLoading, setQuickLaunchLoading] = useState(false)

  // ── Constants ──
  const serviceTypes = { creation: 'Création', gestion: 'Gestion', formation: 'Formation', marketing: 'Marketing' }
  const serviceColors = { creation: c.gold, gestion: c.teal, formation: c.blue, marketing: c.purple }
  const serviceIcons = { creation: '🏪', gestion: '⚙️', formation: '📚', marketing: '📣' }
  const packLabels = { starter: 'Starter', pro: 'Pro', premium: 'Premium' }
  const statusLabels = { pending: 'En attente', onboarding: 'Onboarding', in_progress: 'En cours', review: 'Revue', delivered: 'Livré', active: 'Actif', paused: 'Pause' }
  const statusColors = { pending: c.textTertiary, onboarding: c.amber, in_progress: c.blue, review: c.purple, delivered: c.green, active: c.green, paused: c.red }

  const defaultTasks = {
    creation: [
      { key: 'branding', label: 'Branding & identité visuelle', done: false },
      { key: 'domain', label: 'Domaine & hébergement', done: false },
      { key: 'theme', label: 'Thème & design', done: false },
      { key: 'catalogue', label: 'Catalogue produits', done: false },
      { key: 'payment', label: 'Paiement configuré', done: false },
      { key: 'shipping', label: 'Livraison configurée', done: false },
      { key: 'legal', label: 'Pages légales (CGV, mentions)', done: false },
      { key: 'seo', label: 'SEO de base', done: false },
      { key: 'launch', label: 'Mise en ligne', done: false },
    ],
    gestion: [
      { key: 'stock', label: 'Mise à jour stock', done: false },
      { key: 'orders', label: 'Traitement commandes', done: false },
      { key: 'sav', label: 'SAV & retours', done: false },
      { key: 'analytics', label: 'Rapport analytics', done: false },
      { key: 'promo', label: 'Calendrier promos', done: false },
    ],
    formation: [
      { key: 'dashboard', label: 'Tour du dashboard', done: false },
      { key: 'orders_mgmt', label: 'Gestion commandes', done: false },
      { key: 'catalogue_mgmt', label: 'Gestion catalogue', done: false },
      { key: 'photos', label: 'Photos produits', done: false },
      { key: 'seo_basics', label: 'Bases SEO', done: false },
      { key: 'sav_guide', label: 'Guide SAV', done: false },
    ],
    marketing: [
      { key: 'ad_setup', label: 'Compte pub configuré', done: false },
      { key: 'audience', label: 'Audiences définies', done: false },
      { key: 'creative', label: 'Créas publicitaires', done: false },
      { key: 'launch_campaign', label: 'Campagne lancée', done: false },
      { key: 'reporting', label: 'Reporting & optimisation', done: false },
    ],
  }

  const filtered = ecomServices.filter(s => {
    if (serviceFilter && s.service_type !== serviceFilter) return false
    if (serviceSearch) {
      const q = serviceSearch.toLowerCase()
      const client = allProfiles.find(p => p.id === s.client_id)
      if (!(serviceTypes[s.service_type] || '').toLowerCase().includes(q) && !(client?.full_name || '').toLowerCase().includes(q) && !(client?.email || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const byType = Object.keys(serviceTypes).map(st => ({ type: st, count: ecomServices.filter(s => s.service_type === st).length, active: ecomServices.filter(s => s.service_type === st && (s.status === 'active' || s.status === 'in_progress')).length }))
  const totalRevenue = ecomServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)

  const handleSaveService = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        client_id: serviceForm.client_id || null,
        service_type: serviceForm.service_type,
        pack: serviceForm.pack,
        platform: serviceForm.platform,
        price: parseFloat(serviceForm.price) || 0,
        notes: serviceForm.notes,
        shop_id: serviceForm.shop_id || null,
        tasks: defaultTasks[serviceForm.service_type] || [],
        status: 'pending',
      }
      if (editingService) {
        const { tasks: _, status: __, ...updatePayload } = payload
        await updateEcomService(editingService.id, updatePayload)
      } else {
        payload.started_at = new Date().toISOString()
        await createEcomService(payload)
      }
      setShowServiceModal(false)
      setEditingService(null)
      loadAll()
      toast.success(editingService ? t('toast.serviceUpdated') : t('toast.serviceCreated'))
    } catch (err) {
      toast.error(tToast('genericError', { error: err.message }))
    }
  }

  const handleToggleTask = async (service, taskIndex) => {
    const tasks = [...(service.tasks || [])]
    tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done }
    const allDone = tasks.every(t => t.done)
    const updates = { tasks }
    if (allDone && service.status === 'in_progress') {
      updates.status = 'delivered'
      updates.delivered_at = new Date().toISOString()
    }
    try {
      await updateEcomService(service.id, updates)
      loadAll()
    } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
  }

  const handleStatusChange = async (service, newStatus) => {
    try {
      const updates = { status: newStatus }
      if (newStatus === 'in_progress' && !service.started_at) updates.started_at = new Date().toISOString()
      if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString()
      await updateEcomService(service.id, updates)
      loadAll()
      toast.success(t('toast.statusUpdated'))
    } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
  }

  return (
    <>
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
        <div>
          <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>Services E-commerce</h2>
          <ArtDecoDivider width={50} />
          <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>{ecomServices.length} service{ecomServices.length > 1 ? 's' : ''} actif{ecomServices.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: sp[2] }}>
          <button onClick={() => {
            setQuickLaunchForm({ client_id: '', platform: 'shopify', shopName: '', pack: 'starter', category: '', branding: 'none', launchMethod: 'n8n', notes: '' })
            setShowQuickLaunchModal(true)
          }} style={{
            padding: `10px ${sp[3]}`, background: `${c.gold}`, color: c.bg, border: 'none',
            fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: `all 0.25s ${ease.luxury}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
            <Icon d={icons.link} size={14} color={c.bg} />
            Lancer une boutique
          </button>
          <button onClick={() => { setEditingService(null); setServiceForm({ client_id: '', service_type: 'creation', pack: 'starter', platform: 'shopify', price: '', notes: '', shop_id: '' }); setShowServiceModal(true) }} style={{
            padding: `10px ${sp[3]}`, background: c.amber, color: c.bg, border: 'none',
            fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Icon d={icons.plus} size={16} color={c.bg} />
            Nouveau service
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
        {byType.map(st => (
          <div key={st.type} onClick={() => setServiceFilter(serviceFilter === st.type ? null : st.type)} style={{
            padding: `${sp[2]} ${sp[3]}`, background: serviceFilter === st.type ? `${serviceColors[st.type]}15` : c.bgElevated,
            border: `1px solid ${serviceFilter === st.type ? serviceColors[st.type] : c.border}`, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{serviceIcons[st.type]}</div>
            <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: serviceColors[st.type] }}>{st.count}</div>
            <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{serviceTypes[st.type]}</div>
            <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginTop: '2px' }}>{st.active} actif{st.active > 1 ? 's' : ''}</div>
          </div>
        ))}
        <div style={{ padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}` }}>
          <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>CA Total</div>
          <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: c.green }}>{fmtMoney(totalRevenue)}</div>
          <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginTop: '2px' }}>{ecomServices.filter(s => s.status === 'delivered' || s.status === 'active').length} livrés</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: sp[3], maxWidth: 300 }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
          <Icon d={icons.search} size={13} color={c.textTertiary} />
        </div>
        <input type="text" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
          placeholder="Rechercher un service..."
          style={{ width: '100%', padding: '8px 12px 8px 30px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontSize: size.sm, fontFamily: f.body, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = c.amber}
          onBlur={e => e.target.style.borderColor = c.border}
        />
      </div>

      {/* Service cards */}
      {filtered.length === 0 ? (
        <DragonEmptyState title="Aucun service" subtitle="Créez votre premier service e-commerce pour un client." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
          {filtered.map(svc => {
            const client = allProfiles.find(p => p.id === svc.client_id)
            const shop = shops.find(s => s.id === svc.shop_id)
            const tasks = svc.tasks || []
            const doneTasks = tasks.filter(t => t.done).length
            const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

            return (
              <div key={svc.id} style={{ background: c.bgCard, border: `1px solid ${c.border}`, padding: sp[3], transition: 'all 0.2s ease', position: 'relative', animation: `cardReveal 0.5s ${ease.smooth} backwards` }}>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderTop: `2px solid ${c.gold}`, borderInlineStart: `2px solid ${c.gold}`, opacity: 0.3, pointerEvents: 'none' }} />
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[2] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                    <span style={{ fontSize: '20px' }}>{serviceIcons[svc.service_type]}</span>
                    <div>
                      <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>
                        {serviceTypes[svc.service_type]} — {packLabels[svc.pack] || svc.pack}
                      </div>
                      <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>
                        {client?.full_name || 'Client inconnu'} · {svc.platform} · {svc.price ? `${svc.price}€` : 'Gratuit'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    {/* Status dropdown */}
                    <select value={svc.status} onChange={e => handleStatusChange(svc, e.target.value)} style={{
                      padding: '4px 8px', fontSize: '10px', fontFamily: f.mono, background: c.bgElevated,
                      color: statusColors[svc.status] || c.text, border: `1px solid ${statusColors[svc.status] || c.border}`,
                      cursor: 'pointer', outline: 'none',
                    }}>
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {/* Edit button */}
                    <button onClick={() => {
                      setEditingService(svc)
                      setServiceForm({ client_id: svc.client_id || '', service_type: svc.service_type, pack: svc.pack || 'starter', platform: svc.platform || 'shopify', price: svc.price || '', notes: svc.notes || '', shop_id: svc.shop_id || '' })
                      setShowServiceModal(true)
                    }} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`, color: c.textSecondary, cursor: 'pointer' }}>
                      <Icon d={icons.edit} size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {tasks.length > 0 && (
                  <div style={{ marginBottom: sp[2] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progression</span>
                      <span style={{ fontFamily: f.mono, fontSize: '9px', color: progress === 100 ? c.green : c.amber }}>{doneTasks}/{tasks.length} — {progress}%</span>
                    </div>
                    <div style={{ height: 4, background: c.bgElevated, borderRadius: 0, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? c.green : serviceColors[svc.service_type], transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )}

                {/* Tasks checklist */}
                {tasks.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px' }}>
                    {tasks.map((task, idx) => (
                      <div key={task.key || idx} onClick={() => handleToggleTask(svc, idx)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                        background: task.done ? `${c.green}08` : 'transparent', cursor: 'pointer',
                        borderInlineStart: `2px solid ${task.done ? c.green : c.border}`,
                        transition: 'all 0.15s ease',
                      }}>
                        <div style={{
                          width: 14, height: 14, border: `1.5px solid ${task.done ? c.green : c.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: task.done ? c.green : 'transparent',
                        }}>
                          {task.done && <Icon d={icons.check} size={9} color={c.bg} sw={2.5} />}
                        </div>
                        <span style={{
                          fontSize: '11px', fontFamily: f.body, color: task.done ? c.textSecondary : c.text,
                          textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.3,
                        }}>{task.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shop link + notes */}
                {(shop || svc.notes) && (
                  <div style={{ marginTop: sp[2], paddingTop: sp[1], borderTop: `1px solid ${c.border}`, display: 'flex', gap: sp[3], flexWrap: 'wrap' }}>
                    {shop && <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold }}>🔗 {shop.name} ({shop.domain || shop.platform})</span>}
                    {svc.notes && <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>{svc.notes}</span>}
                  </div>
                )}

                {/* ── LAUNCH SITE CREATION BUTTON ── */}
                {svc.service_type === 'creation' && (svc.status === 'pending' || svc.status === 'onboarding' || svc.status === 'active') && (
                  <button onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEcomServiceForCreation(svc)
                    setSiteCreationData({ launchMethod: 'n8n' })
                    setShowSiteCreationModal(true)
                  }} style={{
                    marginTop: sp[2], width: '100%', padding: `10px ${sp[2]}`,
                    background: `${c.gold}`, color: c.bg,
                    border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: f.mono,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: `all 0.25s ${ease.luxury}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                    <Icon d={icons.plus} size={13} color={c.bg} />
                    Lancer la création du site
                  </button>
                )}

                {/* ── RE-SEND TO N8N BUTTON (for any service) ── */}
                {svc.service_type === 'creation' && (
                  <button onClick={async (e) => {
                    e.stopPropagation()
                    const client = allProfiles.find(p => p.id === svc.client_id)
                    const n8nPayload = {
                      action: 'resend',
                      client_id: svc.client_id,
                      client_name: client?.full_name || client?.email || '',
                      client_email: client?.email || '',
                      service_id: svc.id,
                      platform: svc.platform || '',
                      pack: svc.pack || '',
                      shopName: svc.shop_name || '',
                      category: svc.category || '',
                      status: svc.status,
                      notes: svc.notes || '',
                      timestamp: new Date().toISOString(),
                    }
                    try {
                      await n8nFetch('/site-creation', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(n8nPayload),
                      })
                      toast.success(t('toast.n8nSuccess'))
                    } catch (err) {
                      toast.warning(t('toast.n8nNotConfirmedWorkflow'))
                    }
                  }} style={{
                    marginTop: sp[1], width: '100%', padding: `8px ${sp[2]}`,
                    background: 'transparent', color: c.gold, border: `1px solid ${c.goldMuted}`,
                    fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: f.mono,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: `all 0.2s ${ease.smooth}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${c.goldSoft}`; e.currentTarget.style.borderColor = c.gold }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.goldMuted }}>
                    ⚡ Envoyer sur N8N
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Service Modal */}
      {showServiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: sp[3], backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={() => setShowServiceModal(false)}>
          <div style={{ background: c.bgCard, border: `1px solid ${c.borderLight}`, width: '100%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto', padding: sp[4], borderRadius: radius.sm, boxShadow: shadow.xs }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: sp[3] }}>
              {editingService ? 'Modifier le service' : 'Nouveau service e-com'}
            </h3>
            <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
              {/* Client */}
              <div>
                <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Client</label>
                <select value={serviceForm.client_id} onChange={e => setServiceForm(p => ({ ...p, client_id: e.target.value }))} required style={{
                  width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                }}>
                  <option value="">Sélectionner un client</option>
                  {allProfiles.filter(p => p.role === 'client').map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                </select>
              </div>
              {/* Type + Pack */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Type de service</label>
                  <select value={serviceForm.service_type} onChange={e => setServiceForm(p => ({ ...p, service_type: e.target.value }))} style={{
                    width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                  }}>
                    {Object.entries(serviceTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Pack</label>
                  <select value={serviceForm.pack} onChange={e => setServiceForm(p => ({ ...p, pack: e.target.value }))} style={{
                    width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                  }}>
                    {Object.entries(packLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {/* Platform + Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Plateforme</label>
                  <select value={serviceForm.platform} onChange={e => setServiceForm(p => ({ ...p, platform: e.target.value }))} style={{
                    width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                  }}>
                    <option value="shopify">Shopify</option>
                    <option value="woocommerce">WooCommerce</option>
                    <option value="prestashop">PrestaShop</option>
                    <option value="custom">Sur mesure</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Prix (EUR)</label>
                  <input type="number" value={serviceForm.price} onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))} placeholder="0" style={{
                    width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', boxSizing: 'border-box',
                  }} />
                </div>
              </div>
              {/* Linked shop */}
              {shops.length > 0 && (
                <div>
                  <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Boutique liée (optionnel)</label>
                  <select value={serviceForm.shop_id} onChange={e => setServiceForm(p => ({ ...p, shop_id: e.target.value }))} style={{
                    width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                  }}>
                    <option value="">Aucune</option>
                    {shops.filter(s => !serviceForm.client_id || s.client_id === serviceForm.client_id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>)}
                  </select>
                </div>
              )}
              {/* Notes */}
              <div>
                <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea value={serviceForm.notes} onChange={e => setServiceForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notes internes..." style={{
                  width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }} />
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end', marginTop: sp[2] }}>
                {editingService && (
                  <button type="button" onClick={async () => {
                    setConfirmDialog({
                      open: true, title: 'Supprimer ce service ?', message: 'Cette action est irréversible.',
                      onConfirm: async () => {
                        try { await deleteEcomService(editingService.id); setShowServiceModal(false); setEditingService(null); loadAll(); toast.success(t('toast.serviceDeleted')) }
                        catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                      }
                    })
                  }} style={{
                    padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                    border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  }}>Supprimer</button>
                )}
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setShowServiceModal(false)} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                  border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Annuler</button>
                <button type="submit" style={{
                  padding: `10px ${sp[3]}`, background: c.amber, color: c.bg,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>{editingService ? 'Sauvegarder' : 'Créer le service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* ════════════ MODAL: Quick Launch Boutique ════════════ */}
    {showQuickLaunchModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => setShowQuickLaunchModal(false)}>
        <div style={{
          background: c.bgCard, border: `1px solid ${c.border}`, padding: sp[4],
          maxWidth: '560px', width: '90%', position: 'relative', maxHeight: '85vh', overflowY: 'auto',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ height: 2, background: c.gold, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
            <div>
              <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md }}>Lancer une boutique</div>
              <div style={{ fontSize: size.xs, color: c.textTertiary }}>Créer + lancer directement via N8N ou manuellement</div>
            </div>
            <button onClick={() => setShowQuickLaunchModal(false)} style={{
              background: 'transparent', border: `1px solid ${c.border}`, cursor: 'pointer', padding: '6px', display: 'flex',
            }}>
              <Icon d={icons.close} size={14} color={c.textTertiary} />
            </button>
          </div>

          {/* Client */}
          <div style={{ marginBottom: sp[2] }}>
            <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Client *</label>
            <select value={quickLaunchForm.client_id} onChange={e => setQuickLaunchForm(p => ({ ...p, client_id: e.target.value }))} required style={{
              width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
            }}>
              <option value="">Sélectionner un client</option>
              {allProfiles.filter(p => p.role !== 'admin').map(p => (
                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
              ))}
            </select>
          </div>

          {/* Shop name + Platform */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], marginBottom: sp[2] }}>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Nom de la boutique</label>
              <input value={quickLaunchForm.shopName} onChange={e => setQuickLaunchForm(p => ({ ...p, shopName: e.target.value }))} placeholder="Ex: MonShop" style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Plateforme *</label>
              <select value={quickLaunchForm.platform} onChange={e => setQuickLaunchForm(p => ({ ...p, platform: e.target.value }))} style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
              }}>
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="prestashop">PrestaShop</option>
                <option value="custom">Site custom</option>
              </select>
            </div>
          </div>

          {/* Pack + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], marginBottom: sp[2] }}>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Pack</label>
              <select value={quickLaunchForm.pack} onChange={e => setQuickLaunchForm(p => ({ ...p, pack: e.target.value }))} style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
              }}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Catégorie</label>
              <select value={quickLaunchForm.category} onChange={e => setQuickLaunchForm(p => ({ ...p, category: e.target.value }))} style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
              }}>
                <option value="">Sélectionner</option>
                <option value="textile">Textile / Mode</option>
                <option value="alimentaire">Alimentaire / Halal</option>
                <option value="cosmetique">Cosmétique / Beauté</option>
                <option value="electronique">Électronique</option>
                <option value="maison">Maison / Déco</option>
                <option value="sport">Sport / Équipement</option>
                <option value="general">Généraliste</option>
              </select>
            </div>
          </div>

          {/* Branding */}
          <div style={{ marginBottom: sp[2] }}>
            <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Branding</label>
            <select value={quickLaunchForm.branding} onChange={e => setQuickLaunchForm(p => ({ ...p, branding: e.target.value }))} style={{
              width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
            }}>
              <option value="none">Pas encore de branding</option>
              <option value="basic">Logo + couleurs de base</option>
              <option value="full">Branding complet (charte graphique)</option>
            </select>
          </div>

          {/* Domain + Budget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], marginBottom: sp[2] }}>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Domaine souhaité</label>
              <input value={quickLaunchForm.domain} onChange={e => setQuickLaunchForm(p => ({ ...p, domain: e.target.value }))} placeholder="ex: monshop.fr" style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Budget (€)</label>
              <input value={quickLaunchForm.budget} onChange={e => setQuickLaunchForm(p => ({ ...p, budget: e.target.value }))} placeholder="0" type="number" style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
          </div>

          {/* Priority + Template */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], marginBottom: sp[2] }}>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Priorité</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[{ key: 'low', label: 'Basse', color: c.textTertiary }, { key: 'normal', label: 'Normale', color: c.gold }, { key: 'urgent', label: 'Urgente', color: c.red }].map(p => (
                  <button key={p.key} type="button" onClick={() => setQuickLaunchForm(prev => ({ ...prev, priority: p.key }))} style={{
                    flex: 1, padding: '6px', fontSize: '9px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
                    background: quickLaunchForm.priority === p.key ? `${p.color}15` : c.bgElevated,
                    border: `1px solid ${quickLaunchForm.priority === p.key ? p.color : c.border}`,
                    color: quickLaunchForm.priority === p.key ? p.color : c.textTertiary,
                    transition: `all 0.2s ${ease.smooth}`,
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Template</label>
              <select value={quickLaunchForm.template} onChange={e => setQuickLaunchForm(p => ({ ...p, template: e.target.value }))} style={{
                width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
              }}>
                <option value="classic">Classique</option>
                <option value="minimal">Minimal</option>
                <option value="luxury">Luxe / Premium</option>
                <option value="custom">Sur mesure</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: sp[3] }}>
            <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Notes</label>
            <textarea value={quickLaunchForm.notes} onChange={e => setQuickLaunchForm(p => ({ ...p, notes: e.target.value }))} placeholder="Instructions spéciales, infos supplémentaires..." rows={3} style={{
              width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }} />
          </div>

          {/* Launch method */}
          <div style={{ marginBottom: sp[3] }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Méthode de lancement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { key: 'n8n', label: 'Lancer via N8N (automatique)', desc: 'Webhook N8N — création automatisée', icon: '⚡' },
                { key: 'manual', label: 'Enregistrer seulement', desc: 'Créer le service sans webhook — lancer manuellement après', icon: '📝' },
              ].map(method => (
                <label key={method.key} style={{
                  display: 'flex', alignItems: 'center', gap: sp[2], padding: `10px ${sp[2]}`,
                  border: `1px solid ${quickLaunchForm.launchMethod === method.key ? c.gold : c.border}`,
                  background: quickLaunchForm.launchMethod === method.key ? `${c.gold}08` : c.bgElevated,
                  cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                }}>
                  <input type="radio" name="quickLaunchMethod" value={method.key} checked={quickLaunchForm.launchMethod === method.key}
                    onChange={() => setQuickLaunchForm(prev => ({ ...prev, launchMethod: method.key }))} />
                  <span style={{ fontSize: '16px' }}>{method.icon}</span>
                  <div>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{method.label}</div>
                    <div style={{ fontSize: '9px', color: c.textTertiary }}>{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
            <button onClick={() => setShowQuickLaunchModal(false)} style={{
              padding: `10px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.border}`,
              color: c.textTertiary, cursor: 'pointer', fontFamily: f.body, fontSize: size.sm,
            }}>Annuler</button>
            <button onClick={async () => {
              if (!quickLaunchForm.client_id) { toast.error(t('toast.clientRequired')); return }
              setQuickLaunchLoading(true)
              try {
                const client = allProfiles.find(p => p.id === quickLaunchForm.client_id)

                // 1. Create the e-com service in Supabase
                const servicePayload = {
                  client_id: quickLaunchForm.client_id,
                  service_type: 'creation',
                  pack: quickLaunchForm.pack,
                  platform: quickLaunchForm.platform,
                  price: 0,
                  notes: [quickLaunchForm.shopName && `Boutique: ${quickLaunchForm.shopName}`, quickLaunchForm.category && `Cat: ${quickLaunchForm.category}`, quickLaunchForm.notes].filter(Boolean).join(' | '),
                  tasks: [
                    { key: 'branding', label: 'Branding & identité visuelle', done: quickLaunchForm.branding === 'full' },
                    { key: 'domain', label: 'Domaine & hébergement', done: false },
                    { key: 'theme', label: 'Thème & design', done: false },
                    { key: 'catalogue', label: 'Catalogue produits', done: false },
                    { key: 'payment', label: 'Paiement configuré', done: false },
                    { key: 'shipping', label: 'Livraison configurée', done: false },
                    { key: 'legal', label: 'Pages légales (CGV, mentions)', done: false },
                    { key: 'seo', label: 'SEO de base', done: false },
                    { key: 'launch', label: 'Mise en ligne', done: false },
                  ],
                  status: quickLaunchForm.launchMethod === 'n8n' ? 'in_progress' : 'pending',
                  started_at: new Date().toISOString(),
                }
                const newService = await createEcomService(servicePayload)
                toast.success(t('toast.ecomServiceCreated'))

                // 2. If N8N, fire webhook
                if (quickLaunchForm.launchMethod === 'n8n') {
                  try {
                    const webhookPayload = {
                      client_id: quickLaunchForm.client_id,
                      client_name: client?.full_name || client?.email,
                      client_email: client?.email,
                      service_id: newService?.id || 'new',
                      platform: quickLaunchForm.platform,
                      pack: quickLaunchForm.pack,
                      shopName: quickLaunchForm.shopName,
                      category: quickLaunchForm.category,
                      branding: quickLaunchForm.branding,
                      domain: quickLaunchForm.domain || '',
                      budget: quickLaunchForm.budget || '',
                      template: quickLaunchForm.template || 'classic',
                      priority: quickLaunchForm.priority || 'normal',
                      notes: quickLaunchForm.notes,
                      timestamp: new Date().toISOString(),
                    }
                    await n8nFetch('/site-creation', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(webhookPayload),
                    })
                    toast.success(t('toast.n8nWebhookSentCreating'))
                  } catch (fetchErr) {
                    console.warn('Webhook error:', fetchErr)
                    toast.warning(t('toast.n8nWebhookNotConfirmed'))
                  }
                }

                // 3. Activate ecommerce feature for client
                const features = client?.features || {}
                if (!features.ecommerce) {
                  await updateProfile(quickLaunchForm.client_id, { features: { ...features, ecommerce: true } })
                }

                await loadAll()
                setShowQuickLaunchModal(false)
              } catch (err) {
                toast.error(tToast('genericError', { error: err.message || 'Inconnue' }))
              } finally {
                setQuickLaunchLoading(false)
              }
            }} disabled={quickLaunchLoading} style={{
              padding: `10px ${sp[4]}`, background: `${c.gold}`, color: c.bg, border: 'none',
              cursor: quickLaunchLoading ? 'not-allowed' : 'pointer', fontFamily: f.body, fontSize: size.sm,
              fontWeight: 700, opacity: quickLaunchLoading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: `all 0.25s ${ease.luxury}`,
            }}>
              {quickLaunchLoading ? 'Lancement...' : (
                <>
                  <Icon d={icons.plus} size={14} color={c.bg} />
                  {quickLaunchForm.launchMethod === 'n8n' ? 'Créer + Lancer via N8N' : 'Créer le service'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ════════════ MODAL: Site Creation Launch ════════════ */}
    {showSiteCreationModal && selectedEcomServiceForCreation && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => setShowSiteCreationModal(false)}>
        <div style={{
          background: c.bgCard, border: `1px solid ${c.border}`, padding: sp[4],
          maxWidth: '520px', width: '90%', position: 'relative',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ height: 2, background: c.gold, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
            <div>
              <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md }}>Lancer création boutique</div>
              <div style={{ fontSize: size.xs, color: c.textTertiary }}>
                {allProfiles.find(p => p.id === selectedEcomServiceForCreation.client_id)?.full_name || 'Client'}
              </div>
            </div>
            <button onClick={() => setShowSiteCreationModal(false)} style={{
              background: 'transparent', border: `1px solid ${c.border}`, cursor: 'pointer', padding: '6px', display: 'flex',
            }}>
              <Icon d={icons.close} size={14} color={c.textTertiary} />
            </button>
          </div>

          <div style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
              {[
                { label: 'Plateforme', value: selectedEcomServiceForCreation.platform || 'N/A' },
                { label: 'Pack', value: selectedEcomServiceForCreation.pack || 'N/A' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: size.sm, color: c.text, fontWeight: 600, textTransform: 'capitalize' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: sp[3] }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Méthode de lancement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { key: 'n8n', label: 'Lancer via N8N (automatique)', desc: 'Webhook N8N — lancement auto' },
                { key: 'manual', label: 'Créer manuellement', desc: 'Formulaire avec infos pré-remplies' },
              ].map(method => (
                <label key={method.key} style={{
                  display: 'flex', alignItems: 'center', gap: sp[2], padding: `8px ${sp[2]}`,
                  border: `1px solid ${siteCreationData.launchMethod === method.key ? c.gold : c.border}`,
                  background: siteCreationData.launchMethod === method.key ? `${c.gold}08` : c.bgElevated,
                  cursor: 'pointer',
                }}>
                  <input type="radio" name="launchMethod" value={method.key} checked={siteCreationData.launchMethod === method.key}
                    onChange={() => setSiteCreationData(prev => ({ ...prev, launchMethod: method.key }))} />
                  <div>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{method.label}</div>
                    <div style={{ fontSize: '9px', color: c.textTertiary }}>{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {siteCreationData.launchMethod === 'manual' && (
            <div style={{ marginBottom: sp[3], padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}` }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[2] }}>Infos pré-remplies</div>
              {[
                { label: 'Client', value: allProfiles.find(p => p.id === selectedEcomServiceForCreation.client_id)?.full_name || 'N/A' },
                { label: 'Email', value: allProfiles.find(p => p.id === selectedEcomServiceForCreation.client_id)?.email || 'N/A' },
                { label: 'Plateforme', value: selectedEcomServiceForCreation.platform },
                { label: 'Pack', value: selectedEcomServiceForCreation.pack },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? `1px solid ${c.borderSubtle}` : 'none' }}>
                  <span style={{ fontSize: size.xs, color: c.textTertiary }}>{item.label}</span>
                  <span style={{ fontSize: size.xs, color: c.text, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
            <button onClick={() => setShowSiteCreationModal(false)} style={{
              padding: `10px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.border}`,
              color: c.textTertiary, cursor: 'pointer', fontFamily: f.body, fontSize: size.sm,
            }}>Annuler</button>
            <button onClick={async () => {
              setSiteCreationLoading(true)
              try {
                const client = allProfiles.find(p => p.id === selectedEcomServiceForCreation.client_id)
                const payload = {
                  client_id: selectedEcomServiceForCreation.client_id,
                  client_name: client?.full_name || client?.email,
                  client_email: client?.email,
                  service_id: selectedEcomServiceForCreation.id,
                  platform: selectedEcomServiceForCreation.platform,
                  pack: selectedEcomServiceForCreation.pack,
                  shopName: siteCreationData.shopName || selectedEcomServiceForCreation.shop_name || '',
                  domain: siteCreationData.domain || '',
                  budget: siteCreationData.budget || '',
                  template: siteCreationData.template || 'classic',
                  priority: siteCreationData.priority || 'normal',
                  category: siteCreationData.category || selectedEcomServiceForCreation.category || '',
                  branding: siteCreationData.branding || 'none',
                  notes: siteCreationData.notes || '',
                  timestamp: new Date().toISOString(),
                }
                if (siteCreationData.launchMethod === 'n8n') {
                  try {
                    await n8nFetch('/site-creation', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })
                    toast.success(t('toast.n8nWebhookSuccess'))
                  } catch (fetchErr) {
                    toast.warning(t('toast.n8nWebhookSent'))
                  }
                } else {
                  toast.success(t('toast.manualCreationRecorded'))
                }
                await updateEcomService(selectedEcomServiceForCreation.id, { status: 'in_progress', started_at: new Date().toISOString() })
                await loadAll()
                setShowSiteCreationModal(false)
              } catch (err) { toast.error(tToast('genericError', { error: err.message || 'Inconnue' })) }
              finally { setSiteCreationLoading(false) }
            }} disabled={siteCreationLoading} style={{
              padding: `10px ${sp[3]}`, background: c.gold, color: c.bg, border: 'none',
              cursor: siteCreationLoading ? 'not-allowed' : 'pointer', fontFamily: f.body, fontSize: size.sm,
              fontWeight: 700, opacity: siteCreationLoading ? 0.6 : 1,
            }}>
              {siteCreationLoading ? 'Lancement...' : 'Lancer la création'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ════════════ MODAL: Client Feature Toggles ════════════ */}
    {showClientFeaturesModal && editingClientFeatures && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => { setShowClientFeaturesModal(false); setEditingClientFeatures(null) }}>
        <div style={{
          background: c.bgCard, border: `1px solid ${c.border}`, padding: sp[4],
          maxWidth: '480px', width: '90%', position: 'relative',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ height: 2, background: c.teal, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
            <div>
              <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md }}>Fonctionnalités Dashboard</div>
              <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>
                {allProfiles.find(p => p.id === editingClientFeatures)?.full_name || 'Client'}
              </div>
            </div>
            <button onClick={() => { setShowClientFeaturesModal(false); setEditingClientFeatures(null) }} style={{
              background: 'transparent', border: `1px solid ${c.border}`, cursor: 'pointer', padding: '6px', display: 'flex',
            }}>
              <Icon d={icons.close} size={14} color={c.textTertiary} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: sp[3] }}>
            {[
              { key: 'commandes', label: 'Commandes', desc: 'Gestion des commandes sourcing', disabled: true, color: c.red },
              { key: 'catalogue', label: 'Catalogue', desc: 'Catalogue produits par profil', color: c.gold },
              { key: 'expedition', label: 'Expédition', desc: 'Suivi des envois et logistique', color: c.teal },
              { key: 'stock', label: 'Stock', desc: "Gestion de l'inventaire", color: c.purple },
              { key: 'ecommerce', label: 'E-commerce / Boutique', desc: 'Services boutique en ligne', color: c.gold },
              { key: 'vehicules', label: 'Véhicules', desc: 'Export de véhicules', color: c.red },
              { key: 'fournisseurs', label: 'Fournisseurs', desc: 'Accès aux fournisseurs vérifiés', color: c.teal },
              { key: 'formation', label: 'Formation', desc: 'Modules de formation', color: c.purple },
            ].map(feature => (
              <label key={feature.key} style={{
                display: 'flex', alignItems: 'center', gap: sp[2], padding: `8px ${sp[2]}`,
                border: `1px solid ${clientFeatures[feature.key] ? feature.color + '30' : c.borderSubtle}`,
                background: clientFeatures[feature.key] ? `${feature.color}08` : c.bgElevated,
                cursor: feature.disabled ? 'default' : 'pointer',
                opacity: feature.disabled ? 0.7 : 1,
              }}>
                <input type="checkbox" checked={clientFeatures[feature.key] || false} onChange={(e) => {
                  if (!feature.disabled) setClientFeatures(prev => ({ ...prev, [feature.key]: e.target.checked }))
                }} disabled={feature.disabled} style={{ cursor: feature.disabled ? 'default' : 'pointer' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: size.sm, fontWeight: 600, color: clientFeatures[feature.key] ? feature.color : c.textSecondary }}>{feature.label}</div>
                  <div style={{ fontSize: '9px', color: c.textTertiary }}>{feature.desc}</div>
                </div>
                {feature.disabled && <span style={{ fontSize: '8px', fontFamily: f.mono, color: c.textTertiary }}>REQUIS</span>}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowClientFeaturesModal(false); setEditingClientFeatures(null) }} style={{
              padding: `10px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.border}`,
              color: c.textTertiary, cursor: 'pointer', fontFamily: f.body, fontSize: size.sm,
            }}>Annuler</button>
            <button onClick={async () => {
              try {
                await updateProfile(editingClientFeatures, { features: clientFeatures })
                toast.success(t('toast.featuresUpdated'))
                setShowClientFeaturesModal(false)
                setEditingClientFeatures(null)
                loadAll()
              } catch (err) { toast.error(tToast('genericError', { error: err.message || 'Inconnue' })) }
            }} style={{
              padding: `10px ${sp[3]}`, background: c.teal, color: c.bg, border: 'none',
              cursor: 'pointer', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
            }}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ════════════ MODAL: Send Formation ════════════ */}
    {showSendFormationModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => setShowSendFormationModal(false)}>
        <div style={{
          background: c.bgCard, border: `1px solid ${c.border}`, padding: sp[4],
          maxWidth: '500px', width: '90%', position: 'relative', maxHeight: '80vh', overflowY: 'auto',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ height: 2, background: c.purple, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
            <div>
              <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md }}>Envoyer formation</div>
              <div style={{ fontSize: size.xs, color: c.textTertiary }}>
                {sendFormationData.formationType === 'interne' ? 'Formation Interne (~20h)' : 'Formation Client (2H)'}
              </div>
            </div>
            <button onClick={() => setShowSendFormationModal(false)} style={{
              background: 'transparent', border: `1px solid ${c.border}`, cursor: 'pointer', padding: '6px', display: 'flex',
            }}>
              <Icon d={icons.close} size={14} color={c.textTertiary} />
            </button>
          </div>

          <div style={{ marginBottom: sp[3] }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Sélectionner les clients</div>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${c.border}`, background: c.bgElevated }}>
              {allProfiles.map(client => (
                <label key={client.id} style={{
                  display: 'flex', alignItems: 'center', gap: sp[2], padding: `8px ${sp[2]}`,
                  borderBottom: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
                  background: sendFormationData.clientIds.includes(client.id) ? `${c.purple}08` : 'transparent',
                }}>
                  <input type="checkbox" checked={sendFormationData.clientIds.includes(client.id)} onChange={(e) => {
                    const next = e.target.checked
                      ? [...sendFormationData.clientIds, client.id]
                      : sendFormationData.clientIds.filter(id => id !== client.id)
                    setSendFormationData(prev => ({ ...prev, clientIds: next }))
                  }} style={{ cursor: 'pointer' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{client.full_name || client.email}</div>
                    <div style={{ fontSize: '9px', color: c.textTertiary }}>{client.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: sp[3] }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Méthode d'envoi</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { key: 'email', label: 'Email avec lien', desc: 'Ouvre votre client mail avec lien vers la formation HTML' },
                { key: 'dashboard', label: 'Activer dans le Dashboard', desc: 'Le client verra la formation dans son tableau de bord' },
              ].map(method => (
                <label key={method.key} style={{
                  display: 'flex', alignItems: 'center', gap: sp[2], padding: `8px ${sp[2]}`,
                  border: `1px solid ${sendFormationData.deliveryMethod.includes(method.key) ? c.purple : c.border}`,
                  background: sendFormationData.deliveryMethod.includes(method.key) ? `${c.purple}08` : c.bgElevated,
                  cursor: 'pointer',
                }}>
                  <input type="checkbox" checked={sendFormationData.deliveryMethod.includes(method.key)} onChange={(e) => {
                    const next = e.target.checked
                      ? [...sendFormationData.deliveryMethod, method.key]
                      : sendFormationData.deliveryMethod.filter(m => m !== method.key)
                    setSendFormationData(prev => ({ ...prev, deliveryMethod: next }))
                  }} style={{ cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{method.label}</div>
                    <div style={{ fontSize: '9px', color: c.textTertiary }}>{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
            <button onClick={() => setShowSendFormationModal(false)} style={{
              padding: `10px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.border}`,
              color: c.textTertiary, cursor: 'pointer', fontFamily: f.body, fontSize: size.sm,
            }}>Annuler</button>
            <button onClick={async () => {
              if (!sendFormationData.clientIds.length) { toast.error(t('toast.selectClientFormation')); return }
              setSendFormationLoading(true)
              try {
                const pdfUrl = sendFormationData.formationType === 'interne'
                  ? 'https://app.caraxes.fr/FORMATION_INTERNE_CARAXES.pdf'
                  : 'https://app.caraxes.fr/FORMATION_CLIENT_CARAXES.pdf'
                const formationTitle = sendFormationData.formationType === 'interne'
                  ? 'Formation Interne CARAXES (~20h)'
                  : 'Formation Client CARAXES (2H)'

                for (const clientId of sendFormationData.clientIds) {
                  const client = allProfiles.find(p => p.id === clientId)
                  if (!client) continue

                  if (sendFormationData.deliveryMethod.includes('email')) {
                    try {
                      const response = await n8nFetch('/send-formation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          clientId,
                          clientEmail: client.email,
                          clientName: client.full_name || 'Client',
                          formationType: sendFormationData.formationType,
                          formationTitle,
                          pdfUrl,
                          senderName: 'CARAXES',
                          senderEmail: 'contact@caraxes.fr'
                        })
                      })
                      if (!response.ok) throw new Error(`Webhook error: ${response.status}`)
                    } catch (err) {
                      console.error(`Erreur envoi email pour ${client.email}:`, err)
                      toast.error(tToast('genericError', { error: 'envoi à ' + client.email }))
                    }
                  }

                  if (sendFormationData.deliveryMethod.includes('dashboard')) {
                    const formations = client.formations_enabled || []
                    if (!formations.includes(sendFormationData.formationType)) {
                      formations.push(sendFormationData.formationType)
                      await updateProfile(clientId, { formations_enabled: formations })
                    }
                  }
                }
                toast.success(t('toast.manualCreationRecorded'))
                setShowSendFormationModal(false)
                loadAll()
              } catch (err) { toast.error(tToast('genericError', { error: err.message || 'Inconnue' })) }
              finally { setSendFormationLoading(false) }
            }} disabled={sendFormationLoading} style={{
              padding: `10px ${sp[3]}`, background: c.purple, color: c.text, border: 'none',
              cursor: sendFormationLoading ? 'not-allowed' : 'pointer', fontFamily: f.body, fontSize: size.sm,
              fontWeight: 700, opacity: sendFormationLoading ? 0.6 : 1,
            }}>
              {sendFormationLoading ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
