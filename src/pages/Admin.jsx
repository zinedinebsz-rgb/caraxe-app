import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients, getAllProfiles, createOrder,
  subscribeToMessages, subscribeToOrders, supabase, updateProfile,
} from '../lib/supabase'
import { CATEGORIES } from '../lib/categories'
import { TIERS, getTierByKey, DEFAULT_TIER, getTierPrice, getCategoryMOQ } from '../lib/clientTiers'
import StatusPill, { ProgressBar } from '../components/StatusPill'
import { useToast, ConfirmDialog } from '../components/Toast'
import { exportFullBackupJSON, exportBackupCSVs } from '../lib/backup'

const MAX_FILE_SIZE = 10 * 1024 * 1024

/* ── KEYFRAMES — premium ── */
const keyframes = `
@keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes spin { to { transform:rotate(360deg) } }
@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 oklch(55% 0.22 25 / 0) } 50% { box-shadow: 0 0 12px 2px oklch(55% 0.22 25 / 0.15) } }
@keyframes barReveal { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes cardReveal { from { opacity:0; transform:translateY(12px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
@keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }
`

const scrollbarCSS = `
.admin-scroll::-webkit-scrollbar { width:5px }
.admin-scroll::-webkit-scrollbar-track { background:transparent }
.admin-scroll::-webkit-scrollbar-thumb { background:oklch(22% 0.008 50); border-radius:0 }
.admin-scroll::-webkit-scrollbar-thumb:hover { background:oklch(30% 0.008 50) }
`

/* ── SVG ICONS ── */
const Icon = ({ d, size: s = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  plus: 'M12 5v14m-7-7h14',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  calendar: 'M8 7V3m8 4V3m-9 8h14a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9a2 2 0 012-2z',
  trending: 'M23 6l-9.5 9.5-5-5L1 18',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  chevDown: 'M6 9l6 6 6-6',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/* ── ART DECO ELEMENTS ── */
const ArtDecoDivider = ({ width = 80 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: `${sp[2]} 0`, width: `${width}px` }}>
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)` }} />
    <div style={{ width: 5, height: 5, background: c.gold, transform: 'rotate(45deg)', opacity: 0.6, flexShrink: 0 }} />
  </div>
)

const DragonEmptyState = ({ title, subtitle }) => (
  <div style={{ textAlign: 'center', padding: sp[6], animation: 'fadeSlideIn 0.5s ease-out' }}>
    <svg width="100" height="100" viewBox="0 0 120 120" fill="none" style={{ opacity: 0.6, margin: '0 auto', display: 'block', marginBottom: sp[3] }}>
      <path d="M60 15L75 35Q80 42 75 55Q70 65 60 70Q50 65 45 55Q40 42 55 35L60 15Z" fill={c.red} opacity="0.5"/>
      <path d="M50 45Q45 50 45 60Q45 75 60 85Q75 75 75 60Q75 50 70 45" fill={c.gold} opacity="0.3"/>
      <circle cx="55" cy="55" r="2.5" fill={c.gold} opacity="0.6"/>
      <circle cx="65" cy="55" r="2.5" fill={c.gold} opacity="0.6"/>
      <path d="M40 70Q30 75 25 90M80 70Q90 75 95 90" stroke={c.gold} strokeWidth="1.5" opacity="0.4"/>
      <path d="M60 85Q55 95 60 110M60 85Q65 95 60 110" stroke={c.red} strokeWidth="2" opacity="0.5"/>
    </svg>
    <h4 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, color: c.text }}>{title}</h4>
    <p style={{ fontSize: size.sm, color: c.textSecondary, maxWidth: '300px', margin: '0 auto', lineHeight: 1.6 }}>{subtitle}</p>
  </div>
)

/* ── CHAT BUBBLE ── */
const ChatBubble = ({ msg, isAdmin }) => (
  <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', animation: 'fadeSlideIn 0.3s ease-out' }}>
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
        position: 'relative',
      }}>
        <div style={{ fontSize: size.sm, lineHeight: 1.6, color: c.text }}>{msg.content}</div>
        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '6px', fontFamily: f.mono, letterSpacing: '0.02em' }}>
          {fmtDate(msg.created_at)}
        </div>
      </div>
    </div>
  </div>
)

export default function Admin({ user, profile, onSignOut }) {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [tab, setTab] = useState('messages')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})
  const [mainTab, setMainTab] = useState('commandes')
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [createOrderData, setCreateOrderData] = useState({ clientId: '', product: '', quantity: '', budget: '', deadline: '', notes: '' })
  const [selectedClientTab, setSelectedClientTab] = useState(null)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ open: false })
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const loadAll = useCallback(async () => {
    const [ordersData, clientsData, profilesData] = await Promise.all([getOrders(), getAllClients(), getAllProfiles()])
    setOrders(ordersData); setClients(clientsData); setAllProfiles(profilesData); setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    const ch = subscribeToOrders(() => loadAll())
    return () => { supabase.removeChannel(ch) }
  }, [loadAll])

  const selected = orders.find(o => o.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    Promise.all([getMessages(selectedId), getDocuments(selectedId)])
      .then(([m, d]) => { setMessages(m); setDocuments(d) })
      .catch(err => console.error('Error loading messages/docs:', err))
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const ch = subscribeToMessages(selectedId, (msg) => setMessages(prev => [...prev, msg]))
    return () => { supabase.removeChannel(ch) }
  }, [selectedId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const clientName = (clientId) => {
    const cl = allProfiles.find(x => x.id === clientId) || clients.find(x => x.id === clientId)
    return cl ? (cl.full_name || cl.email) : 'Inconnu'
  }

  const clientInitial = (clientId) => clientName(clientId).charAt(0).toUpperCase()

  const filtered = orders.filter(o => {
    const isDone = o.status === 'delivered' || o.status === 'completed'
    if (filter === 'active' && isDone) return false
    if (filter === 'done' && !isDone) return false
    if (search) {
      const q = search.toLowerCase()
      return o.product.toLowerCase().includes(q) || o.ref?.toLowerCase().includes(q) || clientName(o.client_id).toLowerCase().includes(q)
    }
    return true
  })

  const handleSendMsg = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedId || sendingMsg) return
    setSendingMsg(true)
    const text = newMsg; setNewMsg('')
    try {
      await sendMessage({ orderId: selectedId, senderId: user.id, senderRole: 'admin', content: text })
    } catch (err) {
      setNewMsg(text)
      toast.error('Impossible d\u2019envoyer le message.')
    } finally { setSendingMsg(false) }
  }

  const handleStatusChange = async (newStatusKey) => {
    if (!selectedId) return
    const statusLabel = STATUSES.find(s => s.key === newStatusKey)?.label || newStatusKey
    setConfirmDialog({
      open: true,
      title: 'Changer le statut',
      message: `Passer la commande au statut \u00ab ${statusLabel} \u00bb ?`,
      onConfirm: async () => {
        setConfirmDialog({ open: false })
        try {
          const statusIndex = STATUSES.findIndex(s => s.key === newStatusKey)
          const progress = Math.round((statusIndex / (STATUSES.length - 1)) * 100)
          await updateOrder(selectedId, { status: newStatusKey, progress })
          await loadAll()
          toast.success(`Statut mis \u00e0 jour : ${statusLabel}`)
        } catch (err) { toast.error('Erreur lors du changement de statut.') }
      },
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedId || savingEdit) return
    setSavingEdit(true)
    try {
      // Only send editable fields with proper types
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
      toast.success('Commande mise \u00e0 jour')
    } catch (err) { toast.error('Erreur lors de la sauvegarde.') }
    finally { setSavingEdit(false) }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId || uploadingFile) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 10 Mo)')
      fileInputRef.current.value = ''
      return
    }
    setUploadingFile(true)
    try {
      await uploadDocument(selectedId, file, user.id)
      const docs = await getDocuments(selectedId)
      setDocuments(docs)
      toast.success('Document ajout\u00e9')
    } catch (err) { toast.error('Erreur lors de l\u2019envoi du fichier.') }
    finally { setUploadingFile(false); fileInputRef.current.value = '' }
  }

  const handleDownloadDoc = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      if (url) window.open(url, '_blank')
    } catch (err) { toast.error('Impossible de t\u00e9l\u00e9charger le document.') }
  }

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
      toast.success('Commande cr\u00e9\u00e9e')
    } catch (err) { toast.error('Erreur lors de la cr\u00e9ation de la commande.') }
  }

  const getClientOrderCount = (clientId) => orders.filter(o => o.client_id === clientId).length
  const getClientLastOrderDate = (clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId)
    if (clientOrders.length === 0) return null
    return new Date(clientOrders[0].created_at)
  }

  const focusGlow = `0 0 0 3px ${c.redSoft}`
  const inputStyle = {
    width: '100%', padding: `${sp[2]} ${sp[2]}`, background: c.bgSurface,
    border: `1px solid ${c.border}`, color: c.text,
    fontSize: size.sm, outline: 'none', fontFamily: f.body,
    transition: `all 0.2s ${ease.smooth}`,
  }

  const labelStyle = {
    display: 'block', fontSize: '10px', fontWeight: 600,
    color: c.textTertiary, marginBottom: '6px', fontFamily: f.mono,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'active', label: 'En cours' },
    { key: 'done', label: 'Termin\u00e9es' },
  ]

  const mainTabs = [
    { key: 'overview', label: 'Vue d\u2019ensemble', icon: icons.trending },
    { key: 'commandes', label: 'Commandes', icon: icons.file },
    { key: 'catalogue', label: 'Catalogue', icon: icons.doc },
    { key: 'clients', label: 'Clients', icon: icons.users },
  ]

  const activeOrders = orders.filter(o => o.status !== 'delivered').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, flexDirection: 'column', gap: sp[3] }}>
      <style>{keyframes}</style>
      <div style={{ width: 36, height: 36, border: `2px solid ${c.border}`, borderTopColor: c.gold, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Chargement\u2026</span>
    </div>
  )

  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{keyframes}{scrollbarCSS}</style>

      {/* ════════════ HEADER ════════════ */}
      <header style={{
        padding: `0 ${sp[4]}`, height: '56px', borderBottom: `1px solid ${c.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: c.bgWarm, flexShrink: 0,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
            <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.95"/>
            <path d="M12 11L7 5M28 11L33 5" stroke={c.gold} strokeWidth="1.5" opacity="0.8"/>
            <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.95"/>
            <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.95"/>
            <ellipse cx="16" cy="19" rx="0.7" ry="1.6" fill={c.bg}/>
            <ellipse cx="24" cy="19" rx="0.7" ry="1.6" fill={c.bg}/>
          </svg>
          <span style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md, letterSpacing: '0.06em' }}>CARAXES</span>
          <span style={{
            fontSize: '10px', color: c.gold, padding: '2px 10px',
            border: `1px solid ${c.gold}`, fontFamily: f.mono,
            background: c.goldSoft, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Admin</span>
        </div>

        {/* Center: nav tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {mainTabs.map(t => (
            <button key={t.key} onClick={() => { setMainTab(t.key); setSelectedId(null) }} style={{
              padding: `8px ${sp[3]}`, background: mainTab === t.key ? c.bgElevated : 'transparent',
              border: 'none', borderBottom: `2px solid ${mainTab === t.key ? c.gold : 'transparent'}`,
              color: mainTab === t.key ? c.text : c.textTertiary,
              fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.3s ${ease.luxury}`, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: mainTab === t.key ? `0 2px 8px oklch(75% 0.12 85 / 0.08)` : 'none',
            }}
              onMouseEnter={(e) => { if (mainTab !== t.key) e.currentTarget.style.color = c.textSecondary }}
              onMouseLeave={(e) => { if (mainTab !== t.key) e.currentTarget.style.color = c.textTertiary }}>
              <Icon d={t.icon} size={14} color={mainTab === t.key ? c.gold : c.textTertiary} />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right: stats + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], fontFamily: f.mono, fontSize: '10px', letterSpacing: '0.04em' }}>
            <span style={{ color: c.red, fontWeight: 700 }}>{activeOrders}</span>
            <span style={{ color: c.textTertiary }}>en cours</span>
            <span style={{ color: c.border }}>|</span>
            <span style={{ color: c.green, fontWeight: 700 }}>{deliveredOrders}</span>
            <span style={{ color: c.textTertiary }}>livr\u00e9es</span>
          </div>
          <button onClick={onSignOut} style={{
            background: 'transparent', border: `1px solid ${c.border}`,
            width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: c.textTertiary, cursor: 'pointer',
            transition: `all 0.2s ${ease.smooth}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.bgHover; e.currentTarget.style.color = c.red; e.currentTarget.style.borderColor = c.red }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textTertiary; e.currentTarget.style.borderColor = c.border }}>
            <Icon d={icons.logout} size={15} />
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ════════════ SIDEBAR (Commandes) ════════════ */}
        {mainTab === 'commandes' && (
        <aside style={{
          width: '360px', borderRight: `1px solid ${c.borderSubtle}`, display: 'flex',
          flexDirection: 'column', background: c.bg, flexShrink: 0,
        }}>
          {/* Search & filters */}
          <div style={{ padding: `${sp[3]} ${sp[3]} ${sp[2]}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp[1], padding: `8px ${sp[2]}`,
              background: c.bgSurface, border: `1px solid ${c.border}`, marginBottom: sp[2],
              transition: `all 0.2s ${ease.smooth}`,
            }}>
              <Icon d={icons.search} size={15} color={c.textTertiary} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher\u2026"
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
              <DragonEmptyState title="Aucune commande" subtitle="Aucun r\u00e9sultat pour ce filtre" />
            ) : (
              filtered.map((order, i) => {
                const isSelected = order.id === selectedId
                const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]
                return (
                  <div key={order.id}
                    onClick={() => { setSelectedId(order.id); setTab('messages'); setEditMode(false) }}
                    style={{
                      padding: `${sp[2]} ${sp[3]}`, cursor: 'pointer',
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      borderLeft: `3px solid ${isSelected ? c.gold : 'transparent'}`,
                      background: isSelected ? c.bgElevated : 'transparent',
                      transition: `all 0.2s ${ease.smooth}`,
                      animation: `fadeSlideIn 0.3s ease-out ${i * 30}ms both`,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = c.bgSurface }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
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
              cursor: 'pointer', transition: `all 0.3s ${ease.out}`, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[1],
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
            onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
              <Icon d={icons.plus} size={14} color={c.text} />
              Nouvelle commande
            </button>
          </div>
        </aside>
        )}

        {/* ════════════ MAIN CONTENT ════════════ */}
        <main className="admin-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

          {/* ── OVERVIEW TAB ── */}
          {mainTab === 'overview' && (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              {/* Welcome + Backup */}
              <div style={{ marginBottom: sp[5], animation: 'fadeSlideIn 0.5s ease-out', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, marginBottom: sp[1], letterSpacing: '-0.02em' }}>
                    Bienvenue, {profile?.full_name?.split(' ')[0]}
                  </h1>
                  <p style={{ fontFamily: f.body, fontSize: size.sm, color: c.textSecondary }}>
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <ArtDecoDivider width={120} />
                </div>
                <div style={{ display: 'flex', gap: sp[1] }}>
                  <button onClick={async () => {
                    toast.success('Export JSON en cours\u2026')
                    try { const s = await exportFullBackupJSON(); toast.success(`Backup JSON : ${s.total_clients} clients, ${s.total_orders} commandes`) }
                    catch (e) { toast.error('Erreur export JSON') }
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
                    toast.success('Export CSV en cours\u2026')
                    try { const s = await exportBackupCSVs(); toast.success(`Backup CSV : ${s.total_clients} clients, ${s.total_orders} commandes`) }
                    catch (e) { toast.error('Erreur export CSV') }
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

              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[3], marginBottom: sp[5] }}>
                {[
                  { label: 'Clients', value: allProfiles.length, color: c.gold, sub: 'profils actifs' },
                  { label: 'En cours', value: activeOrders, color: c.red, sub: 'commandes actives' },
                  { label: 'Livr\u00e9es', value: deliveredOrders, color: c.green, sub: 'termin\u00e9es' },
                  { label: 'Total', value: orders.length, color: c.blue, sub: 'toutes commandes' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`,
                    position: 'relative', overflow: 'hidden',
                    transition: `all 0.35s ${ease.luxury}`,
                    animation: `cardReveal 0.5s ${ease.out} ${i * 100}ms both`,
                    boxShadow: shadow.card,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = shadow.cardHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadow.card }}>
                    {/* Accent line top — gradient */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${stat.color}, transparent)`, opacity: 0.7 }} />
                    {/* Subtle corner glow */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${stat.color}08, transparent)`, pointerEvents: 'none' }} />
                    <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: sp[2] }}>
                      {stat.label}
                    </div>
                    <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono, marginTop: sp[1], letterSpacing: '0.02em' }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline Distribution */}
              <div style={{ marginBottom: sp[5], padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, animation: 'fadeSlideIn 0.5s ease-out 0.2s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
                  <div>
                    <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 600, letterSpacing: '-0.01em' }}>
                      Pipeline
                    </h3>
                    <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono, marginTop: '2px', letterSpacing: '0.04em' }}>
                      R\u00e9partition des commandes par statut
                    </div>
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.gold }}>{orders.length}</div>
                </div>

                {/* Bar */}
                <div style={{ display: 'flex', gap: '1px', height: '28px', overflow: 'hidden', marginBottom: sp[3] }}>
                  {STATUSES.map((st, i) => {
                    const count = orders.filter(o => o.status === st.key).length
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

                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${sp[2]} ${sp[3]}` }}>
                  {STATUSES.map((st, i) => {
                    const count = orders.filter(o => o.status === st.key).length
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 8, height: 8, background: st.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary, letterSpacing: '0.02em' }}>{st.label}</span>
                        <span style={{ fontSize: '10px', fontFamily: f.mono, color: st.color, fontWeight: 700 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ animation: 'fadeSlideIn 0.5s ease-out 0.3s both' }}>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Activit\u00e9 r\u00e9cente
                </h3>
                <ArtDecoDivider width={80} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: sp[2] }}>
                  {orders.length === 0 ? (
                    <DragonEmptyState title="Pas de commandes" subtitle="Cr\u00e9ez votre premi\u00e8re commande pour voir l\u2019activit\u00e9 ici" />
                  ) : (
                    orders.slice(0, 8).map((order, i) => (
                      <div key={order.id} style={{
                        padding: `${sp[2]} ${sp[3]}`, background: c.bgSurface,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: `all 0.2s ${ease.smooth}`,
                        borderBottom: `1px solid ${c.borderSubtle}`,
                        cursor: 'pointer',
                        animation: `fadeSlideIn 0.3s ease-out ${i * 40}ms both`,
                      }}
                      onClick={() => { setMainTab('commandes'); setSelectedId(order.id) }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>{order.ref}</span>
                          <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product}</span>
                          <span style={{ fontSize: size.xs, color: c.textTertiary, flexShrink: 0 }}>{clientName(order.client_id)}</span>
                        </div>
                        <StatusPill status={order.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── COMMANDES TAB ── */}
          {mainTab === 'commandes' && selectedId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Order Header */}
              <div style={{ padding: `${sp[3]} ${sp[4]}`, borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, fontWeight: 600, letterSpacing: '0.06em', marginBottom: '4px' }}>
                      {selected?.ref}
                    </div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '4px' }}>
                      {selected?.product}
                    </h2>
                    <p style={{ fontSize: size.xs, color: c.textSecondary }}>
                      {clientName(selected?.client_id)} \u00b7 {selected?.quantity?.toLocaleString('fr-FR')} unit\u00e9s \u00b7 {selected?.budget}
                    </p>
                  </div>
                  <StatusPill status={selected?.status} size="lg" />
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0, paddingLeft: sp[4], gap: '2px' }}>
                {[
                  { key: 'messages', label: 'Messages', icon: icons.msg },
                  { key: 'details', label: 'D\u00e9tails', icon: icons.edit },
                  { key: 'documents', label: 'Documents', icon: icons.doc },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{
                    padding: `10px ${sp[3]}`, background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${tab === t.key ? c.red : 'transparent'}`,
                    color: tab === t.key ? c.text : c.textTertiary,
                    fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
                    transition: `all 0.2s ${ease.smooth}`,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <Icon d={t.icon} size={13} color={tab === t.key ? c.red : c.textTertiary} />
                    {t.label}
                    {t.key === 'messages' && messages.length > 0 && (
                      <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.gold, fontWeight: 700, marginLeft: '2px' }}>{messages.length}</span>
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
                          placeholder="Votre message\u2026"
                          style={{ flex: 1, padding: `10px ${sp[2]}`, background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', transition: `all 0.2s ${ease.smooth}` }}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                        />
                        <button type="submit" disabled={sendingMsg} style={{
                          padding: `10px ${sp[3]}`, background: c.gold, color: c.bg,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: sendingMsg ? 'wait' : 'pointer', transition: `all 0.2s ${ease.smooth}`,
                          display: 'flex', alignItems: 'center', gap: '6px', opacity: sendingMsg ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => { if (!sendingMsg) e.currentTarget.style.background = c.goldDim }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.gold }}>
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
                          const currentIdx = STATUSES.findIndex(s => s.key === selected?.status)
                          const isActive = st.key === selected?.status
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
                              {isPast ? '\u2713 ' : ''}{st.label}
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
                        <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden' }}>
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
                            <div>{clientProfile.phone || '\u2014'}</div>
                            <div>{clientProfile.company || '\u2014'}</div>
                            <div>{clientProfile.city || '\u2014'}</div>
                          </div>
                        </div>
                      ) : null
                    })()}

                    {/* Order fields */}
                    {!editMode ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp[3] }}>
                        {[
                          { label: 'Quantit\u00e9', value: (selected?.quantity || 0).toLocaleString('fr-FR') },
                          { label: 'Budget', value: selected?.budget || '\u2013' },
                          { label: 'Deadline', value: selected?.deadline || '\u2013' },
                          { label: 'Notes', value: selected?.notes || '\u2013', col: 2 },
                        ].map((field, i) => (
                          <div key={i} style={{ gridColumn: field.col ? `span ${field.col}` : 'auto' }}>
                            <div style={labelStyle}>{field.label}</div>
                            <div style={{ padding: sp[2], background: c.bgSurface, border: `1px solid ${c.border}`, fontSize: size.sm, color: c.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                              {field.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp[3], maxWidth: '600px' }}>
                        {[
                          { key: 'quantity', label: 'Quantit\u00e9' },
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
                  </div>
                )}

                {/* DOCUMENTS */}
                {tab === 'documents' && (
                  <div className="admin-scroll" style={{ padding: sp[4], overflowY: 'auto' }}>
                    {/* Upload zone */}
                    <div style={{ marginBottom: sp[4] }}>
                      <div style={labelStyle}>T\u00e9l\u00e9charger un document</div>
                      <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: sp[4], background: c.bgSurface, border: `2px dashed ${c.border}`,
                        textAlign: 'center', cursor: uploadingFile ? 'wait' : 'pointer',
                        transition: `all 0.3s ${ease.out}`, gap: sp[1], minHeight: '100px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.bgElevated }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgSurface }}>
                        <Icon d={uploadingFile ? icons.trending : icons.upload} size={24} color={c.textTertiary} />
                        <div style={{ fontSize: size.sm, color: c.text, fontWeight: 600 }}>
                          {uploadingFile ? 'Envoi en cours\u2026' : 'Cliquez ou glissez un fichier'}
                        </div>
                        <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>Max 10 Mo</div>
                        <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {documents.length === 0 ? (
                      <DragonEmptyState title="Aucun document" subtitle="Ajoutez des documents \u00e0 cette commande" />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {documents.map((doc, i) => (
                          <div key={doc.id} style={{
                            padding: `${sp[2]} ${sp[3]}`, background: c.bgSurface,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: `all 0.2s ${ease.smooth}`, borderBottom: `1px solid ${c.borderSubtle}`,
                            animation: `fadeSlideIn 0.3s ease-out ${i * 50}ms both`,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface }}>
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
                              transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.04em', flexShrink: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.gold; e.currentTarget.style.color = c.bg }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.gold }}>
                              <Icon d={icons.download} size={12} color="currentColor" /> T\u00e9l\u00e9charger
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : mainTab === 'commandes' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DragonEmptyState title="S\u00e9lectionnez une commande" subtitle="Choisissez une commande dans la liste pour voir les d\u00e9tails" />
            </div>
          ) : null}

          {/* ── CATALOGUE TAB ── */}
          {mainTab === 'catalogue' && (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      Catalogue Produits
                    </h2>
                    <ArtDecoDivider width={100} />
                    <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                      {CATEGORIES.length} cat\u00e9gories de sourcing \u00b7 Yiwu \u00b7 Guangzhou \u00b7 Shenzhen
                    </p>
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.gold }}>
                    \u00d75
                    <div style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary, fontWeight: 400, textAlign: 'right', letterSpacing: '0.04em' }}>marge moy.</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: sp[3] }}>
                {CATEGORIES.map((cat, i) => (
                  <div key={cat.id} style={{
                    background: c.bgSurface, border: `1px solid ${c.border}`,
                    transition: `all 0.3s ${ease.out}`, overflow: 'hidden',
                    animation: `fadeSlideIn 0.4s ease-out ${i * 50}ms both`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                    {/* Header */}
                    <div style={{ padding: `${sp[3]} ${sp[3]}`, display: 'flex', alignItems: 'center', gap: sp[2], borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <span style={{ fontSize: '26px' }}>{cat.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md, color: c.text, letterSpacing: '-0.01em' }}>{cat.name}</div>
                        <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>{cat.description}</div>
                      </div>
                    </div>

                    {/* Price Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                      {[
                        { label: 'Prix Chine', value: cat.priceChina, color: c.green },
                        { label: 'Prix France', value: cat.priceFrance, color: c.blue },
                        { label: 'Marge', value: cat.margin, color: c.gold },
                      ].map((cell, j) => (
                        <div key={j} style={{ padding: `${sp[2]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', borderBottom: `1px solid ${c.borderSubtle}` }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Notes & Locations */}
                    <div style={{ padding: `${sp[2]} ${sp[2]}` }}>
                      <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5, marginBottom: sp[1] }}>{cat.notes}</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {cat.locations.map(loc => (
                          <span key={loc} style={{
                            fontSize: '9px', fontFamily: f.mono, padding: '2px 6px',
                            background: c.bg, border: `1px solid ${c.border}`,
                            color: c.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>{loc}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CLIENTS TAB ── */}
          {mainTab === 'clients' && (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Clients
                  </h2>
                  <ArtDecoDivider width={80} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                    {allProfiles.length} profil{allProfiles.length > 1 ? 's' : ''} enregistr\u00e9{allProfiles.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setShowCreateOrder(true)} style={{
                  padding: `10px ${sp[3]}`, background: c.red, color: c.text, border: 'none',
                  fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  transition: `all 0.3s ${ease.out}`, display: 'flex', alignItems: 'center', gap: '6px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
                  <Icon d={icons.plus} size={14} color={c.text} />
                  Nouvelle commande
                </button>
              </div>

              {allProfiles.length === 0 ? (
                <DragonEmptyState title="Aucun client" subtitle="Invitez des clients pour commencer" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: sp[3] }}>
                  {allProfiles.map((client, i) => {
                    const orderCount = getClientOrderCount(client.id)
                    const lastOrderDate = getClientLastOrderDate(client.id)
                    const initial = (client.full_name || client.email).charAt(0).toUpperCase()
                    const tier = getTierByKey(client.client_tier || DEFAULT_TIER)
                    const isExpanded = selectedClientTab === client.id
                    return (
                      <div key={client.id} style={{
                        background: c.bgSurface, border: `1px solid ${c.border}`,
                        transition: `all 0.3s ${ease.out}`, overflow: 'hidden',
                        position: 'relative',
                        animation: `fadeSlideIn 0.4s ease-out ${i * 60}ms both`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = tier.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                        {/* Tier accent */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: tier.color }} />

                        {/* Client header */}
                        <div style={{ padding: `${sp[3]} ${sp[3]} ${sp[2]}`, cursor: 'pointer' }}
                          onClick={() => setSelectedClientTab(isExpanded ? null : client.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                            <div style={{
                              width: '40px', height: '40px',
                              background: c.bgElevated, border: `1px solid ${c.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: c.gold, flexShrink: 0,
                            }}>{initial}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                                <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {client.full_name || client.email}
                                </span>
                              </div>
                              <div style={{ fontSize: size.xs, color: c.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tier selector */}
                        <div style={{ display: 'flex', gap: '1px', padding: `0 ${sp[3]}`, marginBottom: sp[2] }}>
                          {TIERS.map(t => (
                            <button key={t.key} onClick={(e) => {
                              e.stopPropagation()
                              updateProfile(client.id, { client_tier: t.key }).then(() => loadAll()).catch(err => console.error('Error:', err))
                            }} style={{
                              flex: 1, padding: '5px 4px',
                              background: (client.client_tier || DEFAULT_TIER) === t.key ? t.color : 'transparent',
                              border: 'none',
                              color: (client.client_tier || DEFAULT_TIER) === t.key ? c.bg : c.textTertiary,
                              fontSize: '9px', fontFamily: f.mono,
                              fontWeight: (client.client_tier || DEFAULT_TIER) === t.key ? 700 : 400,
                              cursor: 'pointer', letterSpacing: '0.02em',
                              transition: `all 0.15s ${ease.smooth}`,
                            }}>{t.icon} {t.label}</button>
                          ))}
                        </div>

                        {/* Contact info */}
                        {(client.phone || client.company || client.city) && (
                          <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.6, padding: `0 ${sp[3]} ${sp[1]}` }}>
                            {client.company && <div style={{ fontWeight: 600, color: c.text }}>{client.company}</div>}
                            {client.phone && <div>{client.phone}</div>}
                            {client.city && <div>{client.city}</div>}
                          </div>
                        )}

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${c.borderSubtle}` }}>
                          {[
                            { label: 'Commandes', value: orderCount, color: c.gold },
                            { label: 'Derni\u00e8re', value: lastOrderDate ? lastOrderDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : '\u2013', color: c.textSecondary },
                            { label: 'Priorit\u00e9', value: tier.priorityLabel, color: tier.color },
                          ].map((cell, j) => (
                            <div key={j} style={{ padding: `${sp[2]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{cell.label}</div>
                              <div style={{ fontSize: size.xs, fontWeight: 600, color: cell.color }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Create order for this client */}
                        <button onClick={(e) => { e.stopPropagation(); setShowCreateOrder(true); setCreateOrderData(prev => ({ ...prev, clientId: client.id })) }} style={{
                          width: '100%', padding: `8px ${sp[2]}`, background: 'transparent', color: c.textTertiary, border: 'none',
                          borderTop: `1px solid ${c.borderSubtle}`,
                          fontFamily: f.mono, fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                          transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.goldSoft; e.currentTarget.style.color = c.gold }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textTertiary }}>
                          + Commande
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Client orders detail */}
              {selectedClientTab && (
                <div style={{ marginTop: sp[4], paddingTop: sp[4], borderTop: `1px solid ${c.border}`, animation: 'fadeSlideIn 0.4s ease-out' }}>
                  <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Commandes de {clientName(selectedClientTab)}
                  </h3>
                  <ArtDecoDivider width={80} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3], marginTop: sp[2] }}>
                    {orders.filter(o => o.client_id === selectedClientTab).map((order, i) => {
                      const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]
                      return (
                        <div key={order.id} style={{
                          padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                          transition: `all 0.3s ${ease.out}`, cursor: 'pointer',
                          animation: `fadeSlideIn 0.3s ease-out ${i * 50}ms both`,
                        }}
                        onClick={() => { setMainTab('commandes'); setSelectedId(order.id) }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated; e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface; e.currentTarget.style.transform = 'translateY(0)' }}>
                          <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, fontWeight: 600, letterSpacing: '0.04em', marginBottom: '4px' }}>{order.ref}</div>
                          <div style={{ fontWeight: 700, fontSize: size.sm, marginBottom: sp[1], color: c.text }}>{order.product}</div>
                          <div style={{ fontSize: size.xs, color: c.textSecondary, marginBottom: sp[2] }}>
                            {(order.quantity || 0).toLocaleString('fr-FR')} u. \u00b7 {order.budget}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: sp[1], borderTop: `1px solid ${c.borderSubtle}` }}>
                            <StatusPill status={order.status} />
                            <span style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary }}>{fmtDate(order.created_at)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ════════════ MODAL: Create Order ════════════ */}
      {showCreateOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }} onClick={() => setShowCreateOrder(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
            animation: 'fadeSlideIn 0.3s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={() => setShowCreateOrder(false)} style={{
              position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: 0, width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = c.red }}
            onMouseLeave={(e) => { e.currentTarget.style.color = c.textTertiary }}>
              <Icon d={icons.close} size={16} />
            </button>

            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.01em' }}>
              Nouvelle commande
            </h2>
            <ArtDecoDivider width={80} />

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select value={createOrderData.clientId} onChange={e => setCreateOrderData({...createOrderData, clientId: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: sp[3]}}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                  <option value="">S\u00e9lectionner un client\u2026</option>
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
                  <label style={labelStyle}>Quantit\u00e9</label>
                  <input type="number" value={createOrderData.quantity} onChange={e => setCreateOrderData({...createOrderData, quantity: e.target.value})}
                    placeholder="0" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Budget</label>
                  <input type="text" value={createOrderData.budget} onChange={e => setCreateOrderData({...createOrderData, budget: e.target.value})}
                    placeholder="ex: 500\u20ac" style={inputStyle}
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
                  placeholder="D\u00e9tails suppl\u00e9mentaires\u2026"
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
                  cursor: 'pointer', transition: `all 0.3s ${ease.out}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
                  Cr\u00e9er la commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  )
}
