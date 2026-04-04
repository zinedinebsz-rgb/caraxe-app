import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, STATUSES } from '../lib/theme'
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
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
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
  back: 'M15 18l-6-6 6-6',
  close: 'M18 6L6 18M6 6l12 12',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  plus: 'M12 5v14M5 12h14',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtQty = (n) => (n || 0).toLocaleString('fr-FR')

/* ── ORDER CARD ── */
function OrderCard({ order, selected, onClick, unreadCount }) {
  const [hovered, setHovered] = useState(false)
  const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${sp[2]} ${sp[2]}`, cursor: 'pointer',
        background: selected ? c.bgElevated : hovered ? c.bgWarm : 'transparent',
        borderLeft: `2px solid ${selected ? c.red : 'transparent'}`,
        borderBottom: `1px solid ${c.borderSubtle}`,
        transition: `all 0.15s ${ease.smooth}`,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.03em' }}>
          {order.ref}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
          {unreadCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: '9999px',
              background: c.red, color: c.white, fontSize: '10px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
            }}>{unreadCount}</span>
          )}
          <StatusPill status={order.status} />
        </div>
      </div>
      <div style={{
        fontWeight: 600, fontSize: size.sm, marginBottom: '6px',
        lineHeight: 1.4, color: c.text,
      }}>{order.product}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: size.xs, color: c.textSecondary }}>
          {fmtQty(order.quantity)} unit{'\u00e9'}s {'\u00b7'} {order.budget}
        </span>
        <span style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>{order.city}</span>
      </div>
      <div style={{ marginTop: sp[1] }}>
        <ProgressBar value={order.progress} color={statusObj.color} />
      </div>
    </div>
  )
}

/* ── CHAT BUBBLE ── */
function ChatBubble({ msg }) {
  const isAgent = msg.sender_role === 'admin'
  return (
    <div style={{
      display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end',
      marginBottom: sp[1],
    }}>
      <div style={{
        maxWidth: '80%', padding: `${sp[1]} ${sp[2]}`,
        background: isAgent ? c.bgElevated : c.redSoft,
        border: `1px solid ${isAgent ? c.border : c.redGlow}`,
        fontSize: size.sm, lineHeight: 1.65, color: c.text,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: size.xs, color: c.textTertiary, marginBottom: '6px',
        }}>
          <span style={{ color: isAgent ? c.red : c.textSecondary, fontWeight: 600, fontFamily: f.mono, fontSize: size.xs, letterSpacing: '0.04em' }}>
            {isAgent ? 'CARAXES' : 'Vous'}
          </span>
          <span style={{ fontFamily: f.mono, fontSize: '10px' }}>{fmtDate(msg.created_at)}</span>
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        {msg.attachment_name && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: sp[1],
            padding: '6px 10px', background: c.bgSurface, border: `1px solid ${c.border}`,
            fontSize: size.xs, color: c.textSecondary, cursor: 'pointer',
          }}>
            <Icon d={icons.clip} size={12} /> {msg.attachment_name}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── NEW REQUEST MODAL ── */
function NewRequestForm({ onClose, onSubmit }) {
  const [form, setForm] = useState({ product: '', quantity: '', budget: '', deadline: '', notes: '' })
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const inputStyle = {
    width: '100%', padding: '14px 16px', background: c.bg,
    border: `1px solid ${c.border}`, color: c.text,
    fontSize: size.sm, outline: 'none', fontFamily: f.body,
    transition: `border-color 0.2s ${ease.smooth}`,
  }
  const labelStyle = {
    display: 'block', fontSize: size.xs, fontWeight: 500,
    color: c.textSecondary, marginBottom: sp[1], fontFamily: f.mono,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  const steps = [
    <div key="0">
      <label style={labelStyle}>Quel produit recherchez-vous{'\u00a0'}?</label>
      <input style={inputStyle} placeholder="Ex\u00a0: Coque silicone iPhone 16 Pro"
        value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} autoFocus
        onFocus={(e) => e.target.style.borderColor = c.red}
        onBlur={(e) => e.target.style.borderColor = c.border} />
      <p style={{ fontSize: size.xs, color: c.textTertiary, marginTop: sp[1], lineHeight: 1.6 }}>
        Soyez pr{'\u00e9'}cis{'\u00a0'}: mat{'\u00e9'}riau, mod{'\u00e8'}le, finitions souhait{'\u00e9'}es.
      </p>
    </div>,
    <div key="1" style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
        <div>
          <label style={labelStyle}>Quantit{'\u00e9'}</label>
          <input style={inputStyle} placeholder="1000" type="number" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })} autoFocus
            onFocus={(e) => e.target.style.borderColor = c.red}
            onBlur={(e) => e.target.style.borderColor = c.border} />
        </div>
        <div>
          <label style={labelStyle}>Budget max</label>
          <input style={inputStyle} placeholder="2 000 EUR" value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = c.red}
            onBlur={(e) => e.target.style.borderColor = c.border} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>D{'\u00e9'}lai souhait{'\u00e9'}</label>
        <input style={inputStyle} type="date" value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          onFocus={(e) => e.target.style.borderColor = c.red}
          onBlur={(e) => e.target.style.borderColor = c.border} />
      </div>
    </div>,
    <div key="2">
      <label style={labelStyle}>Notes compl{'\u00e9'}mentaires</label>
      <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', lineHeight: 1.65 }}
        placeholder="Couleur, logo, sp\u00e9cifications\u2026" value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })} autoFocus
        onFocus={(e) => e.target.style.borderColor = c.red}
        onBlur={(e) => e.target.style.borderColor = c.border} />
    </div>,
  ]

  const canNext = step === 0 ? form.product.trim() : step === 1 ? form.quantity.trim() : true

  const handleFinalSubmit = async () => {
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: c.bgOverlay,
      backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: sp[2],
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: c.bgSurface, border: `1px solid ${c.border}`,
        width: '100%', maxWidth: '520px',
        overflow: 'hidden', boxShadow: shadow.lg,
        animation: `fadeIn 0.3s ${ease.out}`,
      }}>
        {/* Header */}
        <div style={{
          padding: `${sp[3]} ${sp[3]} ${sp[2]}`, borderBottom: `1px solid ${c.borderSubtle}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 600, color: c.text }}>
              Nouvelle demande
            </h2>
            <span style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '4px', display: 'block', fontFamily: f.mono }}>
              {'\u00c9'}tape {step + 1} sur 3
            </span>
          </div>
          <button onClick={onClose} style={{
            background: c.bgElevated, border: `1px solid ${c.border}`,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c.textTertiary, cursor: 'pointer',
          }}><Icon d={icons.close} size={14} /></button>
        </div>

        {/* Progress */}
        <div style={{ padding: `0 ${sp[3]}` }}>
          <div style={{ display: 'flex', gap: '4px', paddingTop: sp[2] }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                flex: 1, height: 2,
                background: i <= step ? c.red : c.border,
                transition: `background 0.3s ${ease.smooth}`,
              }}/>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: `${sp[3]} ${sp[3]}` }}>{steps[step]}</div>

        {/* Actions */}
        <div style={{ padding: `${sp[2]} ${sp[3]} ${sp[3]}`, display: 'flex', gap: sp[1], justifyContent: 'flex-end' }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              padding: `${sp[1]} ${sp[3]}`, background: 'transparent', border: `1px solid ${c.border}`,
              color: c.textSecondary, fontSize: size.xs, fontWeight: 500, cursor: 'pointer',
              fontFamily: f.body,
            }}>Retour</button>
          )}
          {step < 2 ? (
            <button onClick={() => canNext && setStep(step + 1)} style={{
              padding: `${sp[1]} ${sp[3]}`,
              background: canNext ? c.red : c.bgElevated,
              border: 'none', color: canNext ? c.white : c.textTertiary,
              fontSize: size.xs, fontWeight: 600, cursor: canNext ? 'pointer' : 'default',
              fontFamily: f.body, transition: `all 0.2s ${ease.smooth}`,
            }}>Suivant</button>
          ) : (
            <button onClick={handleFinalSubmit} disabled={submitting} style={{
              padding: `${sp[1]} ${sp[3]}`, background: c.red, border: 'none',
              color: c.white, fontSize: size.xs, fontWeight: 600, cursor: 'pointer',
              fontFamily: f.body, opacity: submitting ? 0.6 : 1,
              transition: `opacity 0.2s ${ease.smooth}`,
            }}>{submitting ? 'Envoi\u2026' : 'Envoyer la demande'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── STATUS TRACKER (inline) ── */
function StatusTracker({ current }) {
  const currentStatus = STATUSES[current] || STATUSES[0]
  return (
    <div style={{ margin: `${sp[2]} 0 ${sp[1]}` }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STATUSES.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STATUSES.length - 1 ? 1 : 'none' }}>
            <div title={s.label} style={{
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontFamily: f.mono, fontWeight: 600,
              background: i <= current ? `${currentStatus.color}15` : c.bgElevated,
              color: i <= current ? currentStatus.color : c.textTertiary,
              border: `1.5px solid ${i <= current ? currentStatus.color : c.border}`,
              boxShadow: i === current ? `0 0 12px ${currentStatus.color}20` : 'none',
              flexShrink: 0, transition: `all 0.3s ${ease.smooth}`,
            }}>{i + 1}</div>
            {i < STATUSES.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, margin: '0 2px',
                background: i < current ? currentStatus.color : c.border,
                transition: `background 0.3s ${ease.smooth}`,
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: sp[1], fontSize: size.xs }}>
        <span style={{ color: currentStatus.color, fontFamily: f.mono, fontWeight: 500 }}>{currentStatus.label}</span>
        <span style={{ color: c.textTertiary, fontFamily: f.mono }}>{current + 1}/{STATUSES.length}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════ */
export default function Dashboard({ user, profile, onSignOut }) {
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [mobileView, setMobileView] = useState('list')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('messages')
  const [loading, setLoading] = useState(true)
  const [unreadMap, setUnreadMap] = useState({})
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders(profile.role === 'admin' ? null : user.id)
      setOrders(data)
      const { data: unreadData } = await supabase
        .from('messages').select('order_id').neq('sender_id', user.id).eq('read', false)
      const map = {}
      ;(unreadData || []).forEach(m => { map[m.order_id] = (map[m.order_id] || 0) + 1 })
      setUnreadMap(map)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user.id, profile.role])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    if (!selectedId) return
    const load = async () => {
      const [msgs, docs] = await Promise.all([getMessages(selectedId), getDocuments(selectedId)])
      setMessages(msgs); setDocuments(docs)
      await markMessagesRead(selectedId, user.id)
      setUnreadMap(prev => ({ ...prev, [selectedId]: 0 }))
    }
    load()
  }, [selectedId, user.id])

  useEffect(() => {
    if (!selectedId) return
    const channel = subscribeToMessages(selectedId, (nm) => {
      setMessages(prev => [...prev, nm])
      if (nm.sender_id !== user.id) markMessagesRead(selectedId, user.id)
    })
    return () => { supabase.removeChannel(channel) }
  }, [selectedId, user.id])

  useEffect(() => {
    const channel = subscribeToOrders(() => { loadOrders() })
    return () => { supabase.removeChannel(channel) }
  }, [loadOrders])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const selected = orders.find(o => o.id === selectedId)

  const filtered = orders.filter(o => {
    if (filter === 'active' && o.status >= 6) return false
    if (filter === 'done' && o.status < 6) return false
    if (search) {
      const q = search.toLowerCase()
      return o.product.toLowerCase().includes(q) || o.ref?.toLowerCase().includes(q) || o.supplier?.toLowerCase().includes(q)
    }
    return true
  })

  const handleNewOrder = async (form) => {
    await createOrder({ clientId: user.id, ...form })
    await loadOrders()
  }

  const handleSendMsg = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedId) return
    const text = newMsg; setNewMsg('')
    await sendMessage({ orderId: selectedId, senderId: user.id, senderRole: profile.role, content: text })
    inputRef.current?.focus()
  }

  const handleDownloadDoc = async (doc) => {
    const url = await getDocumentUrl(doc.storage_path)
    if (url) window.open(url, '_blank')
  }

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, flexDirection: 'column', gap: sp[2] }}>
        <div style={{ width: 32, height: 32, border: `1.5px solid ${c.border}`, borderTopColor: c.red, transform: 'rotate(45deg)', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: size.xs, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chargement{'\u2026'}</span>
      </div>
    )
  }

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'active', label: 'En cours' },
    { key: 'done', label: 'Termin\u00e9es' },
  ]

  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media(max-width:768px){.sidebar-d{display:none!important}.mobile-list{display:flex!important}.main-c{display:${mobileView==='detail'?'flex':'none'}!important}}
        @media(min-width:769px){.mobile-list{display:none!important}.mobile-back{display:none!important}}
      `}</style>

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
            fontSize: '10px', color: c.textTertiary, padding: '3px 10px',
            border: `1px solid ${c.border}`, fontFamily: f.mono, letterSpacing: '0.06em',
          }}>Client</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
          {/* Notifications */}
          <button style={{
            position: 'relative', background: 'transparent', border: `1px solid ${c.border}`,
            width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: c.textSecondary, cursor: 'pointer',
          }}>
            <Icon d={icons.bell} size={16} />
            {totalUnread > 0 && <span style={{
              position: 'absolute', top: -4, right: -4, width: 16, height: 16,
              borderRadius: '9999px', background: c.red, fontSize: '9px', color: c.white,
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{totalUnread}</span>}
          </button>
          {/* New request */}
          <button onClick={() => setShowForm(true)} style={{
            background: c.red, color: c.white, border: 'none',
            padding: `${sp[1]} ${sp[2]}`,
            fontSize: size.xs, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: shadow.glow, fontFamily: f.body,
            transition: `transform 0.15s ${ease.smooth}`,
          }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.97)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            <Icon d={icons.plus} size={14} color={c.white} sw={2} /> Nouvelle demande
          </button>
          {/* Sign out */}
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
        <aside className="sidebar-d" style={{
          width: '340px', borderRight: `1px solid ${c.borderSubtle}`, display: 'flex',
          flexDirection: 'column', background: c.bg, flexShrink: 0,
        }}>
          <div style={{ padding: `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.borderSubtle}` }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp[1], padding: `${sp[1]} ${sp[2]}`,
              background: c.bgWarm, border: `1px solid ${c.border}`, marginBottom: sp[1],
            }}>
              <Icon d={icons.search} size={14} color={c.textTertiary} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher\u2026"
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
            {filtered.length === 0 ? (
              <div style={{ padding: `${sp[4]} ${sp[3]}`, textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
                {orders.length === 0 ? 'Aucune commande.' : 'Aucun r\u00e9sultat'}
              </div>
            ) : filtered.map(order => (
              <OrderCard key={order.id} order={order} selected={order.id === selectedId}
                unreadCount={unreadMap[order.id] || 0}
                onClick={() => { setSelectedId(order.id); setMobileView('detail'); setTab('messages') }} />
            ))}
          </div>
        </aside>

        {/* ── MOBILE LIST ── */}
        <div className="mobile-list" style={{ display: 'none', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.borderSubtle}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp[1], padding: `${sp[1]} ${sp[2]}`,
              background: c.bgWarm, border: `1px solid ${c.border}`,
            }}>
              <Icon d={icons.search} size={14} color={c.textTertiary} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher\u2026"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text, fontSize: size.xs, fontFamily: f.body }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} selected={false}
                unreadCount={unreadMap[order.id] || 0}
                onClick={() => { setSelectedId(order.id); setMobileView('detail'); setTab('messages') }} />
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="main-c" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {selected ? (
            <>
              {/* Order header */}
              <div style={{ padding: `${sp[3]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgWarm }}>
                <button className="mobile-back" onClick={() => setMobileView('list')} style={{
                  background: 'none', border: 'none', color: c.textSecondary, cursor: 'pointer', padding: 0,
                  marginBottom: sp[2], display: 'flex', alignItems: 'center', gap: '4px', fontSize: size.xs, fontFamily: f.body,
                }}><Icon d={icons.back} size={16} /> Retour</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp[2] }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, marginBottom: '4px', letterSpacing: '0.03em' }}>
                      {selected.ref} {'\u00b7'} {fmtDate(selected.created_at)}
                    </div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                      {selected.product}
                    </h2>
                  </div>
                  <StatusPill status={selected.status} size="md" />
                </div>

                <div style={{
                  display: 'flex', gap: sp[3], fontSize: size.xs, color: c.textSecondary,
                  marginTop: sp[2], flexWrap: 'wrap',
                }}>
                  <span><strong style={{ color: c.text }}>{fmtQty(selected.quantity)}</strong> unit{'\u00e9'}s</span>
                  <span>Budget{'\u00a0'}: <strong style={{ color: c.gold }}>{selected.budget}</strong></span>
                  <span>D{'\u00e9'}lai{'\u00a0'}: <strong style={{ color: c.text }}>{selected.deadline}</strong></span>
                  <span>Fournisseur{'\u00a0'}: <strong style={{ color: c.text }}>{selected.supplier}</strong></span>
                </div>

                <StatusTracker current={selected.status} />

                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginTop: '4px' }}>
                  <div style={{ flex: 1 }}><ProgressBar value={selected.progress} color={(STATUSES[selected.status] || STATUSES[0]).color} height={3} /></div>
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
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', padding: sp[6], color: c.textTertiary, fontSize: size.xs }}>
                        Aucun message. {'\u00c9'}crivez le premier{'\u00a0'}!
                      </div>
                    )}
                    {messages.map((msg, i) => <ChatBubble key={msg.id || i} msg={msg} />)}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMsg} style={{
                    padding: `${sp[2]} ${sp[3]}`, borderTop: `1px solid ${c.borderSubtle}`,
                    display: 'flex', gap: sp[1], background: c.bgWarm,
                  }}>
                    <input ref={inputRef} value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      placeholder={'\u00c9crivez un message\u2026'}
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
                      border: 'none', width: 40, height: 40,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: newMsg.trim() ? 'pointer' : 'default', flexShrink: 0,
                      transition: `all 0.15s ${ease.smooth}`,
                    }}>
                      <Icon d={icons.send} size={16} color={newMsg.trim() ? c.white : c.textTertiary} />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: `${sp[3]} ${sp[3]}` }}>
                  {documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: sp[6], color: c.textTertiary, fontSize: size.xs }}>
                      Aucun document pour cette commande.
                    </div>
                  ) : documents.map(doc => (
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
              <span style={{ fontSize: size.sm }}>S{'\u00e9'}lectionnez une commande</span>
            </div>
          )}
        </main>
      </div>

      {showForm && <NewRequestForm onClose={() => setShowForm(false)} onSubmit={handleNewOrder} />}
    </div>
  )
}
