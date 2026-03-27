import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, STATUSES } from '../lib/theme'
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
  subscribeToMessages, subscribeToOrders, supabase,
} from '../lib/supabase'
import StatusPill, { ProgressBar } from '../components/StatusPill'

// ─── ICONS ───
const Icons = {
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  file: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  clip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtQty = (n) => (n || 0).toLocaleString('fr-FR')

// ─── ORDER CARD ───
function OrderCard({ order, selected, onClick, unreadCount }) {
  return (
    <div onClick={onClick} style={{
      padding: '1rem 1.25rem', cursor: 'pointer',
      background: selected ? c.bgE : 'transparent',
      borderBottom: `1px solid ${c.border}`,
      borderLeft: selected ? `3px solid ${c.gold}` : '3px solid transparent',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontFamily: f.mono, fontSize: '0.65rem', color: c.textMuted, letterSpacing: '0.04em' }}>{order.ref}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <span style={{
              minWidth: '1.1rem', height: '1.1rem', borderRadius: '50%',
              background: c.red, color: '#fff', fontSize: '0.55rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.2rem',
            }}>{unreadCount}</span>
          )}
          <StatusPill status={order.status} />
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.3 }}>{order.product}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: c.textDim }}>{fmtQty(order.quantity)} unit\u00e9s \u00b7 {order.budget}</span>
        <span style={{ fontSize: '0.65rem', color: c.textMuted, fontFamily: f.mono }}>{order.city}</span>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <ProgressBar value={order.progress} color={STATUSES[order.status]?.color || c.textMuted} />
      </div>
    </div>
  )
}

// ─── CHAT BUBBLE ───
function ChatBubble({ msg }) {
  const isAgent = msg.sender_role === 'admin'
  return (
    <div style={{ display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end', marginBottom: '0.6rem' }}>
      <div style={{
        maxWidth: '85%', padding: '0.75rem 1rem',
        background: isAgent ? c.bgC : `${c.gold}10`,
        border: `1px solid ${isAgent ? c.border : c.goldDim + '30'}`,
        borderRadius: isAgent ? '2px 8px 8px 8px' : '8px 2px 8px 8px',
        fontSize: '0.88rem', lineHeight: 1.6, color: c.text,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.65rem', color: c.textMuted, marginBottom: '0.35rem', fontFamily: f.mono,
        }}>
          <span style={{ color: isAgent ? c.gold : c.textDim, fontWeight: 600 }}>
            {isAgent ? '\u2666 CARAXE' : 'Vous'}
          </span>
          <span>{fmtDate(msg.created_at)}</span>
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        {msg.attachment_name && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem',
            padding: '0.3rem 0.6rem', background: `${c.gold}10`, border: `1px solid ${c.goldDim}30`,
            borderRadius: '2px', fontSize: '0.75rem', color: c.gold, cursor: 'pointer',
          }}>{Icons.clip} {msg.attachment_name}</div>
        )}
      </div>
    </div>
  )
}

// ─── NEW REQUEST FORM ───
function NewRequestForm({ onClose, onSubmit }) {
  const [form, setForm] = useState({ product: '', quantity: '', budget: '', deadline: '', notes: '' })
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const inputStyle = {
    width: '100%', padding: '0.9rem 1rem', background: c.bg,
    border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body,
    fontSize: '0.9rem', outline: 'none', borderRadius: '2px',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.7rem', fontFamily: f.mono,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textMuted, marginBottom: '0.5rem',
  }

  const steps = [
    <div key="0">
      <label style={labelStyle}>Quel produit recherchez-vous ?</label>
      <input style={inputStyle} placeholder="Ex : Coque silicone iPhone 16 Pro"
        value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} autoFocus />
      <p style={{ fontSize: '0.78rem', color: c.textDim, marginTop: '0.5rem', lineHeight: 1.5 }}>
        Soyez pr\u00e9cis : mat\u00e9riau, mod\u00e8le, finitions souhait\u00e9es.
      </p>
    </div>,
    <div key="1" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Quantit\u00e9</label>
          <input style={inputStyle} placeholder="1000" type="number" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Budget max</label>
          <input style={inputStyle} placeholder="2 000 \u20ac" value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>D\u00e9lai souhait\u00e9</label>
        <input style={inputStyle} type="date" value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
      </div>
    </div>,
    <div key="2">
      <label style={labelStyle}>Notes compl\u00e9mentaires</label>
      <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', lineHeight: 1.6 }}
        placeholder="Couleur, logo, sp\u00e9cifications\u2026" value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })} autoFocus />
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '1rem',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: c.bgC, border: `1px solid ${c.border}`,
        width: '100%', maxWidth: '540px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.5rem 2rem', borderBottom: `1px solid ${c.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontFamily: f.display, fontSize: '1.4rem', fontWeight: 700 }}>Nouvelle demande</h2>
            <div style={{ fontFamily: f.mono, fontSize: '0.65rem', color: c.textMuted, marginTop: '0.3rem' }}>
              \u00c9tape {step + 1} sur 3
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer' }}>{Icons.close}</button>
        </div>
        <div style={{ padding: '0 2rem' }}>
          <div style={{ display: 'flex', gap: '0.3rem', paddingTop: '1.25rem' }}>
            {[0,1,2].map(i => <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: i<=step ? c.gold : c.border, transition:'background 0.3s' }}/>)}
          </div>
        </div>
        <div style={{ padding: '1.5rem 2rem' }}>{steps[step]}</div>
        <div style={{ padding: '1rem 2rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {step > 0 && <button onClick={() => setStep(step-1)} style={{
            padding:'0.75rem 1.5rem', background:'transparent', border:`1px solid ${c.border}`,
            color:c.textDim, fontFamily:f.body, fontSize:'0.8rem', fontWeight:600, cursor:'pointer', borderRadius:'2px',
          }}>Retour</button>}
          {step < 2 ? (
            <button onClick={() => canNext && setStep(step+1)} style={{
              padding:'0.75rem 2rem', background: canNext ? c.red : c.bgE, border:'none',
              color: canNext ? '#fff' : c.textMuted, fontFamily:f.body, fontSize:'0.8rem',
              fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
              cursor: canNext ? 'pointer' : 'default', borderRadius:'2px',
            }}>Suivant</button>
          ) : (
            <button onClick={handleFinalSubmit} disabled={submitting} style={{
              padding:'0.75rem 2rem', background:c.red, border:'none', color:'#fff',
              fontFamily:f.body, fontSize:'0.8rem', fontWeight:700, letterSpacing:'0.04em',
              textTransform:'uppercase', cursor:'pointer', borderRadius:'2px',
              opacity: submitting ? 0.6 : 1,
            }}>{submitting ? 'Envoi\u2026' : 'Envoyer la demande'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───
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

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders(profile.role === 'admin' ? null : user.id)
      setOrders(data)

      // Count unread per order
      const { data: unreadData } = await supabase
        .from('messages')
        .select('order_id')
        .neq('sender_id', user.id)
        .eq('read', false)
      const map = {}
      ;(unreadData || []).forEach(m => { map[m.order_id] = (map[m.order_id] || 0) + 1 })
      setUnreadMap(map)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user.id, profile.role])

  useEffect(() => { loadOrders() }, [loadOrders])

  // Load messages & docs when selecting an order
  useEffect(() => {
    if (!selectedId) return
    const load = async () => {
      const [msgs, docs] = await Promise.all([getMessages(selectedId), getDocuments(selectedId)])
      setMessages(msgs)
      setDocuments(docs)
      await markMessagesRead(selectedId, user.id)
      setUnreadMap(prev => ({ ...prev, [selectedId]: 0 }))
    }
    load()
  }, [selectedId, user.id])

  // Realtime: messages
  useEffect(() => {
    if (!selectedId) return
    const channel = subscribeToMessages(selectedId, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
      if (newMsg.sender_id !== user.id) {
        markMessagesRead(selectedId, user.id)
      }
    })
    return () => { supabase.removeChannel(channel) }
  }, [selectedId, user.id])

  // Realtime: orders
  useEffect(() => {
    const channel = subscribeToOrders(() => { loadOrders() })
    return () => { supabase.removeChannel(channel) }
  }, [loadOrders])

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const selected = orders.find(o => o.id === selectedId)

  // Filter
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
    const text = newMsg
    setNewMsg('')
    await sendMessage({
      orderId: selectedId, senderId: user.id,
      senderRole: profile.role, content: text,
    })
    inputRef.current?.focus()
  }

  const handleDownloadDoc = async (doc) => {
    const url = await getDocumentUrl(doc.storage_path)
    if (url) window.open(url, '_blank')
  }

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg }}>
        <div style={{ fontFamily: f.mono, color: c.textMuted, fontSize: '0.85rem' }}>Chargement\u2026</div>
      </div>
    )
  }

  // ─── STATUS TRACKER ───
  const StatusTracker = ({ current }) => (
    <div style={{ margin: '1.25rem 0 0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STATUSES.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STATUSES.length - 1 ? 1 : 'none' }}>
            <div title={s.label} style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i <= current ? '0.8rem' : '0.6rem', fontFamily: f.mono, fontWeight: 700,
              background: i <= current ? `${STATUSES[current].color}20` : c.bgC,
              color: i <= current ? STATUSES[current].color : c.textMuted,
              border: `2px solid ${i <= current ? STATUSES[current].color : c.border}`,
              boxShadow: i === current ? `0 0 12px ${STATUSES[current].color}30` : 'none',
              flexShrink: 0, transition: 'all 0.3s',
            }}>{i <= current ? s.icon : i + 1}</div>
            {i < STATUSES.length - 1 && (
              <div style={{ flex:1, height:'2px', margin:'0 0.1rem', background: i < current ? STATUSES[current].color : c.border }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem' }}>
        <span style={{ color: STATUSES[current]?.color, fontFamily: f.mono }}>{STATUSES[current]?.icon} {STATUSES[current]?.label}</span>
        <span style={{ color: c.textMuted, fontFamily: f.mono }}>{current + 1}/{STATUSES.length}</span>
      </div>
    </div>
  )

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'active', label: 'En cours' },
    { key: 'done', label: 'Termin\u00e9es' },
  ]

  // ─── RENDER ───
  return (
    <div style={{ fontFamily: f.body, background: c.bg, color: c.text, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media(max-width:768px){.sidebar-d{display:none!important}.mobile-list{display:flex!important}.main-c{display:${mobileView==='detail'?'flex':'none'}!important}}
        @media(min-width:769px){.mobile-list{display:none!important}.mobile-back{display:none!important}}
        input:focus,textarea:focus{border-color:${c.goldDim}!important}
      `}</style>

      {/* HEADER */}
      <header style={{
        padding: '0.75rem 1.25rem', borderBottom: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.bgE, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: c.red, fontSize: '1.1rem' }}>{'\u2666'}</span>
          <span style={{ fontFamily: f.display, fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.08em' }}>CARAXE</span>
          <span style={{
            fontFamily: f.mono, fontSize: '0.55rem', color: c.textMuted, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '0.15rem 0.45rem', border: `1px solid ${c.border}`,
            marginLeft: '0.25rem', borderRadius: '2px',
          }}>Espace client</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', color: c.textDim }}>
            {Icons.bell}
            {totalUnread > 0 && <span style={{
              position: 'absolute', top: '-4px', right: '-4px', width: '0.85rem', height: '0.85rem',
              borderRadius: '50%', background: c.red, fontSize: '0.5rem', color: '#fff', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{totalUnread}</span>}
          </div>
          <button onClick={() => setShowForm(true)} style={{
            background: c.red, color: '#fff', border: 'none', padding: '0.55rem 1.1rem',
            fontFamily: f.body, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '0.35rem', borderRadius: '2px',
          }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Nouvelle demande
          </button>
          <button onClick={onSignOut} style={{
            background: 'transparent', border: `1px solid ${c.border}`, color: c.textMuted,
            padding: '0.45rem 0.75rem', fontFamily: f.mono, fontSize: '0.6rem', letterSpacing: '0.04em',
            textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px',
          }}>D\u00e9co</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* SIDEBAR (Desktop) */}
        <aside className="sidebar-d" style={{
          width: '340px', borderRight: `1px solid ${c.border}`, display: 'flex',
          flexDirection: 'column', background: c.bg, flexShrink: 0, overflow: 'hidden',
        }}>
          {/* Search + filter */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${c.border}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
              background: c.bgC, border: `1px solid ${c.border}`, borderRadius: '2px', marginBottom: '0.6rem',
            }}>
              <span style={{ color: c.textMuted, flexShrink: 0 }}>{Icons.search}</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher\u2026"
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:c.text, fontFamily:f.body, fontSize:'0.85rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {filters.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  flex:1, padding:'0.4rem', border:`1px solid ${filter===key ? c.goldDim : c.border}`,
                  background: filter===key ? `${c.gold}12` : 'transparent',
                  color: filter===key ? c.gold : c.textMuted, fontFamily:f.mono,
                  fontSize:'0.65rem', letterSpacing:'0.06em', textTransform:'uppercase',
                  cursor:'pointer', borderRadius:'2px',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:'2rem', textAlign:'center', color:c.textMuted, fontFamily:f.mono, fontSize:'0.8rem' }}>
                {orders.length === 0 ? 'Aucune commande. Cr\u00e9ez la premi\u00e8re !' : 'Aucun r\u00e9sultat'}
              </div>
            ) : filtered.map(order => (
              <OrderCard key={order.id} order={order} selected={order.id === selectedId}
                unreadCount={unreadMap[order.id] || 0}
                onClick={() => { setSelectedId(order.id); setMobileView('detail'); setTab('messages') }} />
            ))}
          </div>
        </aside>

        {/* MOBILE LIST */}
        <div className="mobile-list" style={{ display:'none', flexDirection:'column', flex:1, overflow:'hidden' }}>
          <div style={{ padding:'0.75rem 1rem', borderBottom:`1px solid ${c.border}` }}>
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem',
              background:c.bgC, border:`1px solid ${c.border}`, borderRadius:'2px',
            }}>
              <span style={{ color:c.textMuted }}>{Icons.search}</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher\u2026"
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:c.text, fontFamily:f.body, fontSize:'0.85rem' }} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} selected={false}
                unreadCount={unreadMap[order.id] || 0}
                onClick={() => { setSelectedId(order.id); setMobileView('detail'); setTab('messages') }} />
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="main-c" style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>
          {selected ? (
            <>
              {/* Detail Header */}
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${c.border}`, background:c.bgE }}>
                <button className="mobile-back" onClick={() => setMobileView('list')} style={{
                  background:'none', border:'none', color:c.textDim, cursor:'pointer', padding:0,
                  marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.3rem',
                  fontFamily:f.body, fontSize:'0.8rem',
                }}>{Icons.back} Retour</button>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:f.mono, fontSize:'0.65rem', color:c.textMuted, marginBottom:'0.3rem' }}>
                      {selected.ref} \u00b7 {fmtDate(selected.created_at)}
                    </div>
                    <h2 style={{ fontFamily:f.display, fontSize:'1.4rem', fontWeight:700, lineHeight:1.2 }}>{selected.product}</h2>
                  </div>
                  <StatusPill status={selected.status} size="md" />
                </div>

                <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.8rem', color:c.textDim, marginTop:'0.75rem', flexWrap:'wrap' }}>
                  <span><strong style={{color:c.text}}>{fmtQty(selected.quantity)}</strong> unit\u00e9s</span>
                  <span>Budget : <strong style={{color:c.gold}}>{selected.budget}</strong></span>
                  <span>D\u00e9lai : <strong style={{color:c.text}}>{selected.deadline}</strong></span>
                  <span>Fournisseur : <strong style={{color:c.text}}>{selected.supplier}</strong></span>
                </div>

                <StatusTracker current={selected.status} />
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'0.25rem' }}>
                  <div style={{ flex:1 }}><ProgressBar value={selected.progress} color={STATUSES[selected.status]?.color} height={6} /></div>
                  <span style={{ fontFamily:f.mono, fontSize:'0.7rem', color:c.textMuted, fontWeight:600 }}>{selected.progress}%</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:`1px solid ${c.border}` }}>
                {['messages', 'documents'].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex:1, padding:'0.65rem', background: tab===t ? c.bgE : 'transparent',
                    border:'none', borderBottom: tab===t ? `2px solid ${c.gold}` : '2px solid transparent',
                    color: tab===t ? c.gold : c.textMuted, fontFamily:f.mono, fontSize:'0.7rem',
                    letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                  }}>
                    {t === 'messages' ? `Messages (${messages.length})` : `Documents (${documents.length})`}
                  </button>
                ))}
              </div>

              {tab === 'messages' ? (
                <>
                  <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.5rem' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign:'center', padding:'3rem', color:c.textMuted, fontFamily:f.mono, fontSize:'0.8rem' }}>
                        Aucun message. \u00c9crivez le premier !
                      </div>
                    )}
                    {messages.map((msg, i) => <ChatBubble key={msg.id || i} msg={msg} />)}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMsg} style={{
                    padding:'0.75rem 1.25rem', borderTop:`1px solid ${c.border}`,
                    display:'flex', gap:'0.5rem', background:c.bgE,
                  }}>
                    <input ref={inputRef} value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      placeholder="\u00c9crivez un message\u2026"
                      style={{
                        flex:1, padding:'0.75rem 1rem', background:c.bg, border:`1px solid ${c.border}`,
                        color:c.text, fontFamily:f.body, fontSize:'0.88rem', outline:'none', borderRadius:'2px',
                      }} />
                    <button type="submit" style={{
                      background: newMsg.trim() ? c.gold : c.bgC,
                      color: newMsg.trim() ? c.bg : c.textMuted,
                      border:`1px solid ${newMsg.trim() ? c.gold : c.border}`,
                      width:'2.75rem', height:'2.75rem', display:'flex', alignItems:'center',
                      justifyContent:'center', cursor: newMsg.trim() ? 'pointer' : 'default',
                      borderRadius:'2px', flexShrink:0,
                    }}>{Icons.send}</button>
                  </form>
                </>
              ) : (
                <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.5rem' }}>
                  {documents.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'3rem', color:c.textMuted, fontFamily:f.mono, fontSize:'0.8rem' }}>
                      Aucun document pour cette commande.
                    </div>
                  ) : documents.map(doc => (
                    <div key={doc.id} onClick={() => handleDownloadDoc(doc)} style={{
                      display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.75rem',
                      background:c.bgC, border:`1px solid ${c.border}`, borderRadius:'2px',
                      fontSize:'0.8rem', cursor:'pointer', marginBottom:'0.5rem', transition:'border-color 0.2s',
                    }}>
                      <span style={{ color:c.gold, flexShrink:0 }}>{Icons.file}</span>
                      <span style={{ flex:1, color:c.text, fontWeight:500 }}>{doc.name}</span>
                      <span style={{ color:c.textMuted, fontSize:'0.7rem', fontFamily:f.mono }}>{doc.size}</span>
                      <span style={{ color:c.teal }}>{Icons.download}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'0.75rem', color:c.textMuted }}>
              <span style={{ fontSize:'2rem' }}>{'\u2666'}</span>
              <span style={{ fontFamily:f.mono, fontSize:'0.8rem' }}>S\u00e9lectionnez une commande</span>
            </div>
          )}
        </main>
      </div>

      {showForm && <NewRequestForm onClose={() => setShowForm(false)} onSubmit={handleNewOrder} />}
    </div>
  )
}