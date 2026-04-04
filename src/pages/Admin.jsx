import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients,
  subscribeToMessages, subscribeToOrders, supabase,
} from '../lib/supabase'
import StatusPill, { ProgressBar } from '../components/StatusPill'

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
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Admin({ user, profile, onSignOut }) {
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
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
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const loadAll = useCallback(async () => {
    const [ordersData, clientsData] = await Promise.all([getOrders(), getAllClients()])
    setOrders(ordersData); setClients(clientsData); setLoading(false)
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
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const ch = subscribeToMessages(selectedId, (msg) => setMessages(prev => [...prev, msg]))
    return () => { supabase.removeChannel(ch) }
  }, [selectedId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const clientName = (clientId) => {
    const cl = clients.find(x => x.id === clientId)
    return cl ? (cl.full_name || cl.email) : 'Inconnu'
  }

  const filtered = orders.filter(o => {
    if (filter === 'active' && o.status >= 6) return false
    if (filter === 'done' && o.status < 6) return false
    if (search) {
      const q = search.toLowerCase()
      return o.product.toLowerCase().includes(q) || o.ref?.toLowerCase().includes(q) || clientName(o.client_id).toLowerCase().includes(q)
    }
    return true
  })

  const handleSendMsg = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedId) return
    const text = newMsg; setNewMsg('')
    await sendMessage({ orderId: selectedId, senderId: user.id, senderRole: 'admin', content: text })
  }

  const handleStatusChange = async (newStatus) => {
    if (!selectedId) return
    const progress = Math.round((newStatus / 6) * 100)
    await updateOrder(selectedId, { status: newStatus, progress })
    await loadAll()
  }

  const handleSaveEdit = async () => {
    if (!selectedId) return
    await updateOrder(selectedId, editData)
    setEditMode(false); await loadAll()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    await uploadDocument(selectedId, file, user.id)
    const docs = await getDocuments(selectedId)
    setDocuments(docs); fileInputRef.current.value = ''
  }

  const handleDownloadDoc = async (doc) => {
    const url = await getDocumentUrl(doc.storage_path)
    if (url) window.open(url, '_blank')
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: c.bg,
    border: `1px solid ${c.border}`, color: c.text,
    fontSize: size.xs, outline: 'none', fontFamily: f.body,
    transition: `border-color 0.2s ${ease.smooth}`,
  }
  const labelStyle = {
    display: 'block', fontSize: size.xs, fontWeight: 500,
    color: c.textTertiary, marginBottom: '6px', fontFamily: f.mono,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'active', label: 'En cours' },
    { key: 'done', label: 'Termin\u00e9es' },
  ]

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, flexDirection: 'column', gap: sp[2] }}>
      <div style={{ width: 32, height: 32, border: `1.5px solid ${c.border}`, borderTopColor: c.red, transform: 'rotate(45deg)', animation: 'spin 1s linear infinite' }} />
      <span style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: size.xs, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chargement{'\u2026'}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        padding: `0 ${sp[3]}`, height: '56px', borderBottom: `1px solid ${c.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: c.bgWarm, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
            <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.9"/>
            <path d="M12 11L7 5M28 11L33 5" stroke="#D4A843" strokeWidth="1.5" opacity="0.8"/>
            <path d="M16 7L14 3M24 7L26 3" stroke="#D4A843" strokeWidth="1" opacity="0.5"/>
            <circle cx="16" cy="19" r="2" fill="#FFD700" opacity="0.9"/>
            <circle cx="24" cy="19" r="2" fill="#FFD700" opacity="0.9"/>
            <ellipse cx="16" cy="19" rx="0.8" ry="1.8" fill="#0D0D0D"/>
            <ellipse cx="24" cy="19" rx="0.8" ry="1.8" fill="#0D0D0D"/>
            <path d="M14 15L12 13M26 15L28 13" stroke="#4A0A10" strokeWidth="1.5" opacity="0.6"/>
          </svg>
          <span style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.base, letterSpacing: '0.06em' }}>CARAXES</span>
          <span style={{
            fontSize: '10px', color: c.red, padding: '3px 10px',
            border: `1px solid ${c.redGlow}`, fontFamily: f.mono,
            background: c.redSoft, fontWeight: 600, letterSpacing: '0.06em',
          }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary }}>
            {orders.filter(o => o.status < 6).length} en cours {'\u00b7'} {orders.length} total
          </span>
          <button onClick={onSignOut} style={{
            background: 'transparent', border: `1px solid ${c.border}`,
            width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: c.textTertiary, cursor: 'pointer',
          }}>
            <Icon d={icons.logout} size={15} />
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: '360px', borderRight: `1px solid ${c.borderSubtle}`, display: 'flex',
          flexDirection: 'column', background: c.bg, flexShrink: 0,
        }}>
          <div style={{ padding: `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.borderSubtle}` }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp[1], padding: `${sp[1]} ${sp[2]}`,
              background: c.bgWarm, border: `1px solid ${c.border}`, marginBottom: sp[1],
            }}>
              <Icon d={icons.search} size={14} color={c.textTertiary} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher client, produit\u2026"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text, fontSize: size.xs, fontFamily: f.body }} />
            </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {filters.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  flex: 1, padding: '7px', border: `1px solid ${filter === key ? c.redGlow : c.border}`,
                  background: filter === key ? c.redSoft : 'transparent',
                  color: filter === key ? c.red : c.textTertiary,
                  fontSize: size.xs, fontWeight: 500, cursor: 'pointer', fontFamily: f.body,
                  transition: `all 0.15s ${ease.smooth}`,
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(order => {
              const isSelected = order.id === selectedId
              const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]
              return (
                <div key={order.id}
                  onClick={() => { setSelectedId(order.id); setTab('messages'); setEditMode(false) }}
                  style={{
                    padding: `${sp[2]} ${sp[2]}`, cursor: 'pointer',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    borderLeft: `2px solid ${isSelected ? c.red : 'transparent'}`,
                    background: isSelected ? c.bgElevated : 'transparent',
                    transition: `all 0.15s ${ease.smooth}`,
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.03em' }}>{order.ref}</span>
                    <StatusPill status={order.status} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: size.sm, marginBottom: '4px', color: c.text }}>{order.product}</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary }}>
                    {clientName(order.client_id)} {'\u00b7'} {(order.quantity || 0).toLocaleString('fr-FR')} unit{'\u00e9'}s {'\u00b7'} {order.budget}
                  </div>
                  <div style={{ marginTop: sp[1] }}>
                    <ProgressBar value={order.progress} color={statusObj.color} />
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {selected ? (
            <>
              {/* Order header */}
              <div style={{ padding: `${sp[3]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp[2], marginBottom: sp[2] }}>
                  <div>
                    <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, marginBottom: '4px', letterSpacing: '0.03em' }}>
                      {selected.ref} {'\u00b7'} Client{'\u00a0'}: {clientName(selected.client_id)}
                    </div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 600, letterSpacing: '-0.02em' }}>
                      {selected.product}
                    </h2>
                  </div>
                  <button onClick={() => {
                    setEditMode(!editMode)
                    setEditData({ supplier: selected.supplier, city: selected.city, status: selected.status, progress: selected.progress })
                  }} style={{
                    padding: `${sp[1]} ${sp[2]}`, background: editMode ? c.bgElevated : 'transparent',
                    border: `1px solid ${c.border}`,
                    color: c.textSecondary, fontSize: size.xs, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: f.body,
                    transition: `all 0.15s ${ease.smooth}`,
                  }}>
                    <Icon d={editMode ? icons.close : icons.edit} size={13} />
                    {editMode ? 'Annuler' : 'Modifier'}
                  </button>
                </div>

                {/* Status quick buttons */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: sp[2] }}>
                  {STATUSES.map((s, i) => {
                    const isActive = i === selected.status
                    return (
                      <button key={i} onClick={() => handleStatusChange(i)} style={{
                        padding: '5px 12px', fontSize: size.xs, fontWeight: 500,
                        border: `1px solid ${isActive ? s.color : c.border}`,
                        background: isActive ? `${s.color}15` : 'transparent',
                        color: isActive ? s.color : c.textTertiary,
                        cursor: 'pointer', fontFamily: f.body,
                        transition: `all 0.2s ${ease.smooth}`,
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        {s.label}
                      </button>
                    )
                  })}
                </div>

                {/* Edit form */}
                {editMode && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: sp[2],
                    padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`,
                    marginBottom: sp[2],
                  }}>
                    <div>
                      <label style={labelStyle}>Fournisseur</label>
                      <input style={inputStyle} value={editData.supplier || ''}
                        onChange={e => setEditData({ ...editData, supplier: e.target.value })}
                        onFocus={(e) => e.target.style.borderColor = c.red}
                        onBlur={(e) => e.target.style.borderColor = c.border} />
                    </div>
                    <div>
                      <label style={labelStyle}>Ville</label>
                      <input style={inputStyle} value={editData.city || ''}
                        onChange={e => setEditData({ ...editData, city: e.target.value })}
                        onFocus={(e) => e.target.style.borderColor = c.red}
                        onBlur={(e) => e.target.style.borderColor = c.border} />
                    </div>
                    <div>
                      <label style={labelStyle}>Progression %</label>
                      <input style={inputStyle} type="number" min="0" max="100" value={editData.progress || 0}
                        onChange={e => setEditData({ ...editData, progress: parseInt(e.target.value) || 0 })}
                        onFocus={(e) => e.target.style.borderColor = c.red}
                        onBlur={(e) => e.target.style.borderColor = c.border} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button onClick={handleSaveEdit} style={{
                        padding: `${sp[1]} ${sp[3]}`, background: c.green, border: 'none',
                        color: c.black, fontSize: size.xs, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontFamily: f.body,
                      }}>
                        <Icon d={icons.check} size={14} color={c.black} sw={2} /> Sauver
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={selected.progress} color={(STATUSES[selected.status] || STATUSES[0]).color} height={3} />
                  </div>
                  <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, fontWeight: 500 }}>{selected.progress}%</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSubtle}` }}>
                {[
                  { key: 'messages', label: 'Messages', icon: icons.msg, count: messages.length },
                  { key: 'documents', label: 'Documents', icon: icons.doc, count: documents.length },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{
                    flex: 1, padding: sp[2], background: 'transparent',
                    border: 'none', borderBottom: `2px solid ${tab === t.key ? c.red : 'transparent'}`,
                    color: tab === t.key ? c.text : c.textTertiary,
                    fontSize: size.xs, fontWeight: 500, cursor: 'pointer', fontFamily: f.body,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: `all 0.15s ${ease.smooth}`,
                  }}>
                    <Icon d={t.icon} size={14} color={tab === t.key ? c.red : c.textTertiary} />
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === 'messages' ? (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: `${sp[3]} ${sp[3]}` }}>
                    {messages.map((msg, i) => {
                      const isAgent = msg.sender_role === 'admin'
                      return (
                        <div key={msg.id || i} style={{
                          display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start',
                          marginBottom: sp[1],
                        }}>
                          <div style={{
                            maxWidth: '80%', padding: `${sp[1]} ${sp[2]}`,
                            background: isAgent ? c.redSoft : c.bgElevated,
                            border: `1px solid ${isAgent ? c.redGlow : c.border}`,
                            fontSize: size.sm, lineHeight: 1.65,
                          }}>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', gap: sp[2],
                              fontSize: size.xs, color: c.textTertiary, marginBottom: '6px',
                            }}>
                              <span style={{ color: isAgent ? c.red : c.teal, fontWeight: 600, fontFamily: f.mono, letterSpacing: '0.04em' }}>
                                {isAgent ? 'Vous (Admin)' : 'Client'}
                              </span>
                              <span style={{ fontFamily: f.mono, fontSize: '10px' }}>{fmtDate(msg.created_at)}</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMsg} style={{
                    padding: `${sp[2]} ${sp[3]}`, borderTop: `1px solid ${c.borderSubtle}`,
                    display: 'flex', gap: sp[1], background: c.bgWarm,
                  }}>
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      placeholder="R\u00e9pondre au client\u2026"
                      style={{
                        flex: 1, padding: `${sp[1]} ${sp[2]}`, background: c.bg,
                        border: `1px solid ${c.border}`, color: c.text,
                        fontSize: size.sm, outline: 'none', fontFamily: f.body,
                        transition: `border-color 0.2s ${ease.smooth}`,
                      }}
                      onFocus={(e) => e.target.style.borderColor = c.red}
                      onBlur={(e) => e.target.style.borderColor = c.border}
                    />
                    <button type="submit" style={{
                      background: newMsg.trim() ? c.red : c.bgElevated,
                      color: newMsg.trim() ? c.white : c.textTertiary,
                      border: 'none', padding: `${sp[1]} ${sp[3]}`,
                      fontSize: size.xs, fontWeight: 600,
                      cursor: newMsg.trim() ? 'pointer' : 'default', fontFamily: f.body,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: `all 0.15s ${ease.smooth}`,
                    }}>
                      <Icon d={icons.send} size={14} color={newMsg.trim() ? c.white : c.textTertiary} /> Envoyer
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: `${sp[3]} ${sp[3]}` }}>
                  {/* Upload zone */}
                  <div style={{
                    padding: sp[3], border: `2px dashed ${c.border}`,
                    textAlign: 'center', cursor: 'pointer', marginBottom: sp[2],
                    transition: `border-color 0.2s ${ease.smooth}`,
                  }} onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={e => e.currentTarget.style.borderColor = c.red}
                    onMouseLeave={e => e.currentTarget.style.borderColor = c.border}
                  >
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                    <Icon d={icons.upload} size={20} color={c.textTertiary} />
                    <p style={{ fontSize: size.xs, color: c.textTertiary, marginTop: sp[1] }}>
                      Cliquez pour uploader un document
                    </p>
                  </div>
                  {documents.map(doc => (
                    <div key={doc.id} onClick={() => handleDownloadDoc(doc)} style={{
                      display: 'flex', alignItems: 'center', gap: sp[2], padding: `${sp[2]} ${sp[2]}`,
                      background: c.bgSurface, border: `1px solid ${c.border}`,
                      fontSize: size.xs, cursor: 'pointer', marginBottom: sp[1],
                      transition: `border-color 0.15s ${ease.smooth}`,
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = c.textTertiary}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = c.border}
                    >
                      <div style={{
                        width: 32, height: 32,
                        background: c.redSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon d={icons.file} size={14} color={c.red} />
                      </div>
                      <span style={{ flex: 1, color: c.text, fontWeight: 500 }}>{doc.name}</span>
                      <span style={{ color: c.textTertiary, fontFamily: f.mono }}>{doc.size}</span>
                      <Icon d={icons.download} size={14} color={c.textSecondary} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: sp[2], color: c.textTertiary,
            }}>
              <svg width="48" height="48" viewBox="0 0 36 36" fill="none" style={{ opacity: 0.25 }}>
                <rect x="2" y="2" width="32" height="32" fill={c.red} />
                <path d="M10 18L18 10L26 18L18 26Z" fill="oklch(98% 0.005 70)" opacity="0.9"/>
              </svg>
              <span style={{ fontSize: size.sm }}>S{'\u00e9'}lectionnez une commande {'\u00e0'} g{'\u00e9'}rer</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
