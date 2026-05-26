/* ── CARAXES Admin — Commandes Tab ── */
import { useState, useEffect, useRef } from 'react'
import { c, f, size, sp, shadow, ease, radius, STATUSES } from '../../lib/theme'
import { VERIFIED_SUPPLIERS } from '../../lib/catalogsByProfile'
import { TIERS, getTierByKey, DEFAULT_TIER } from '../../lib/clientTiers'
import StatusPill, { ProgressBar } from '../../components/StatusPill'
import { useAdmin } from './AdminContext'
import {
  Icon, icons, fmtDate, DragonEmptyState, ArtDecoDivider,
  focusGlow, inputStyle, labelStyle, MAX_FILE_SIZE,
} from './AdminShared'
import { Modal } from '../../components/Toast'

/* ── ORDER TRACKING TIMELINE ── */
const OrderTrackingTimeline = ({ currentStatus, statuses = STATUSES }) => {
  const currentIdx = typeof currentStatus === 'number' ? currentStatus : statuses.findIndex(s => s.key === currentStatus)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, width: '100%', padding: `${sp[3]} 0` }}>
      {statuses.map((step, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const color = isCompleted || isCurrent ? (step.color || c.gold) : c.textGhost
        return (
          <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Connector line */}
            {idx > 0 && (
              <div style={{
                position: 'absolute', top: 8, right: '50%', width: '100%', height: 2,
                background: isCompleted ? (statuses[idx - 1]?.color || c.gold) : `${c.textGhost}30`,
                transition: 'background 0.4s ease',
              }} />
            )}
            {/* Dot */}
            <div style={{
              width: isCurrent ? 18 : 12, height: isCurrent ? 18 : 12,
              borderRadius: '50%', border: `2px solid ${color}`,
              background: isCompleted ? color : isCurrent ? `${color}25` : 'transparent',
              position: 'relative', zIndex: 2, transition: 'all 0.3s ease',
              animation: isCurrent ? 'trackingPulse 2s ease infinite' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isCompleted && <Icon d={icons.check} size={8} color={c.bg} sw={3} />}
            </div>
            {/* Label */}
            <div style={{
              marginTop: 6, fontFamily: f.mono, fontSize: '8px', letterSpacing: '0.04em',
              textTransform: 'uppercase', color: isCurrent ? color : isCompleted ? c.textSecondary : c.textGhost,
              fontWeight: isCurrent ? 700 : 500, textAlign: 'center', lineHeight: 1.3,
            }}>{step.label}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── CHAT BUBBLE ── */
const ChatBubble = ({ msg, isAdmin }) => (
  <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
    <div style={{ maxWidth: '65%' }}>
      <div style={{
        fontSize: '10px', fontFamily: f.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: isAdmin ? c.gold : c.textTertiary, marginBottom: '4px', fontWeight: 600,
        textAlign: isAdmin ? 'right' : 'left',
      }}>
        {isAdmin ? 'Agent CARAXES' : 'Client'}
      </div>
      <div style={{
        padding: `${sp[2]} ${sp[3]}`,
        background: isAdmin ? c.red : c.bgElevated,
        border: isAdmin ? 'none' : `1px solid ${c.border}`,
        borderRadius: radius.sm,
        position: 'relative',
        boxShadow: isAdmin ? shadow.glow : shadow.xs,
      }}>
        <div style={{ fontSize: size.sm, lineHeight: 1.6, color: c.text }}>{msg.content}</div>
        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '6px', fontFamily: f.mono, letterSpacing: '0.02em' }}>
          {fmtDate(msg.created_at)}
        </div>
      </div>
    </div>
  </div>
)

/* ── DecoPattern placeholder (matches Admin.jsx) ── */
const DecoPattern = () => null

/* ── FILTER OPTIONS ── */
const filters = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours' },
  { key: 'done', label: 'Terminées' },
]

/* ═══════════════════════════════════════════════
   COMMANDES SIDEBAR — order list with search/filters
   ═══════════════════════════════════════════════ */
export function CommandesSidebar({ selectedId, setSelectedId, setMobileShowDetail, mobileShowDetail }) {
  const {
    orders, clients, allProfiles, shipments,
    clientName, activeOrders, deliveredOrders,
    user, t, tToast, toast,
    loadAll, createOrder, setConfirmDialog,
    preselectedClientId, setPreselectedClientId,
  } = useAdmin()

  const searchInputRef = useRef(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [createOrderData, setCreateOrderData] = useState({ clientId: '', product: '', quantity: '', budget: '', deadline: '', notes: '' })

  // Auto-open create order with pre-selected client when arriving from ClientsTab "+ CMD" button
  useEffect(() => {
    if (preselectedClientId) {
      setCreateOrderData(prev => ({ ...prev, clientId: preselectedClientId }))
      setShowCreateOrder(true)
      setPreselectedClientId(null) // consume once
    }
  }, [preselectedClientId, setPreselectedClientId])

  const filtered = orders.filter(o => {
    const isDone = o.status === 6 || o.status === 'delivered' || o.status === 'livré' || o.status === 'completed'
    if (filter === 'active' && isDone) return false
    if (filter === 'done' && !isDone) return false
    if (search) {
      const q = search.toLowerCase()
      return (o.product || '').toLowerCase().includes(q) || (o.ref || '').toLowerCase().includes(q) || (clientName(o.client_id) || '').toLowerCase().includes(q)
    }
    return true
  })

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!createOrderData.clientId || !createOrderData.product) return
    try {
      await createOrder({
        clientId: createOrderData.clientId,
        product: createOrderData.product,
        quantity: createOrderData.quantity,
        budget: createOrderData.budget,
        deadline: createOrderData.deadline,
        notes: createOrderData.notes,
      })
      setCreateOrderData({ clientId: '', product: '', quantity: '', budget: '', deadline: '', notes: '' })
      setShowCreateOrder(false)
      await loadAll()
      toast.success(t('toast.orderCreated'))
    } catch (err) { toast.error(t('toast.orderCreationError')) }
  }

  return (
    <>
      <aside className="admin-sidebar" style={{
        width: '360px', borderInlineEnd: `1px solid ${c.borderSubtle}`,
        display: mobileShowDetail && window.innerWidth <= 768 ? 'none' : 'flex',
        flexDirection: 'column', background: c.bg, flexShrink: 0,
      }}>
        {/* ── Orders Analytics Header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${c.borderSubtle}` }}>
          {[
            { l: 'TOTAL', v: orders.length, col: c.gold },
            { l: 'EN COURS', v: activeOrders, col: c.red },
            { l: 'LIVRÉES', v: deliveredOrders, col: c.green },
            { l: 'CE MOIS', v: orders.filter(o => { const d = new Date(o.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length, col: c.teal },
          ].map(stat => (
            <div key={stat.l} style={{ padding: `${sp[2]} ${sp[1]}`, textAlign: 'center', borderInlineEnd: `1px solid ${c.borderSubtle}` }}>
              <div style={{ fontFamily: f.mono, fontSize: '7px', color: stat.col, letterSpacing: '0.12em', marginBottom: 3 }}>{stat.l}</div>
              <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: c.text }}>{stat.v}</div>
            </div>
          ))}
        </div>
        {/* Search & filters */}
        <div style={{ padding: `${sp[3]} ${sp[3]} ${sp[2]}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: sp[1], padding: `8px ${sp[2]}`,
            background: c.bgCard, border: `1px solid ${c.border}`, marginBottom: sp[2],
            transition: `all 0.2s ${ease.smooth}`,
          }}>
            <Icon d={icons.search} size={15} color={c.textTertiary} />
            <input ref={searchInputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text, fontSize: size.sm, fontFamily: f.body }}
              onFocus={(e) => { e.target.parentElement.style.borderColor = c.gold; e.target.parentElement.style.boxShadow = focusGlow }}
              onBlur={(e) => { e.target.parentElement.style.borderColor = c.border; e.target.parentElement.style.boxShadow = 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {filters.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                flex: 1, padding: `6px ${sp[1]}`, border: 'none',
                background: filter === key ? c.bgElevated : 'transparent',
                borderBottom: `2px solid ${filter === key ? c.gold : 'transparent'}`,
                color: filter === key ? c.gold : c.textTertiary,
                fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: f.mono,
                transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Order list */}
        <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <DragonEmptyState title="Aucune commande" subtitle="Aucun résultat pour ce filtre" />
          ) : (
            filtered.map((order, i) => {
              const isSelected = order.id === selectedId
              const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]
              return (
                <div key={order.id}
                  onClick={() => { if (setSelectedId) setSelectedId(order.id); if (setMobileShowDetail) setMobileShowDetail(true) }}
                  style={{
                    padding: `${sp[2]} ${sp[3]}`, cursor: 'pointer',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    borderInlineStart: `3px solid ${isSelected ? c.gold : 'transparent'}`,
                    background: isSelected ? c.bgElevated : 'transparent',
                    transition: `border-color 0.2s ${ease.smooth}`,
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.04em', fontWeight: 600 }}>{order.ref}</span>
                    <StatusPill status={order.status} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: size.sm, marginBottom: '4px', color: c.text, lineHeight: 1.3 }}>{order.product}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[1] }}>
                    <span style={{ fontSize: size.xs, color: c.textSecondary }}>{clientName(order.client_id)}</span>
                    <span style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
                      {(order.quantity || 0).toLocaleString('fr-FR')} u.
                    </span>
                  </div>
                  <ProgressBar value={order.progress} color={statusObj.color} height={2} />
                </div>
              )
            })
          )}
        </div>

        {/* New order button */}
        <div style={{ padding: sp[3], borderTop: `1px solid ${c.borderSubtle}` }}>
          <button onClick={() => setShowCreateOrder(true)} style={{
            width: '100%', padding: `10px ${sp[3]}`, background: c.red, color: c.text,
            border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
            cursor: 'pointer', transition: `background 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[1],
          }}>
            <Icon d={icons.plus} size={14} color={c.text} />
            Nouvelle commande
          </button>
        </div>
      </aside>

      {/* ═══════ MODAL: Nouvelle commande ═══════ */}
      <Modal open={showCreateOrder} onClose={() => setShowCreateOrder(false)} title="Nouvelle commande" maxWidth={480}>
            <ArtDecoDivider width={80} />

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select value={createOrderData.clientId} onChange={e => setCreateOrderData({...createOrderData, clientId: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingInlineEnd: sp[3]}}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                  <option value="">Sélectionner un client…</option>
                  {allProfiles.map(cl => (<option key={cl.id} value={cl.id}>{cl.full_name || cl.email}</option>))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Produit *</label>
                <input type="text" value={createOrderData.product} onChange={e => setCreateOrderData({...createOrderData, product: e.target.value})}
                  placeholder="Nom du produit" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Quantité</label>
                  <input type="number" value={createOrderData.quantity} onChange={e => setCreateOrderData({...createOrderData, quantity: e.target.value})}
                    placeholder="0" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Budget</label>
                  <input type="text" value={createOrderData.budget} onChange={e => setCreateOrderData({...createOrderData, budget: e.target.value})}
                    placeholder="ex: 500€" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Deadline</label>
                <input type="date" value={createOrderData.deadline} onChange={e => setCreateOrderData({...createOrderData, deadline: e.target.value})}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={createOrderData.notes} onChange={e => setCreateOrderData({...createOrderData, notes: e.target.value})}
                  placeholder="Détails supplémentaires…"
                  style={{...inputStyle, minHeight: '80px', fontFamily: f.body}}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                <button type="button" onClick={() => setShowCreateOrder(false)} style={{
                  flex: 1, padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                  border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
                  Annuler
                </button>
                <button type="submit" style={{
                  flex: 1, padding: `10px ${sp[3]}`, background: c.red, color: c.text,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
                  Créer la commande
                </button>
              </div>
            </form>
      </Modal>
    </>
  )
}

/* ═══════════════════════════════════════════════
   COMMANDES DETAIL — order detail view
   ═══════════════════════════════════════════════ */
export default function CommandesDetail({ selectedId, setMobileShowDetail }) {
  const {
    orders, clients, allProfiles, shipments,
    user, t, tToast, toast,
    clientName, clientInitial,
    loadAll, updateOrder, sendMessage,
    getMessages, getDocuments, uploadDocument, getDocumentUrl,
    subscribeToMessages, supabase,
    createShipment,
    setConfirmDialog,
  } = useAdmin()

  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [tab, setTab] = useState('messages')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})
  const [sendingMsg, setSendingMsg] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const selected = orders.find(o => o.id === selectedId)

  // Reset internal state when switching orders
  useEffect(() => {
    setTab('messages')
    setEditMode(false)
    setEditData({})
    setNewMsg('')
  }, [selectedId])

  // Load messages & documents when selectedId changes
  useEffect(() => {
    if (!selectedId) return
    let active = true
    Promise.all([getMessages(selectedId), getDocuments(selectedId)])
      .then(([m, d]) => { if (active) { setMessages(m); setDocuments(d) } })
      .catch(err => { if (active) console.error('Error loading messages/docs:', err) })
    return () => { active = false }
  }, [selectedId])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!selectedId) return
    const ch = subscribeToMessages(selectedId, (msg) => setMessages(prev => [...prev, msg]))
    return () => { supabase.removeChannel(ch) }
  }, [selectedId])

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  // Reset edit mode on order change
  useEffect(() => { setEditMode(false); setTab('messages') }, [selectedId])

  /* ── Handlers ── */

  const handleSendMsg = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedId || sendingMsg) return
    setSendingMsg(true)
    const text = newMsg; setNewMsg('')
    try {
      await sendMessage({ orderId: selectedId, senderId: user.id, senderRole: 'admin', content: text })
    } catch (err) {
      setNewMsg(text)
      toast.error(t('toast.messageSendError'))
    } finally { setSendingMsg(false) }
  }

  const handleStatusChange = async (newStatusKey) => {
    if (!selectedId) return
    const statusLabel = STATUSES.find(s => s.key === newStatusKey)?.label || newStatusKey
    setConfirmDialog({
      open: true,
      title: 'Changer le statut',
      message: `Passer la commande au statut « ${statusLabel} » ?`,
      onConfirm: async () => {
        setConfirmDialog({ open: false })
        try {
          const statusIndex = STATUSES.findIndex(s => s.key === newStatusKey)
          const progress = Math.round((statusIndex / (STATUSES.length - 1)) * 100)
          await updateOrder(selectedId, { status: statusIndex, progress })
          // Auto-create shipment when order goes to "shipping" (index 5)
          if (statusIndex === 5) {
            const order = orders.find(o => o.id === selectedId)
            if (order) {
              const alreadyHasShipment = shipments.some(s => s.order_id === selectedId)
              if (!alreadyHasShipment) {
                try {
                  await createShipment({
                    client_id: order.client_id,
                    order_id: order.id,
                    product_name: order.product || null,
                    tracking_number: null,
                    method: 'maritime',
                    destination: order.city || 'France',
                    origin: 'Chine',
                    weight_kg: null,
                    notes: `Auto-créé depuis commande ${order.ref}`,
                    status: 0,
                  })
                  toast.success(t('toast.shipmentCreatedAuto'))
                } catch (shipErr) { console.warn('Auto-shipment failed:', shipErr) }
              }
            }
          }
          await loadAll()
          toast.success(tToast('statusUpdatedWithLabel', { label: statusLabel }))
        } catch (err) { toast.error(t('toast.statusChangeError')) }
      },
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedId || savingEdit) return
    setSavingEdit(true)
    try {
      const payload = {}
      if (editData.quantity != null) payload.quantity = parseInt(editData.quantity, 10) || 0
      if (editData.budget != null) payload.budget = String(editData.budget)
      if (editData.deadline != null) payload.deadline = String(editData.deadline)
      if (editData.notes != null) payload.notes = String(editData.notes)
      if (editData.supplier != null) payload.supplier = String(editData.supplier)
      if (editData.city != null) payload.city = String(editData.city)
      await updateOrder(selectedId, payload)
      setEditMode(false)
      await loadAll()
      toast.success(t('toast.statusUpdated'))
    } catch (err) { toast.error(t('toast.saveError')) }
    finally { setSavingEdit(false) }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId || uploadingFile) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('toast.fileTooLarge'))
      fileInputRef.current.value = ''
      return
    }
    setUploadingFile(true)
    try {
      await uploadDocument(selectedId, file, user.id)
      const docs = await getDocuments(selectedId)
      setDocuments(docs)
      toast.success(t('toast.documentAdded'))
    } catch (err) { toast.error(t('toast.documentUploadError')) }
    finally { setUploadingFile(false); fileInputRef.current.value = '' }
  }

  const handleDownloadDoc = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      if (url) window.open(url, '_blank')
    } catch (err) { toast.error(t('toast.documentDownloadError')) }
  }

  /* ── No order selected ── */
  if (!selectedId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DragonEmptyState title="Sélectionnez une commande" subtitle="Choisissez une commande dans la liste pour voir les détails" />
      </div>
    )
  }

  /* ── Detail view ── */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header accent */}
      <div style={{ position: 'relative', height: 48, overflow: 'hidden', flexShrink: 0, background: `${c.bgCard}` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.red, opacity: 0.5 }} />
        <DecoPattern color={c.gold} opacity={0.025} />
      </div>
      {/* Order Header */}
      <div style={{ padding: `${sp[3]} ${sp[4]}`, borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button className="admin-mobile-nav" onClick={() => setMobileShowDetail(false)} style={{
              display: 'none', background: 'none', border: 'none', color: c.red,
              fontSize: size.sm, fontFamily: f.mono, cursor: 'pointer', padding: 0,
              marginBottom: '6px', letterSpacing: '0.04em',
            }}>← Retour</button>
            <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, fontWeight: 600, letterSpacing: '0.06em', marginBottom: '4px' }}>
              {selected?.ref}
            </div>
            <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '4px' }}>
              {selected?.product}
            </h2>
            <p style={{ fontSize: size.xs, color: c.textSecondary }}>
              {clientName(selected?.client_id)} · {selected?.quantity?.toLocaleString('fr-FR')} unités · {selected?.budget || '–'}
            </p>
          </div>
          <StatusPill status={selected?.status} size="lg" />
        </div>
        {/* ── Order Tracking Timeline ── */}
        <div style={{ marginTop: sp[3], padding: `0 ${sp[2]}`, background: `${c.bgCard}`, border: `1px solid ${c.borderSubtle}`, borderRadius: 0 }}>
          <OrderTrackingTimeline currentStatus={typeof selected?.status === 'number' ? selected.status : STATUSES.findIndex(s => s.key === selected?.status)} />
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0, paddingInlineStart: sp[4], gap: '2px' }}>
        {[
          { key: 'messages', label: 'Messages', icon: icons.msg },
          { key: 'details', label: 'Détails', icon: icons.edit },
          { key: 'documents', label: 'Documents', icon: icons.doc },
        ].map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding: `10px ${sp[3]}`, background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === tb.key ? c.red : 'transparent'}`,
            color: tab === tb.key ? c.text : c.textTertiary,
            fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
            transition: `all 0.2s ${ease.smooth}`,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Icon d={tb.icon} size={13} color={tab === tb.key ? c.red : c.textTertiary} />
            {tb.label}
            {tb.key === 'messages' && messages.length > 0 && (
              <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.gold, fontWeight: 700, marginInlineStart: '2px' }}>{messages.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* MESSAGES */}
        {tab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4], display: 'flex', flexDirection: 'column', gap: sp[3] }}>
              {messages.length === 0 ? (
                <DragonEmptyState title="Aucun message" subtitle="Commencez la conversation avec le client" />
              ) : (
                messages.map(msg => (
                  <ChatBubble key={msg.id} msg={msg} isAdmin={msg.sender_role === 'admin'} />
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: `${sp[2]} ${sp[4]}`, borderTop: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0 }}>
              <form onSubmit={handleSendMsg} style={{ display: 'flex', gap: sp[2] }}>
                <input
                  value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder="Votre message…"
                  style={{ flex: 1, padding: `10px ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', transition: `all 0.2s ${ease.smooth}` }}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
                <button type="submit" disabled={sendingMsg} style={{
                  padding: `10px ${sp[3]}`, background: c.gold, color: c.bg,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: sendingMsg ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', opacity: sendingMsg ? 0.6 : 1,
                }}>
                  <Icon d={icons.send} size={13} color={c.bg} sw={2} />
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DETAILS */}
        {tab === 'details' && (
          <div className="admin-scroll" style={{ padding: sp[4], overflowY: 'auto' }}>
            {/* Status Pipeline */}
            <div style={{ marginBottom: sp[4] }}>
              <div style={labelStyle}>Statut de la commande</div>
              <div style={{ display: 'flex', gap: '1px', padding: '2px', background: c.bg, border: `1px solid ${c.border}` }}>
                {STATUSES.map((st, i) => {
                  const currentIdx = typeof selected?.status === 'number' ? selected.status : STATUSES.findIndex(s => s.key === selected?.status)
                  const isActive = i === currentIdx
                  const isPast = i < currentIdx
                  return (
                    <button key={st.key} onClick={() => handleStatusChange(st.key)} style={{
                      flex: 1, padding: `8px 4px`,
                      background: isActive ? st.color : isPast ? st.bg : 'transparent',
                      border: 'none',
                      color: isActive ? c.bg : isPast ? st.color : c.textTertiary,
                      fontSize: '9px', fontFamily: f.mono, fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer', letterSpacing: '0.02em',
                      transition: `all 0.2s ${ease.smooth}`, textAlign: 'center', lineHeight: 1.3,
                      position: 'relative',
                    }}>
                      {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: c.bg, opacity: 0.3 }} />}
                      {isPast ? '✓ ' : ''}{st.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Client info */}
            {(() => {
              const clientProfile = allProfiles.find(p => p.id === selected?.client_id)
              const tier = getTierByKey(clientProfile?.client_tier || DEFAULT_TIER)
              return clientProfile ? (
                <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: tier.color }} />
                  <div style={labelStyle}>Client</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                    <div style={{
                      width: '32px', height: '32px', background: c.bgElevated, border: `1px solid ${c.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold,
                    }}>
                      {clientInitial(selected?.client_id)}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>
                      {clientProfile.full_name || clientProfile.email}
                    </span>
                    <span style={{
                      padding: '2px 8px', background: tier.colorSoft, border: `1px solid ${tier.color}33`,
                      color: tier.color, fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                    }}>
                      {tier.icon} {tier.label}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp[1], fontSize: size.xs, color: c.textSecondary }}>
                    <div>{clientProfile.email}</div>
                    <div>{clientProfile.phone || '—'}</div>
                    <div>{clientProfile.company || '—'}</div>
                    <div>{clientProfile.city || '—'}</div>
                  </div>
                </div>
              ) : null
            })()}

            {/* Order fields */}
            {!editMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp[3] }}>
                {[
                  { label: 'Quantité', value: (selected?.quantity || 0).toLocaleString('fr-FR') },
                  { label: 'Budget', value: selected?.budget || '–' },
                  { label: 'Deadline', value: selected?.deadline || '–' },
                  { label: 'Notes', value: selected?.notes || '–', col: 2 },
                ].map((field, i) => (
                  <div key={i} style={{ gridColumn: field.col ? `span ${field.col}` : 'auto' }}>
                    <div style={labelStyle}>{field.label}</div>
                    <div style={{ padding: sp[2], background: c.bgCard, border: `1px solid ${c.border}`, fontSize: size.sm, color: c.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp[3], maxWidth: '600px' }}>
                {[
                  { key: 'quantity', label: 'Quantité' },
                  { key: 'budget', label: 'Budget' },
                  { key: 'deadline', label: 'Deadline' },
                  { key: 'notes', label: 'Notes', col: 2 },
                ].map(field => (
                  <div key={field.key} style={{ gridColumn: field.col ? `span ${field.col}` : 'auto' }}>
                    <label style={labelStyle}>{field.label}</label>
                    <textarea
                      value={editData[field.key] ?? (selected?.[field.key] || '')}
                      onChange={e => setEditData({...editData, [field.key]: e.target.value})}
                      style={{...inputStyle, minHeight: field.col ? '100px' : 'auto'}}
                      onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                      onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ marginTop: sp[4], display: 'flex', gap: sp[2], paddingTop: sp[3], borderTop: `1px solid ${c.border}` }}>
              {!editMode ? (
                <button onClick={() => { setEditMode(true); setEditData({ quantity: selected?.quantity ?? '', budget: selected?.budget ?? '', deadline: selected?.deadline ?? '', notes: selected?.notes ?? '', supplier: selected?.supplier ?? '', city: selected?.city ?? '' }) }} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.blue, border: `1px solid ${c.blue}`,
                  fontFamily: f.body, fontWeight: 700, fontSize: size.sm, cursor: 'pointer',
                  transition: `all 0.2s ${ease.smooth}`, display: 'flex', alignItems: 'center', gap: '6px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.blue; e.currentTarget.style.color = c.bg }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.blue }}>
                  <Icon d={icons.edit} size={14} />
                  Modifier
                </button>
              ) : (
                <>
                  <button onClick={handleSaveEdit} disabled={savingEdit} style={{
                    padding: `10px ${sp[3]}`, background: c.green, color: c.bg, border: 'none',
                    fontFamily: f.body, fontWeight: 700, fontSize: size.sm, cursor: savingEdit ? 'wait' : 'pointer',
                    transition: `all 0.2s ${ease.smooth}`, display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: savingEdit ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = savingEdit ? '0.6' : '1' }}>
                    <Icon d={icons.check} size={14} color={c.bg} />
                    Enregistrer
                  </button>
                  <button onClick={() => setEditMode(false)} style={{
                    padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary, border: `1px solid ${c.border}`,
                    fontFamily: f.body, fontWeight: 700, fontSize: size.sm, cursor: 'pointer',
                    transition: `all 0.2s ${ease.smooth}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.color = c.red }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
                    Annuler
                  </button>
                </>
              )}
            </div>

            {/* ── SUPPLIER SUGGESTIONS ── */}
            {(() => {
              const product = (selected?.product || '').toLowerCase()
              const notes = (selected?.notes || '').toLowerCase()
              const query = product + ' ' + notes
              const keywordMap = {
                textile: ['textile', 'tissu', 'vêtement', 'abaya', 'hijab', 'foulard', 't-shirt', 'chemise', 'pantalon', 'robe', 'vetement', 'tshirt', 'habit', 'coton', 'tissu', 'confection', 'mode'],
                electronique: ['electronique', 'électronique', 'écouteur', 'chargeur', 'montre', 'smartwatch', 'led', 'cable', 'câble', 'téléphone', 'accessoire', 'bluetooth', 'usb', 'écran'],
                cosmetique: ['cosmétique', 'cosmetique', 'beauté', 'beaute', 'crème', 'creme', 'parfum', 'maquillage', 'soin', 'huile', 'savon', 'henné', 'henne', 'skincare'],
                maison: ['maison', 'meuble', 'mobilier', 'décoration', 'decoration', 'cuisine', 'vaisselle', 'bois', 'tapis', 'rideau', 'lampe', 'bureau'],
                sport: ['sport', 'ballon', 'fitness', 'gym', 'sac', 'camping', 'vélo', 'velo', 'football', 'musculation', 'yoga', 'running'],
                alimentaire: ['alimentaire', 'nourriture', 'thé', 'the', 'épice', 'epice', 'snack', 'conserve', 'huile', 'riz', 'pâtes', 'pates', 'halal', 'bio', 'sec', 'céréale'],
              }
              const matchedCats = Object.entries(keywordMap)
                .filter(([, keywords]) => keywords.some(kw => query.includes(kw)))
                .map(([cat]) => cat)
              const suggested = matchedCats.length > 0
                ? VERIFIED_SUPPLIERS.filter(s => matchedCats.includes(s.category))
                : VERIFIED_SUPPLIERS.slice(0, 3)

              return (
                <div style={{ marginTop: sp[4] }}>
                  <ArtDecoDivider color={c.teal} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2], marginTop: sp[2] }}>
                    <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" size={16} color={c.teal} />
                    <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.teal, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Fournisseurs suggérés
                    </span>
                    {matchedCats.length > 0 && (
                      <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>
                        (match: {matchedCats.join(', ')})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: sp[2] }}>
                    {suggested.map(s => {
                      const catColors = { textile: c.red, electronique: c.blue || '#6495ED', cosmetique: c.purple, maison: c.gold, sport: c.teal, alimentaire: c.green || '#4CAF50' }
                      const accent = catColors[s.category] || c.gold
                      return (
                        <div key={s.id} style={{
                          padding: sp[2], background: c.bgCard, border: `1px solid ${c.border}`,
                          borderInlineStart: `3px solid ${accent}`, transition: `all 0.2s ${ease.smooth}`,
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.borderLeftColor = accent }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{s.name}</div>
                              <div style={{ fontSize: '10px', color: c.textTertiary }}>{s.city} · MOQ {s.moq}</div>
                            </div>
                            <span style={{
                              padding: '1px 6px', fontSize: '8px', fontFamily: f.mono,
                              color: accent, border: `1px solid ${accent}33`, textTransform: 'uppercase',
                            }}>{s.category}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: c.gold, fontWeight: 600, fontFamily: f.mono, marginTop: '4px' }}>{s.priceRange}</div>
                          {s.contact?.wechat && (
                            <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono, marginTop: '2px' }}>WC: {s.contact.wechat}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {matchedCats.length === 0 && (
                    <p style={{ fontSize: size.xs, color: c.textTertiary, fontStyle: 'italic', marginTop: sp[1] }}>
                      Aucun match exact — affichage des fournisseurs principaux. Ajoutez des mots-clés produit pour un meilleur matching.
                    </p>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === 'documents' && (
          <div className="admin-scroll" style={{ padding: sp[4], overflowY: 'auto' }}>
            {/* Upload zone */}
            <div style={{ marginBottom: sp[4] }}>
              <div style={labelStyle}>Télécharger un document</div>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: sp[4], background: c.bgCard, border: `2px dashed ${c.border}`,
                textAlign: 'center', cursor: uploadingFile ? 'wait' : 'pointer',
                transition: `all 0.35s ${ease.luxury}`, gap: sp[1], minHeight: '100px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.bgElevated }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgCard }}>
                <Icon d={uploadingFile ? icons.trending : icons.upload} size={24} color={c.textTertiary} />
                <div style={{ fontSize: size.sm, color: c.text, fontWeight: 600 }}>
                  {uploadingFile ? 'Envoi en cours…' : 'Cliquez ou glissez un fichier'}
                </div>
                <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>Max 10 Mo</div>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {documents.length === 0 ? (
              <DragonEmptyState title="Aucun document" subtitle="Ajoutez des documents à cette commande" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {documents.map((doc, i) => (
                  <div key={doc.id} style={{
                    padding: `${sp[2]} ${sp[3]}`, background: c.bgCard,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                  }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: sp[2], minWidth: 0 }}>
                      <Icon d={icons.doc} size={16} color={c.gold} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_filename}</div>
                        <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>{fmtDate(doc.created_at)}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDownloadDoc(doc)} style={{
                      padding: `6px ${sp[2]}`, background: 'transparent', color: c.gold, border: `1px solid ${c.gold}`,
                      fontFamily: f.mono, fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.04em', flexShrink: 0,
                    }}>
                      <Icon d={icons.download} size={12} color="currentColor" /> Télécharger
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
