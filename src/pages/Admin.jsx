import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients,
  subscribeToMessages, subscribeToOrders, supabase,
} from '../lib/supabase'
import StatusPill, { ProgressBar } from '../components/StatusPill'

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })

// ─── ADMIN PANEL ───
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
    setOrders(ordersData)
    setClients(clientsData)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Realtime
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
    const cl = clients.find(c => c.id === clientId)
    return cl ? (cl.full_name || cl.email) : 'Inconnu'
  }

  const filtered = orders.filter(o => {
    if (filter === 'active' && o.status >= 6) return false
    if (filter === 'done' && o.status < 6) return false
    if (search) {
      const q = search.toLowerCase()
      return o.product.toLowerCase().includes(q) || o.ref?.toLowerCase().includes(q) ||
        clientName(o.client_id).toLowerCase().includes(q)
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
    setEditMode(false)
    await loadAll()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    await uploadDocument(selectedId, file, user.id)
    const docs = await getDocuments(selectedId)
    setDocuments(docs)
    fileInputRef.current.value = ''
  }

  const handleDownloadDoc = async (doc) => {
    const url = await getDocumentUrl(doc.storage_path)
    if (url) window.open(url, '_blank')
  }

  const inputStyle = {
    width:'100%', padding:'0.7rem 0.85rem', background:c.bg, border:`1px solid ${c.border}`,
    color:c.text, fontFamily:f.body, fontSize:'0.85rem', outline:'none', borderRadius:'2px',
  }
  const labelStyle = {
    display:'block', fontSize:'0.65rem', fontFamily:f.mono, letterSpacing:'0.08em',
    textTransform:'uppercase', color:c.textMuted, marginBottom:'0.35rem',
  }

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:c.bg }}>
      <span style={{ fontFamily:f.mono, color:c.textMuted }}>Chargement\u2026</span>
    </div>
  )

  return (
    <div style={{ fontFamily:f.body, background:c.bg, color:c.text, height:'100vh', display:'flex', flexDirection:'column' }}>
      <style>{`input:focus,textarea:focus,select:focus{border-color:${c.goldDim}!important}`}</style>

      {/* HEADER */}
      <header style={{
        padding:'0.75rem 1.25rem', borderBottom:`1px solid ${c.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between', background:c.bgE, flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ color:c.red, fontSize:'1.1rem' }}>{'\u2666'}</span>
          <span style={{ fontFamily:f.display, fontWeight:900, fontSize:'1.15rem', letterSpacing:'0.08em' }}>CARAXE</span>
          <span style={{
            fontFamily:f.mono, fontSize:'0.55rem', color:c.red, letterSpacing:'0.06em',
            textTransform:'uppercase', padding:'0.15rem 0.45rem', border:`1px solid ${c.red}40`,
            background:`${c.red}15`, marginLeft:'0.25rem', borderRadius:'2px',
          }}>Admin</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontFamily:f.mono, fontSize:'0.7rem', color:c.textMuted }}>
            {orders.filter(o=>o.status<6).length} en cours \u00b7 {orders.length} total
          </span>
          <button onClick={onSignOut} style={{
            background:'transparent', border:`1px solid ${c.border}`, color:c.textMuted,
            padding:'0.45rem 0.75rem', fontFamily:f.mono, fontSize:'0.6rem',
            cursor:'pointer', borderRadius:'2px', textTransform:'uppercase',
          }}>D\u00e9co</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* SIDEBAR */}
        <aside style={{
          width:'360px', borderRight:`1px solid ${c.border}`, display:'flex',
          flexDirection:'column', background:c.bg, flexShrink:0, overflow:'hidden',
        }}>
          <div style={{ padding:'0.75rem 1rem', borderBottom:`1px solid ${c.border}` }}>
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem',
              background:c.bgC, border:`1px solid ${c.border}`, borderRadius:'2px', marginBottom:'0.6rem',
            }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher client, produit\u2026"
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:c.text, fontFamily:f.body, fontSize:'0.85rem' }} />
            </div>
            <div style={{ display:'flex', gap:'0.4rem' }}>
              {[{key:'all',label:'Toutes'},{key:'active',label:'En cours'},{key:'done',label:'Termin\u00e9es'}].map(({key,label}) => (
                <button key={key} onClick={()=>setFilter(key)} style={{
                  flex:1, padding:'0.4rem', border:`1px solid ${filter===key?c.goldDim:c.border}`,
                  background:filter===key?`${c.gold}12`:'transparent', color:filter===key?c.gold:c.textMuted,
                  fontFamily:f.mono, fontSize:'0.65rem', letterSpacing:'0.06em', textTransform:'uppercase',
                  cursor:'pointer', borderRadius:'2px',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.map(order => (
              <div key={order.id} onClick={()=>{setSelectedId(order.id);setTab('messages');setEditMode(false)}}
                style={{
                  padding:'0.85rem 1rem', cursor:'pointer', borderBottom:`1px solid ${c.border}`,
                  borderLeft: order.id===selectedId ? `3px solid ${c.gold}` : '3px solid transparent',
                  background: order.id===selectedId ? c.bgE : 'transparent',
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.3rem' }}>
                  <span style={{ fontFamily:f.mono, fontSize:'0.6rem', color:c.textMuted }}>{order.ref}</span>
                  <StatusPill status={order.status} />
                </div>
                <div style={{ fontWeight:600, fontSize:'0.88rem', marginBottom:'0.2rem' }}>{order.product}</div>
                <div style={{ fontSize:'0.72rem', color:c.textDim }}>
                  {clientName(order.client_id)} \u00b7 {(order.quantity||0).toLocaleString('fr-FR')} unit\u00e9s \u00b7 {order.budget}
                </div>
                <div style={{ marginTop:'0.4rem' }}>
                  <ProgressBar value={order.progress} color={STATUSES[order.status]?.color||c.textMuted} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>
          {selected ? (
            <>
              {/* Order Header */}
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${c.border}`, background:c.bgE }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', marginBottom:'0.75rem' }}>
                  <div>
                    <div style={{ fontFamily:f.mono, fontSize:'0.65rem', color:c.textMuted, marginBottom:'0.3rem' }}>
                      {selected.ref} \u00b7 Client : {clientName(selected.client_id)}
                    </div>
                    <h2 style={{ fontFamily:f.display, fontSize:'1.3rem', fontWeight:700 }}>{selected.product}</h2>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                    <button onClick={()=>{setEditMode(!editMode);setEditData({
                      supplier:selected.supplier, city:selected.city, status:selected.status, progress:selected.progress,
                    })}} style={{
                      padding:'0.4rem 0.8rem', background:editMode?c.gold:'transparent',
                      border:`1px solid ${editMode?c.gold:c.border}`, color:editMode?c.bg:c.textDim,
                      fontFamily:f.mono, fontSize:'0.6rem', cursor:'pointer', borderRadius:'2px',
                      textTransform:'uppercase', letterSpacing:'0.04em',
                    }}>{editMode?'Annuler':'\u270F\uFE0F Modifier'}</button>
                  </div>
                </div>

                {/* Status changer (admin quick buttons) */}
                <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
                  {STATUSES.map((s,i) => (
                    <button key={i} onClick={()=>handleStatusChange(i)} style={{
                      padding:'0.3rem 0.6rem', fontSize:'0.6rem', fontFamily:f.mono,
                      border:`1px solid ${i===selected.status?s.color:c.border}`,
                      background:i===selected.status?`${s.color}20`:'transparent',
                      color:i===selected.status?s.color:c.textMuted,
                      cursor:'pointer', borderRadius:'2px', transition:'all 0.2s',
                    }}>{s.icon} {s.label}</button>
                  ))}
                </div>

                {/* Edit form */}
                {editMode && (
                  <div style={{
                    display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'0.75rem',
                    padding:'1rem', background:c.bgC, border:`1px solid ${c.border}`, marginBottom:'0.75rem',
                  }}>
                    <div>
                      <label style={labelStyle}>Fournisseur</label>
                      <input style={inputStyle} value={editData.supplier||''} onChange={e=>setEditData({...editData,supplier:e.target.value})} />
                    </div>
                    <div>
                      <label style={labelStyle}>Ville</label>
                      <input style={inputStyle} value={editData.city||''} onChange={e=>setEditData({...editData,city:e.target.value})} />
                    </div>
                    <div>
                      <label style={labelStyle}>Progression %</label>
                      <input style={inputStyle} type="number" min="0" max="100" value={editData.progress||0}
                        onChange={e=>setEditData({...editData,progress:parseInt(e.target.value)||0})} />
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end' }}>
                      <button onClick={handleSaveEdit} style={{
                        padding:'0.7rem 1.25rem', background:c.green, border:'none', color:c.bg,
                        fontFamily:f.body, fontSize:'0.75rem', fontWeight:700, cursor:'pointer',
                        borderRadius:'2px', textTransform:'uppercase',
                      }}>Sauver</button>
                    </div>
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ flex:1 }}><ProgressBar value={selected.progress} color={STATUSES[selected.status]?.color} height={6} /></div>
                  <span style={{ fontFamily:f.mono, fontSize:'0.7rem', color:c.textMuted }}>{selected.progress}%</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:`1px solid ${c.border}` }}>
                {['messages','documents'].map(t => (
                  <button key={t} onClick={()=>setTab(t)} style={{
                    flex:1, padding:'0.65rem', background:tab===t?c.bgE:'transparent',
                    border:'none', borderBottom:tab===t?`2px solid ${c.gold}`:'2px solid transparent',
                    color:tab===t?c.gold:c.textMuted, fontFamily:f.mono, fontSize:'0.7rem',
                    letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                  }}>{t==='messages'?`Messages (${messages.length})`:`Documents (${documents.length})`}</button>
                ))}
              </div>

              {tab === 'messages' ? (
                <>
                  <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.5rem' }}>
                    {messages.map((msg,i) => {
                      const isAgent = msg.sender_role === 'admin'
                      return (
                        <div key={msg.id||i} style={{ display:'flex', justifyContent:isAgent?'flex-end':'flex-start', marginBottom:'0.6rem' }}>
                          <div style={{
                            maxWidth:'85%', padding:'0.75rem 1rem',
                            background:isAgent?`${c.gold}10`:c.bgC,
                            border:`1px solid ${isAgent?c.goldDim+'30':c.border}`,
                            borderRadius:isAgent?'8px 2px 8px 8px':'2px 8px 8px 8px',
                            fontSize:'0.88rem', lineHeight:1.6,
                          }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:c.textMuted, marginBottom:'0.35rem', fontFamily:f.mono }}>
                              <span style={{ color:isAgent?c.gold:c.teal, fontWeight:600 }}>{isAgent?'Vous (Admin)':'Client'}</span>
                              <span>{fmtDate(msg.created_at)}</span>
                            </div>
                            <div style={{ whiteSpace:'pre-wrap' }}>{msg.content}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMsg} style={{
                    padding:'0.75rem 1.25rem', borderTop:`1px solid ${c.border}`,
                    display:'flex', gap:'0.5rem', background:c.bgE,
                  }}>
                    <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                      placeholder="R\u00e9pondre au client\u2026"
                      style={{
                        flex:1, padding:'0.75rem 1rem', background:c.bg, border:`1px solid ${c.border}`,
                        color:c.text, fontFamily:f.body, fontSize:'0.88rem', outline:'none', borderRadius:'2px',
                      }} />
                    <button type="submit" style={{
                      background:newMsg.trim()?c.gold:c.bgC, color:newMsg.trim()?c.bg:c.textMuted,
                      border:`1px solid ${newMsg.trim()?c.gold:c.border}`,
                      padding:'0.75rem 1.25rem', fontFamily:f.body, fontSize:'0.8rem', fontWeight:700,
                      cursor:newMsg.trim()?'pointer':'default', borderRadius:'2px',
                      textTransform:'uppercase', letterSpacing:'0.04em',
                    }}>Envoyer</button>
                  </form>
                </>
              ) : (
                <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.5rem' }}>
                  {/* Upload */}
                  <div style={{
                    padding:'1rem', border:`2px dashed ${c.border}`, textAlign:'center',
                    marginBottom:'1rem', cursor:'pointer', borderRadius:'2px',
                  }} onClick={()=>fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleFileUpload} />
                    <span style={{ fontFamily:f.mono, fontSize:'0.75rem', color:c.textMuted }}>
                      Cliquez pour uploader un document
                    </span>
                  </div>
                  {documents.map(doc => (
                    <div key={doc.id} onClick={()=>handleDownloadDoc(doc)} style={{
                      display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.75rem',
                      background:c.bgC, border:`1px solid ${c.border}`, borderRadius:'2px',
                      fontSize:'0.8rem', cursor:'pointer', marginBottom:'0.5rem',
                    }}>
                      <span style={{ flex:1, color:c.text, fontWeight:500 }}>{doc.name}</span>
                      <span style={{ color:c.textMuted, fontSize:'0.7rem', fontFamily:f.mono }}>{doc.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'0.75rem', color:c.textMuted }}>
              <span style={{ fontSize:'2rem' }}>{'\u2666'}</span>
              <span style={{ fontFamily:f.mono, fontSize:'0.85rem' }}>S\u00e9lectionnez une commande \u00e0 g\u00e9rer</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}