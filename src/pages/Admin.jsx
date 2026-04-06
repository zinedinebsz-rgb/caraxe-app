import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients, getAllProfiles, createOrder,
  subscribeToMessages, subscribeToOrders, supabase, updateProfile, resetPassword,
} from '../lib/supabase'
import { CATALOGS, getCatalog } from '../lib/catalogsByProfile'
import { TIERS, getTierByKey, DEFAULT_TIER, getTierPrice, getTierMOQ } from '../lib/clientTiers'
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
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
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
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [catalogProduct, setCatalogProduct] = useState(null) // selected product for detail/edit
  const [catalogEditData, setCatalogEditData] = useState(null) // editing state
  const [clientPasswordModal, setClientPasswordModal] = useState(null) // client for password management
  const [newTempPassword, setNewTempPassword] = useState('')
  const [passwordAction, setPasswordAction] = useState(null) // 'reset' | 'set' | null
  const [passwordLoading, setPasswordLoading] = useState(false)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setMainTab('commandes')
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const clientName = (clientId) => {
    const cl = allProfiles.find(x => x.id === clientId) || clients.find(x => x.id === clientId)
    return cl ? (cl.full_name || cl.email) : 'Inconnu'
  }

  const clientInitial = (clientId) => clientName(clientId).charAt(0).toUpperCase()

  const filtered = orders.filter(o => {
    const isDone = o.status === 6 || o.status === 'delivered' || o.status === 'completed'
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
      toast.error('Impossible d’envoyer le message.')
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
          await loadAll()
          toast.success(`Statut mis à jour : ${statusLabel}`)
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
      toast.success('Commande mise à jour')
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
      toast.success('Document ajouté')
    } catch (err) { toast.error('Erreur lors de l’envoi du fichier.') }
    finally { setUploadingFile(false); fileInputRef.current.value = '' }
  }

  const handleDownloadDoc = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      if (url) window.open(url, '_blank')
    } catch (err) { toast.error('Impossible de télécharger le document.') }
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
      toast.success('Commande créée')
    } catch (err) { toast.error('Erreur lors de la création de la commande.') }
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
    { key: 'done', label: 'Terminées' },
  ]

  const mainTabs = [
    { key: 'overview', label: 'Vue d’ensemble', icon: icons.trending },
    { key: 'commandes', label: 'Commandes', icon: icons.file },
    { key: 'catalogue', label: 'Catalogue', icon: icons.doc },
    { key: 'clients', label: 'Clients', icon: icons.users },
  ]

  const activeOrders = orders.filter(o => o.status !== 6 && o.status !== 'delivered').length
  const deliveredOrders = orders.filter(o => o.status === 6 || o.status === 'delivered').length

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, flexDirection: 'column', gap: sp[3] }}>
      <style>{keyframes}</style>
      <div style={{ width: 36, height: 36, border: `2px solid ${c.border}`, borderTopColor: c.gold, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Chargement…</span>
    </div>
  )

  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{keyframes}{scrollbarCSS}{`
        @media (max-width: 768px) {
          .admin-nav-center { display: none !important; }
          .admin-stats { display: none !important; }
          .admin-sidebar { width: 100% !important; }
          .admin-detail { width: 100% !important; }
          .admin-mobile-nav { display: flex !important; }
        }
      `}</style>

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
        <nav className="admin-nav-center" style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
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
          <div className="admin-stats" style={{ display: 'flex', alignItems: 'center', gap: sp[2], fontFamily: f.mono, fontSize: '10px', letterSpacing: '0.04em' }}>
            <span style={{ color: c.red, fontWeight: 700 }}>{activeOrders}</span>
            <span style={{ color: c.textTertiary }}>en cours</span>
            <span style={{ color: c.border }}>|</span>
            <span style={{ color: c.green, fontWeight: 700 }}>{deliveredOrders}</span>
            <span style={{ color: c.textTertiary }}>livrées</span>
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

      {/* Mobile nav tabs */}
      <div className="admin-mobile-nav" style={{
        display: 'none', gap: '1px', background: c.bgSurface,
        borderBottom: `1px solid ${c.border}`, flexShrink: 0, overflow: 'auto',
      }}>
        {mainTabs.map(t => (
          <button key={t.key} onClick={() => { setMainTab(t.key); setSelectedId(null) }} style={{
            flex: 1, padding: '10px 4px', background: mainTab === t.key ? c.bgElevated : 'transparent',
            border: 'none', borderBottom: `2px solid ${mainTab === t.key ? c.gold : 'transparent'}`,
            color: mainTab === t.key ? c.text : c.textTertiary,
            fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: f.mono,
            letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ════════════ SIDEBAR (Commandes) ════════════ */}
        {mainTab === 'commandes' && (
        <aside className="admin-sidebar" style={{
          width: '360px', borderRight: `1px solid ${c.borderSubtle}`,
          display: mobileShowDetail && window.innerWidth <= 768 ? 'none' : 'flex',
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
                    onClick={() => { setSelectedId(order.id); setTab('messages'); setEditMode(false); setMobileShowDetail(true) }}
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
        <main className="admin-scroll admin-detail" style={{ flex: 1, display: !mobileShowDetail && window.innerWidth <= 768 && mainTab === 'commandes' ? 'none' : 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

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
                    toast.success('Export JSON en cours…')
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
                    toast.success('Export CSV en cours…')
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
                  { label: 'Clients', value: allProfiles.length, color: c.gold, sub: `${allProfiles.filter(p => p.client_tier === 'grossiste' || p.client_tier === 'pro').length} grossistes/pro` },
                  { label: 'En cours', value: activeOrders, color: c.red, sub: orders.length > 0 ? `${Math.round((activeOrders / orders.length) * 100)}% du total` : '0%' },
                  { label: 'Livrées', value: deliveredOrders, color: c.green, sub: orders.length > 0 ? `taux: ${Math.round((deliveredOrders / orders.length) * 100)}%` : '0%' },
                  { label: 'Ce mois', value: orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth() && new Date(o.created_at).getFullYear() === new Date().getFullYear()).length, color: c.blue, sub: new Date().toLocaleDateString('fr-FR', { month: 'long' }) },
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
                      Répartition des commandes par statut
                    </div>
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.gold }}>{orders.length}</div>
                </div>

                {/* Bar */}
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

                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${sp[2]} ${sp[3]}` }}>
                  {STATUSES.map((st, i) => {
                    const count = orders.filter(o => o.status === i).length
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
                  Activité récente
                </h3>
                <ArtDecoDivider width={80} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: sp[2] }}>
                  {orders.length === 0 ? (
                    <DragonEmptyState title="Pas de commandes" subtitle="Créez votre première commande pour voir l’activité ici" />
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
                      {clientName(selected?.client_id)} · {selected?.quantity?.toLocaleString('fr-FR')} unités · {selected?.budget}
                    </p>
                  </div>
                  <StatusPill status={selected?.status} size="lg" />
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0, paddingLeft: sp[4], gap: '2px' }}>
                {[
                  { key: 'messages', label: 'Messages', icon: icons.msg },
                  { key: 'details', label: 'Détails', icon: icons.edit },
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
                          placeholder="Votre message…"
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
                            <div style={{ padding: sp[2], background: c.bgSurface, border: `1px solid ${c.border}`, fontSize: size.sm, color: c.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
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
                        padding: sp[4], background: c.bgSurface, border: `2px dashed ${c.border}`,
                        textAlign: 'center', cursor: uploadingFile ? 'wait' : 'pointer',
                        transition: `all 0.3s ${ease.out}`, gap: sp[1], minHeight: '100px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.bgElevated }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgSurface }}>
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
          ) : mainTab === 'commandes' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DragonEmptyState title="Sélectionnez une commande" subtitle="Choisissez une commande dans la liste pour voir les détails" />
            </div>
          ) : null}

          {/* ── CATALOGUE TAB ── */}
          {mainTab === 'catalogue' && (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      Catalogue par Profil
                    </h2>
                    <ArtDecoDivider width={100} />
                    <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                      {TIERS.length} profils clients · {Object.values(CATALOGS).flat().length} catégories au total
                    </p>
                  </div>
                </div>
              </div>

              {/* Tier sections */}
              {TIERS.map(t => {
                const tierCatalog = getCatalog(t.key)
                return (
                <div key={t.key} style={{ marginBottom: sp[5] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[3] }}>
                    <span style={{ fontSize: '20px' }}>{t.icon}</span>
                    <span style={{
                      fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: t.color,
                    }}>{t.label}</span>
                    <span style={{
                      fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
                      padding: '2px 8px', background: t.colorSoft, border: `1px solid ${t.color}33`,
                      letterSpacing: '0.04em',
                    }}>{tierCatalog.length} catégories</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: sp[2] }}>
                    {tierCatalog.map((cat, i) => (
                      <div key={cat.id} style={{
                        background: c.bgSurface, border: `1px solid ${c.border}`,
                        transition: `all 0.3s ${ease.out}`, overflow: 'hidden', cursor: 'pointer',
                      }}
                      onClick={() => { setCatalogProduct({ ...cat, tierKey: t.key, tierLabel: t.label, tierColor: t.color }); setCatalogEditData(null) }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                        <div style={{ height: 2, background: t.color }} />
                        <div style={{ padding: `${sp[2]} ${sp[3]}`, display: 'flex', alignItems: 'center', gap: sp[2] }}>
                          <span style={{ fontSize: '22px' }}>{cat.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, color: c.text }}>{cat.name}</div>
                            <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px', lineHeight: 1.4 }}>{cat.description}</div>
                          </div>
                          <Icon d={icons.chevDown} size={14} color={c.textTertiary} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${c.borderSubtle}` }}>
                          {[
                            { label: 'Prix', value: cat.priceRange, color: c.green },
                            { label: 'Marge', value: cat.margin, color: c.gold },
                            { label: 'MOQ', value: cat.moq.toLocaleString('fr-FR'), color: c.amber },
                          ].map((cell, j) => (
                            <div key={j} style={{ padding: `${sp[1]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.xs, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: `${sp[1]} ${sp[2]}`, display: 'flex', gap: '3px', flexWrap: 'wrap', borderTop: `1px solid ${c.borderSubtle}` }}>
                          {cat.topProducts.slice(0, 3).map((p, pi) => (
                            <span key={pi} style={{ fontSize: '9px', color: c.textTertiary, padding: '1px 6px', background: c.bg, border: `1px solid ${c.borderSubtle}` }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )
              })}

              {/* ── CATALOG PRODUCT DETAIL MODAL ── */}
              {catalogProduct && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'fadeSlideIn 0.2s ease-out',
                }} onClick={() => { setCatalogProduct(null); setCatalogEditData(null) }}>
                  <div style={{
                    width: '95%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
                    background: c.bgSurface, border: `1px solid ${c.border}`,
                  }} onClick={(e) => e.stopPropagation()} className="admin-scroll">
                    {/* Header bar */}
                    <div style={{ height: 3, background: catalogProduct.tierColor }} />
                    <div style={{ padding: `${sp[3]} ${sp[4]}` }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: sp[3] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                          <span style={{ fontSize: '32px' }}>{catalogProduct.icon}</span>
                          <div>
                            <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0 }}>{catalogEditData ? catalogEditData.name : catalogProduct.name}</h3>
                            <span style={{
                              fontFamily: f.mono, fontSize: '10px', color: catalogProduct.tierColor,
                              padding: '2px 8px', background: `${catalogProduct.tierColor}15`, border: `1px solid ${catalogProduct.tierColor}33`,
                              marginTop: '4px', display: 'inline-block',
                            }}>{catalogProduct.tierLabel}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: sp[1] }}>
                          {!catalogEditData ? (
                            <button onClick={() => setCatalogEditData({ ...catalogProduct })} style={{
                              padding: `6px ${sp[2]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                              color: c.gold, fontSize: size.xs, fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                              <Icon d={icons.edit} size={12} color={c.gold} /> Modifier
                            </button>
                          ) : (
                            <>
                              <button onClick={() => {
                                // Save edits to catalogsByProfile (in-memory for now, persisted when connected to DB)
                                const tierCat = CATALOGS[catalogEditData.tierKey]
                                if (tierCat) {
                                  const idx = tierCat.findIndex(x => x.id === catalogEditData.id)
                                  if (idx !== -1) {
                                    tierCat[idx] = { ...tierCat[idx], name: catalogEditData.name, description: catalogEditData.description, priceRange: catalogEditData.priceRange, moq: Number(catalogEditData.moq), margin: catalogEditData.margin, topProducts: catalogEditData.topProducts, locations: catalogEditData.locations }
                                  }
                                }
                                setCatalogProduct({ ...catalogEditData })
                                setCatalogEditData(null)
                                toast.success('Produit mis à jour')
                              }} style={{
                                padding: `6px ${sp[2]}`, background: c.green, border: 'none',
                                color: c.white, fontSize: size.xs, fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                              }}>
                                <Icon d={icons.save} size={12} color={c.white} /> Sauvegarder
                              </button>
                              <button onClick={() => setCatalogEditData(null)} style={{
                                padding: `6px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                                color: c.textTertiary, fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer',
                              }}>Annuler</button>
                            </>
                          )}
                          <button onClick={() => { setCatalogProduct(null); setCatalogEditData(null) }} style={{
                            padding: '6px', background: 'transparent', border: `1px solid ${c.border}`,
                            color: c.textTertiary, cursor: 'pointer', display: 'flex',
                          }}>
                            <Icon d={icons.close} size={14} color={c.textTertiary} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: sp[3] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>Description</div>
                        {catalogEditData ? (
                          <textarea value={catalogEditData.description} onChange={(e) => setCatalogEditData({ ...catalogEditData, description: e.target.value })} style={{
                            width: '100%', padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`,
                            color: c.text, fontFamily: f.body, fontSize: size.sm, resize: 'vertical', minHeight: '60px', outline: 'none',
                          }} />
                        ) : (
                          <p style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6, margin: 0 }}>{catalogProduct.description}</p>
                        )}
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2], marginBottom: sp[3] }}>
                        {[
                          { label: 'Fourchette prix', key: 'priceRange', color: c.green },
                          { label: 'Marge indicative', key: 'margin', color: c.gold },
                          { label: 'MOQ minimum', key: 'moq', color: c.amber, isMoq: true },
                        ].map((field) => (
                          <div key={field.key} style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}` }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>{field.label}</div>
                            {catalogEditData ? (
                              <input value={catalogEditData[field.key]} onChange={(e) => setCatalogEditData({ ...catalogEditData, [field.key]: field.isMoq ? e.target.value : e.target.value })} style={{
                                width: '100%', padding: '4px 6px', background: c.bg, border: `1px solid ${c.border}`,
                                color: field.color, fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, outline: 'none',
                              }} />
                            ) : (
                              <div style={{ fontFamily: f.mono, fontSize: size.md, fontWeight: 700, color: field.color }}>
                                {field.isMoq ? Number(catalogProduct[field.key]).toLocaleString('fr-FR') : catalogProduct[field.key]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Top Products */}
                      <div style={{ marginBottom: sp[3] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>Produits phares</div>
                        {catalogEditData ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {catalogEditData.topProducts.map((p, i) => (
                              <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <input value={p} onChange={(e) => {
                                  const updated = [...catalogEditData.topProducts]
                                  updated[i] = e.target.value
                                  setCatalogEditData({ ...catalogEditData, topProducts: updated })
                                }} style={{
                                  flex: 1, padding: '4px 8px', background: c.bgElevated, border: `1px solid ${c.border}`,
                                  color: c.text, fontFamily: f.body, fontSize: size.xs, outline: 'none',
                                }} />
                                <button onClick={() => {
                                  const updated = catalogEditData.topProducts.filter((_, j) => j !== i)
                                  setCatalogEditData({ ...catalogEditData, topProducts: updated })
                                }} style={{ background: 'transparent', border: 'none', color: c.textTertiary, cursor: 'pointer', padding: '2px' }}>
                                  <Icon d={icons.close} size={10} color={c.textTertiary} />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => setCatalogEditData({ ...catalogEditData, topProducts: [...catalogEditData.topProducts, ''] })} style={{
                              padding: '4px 8px', background: 'transparent', border: `1px dashed ${c.border}`,
                              color: c.textTertiary, fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer',
                            }}>+ Ajouter un produit</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {catalogProduct.topProducts.map((p, i) => (
                              <span key={i} style={{
                                fontSize: size.xs, color: c.text, padding: '4px 10px',
                                background: c.bgElevated, border: `1px solid ${c.border}`,
                              }}>{p}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Locations */}
                      <div style={{ marginBottom: sp[3] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>Zones de sourcing</div>
                        {catalogEditData ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {catalogEditData.locations.map((loc, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input value={loc} onChange={(e) => {
                                  const updated = [...catalogEditData.locations]
                                  updated[i] = e.target.value
                                  setCatalogEditData({ ...catalogEditData, locations: updated })
                                }} style={{
                                  padding: '4px 8px', background: c.bgElevated, border: `1px solid ${c.border}`,
                                  color: c.text, fontFamily: f.body, fontSize: size.xs, outline: 'none', width: '120px',
                                }} />
                                <button onClick={() => {
                                  const updated = catalogEditData.locations.filter((_, j) => j !== i)
                                  setCatalogEditData({ ...catalogEditData, locations: updated })
                                }} style={{ background: 'transparent', border: 'none', color: c.textTertiary, cursor: 'pointer', padding: '2px' }}>
                                  <Icon d={icons.close} size={10} color={c.textTertiary} />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => setCatalogEditData({ ...catalogEditData, locations: [...catalogEditData.locations, ''] })} style={{
                              padding: '4px 8px', background: 'transparent', border: `1px dashed ${c.border}`,
                              color: c.textTertiary, fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer',
                            }}>+</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {catalogProduct.locations.map((loc, i) => (
                              <span key={i} style={{
                                fontSize: size.xs, color: c.gold, padding: '3px 10px',
                                background: c.goldSoft, border: `1px solid ${c.gold}33`,
                                fontFamily: f.mono, fontWeight: 600,
                              }}>{loc}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Supplier section (future) */}
                      <div style={{
                        padding: sp[3], background: c.bg, border: `1px dashed ${c.border}`,
                        marginBottom: sp[2],
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                          <Icon d={icons.link} size={16} color={c.textTertiary} />
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.textSecondary }}>Fournisseurs</div>
                            <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>Connectez vos fournisseurs pour ce produit</div>
                          </div>
                        </div>
                        <div style={{
                          padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[1],
                          color: c.textTertiary, fontSize: size.xs, fontFamily: f.mono,
                        }}>
                          <Icon d={icons.plus} size={12} color={c.textTertiary} />
                          Ajouter un fournisseur (bientôt disponible)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    {allProfiles.length} profil{allProfiles.length > 1 ? 's' : ''} enregistré{allProfiles.length > 1 ? 's' : ''}
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
                            { label: 'Dernière', value: lastOrderDate ? lastOrderDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : '–', color: c.textSecondary },
                            { label: 'Priorité', value: tier.priorityLabel, color: tier.color },
                          ].map((cell, j) => (
                            <div key={j} style={{ padding: `${sp[2]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{cell.label}</div>
                              <div style={{ fontSize: size.xs, fontWeight: 600, color: cell.color }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', borderTop: `1px solid ${c.borderSubtle}` }}>
                          <button onClick={(e) => { e.stopPropagation(); setShowCreateOrder(true); setCreateOrderData(prev => ({ ...prev, clientId: client.id })) }} style={{
                            flex: 1, padding: `8px ${sp[2]}`, background: 'transparent', color: c.textTertiary, border: 'none',
                            borderRight: `1px solid ${c.borderSubtle}`,
                            fontFamily: f.mono, fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                            transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.04em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.goldSoft; e.currentTarget.style.color = c.gold }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textTertiary }}>
                            <Icon d={icons.plus} size={10} color="currentColor" /> Commande
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setClientPasswordModal(client); setPasswordAction(null); setNewTempPassword('') }} style={{
                            flex: 1, padding: `8px ${sp[2]}`, background: 'transparent', color: c.textTertiary, border: 'none',
                            fontFamily: f.mono, fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                            transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.04em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${c.red}15`; e.currentTarget.style.color = c.red }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textTertiary }}>
                            <Icon d={icons.lock} size={10} color="currentColor" /> Mot de passe
                          </button>
                        </div>
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
                      const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]
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
                            {(order.quantity || 0).toLocaleString('fr-FR')} u. · {order.budget}
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

      {/* ════════════ MODAL: Client Password ════════════ */}
      {clientPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fadeSlideIn 0.2s ease-out',
        }} onClick={() => setClientPasswordModal(null)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '440px', width: '90%', position: 'relative',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ height: 2, background: c.red, position: 'absolute', top: 0, left: 0, right: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                <div style={{
                  width: 36, height: 36, background: c.bgElevated, border: `1px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon d={icons.lock} size={16} color={c.gold} />
                </div>
                <div>
                  <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md }}>Mot de passe</div>
                  <div style={{ fontSize: size.xs, color: c.textTertiary }}>{clientPasswordModal.full_name || clientPasswordModal.email}</div>
                </div>
              </div>
              <button onClick={() => setClientPasswordModal(null)} style={{
                background: 'transparent', border: `1px solid ${c.border}`, cursor: 'pointer', padding: '6px', display: 'flex',
              }}>
                <Icon d={icons.close} size={14} color={c.textTertiary} />
              </button>
            </div>

            {/* Client info */}
            <div style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
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
            </div>

            {/* Actions */}
            {!passwordAction && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                <button onClick={() => setPasswordAction('reset')} style={{
                  width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                  color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'left',
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
                  color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'left',
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
              </div>
            )}

            {/* Reset password flow */}
            {passwordAction === 'reset' && (
              <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
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
                      toast.success('Email de réinitialisation envoyé')
                      setClientPasswordModal(null)
                    } catch (err) {
                      toast.error('Erreur: ' + err.message)
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
              <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div style={{
                  padding: sp[3], background: `${c.red}10`, border: `1px solid ${c.red}33`, marginBottom: sp[3],
                }}>
                  <p style={{ fontSize: size.sm, color: c.text, lineHeight: 1.6, margin: 0 }}>
                    Ce mot de passe temporaire remplacera l’ancien. Communiquez-le au client de manière sécurisée.
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
                    if (newTempPassword.length < 8) { toast.error('Minimum 8 caractères'); return }
                    setPasswordLoading(true)
                    try {
                      // Use Supabase admin API via service role (Edge Function needed for production)
                      // For now, use the client-side updateUser for the current session workaround
                      const { error } = await supabase.auth.admin.updateUserById(clientPasswordModal.id, { password: newTempPassword })
                      if (error) throw error
                      toast.success('Mot de passe mis à jour')
                      setClientPasswordModal(null)
                      setNewTempPassword('')
                    } catch (err) {
                      // If admin API not available, fall back to reset email
                      if (err.message?.includes('not authorized') || err.message?.includes('not allowed') || err.status === 403 || err.status === 401) {
                        toast.error('Accès admin requis. Utilisez la réinitialisation par email.')
                        setPasswordAction('reset')
                      } else {
                        toast.error('Erreur: ' + (err.message || 'Inconnue'))
                      }
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
          </div>
        </div>
      )}

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
                  cursor: 'pointer', transition: `all 0.3s ${ease.out}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
                  Créer la commande
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
