import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients, getAllProfiles, createOrder,
  subscribeToMessages, subscribeToOrders, supabase, updateProfile,
} from '../lib/supabase'
import { CATEGORIES } from '../lib/categories'
import { TIERS, getTierByKey, DEFAULT_TIER, getTierPrice, getCategoryMOQ } from '../lib/clientTiers'
import StatusPill, { ProgressBar } from '../components/StatusPill'
import { useToast, ConfirmDialog } from '../components/Toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024

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
  users: 'M12 4.354a4 4 0 110 8 4 4 0 010-8zM18.268 15.6a5.955 5.955 0 01-2.448-.978c-.087.06-.177.118-.27.174a9.042 9.042 0 01-4.1 0c-.093-.056-.183-.114-.27-.174a5.955 5.955 0 01-2.448.978A9.968 9.968 0 006 21c0 .034.022.065.063.095 3.923 2.813 8.948 2.813 12.874 0 .041-.03.063-.061.063-.095a9.968 9.968 0 00-4.131-5.4z',
  calendar: 'M8 7V3m8 4V3m-9 8h14a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9a2 2 0 012-2z',
  trending: 'M13 7l.5 1.5M18 3l1 2M7 18l1-2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const getDragonIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ opacity: 0.8 }}>
    <path d="M60 15L75 35Q80 42 75 55Q70 65 60 70Q50 65 45 55Q40 42 55 35L60 15Z" fill={c.red} opacity="0.6"/>
    <path d="M50 45Q45 50 45 60Q45 75 60 85Q75 75 75 60Q75 50 70 45" fill={c.gold} opacity="0.4"/>
    <circle cx="55" cy="55" r="3" fill={c.gold} opacity="0.7"/>
    <circle cx="65" cy="55" r="3" fill={c.gold} opacity="0.7"/>
    <path d="M40 70Q30 75 25 90M80 70Q90 75 95 90" stroke={c.gold} strokeWidth="2" opacity="0.5"/>
    <path d="M60 85Q55 95 60 110M60 85Q65 95 60 110" stroke={c.red} strokeWidth="2.5" opacity="0.6"/>
  </svg>
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

  const clientInitial = (clientId) => {
    const name = clientName(clientId)
    return name.charAt(0).toUpperCase()
  }

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
    } finally {
      setSendingMsg(false)
    }
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
        } catch (err) {
          toast.error('Erreur lors du changement de statut.')
        }
      },
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedId || savingEdit) return
    setSavingEdit(true)
    try {
      await updateOrder(selectedId, editData)
      setEditMode(false)
      await loadAll()
      toast.success('Commande mise \u00e0 jour')
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSavingEdit(false)
    }
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
    } catch (err) {
      toast.error('Erreur lors de l\u2019envoi du fichier.')
    } finally {
      setUploadingFile(false)
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadDoc = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      if (url) window.open(url, '_blank')
    } catch (err) {
      toast.error('Impossible de t\u00e9l\u00e9charger le document.')
    }
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
    } catch (err) {
      toast.error('Erreur lors de la cr\u00e9ation de la commande.')
    }
  }

  const getClientOrderCount = (clientId) => orders.filter(o => o.client_id === clientId).length
  const getClientLastOrderDate = (clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId)
    if (clientOrders.length === 0) return null
    return new Date(clientOrders[0].created_at)
  }

  const inputStyle = {
    width: '100%', padding: `${sp[2]} ${sp[2]}`, background: c.bgSurface,
    border: `1px solid ${c.border}`, color: c.text,
    fontSize: size.xs, outline: 'none', fontFamily: f.body,
    transition: `all 0.2s ${ease.smooth}`,
  }

  const labelStyle = {
    display: 'block', fontSize: size.xs, fontWeight: 600,
    color: c.textTertiary, marginBottom: sp[1], fontFamily: f.mono,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'active', label: 'En cours' },
    { key: 'done', label: 'Terminées' },
  ]

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, flexDirection: 'column', gap: sp[2] }}>
      <div style={{ width: 40, height: 40, border: `2px solid ${c.border}`, borderTopColor: c.gold, borderRadius: '2px', animation: 'spin 1s linear infinite' }} />
      <span style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: size.xs, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chargement…</span>
    </div>
  )

  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        padding: `0 ${sp[4]}`, height: '64px', borderBottom: `1px solid ${c.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: c.bgWarm, flexShrink: 0, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.95"/>
            <path d="M12 11L7 5M28 11L33 5" stroke={c.gold} strokeWidth="1.5" opacity="0.85"/>
            <path d="M16 7L14 3M24 7L26 3" stroke={c.gold} strokeWidth="1" opacity="0.6"/>
            <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.95"/>
            <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.95"/>
            <ellipse cx="16" cy="19" rx="0.8" ry="1.8" fill={c.bg}/>
            <ellipse cx="24" cy="19" rx="0.8" ry="1.8" fill={c.bg}/>
          </svg>
          <span style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md, letterSpacing: '0.06em' }}>CARAXES</span>
          <span style={{
            fontSize: size.xs, color: c.gold, padding: `3px ${sp[2]}`,
            border: `1px solid ${c.gold}`, fontFamily: f.mono,
            background: c.bgElevated, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[3], fontSize: size.xs }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], color: c.textSecondary, fontFamily: f.mono }}>
            <span style={{ fontSize: size.xs, fontWeight: 600 }}>{orders.filter(o => o.status !== 'delivered').length}</span>
            <span style={{ opacity: 0.6 }}>·</span>
            <span>{orders.length} commandes</span>
          </div>
          <button onClick={onSignOut} style={{
            background: 'transparent', border: `1px solid ${c.border}`,
            width: 40, height: 40, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: c.textTertiary, cursor: 'pointer',
            transition: `all 0.2s ${ease.smooth}`, fontSize: size.xs,
          }}
          onMouseEnter={(e) => { e.target.style.background = c.bgHover; e.target.style.color = c.text }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = c.textTertiary }}>
            <Icon d={icons.logout} size={16} />
          </button>
        </div>
      </header>

      {/* ── MAIN TABS ── */}
      <nav style={{ display: 'flex', borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0, paddingLeft: sp[4] }}>
        {['overview', 'commandes', 'catalogue', 'clients'].map(t => (
          <button key={t} onClick={() => { setMainTab(t); setSelectedId(null) }} style={{
            padding: `${sp[2]} ${sp[4]}`, background: 'transparent', border: 'none',
            borderBottom: `3px solid ${mainTab === t ? c.gold : 'transparent'}`,
            color: mainTab === t ? c.text : c.textTertiary,
            fontSize: size.sm, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
            transition: `all 0.2s ${ease.smooth}`,
            textTransform: 'capitalize', letterSpacing: '0.02em',
          }}>
            {t === 'overview' && '◆ Vue d\'ensemble'}
            {t === 'commandes' && '◆ Commandes'}
            {t === 'catalogue' && '◆ Catalogue'}
            {t === 'clients' && '◆ Clients'}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── SIDEBAR (Commandes only) ── */}
        {mainTab === 'commandes' && (
        <aside style={{
          width: '380px', borderRight: `1px solid ${c.borderSubtle}`, display: 'flex',
          flexDirection: 'column', background: c.bg, flexShrink: 0, position: 'relative',
        }}>
          <div style={{ padding: sp[3], borderBottom: `1px solid ${c.borderSubtle}` }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp[2], padding: `${sp[2]} ${sp[2]}`,
              background: c.bgSurface, border: `1px solid ${c.border}`, marginBottom: sp[2],
              transition: `all 0.2s ${ease.smooth}`,
            }}>
              <Icon d={icons.search} size={16} color={c.textTertiary} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Client, produit…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text, fontSize: size.sm, fontFamily: f.body }} />
            </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: sp[1] }}>
              {filters.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  flex: 1, padding: `${sp[1]} ${sp[2]}`, border: `1px solid ${filter === key ? c.gold : c.border}`,
                  background: filter === key ? c.bgElevated : 'transparent',
                  color: filter === key ? c.gold : c.textTertiary,
                  fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.mono,
                  transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filtered.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: sp[3], textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: size.lg, marginBottom: sp[2], opacity: 0.5 }}>◇ ◇ ◇</div>
                  <div style={{ fontSize: size.sm, color: c.textSecondary }}>Aucune commande trouvée</div>
                </div>
              </div>
            ) : (
              filtered.map(order => {
                const isSelected = order.id === selectedId
                const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]
                return (
                  <div key={order.id}
                    onClick={() => { setSelectedId(order.id); setTab('messages'); setEditMode(false) }}
                    style={{
                      padding: sp[3], cursor: 'pointer',
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      borderLeft: `3px solid ${isSelected ? c.gold : 'transparent'}`,
                      background: isSelected ? c.bgElevated : 'transparent',
                      transition: `all 0.2s ${ease.smooth}`,
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[1] }}>
                      <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.gold, letterSpacing: '0.04em', fontWeight: 600 }}>{order.ref}</span>
                      <StatusPill status={order.status} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: size.md, marginBottom: sp[1], color: c.text, lineHeight: 1.3 }}>{order.product}</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, marginBottom: sp[2] }}>
                      <div>{clientName(order.client_id)}</div>
                      <div style={{ marginTop: '4px', fontFamily: f.mono, opacity: 0.7 }}>{(order.quantity || 0).toLocaleString('fr-FR')} unités · {order.budget}</div>
                    </div>
                    <ProgressBar value={order.progress} color={statusObj.color} />
                  </div>
                )
              })
            )}
          </div>

          <div style={{ padding: sp[3], borderTop: `1px solid ${c.borderSubtle}` }}>
            <button onClick={() => setShowCreateOrder(true)} style={{
              width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.red, color: c.text,
              border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
              cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { e.target.style.background = c.redDeep }}
            onMouseLeave={(e) => { e.target.style.background = c.red }}>
              + Nouvelle commande
            </button>
          </div>
        </aside>
        )}

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

          {/* OVERVIEW TAB */}
          {mainTab === 'overview' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              {/* Welcome */}
              <div style={{ marginBottom: sp[4] }}>
                <h1 style={{ fontFamily: f.display, fontSize: size['3xl'], fontWeight: 700, marginBottom: sp[1], letterSpacing: '-0.02em' }}>
                  Bienvenue, {profile?.full_name?.split(' ')[0]}
                </h1>
                <p style={{ fontFamily: f.body, fontSize: size.sm, color: c.textSecondary }}>
                  Tableau de bord de gestion · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: sp[3], marginBottom: sp[4] }}>
                {[
                  { label: 'Clients actifs', value: allProfiles.length, icon: icons.users, color: c.gold },
                  { label: 'En cours', value: orders.filter(o => o.status !== 'delivered').length, icon: icons.trending, color: c.red },
                  { label: 'Livrées', value: orders.filter(o => o.status === 'delivered').length, icon: icons.check, color: c.green },
                  { label: 'Commandes totales', value: orders.length, icon: icons.calendar, color: c.blue },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`,
                    display: 'flex', flexDirection: 'column', gap: sp[2], position: 'relative', overflow: 'hidden',
                    transition: `all 0.3s ${ease.smooth}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.background = c.bgElevated }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgSurface }}>
                    <div style={{ position: 'absolute', top: '-24px', right: '-24px', opacity: 0.08 }}>
                      <Icon d={stat.icon} size={80} color={stat.color} />
                    </div>
                    <div>
                      <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: sp[1] }}>
                        {stat.label}
                      </div>
                      <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: stat.color, letterSpacing: '-0.01em' }}>
                        {stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pipeline Overview */}
              <div style={{ marginBottom: sp[4], padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}` }}>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[2], fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Distribution du pipeline
                </h3>
                <div style={{ display: 'flex', gap: '2px', height: '20px', borderRadius: '1px', overflow: 'hidden', border: `1px solid ${c.border}` }}>
                  {STATUSES.map((st, i) => {
                    const count = orders.filter(o => o.status === st.key).length
                    const percent = orders.length > 0 ? (count / orders.length) * 100 : 0
                    return (
                      <div key={i} style={{
                        flex: percent || 0.5, background: st.color, minWidth: '2px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: `all 0.2s ${ease.smooth}`,
                        opacity: percent > 0 ? 1 : 0.3,
                      }} title={`${st.label}: ${count}`} />
                    )
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: sp[2], marginTop: sp[3] }}>
                  {STATUSES.map((st, i) => {
                    const count = orders.filter(o => o.status === st.key).length
                    return (
                      <div key={i} style={{ padding: sp[2], background: c.bg, border: `1px solid ${c.border}`, display: 'flex', gap: sp[1], alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, background: st.color, borderRadius: '50%', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.04em' }}>{st.label}</div>
                          <div style={{ fontSize: size.md, fontWeight: 700, color: st.color, fontFamily: f.display }}>
                            {count}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[3], fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Activité récente
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                  {orders.length === 0 ? (
                    <div style={{ padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: sp[3] }}>
                        {getDragonIllustration()}
                      </div>
                      <h4 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600 }}>Pas de commandes</h4>
                      <p style={{ fontSize: size.sm, color: c.textSecondary }}>Créez votre première commande pour voir l'activité ici</p>
                    </div>
                  ) : (
                    orders.slice(0, 8).map(order => {
                      const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]
                      return (
                        <div key={order.id} style={{
                          padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: `all 0.2s ${ease.smooth}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated; e.currentTarget.style.borderColor = c.textTertiary }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface; e.currentTarget.style.borderColor = c.border }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.gold, marginBottom: sp[1], fontWeight: 600, letterSpacing: '0.04em' }}>
                              {order.ref}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text, marginBottom: '4px' }}>{order.product}</div>
                            <div style={{ fontSize: size.xs, color: c.textSecondary }}>
                              {clientName(order.client_id)} · {fmtDate(order.created_at)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                            <StatusPill status={order.status} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMMANDES TAB */}
          {mainTab === 'commandes' && selectedId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Order Header */}
              <div style={{ padding: sp[4], borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[2] }}>
                  <div>
                    <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.gold, fontWeight: 600, letterSpacing: '0.04em', marginBottom: sp[1] }}>
                      {selected?.ref}
                    </div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {selected?.product}
                    </h2>
                    <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                      {clientName(selected?.client_id)} · {selected?.quantity} unités · {selected?.budget}
                    </p>
                  </div>
                  <StatusPill status={selected?.status} size="lg" />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0, paddingLeft: sp[4] }}>
                {['messages', 'details', 'documents'].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: `${sp[2]} ${sp[4]}`, background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${tab === t ? c.red : 'transparent'}`,
                    color: tab === t ? c.text : c.textTertiary,
                    fontSize: size.sm, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
                    transition: `all 0.2s ${ease.smooth}`, textTransform: 'capitalize',
                  }}>
                    {t === 'messages' && 'Messages'}
                    {t === 'details' && 'Détails'}
                    {t === 'documents' && 'Documents'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {tab === 'messages' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: sp[4], display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                      {messages.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                          <div>
                            <Icon d={icons.msg} size={48} color={c.textTertiary} style={{ opacity: 0.3, marginBottom: sp[2] }} />
                            <p style={{ color: c.textSecondary, fontSize: size.sm }}>Aucun message · Commencez la conversation</p>
                          </div>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <div key={msg.id} style={{
                            display: 'flex', justifyContent: msg.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                          }}>
                            <div style={{
                              maxWidth: '60%', padding: `${sp[2]} ${sp[3]}`,
                              background: msg.sender_role === 'admin' ? c.red : c.bgElevated,
                              color: msg.sender_role === 'admin' ? c.text : c.text,
                              borderRadius: '1px',
                            }}>
                              <div style={{ fontSize: size.sm }}>{msg.content}</div>
                              <div style={{ fontSize: size.xs, opacity: 0.6, marginTop: '4px', fontFamily: f.mono }}>
                                {fmtDate(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <div style={{ padding: sp[4], borderTop: `1px solid ${c.borderSubtle}`, background: c.bgWarm, flexShrink: 0 }}>
                      <form onSubmit={handleSendMsg} style={{ display: 'flex', gap: sp[2] }}>
                        <input
                          value={newMsg}
                          onChange={e => setNewMsg(e.target.value)}
                          placeholder="Entrez votre message…"
                          style={{
                            flex: 1, padding: `${sp[2]} ${sp[2]}`, background: c.bgSurface,
                            border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body,
                            fontSize: size.sm, outline: 'none', transition: `all 0.2s ${ease.smooth}`,
                          }}
                          onFocus={(e) => { e.target.style.borderColor = c.gold }}
                          onBlur={(e) => { e.target.style.borderColor = c.border }}
                        />
                        <button type="submit" style={{
                          padding: `${sp[2]} ${sp[3]}`, background: c.gold, color: c.bg,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`, display: 'flex', alignItems: 'center', gap: sp[1],
                        }}
                        onMouseEnter={(e) => { e.target.style.background = c.goldDim }}
                        onMouseLeave={(e) => { e.target.style.background = c.gold }}>
                          <Icon d={icons.send} size={14} color={c.bg} stroke="2" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {tab === 'details' && (
                  <div style={{ padding: sp[4], overflowY: 'auto' }}>
                    {/* Clickable Status Pipeline */}
                    <div style={{ marginBottom: sp[4] }}>
                      <div style={labelStyle}>Statut de la commande</div>
                      <div style={{ display: 'flex', gap: '2px', padding: '3px', background: c.bg, border: `1px solid ${c.border}` }}>
                        {STATUSES.map((st, i) => {
                          const currentIdx = STATUSES.findIndex(s => s.key === selected?.status)
                          const isActive = st.key === selected?.status
                          const isPast = i < currentIdx
                          return (
                            <button
                              key={st.key}
                              onClick={() => handleStatusChange(st.key)}
                              style={{
                                flex: 1,
                                padding: `${sp[2]} ${sp[1]}`,
                                background: isActive ? st.color : isPast ? `${st.color}22` : 'transparent',
                                border: `1px solid ${isActive ? st.color : isPast ? `${st.color}44` : c.border}`,
                                color: isActive ? c.white : isPast ? st.color : c.textTertiary,
                                fontSize: '10px',
                                fontFamily: f.mono,
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                transition: `all 0.2s ${ease.smooth}`,
                                textAlign: 'center',
                                lineHeight: 1.3,
                              }}
                            >
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
                        <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}` }}>
                          <div style={labelStyle}>Client</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                            <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>
                              {clientProfile.full_name || clientProfile.email}
                            </span>
                            <span style={{
                              padding: `2px ${sp[1]}`, background: tier.colorSoft, border: `1px solid ${tier.color}33`,
                              color: tier.color, fontSize: '10px', fontFamily: f.mono, fontWeight: 600,
                            }}>
                              {tier.icon} {tier.label}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp[2], fontSize: size.xs, color: c.textSecondary }}>
                            <div>{clientProfile.email}</div>
                            <div>{clientProfile.phone || '—'}</div>
                            <div>{clientProfile.company || '—'}</div>
                            <div>{clientProfile.city || '—'}</div>
                          </div>
                        </div>
                      ) : null
                    })()}

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
                            <div style={{ padding: sp[2], background: c.bgSurface, border: `1px solid ${c.border}`, fontSize: size.sm, color: c.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ marginTop: sp[4], display: 'flex', gap: sp[2], paddingTop: sp[3], borderTop: `1px solid ${c.border}` }}>
                      {!editMode ? (
                        <button onClick={() => { setEditMode(true); setEditData(selected || {}) }} style={{
                          padding: `${sp[2]} ${sp[3]}`, background: c.blue, color: c.text, border: 'none',
                          fontFamily: f.body, fontWeight: 700, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`, display: 'flex', alignItems: 'center', gap: sp[1],
                        }}
                        onMouseEnter={(e) => { e.target.style.background = c.blue; e.target.style.opacity = '0.8' }}
                        onMouseLeave={(e) => { e.target.style.opacity = '1' }}>
                          <Icon d={icons.edit} size={14} color={c.text} />
                          Modifier
                        </button>
                      ) : (
                        <>
                          <button onClick={handleSaveEdit} style={{
                            padding: `${sp[2]} ${sp[3]}`, background: c.green, color: c.text, border: 'none',
                            fontFamily: f.body, fontWeight: 700, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`, display: 'flex', alignItems: 'center', gap: sp[1],
                          }}
                          onMouseEnter={(e) => { e.target.style.opacity = '0.8' }}
                          onMouseLeave={(e) => { e.target.style.opacity = '1' }}>
                            <Icon d={icons.check} size={14} color={c.text} />
                            Enregistrer
                          </button>
                          <button onClick={() => setEditMode(false)} style={{
                            padding: `${sp[2]} ${sp[3]}`, background: 'transparent', color: c.textSecondary, border: `1px solid ${c.border}`,
                            fontFamily: f.body, fontWeight: 700, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                          }}
                          onMouseEnter={(e) => { e.target.style.borderColor = c.red; e.target.style.color = c.red }}
                          onMouseLeave={(e) => { e.target.style.borderColor = c.border; e.target.style.color = c.textSecondary }}>
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'documents' && (
                  <div style={{ padding: sp[4], overflowY: 'auto' }}>
                    <div style={{ marginBottom: sp[4] }}>
                      <div style={{ marginBottom: sp[2] }}>
                        <label style={labelStyle}>Télécharger un document</label>
                      </div>
                      <label style={{
                        display: 'block', padding: sp[4], background: c.bgSurface, border: `2px dashed ${c.border}`,
                        textAlign: 'center', cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.bgElevated }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgSurface }}>
                        <Icon d={icons.upload} size={28} color={c.textTertiary} style={{ marginBottom: sp[1] }} />
                        <div style={{ fontSize: size.sm, color: c.text, fontWeight: 600 }}>Cliquez ou glissez un fichier</div>
                        <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {documents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}` }}>
                        <Icon d={icons.file} size={32} color={c.textTertiary} style={{ opacity: 0.3, marginBottom: sp[2] }} />
                        <p style={{ color: c.textSecondary, fontSize: size.sm }}>Aucun document</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                        {documents.map(doc => (
                          <div key={doc.id} style={{
                            padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: `all 0.2s ${ease.smooth}`,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: sp[2] }}>
                              <Icon d={icons.doc} size={18} color={c.gold} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{doc.original_filename}</div>
                                <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>
                                  {fmtDate(doc.created_at)}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => handleDownloadDoc(doc)} style={{
                              padding: `${sp[1]} ${sp[2]}`, background: c.gold, color: c.bg, border: 'none',
                              fontFamily: f.body, fontSize: size.xs, fontWeight: 700, cursor: 'pointer',
                              transition: `all 0.2s ${ease.smooth}`,
                            }}
                            onMouseEnter={(e) => { e.target.style.opacity = '0.8' }}
                            onMouseLeave={(e) => { e.target.style.opacity = '1' }}>
                              Télécharger
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: sp[4] }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: size.lg, marginBottom: sp[2], opacity: 0.4 }}>◇ ◇ ◇</div>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600 }}>Sélectionnez une commande</h3>
                <p style={{ fontSize: size.sm, color: c.textSecondary }}>Choisissez une commande pour voir les détails, messages et documents</p>
              </div>
            </div>
          ) : null}

          {/* CATALOGUE TAB */}
          {mainTab === 'catalogue' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ marginBottom: sp[4] }}>
                <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: sp[1] }}>
                  Catalogue Produits
                </h2>
                <p style={{ fontSize: size.sm, color: c.textSecondary }}>
                  10 catégories de sourcing Chine avec prix et marges estimées
                </p>
              </div>

              {/* Category Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: sp[3] }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} style={{
                    background: c.bgSurface, border: `1px solid ${c.border}`,
                    transition: `all 0.3s ${ease.smooth}`, overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.background = c.bgElevated }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgSurface }}>
                    {/* Category Header */}
                    <div style={{
                      padding: `${sp[3]} ${sp[3]}`, display: 'flex', alignItems: 'center', gap: sp[2],
                      borderBottom: `1px solid ${c.borderSubtle}`,
                    }}>
                      <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md, color: c.text, letterSpacing: '-0.01em' }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>
                          {cat.description}
                        </div>
                      </div>
                    </div>

                    {/* Price Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <div style={{ padding: sp[2], borderRight: `1px solid ${c.borderSubtle}` }}>
                        <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                          Prix Chine
                        </div>
                        <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.green }}>
                          {cat.priceChina}
                        </div>
                      </div>
                      <div style={{ padding: sp[2], borderRight: `1px solid ${c.borderSubtle}` }}>
                        <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                          Prix France
                        </div>
                        <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.blue }}>
                          {cat.priceFrance}
                        </div>
                      </div>
                      <div style={{ padding: sp[2] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                          Marge
                        </div>
                        <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.gold }}>
                          {cat.margin}
                        </div>
                      </div>
                    </div>

                    {/* Notes & Locations */}
                    <div style={{ padding: sp[2] }}>
                      <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5, marginBottom: sp[1] }}>
                        {cat.notes}
                      </div>
                      <div style={{ display: 'flex', gap: sp[1], flexWrap: 'wrap' }}>
                        {cat.locations.map(loc => (
                          <span key={loc} style={{
                            fontSize: '10px', fontFamily: f.mono, padding: '2px 8px',
                            background: c.bg, border: `1px solid ${c.border}`,
                            color: c.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Summary */}
              <div style={{
                marginTop: sp[4], padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: sp[3],
              }}>
                <div>
                  <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>
                    Catégories
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.gold }}>{CATEGORIES.length}</div>
                </div>
                <div>
                  <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>
                    Zones sourcing
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.red }}>3</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary }}>Yiwu · Guangzhou · Shenzhen</div>
                </div>
                <div>
                  <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>
                    Marge moyenne
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.green }}>×5</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary }}>De ×3 a ×10+</div>
                </div>
                <div>
                  <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>
                    Prix entree min
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, color: c.blue }}>0.20 EUR</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary }}>Papeterie creative</div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {mainTab === 'clients' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[4] }}>
                <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Tous les clients
                </h2>
                <button onClick={() => setShowCreateOrder(true)} style={{
                  padding: `${sp[2]} ${sp[3]}`, background: c.red, color: c.text, border: 'none',
                  fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  transition: `all 0.2s ${ease.smooth}`, display: 'flex', alignItems: 'center', gap: sp[1],
                }}
                onMouseEnter={(e) => { e.target.style.background = c.redDeep }}
                onMouseLeave={(e) => { e.target.style.background = c.red }}>
                  <Icon d={icons.plus} size={14} color={c.text} />
                  Nouvelle commande
                </button>
              </div>

              {allProfiles.length === 0 ? (
                <div style={{ padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: sp[3] }}>
                    <Icon d={icons.users} size={48} color={c.textTertiary} style={{ opacity: 0.3 }} />
                  </div>
                  <h4 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600 }}>Aucun client</h4>
                  <p style={{ fontSize: size.sm, color: c.textSecondary }}>Invitez des clients pour commencer</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                  {allProfiles.map(client => {
                    const orderCount = getClientOrderCount(client.id)
                    const lastOrderDate = getClientLastOrderDate(client.id)
                    const initial = (client.full_name || client.email).charAt(0).toUpperCase()
                    const tier = getTierByKey(client.client_tier || DEFAULT_TIER)
                    return (
                      <div key={client.id} style={{
                        padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                        display: 'flex', flexDirection: 'column', gap: sp[2],
                        transition: `all 0.2s ${ease.smooth}`,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onClick={() => setSelectedClientTab(client.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated; e.currentTarget.style.borderColor = tier.color }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface; e.currentTarget.style.borderColor = c.border }}>
                        {/* Tier accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tier.color }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '2px',
                            background: c.bgElevated, border: `1px solid ${c.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: c.gold,
                          }}>
                            {initial}
                          </div>
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

                        {/* Tier selector */}
                        <div style={{ display: 'flex', gap: '2px', background: c.bg, padding: '2px' }}>
                          {TIERS.map(t => (
                            <button
                              key={t.key}
                              onClick={(e) => {
                                e.stopPropagation()
                                updateProfile(client.id, { client_tier: t.key })
                                  .then(() => loadAll())
                                  .catch(err => console.error('Error updating tier:', err))
                              }}
                              style={{
                                flex: 1,
                                padding: `4px ${sp[1]}`,
                                background: (client.client_tier || DEFAULT_TIER) === t.key ? t.color : 'transparent',
                                border: 'none',
                                color: (client.client_tier || DEFAULT_TIER) === t.key ? c.bg : c.textTertiary,
                                fontSize: '10px',
                                fontFamily: f.mono,
                                fontWeight: (client.client_tier || DEFAULT_TIER) === t.key ? 700 : 400,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                transition: `all 0.15s ${ease.smooth}`,
                              }}
                            >
                              {t.icon} {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Contact info */}
                        {(client.phone || client.company || client.city) && (
                          <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.6, padding: `${sp[1]} 0` }}>
                            {client.company && <div style={{ fontWeight: 600, color: c.text }}>{client.company}</div>}
                            {client.phone && <div>{client.phone}</div>}
                            {client.city && <div>{client.city}</div>}
                            {client.address && <div style={{ color: c.textTertiary }}>{client.address}</div>}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[1], padding: `${sp[2]} 0`, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>Commandes</div>
                            <div style={{ fontSize: size.md, fontWeight: 700, color: c.gold }}>{orderCount}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>Dernière</div>
                            <div style={{ fontSize: size.xs, color: c.textSecondary }}>
                              {lastOrderDate ? lastOrderDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : '–'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>Priorité</div>
                            <div style={{ fontSize: size.xs, fontWeight: 600, color: tier.color }}>
                              {tier.priorityLabel}
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setShowCreateOrder(true); setCreateOrderData(prev => ({ ...prev, clientId: client.id })) }} style={{
                          padding: `${sp[1]} ${sp[2]}`, background: c.bgElevated, color: c.text, border: `1px solid ${c.border}`,
                          fontFamily: f.body, fontSize: size.xs, fontWeight: 600, cursor: 'pointer',
                          transition: `all 0.2s ${ease.smooth}`, width: '100%',
                        }}
                        onMouseEnter={(e) => { e.target.style.background = c.gold; e.target.style.color = c.bg; e.target.style.borderColor = c.gold }}
                        onMouseLeave={(e) => { e.target.style.background = c.bgElevated; e.target.style.color = c.text; e.target.style.borderColor = c.border }}>
                          + Commande
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Client Orders */}
              {selectedClientTab && (
                <div style={{ marginTop: sp[4], paddingTop: sp[4], borderTop: `1px solid ${c.border}` }}>
                  <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[3], fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Commandes de {clientName(selectedClientTab)}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {orders.filter(o => o.client_id === selectedClientTab).map(order => {
                      const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]
                      return (
                        <div key={order.id} style={{
                          padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                          transition: `all 0.2s ${ease.smooth}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.bgElevated }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.bgSurface }}>
                          <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.gold, fontWeight: 600, letterSpacing: '0.04em', marginBottom: sp[1] }}>
                            {order.ref}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: size.md, marginBottom: sp[2], color: c.text }}>
                            {order.product}
                          </div>
                          <div style={{ fontSize: size.xs, color: c.textSecondary, marginBottom: sp[2] }}>
                            <div>{(order.quantity || 0).toLocaleString('fr-FR')} unités</div>
                            <div>{order.budget}</div>
                            <div style={{ marginTop: '4px', fontFamily: f.mono, opacity: 0.7 }}>{fmtDate(order.created_at)}</div>
                          </div>
                          <div style={{ paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                            <StatusPill status={order.status} />
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

      {/* ── MODAL: Create Order ── */}
      {showCreateOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
        }} onClick={() => setShowCreateOrder(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCreateOrder(false)} style={{
              position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: '0', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.target.style.color = c.red }}
            onMouseLeave={(e) => { e.target.style.color = c.textTertiary }}>
              <Icon d={icons.close} size={18} />
            </button>

            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: sp[3], letterSpacing: '-0.01em' }}>
              Nouvelle commande
            </h2>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
              {/* Client Select */}
              <div>
                <label style={labelStyle}>Client *</label>
                <select
                  value={createOrderData.clientId}
                  onChange={e => setCreateOrderData({...createOrderData, clientId: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: sp[3]}}
                >
                  <option value="">Sélectionner un client…</option>
                  {allProfiles.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.full_name || cl.email}</option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label style={labelStyle}>Produit *</label>
                <input
                  type="text"
                  value={createOrderData.product}
                  onChange={e => setCreateOrderData({...createOrderData, product: e.target.value})}
                  placeholder="Nom du produit"
                  style={inputStyle}
                />
              </div>

              {/* Quantity */}
              <div>
                <label style={labelStyle}>Quantité</label>
                <input
                  type="number"
                  value={createOrderData.quantity}
                  onChange={e => setCreateOrderData({...createOrderData, quantity: e.target.value})}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>

              {/* Budget */}
              <div>
                <label style={labelStyle}>Budget</label>
                <input
                  type="text"
                  value={createOrderData.budget}
                  onChange={e => setCreateOrderData({...createOrderData, budget: e.target.value})}
                  placeholder="ex: 500€"
                  style={inputStyle}
                />
              </div>

              {/* Deadline */}
              <div>
                <label style={labelStyle}>Deadline</label>
                <input
                  type="date"
                  value={createOrderData.deadline}
                  onChange={e => setCreateOrderData({...createOrderData, deadline: e.target.value})}
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={createOrderData.notes}
                  onChange={e => setCreateOrderData({...createOrderData, notes: e.target.value})}
                  placeholder="Détails supplémentaires…"
                  style={{...inputStyle, minHeight: '100px', fontFamily: f.body}}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                <button
                  type="button"
                  onClick={() => setShowCreateOrder(false)}
                  style={{
                    flex: 1, padding: `${sp[2]} ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                    border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                    cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = c.textSecondary; e.target.style.color = c.text }}
                  onMouseLeave={(e) => { e.target.style.borderColor = c.border; e.target.style.color = c.textSecondary }}>
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: `${sp[2]} ${sp[3]}`, background: c.red, color: c.text,
                    border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                    cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                  }}
                  onMouseEnter={(e) => { e.target.style.background = c.redDeep }}
                  onMouseLeave={(e) => { e.target.style.background = c.red }}>
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
