import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { c, f, size, sp, shadow, ease, STATUSES } from '../lib/theme'
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
  subscribeToMessages, subscribeToOrders, supabase,
} from '../lib/supabase'
import { CATEGORIES } from '../lib/categories'
import { getTierByKey, getTierPrice, getCategoryMOQ, DEFAULT_TIER } from '../lib/clientTiers'
import StatusPill, { ProgressBar } from '../components/StatusPill'
import { useToast } from '../components/Toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

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
  settings: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtQty = (n) => (n || 0).toLocaleString('fr-FR')

/* ── DRAGON ART DECO EMPTY STATE SVG ── */
function DragonEmptyState() {
  return (
    <svg viewBox="0 0 200 200" width={120} height={120} style={{ opacity: 0.15, marginBottom: sp[3] }}>
      <g>
        <path d="M100 20 L130 60 L100 50 L70 60 Z" fill={c.gold} stroke={c.gold} strokeWidth="1" />
        <circle cx="100" cy="100" r="40" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M70 100 Q60 90 60 80 Q60 70 75 70" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M130 100 Q140 90 140 80 Q140 70 125 70" fill="none" stroke={c.gold} strokeWidth="1" />
        <circle cx="85" cy="95" r="3" fill={c.gold} />
        <circle cx="115" cy="95" r="3" fill={c.gold} />
        <path d="M100 110 Q90 120 85 130" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M100 110 Q110 120 115 130" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M80 140 L90 160 L100 155 L110 160 L120 140" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M100 20 L100 180" stroke={c.goldSoft} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
      </g>
    </svg>
  )
}

/* ── ORDER CARD (SIDEBAR) ── */
function OrderCard({ order, selected, onClick, unreadCount }) {
  const [hovered, setHovered] = useState(false)
  const statusObj = STATUSES.find(s => s.key === order.status) || STATUSES[0]

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${sp[2]} ${sp[2]}`,
        cursor: 'pointer',
        background: selected ? c.bgElevated : hovered ? c.bgWarm : 'transparent',
        borderLeft: `3px solid ${selected ? c.red : 'transparent'}`,
        borderBottom: `1px solid ${c.borderSubtle}`,
        transition: `all 0.15s ${ease.smooth}`,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textTertiary, letterSpacing: '0.03em' }}>
          {order.ref}
        </span>
        {unreadCount > 0 && (
          <span style={{
            minWidth: 18, height: 18, borderRadius: '9999px',
            background: c.red, color: c.white, fontSize: '9px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
          }}>{unreadCount}</span>
        )}
      </div>
      <div style={{
        fontWeight: 600, fontSize: size.sm, marginBottom: '8px',
        lineHeight: 1.4, color: c.text,
      }}>{order.product}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: size.xs, color: c.textSecondary }}>
          {fmtQty(order.quantity)} unités · {order.budget}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp[1], marginBottom: '6px' }}>
        <StatusPill status={order.status} size="sm" />
      </div>
      <div style={{ marginTop: sp[1] }}>
        <ProgressBar value={order.progress} color={statusObj.color} height={2} />
      </div>
    </div>
  )
}

/* ── CHAT BUBBLE ── */
function ChatBubble({ msg }) {
  const isAgent = msg.sender_role === 'admin'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isAgent ? 'flex-start' : 'flex-end',
      marginBottom: sp[2],
    }}>
      <div style={{
        maxWidth: '75%',
        padding: `${sp[2]} ${sp[2]}`,
        background: isAgent ? c.bgElevated : c.redSoft,
        border: `1px solid ${isAgent ? c.border : c.redGlow}`,
        borderRadius: 0,
        fontSize: size.sm,
        lineHeight: 1.65,
        color: c.text,
      }}>
        <div style={{
          fontSize: size.xs,
          color: c.textTertiary,
          marginBottom: '6px',
          fontFamily: f.mono,
          letterSpacing: '0.02em',
        }}>
          {isAgent ? 'Agent · ' : 'Vous · '}{fmtDate(msg.created_at)}
        </div>
        <p style={{ margin: 0, wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </p>
      </div>
    </div>
  )
}

/* ── DOCUMENT CARD ── */
function DocumentCard({ doc, onDownload }) {
  const [hovered, setHovered] = useState(false)
  const fileName = doc.name || doc.file_name || 'Document'
  const fileExt = fileName.split('.').pop().toUpperCase()

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: `${sp[2]} ${sp[2]}`,
        background: hovered ? c.bgHover : c.bgElevated,
        border: `1px solid ${c.border}`,
        gap: sp[2],
        transition: `all 0.15s ${ease.smooth}`,
        cursor: 'pointer',
      }}
      onClick={onDownload}>
      <div style={{
        width: 40,
        height: 40,
        background: c.redSoft,
        border: `1px solid ${c.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon d={icons.file} size={20} color={c.red} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: size.sm, color: c.text, fontWeight: 500, marginBottom: '2px' }}>
          {fileName}
        </div>
        <div style={{ fontSize: size.xs, color: c.textTertiary }}>
          {fileExt} · {fmtDate(doc.created_at)}
        </div>
      </div>
      <Icon d={icons.download} size={16} color={c.textSecondary} />
    </div>
  )
}

/* ── PIPELINE TRACKER ── */
function PipelineTracker({ status }) {
  const stages = STATUSES
  const currentIndex = stages.findIndex(s => s.key === status)

  return (
    <div style={{
      background: c.bgElevated,
      border: `1px solid ${c.border}`,
      padding: `${sp[3]} ${sp[3]}`,
      marginBottom: sp[3],
    }}>
      <div style={{
        fontSize: size.xs,
        color: c.textTertiary,
        marginBottom: sp[2],
        fontFamily: f.mono,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}>
        Progression
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isFuture = idx > currentIndex

          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Step circle */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 0,
                background: isCurrent ? c.red : isCompleted ? c.green : c.bgSurface,
                border: `2px solid ${isCurrent ? c.red : isCompleted ? c.green : c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: f.mono,
                fontSize: size.xs,
                fontWeight: 600,
                color: isCurrent || isCompleted ? c.white : c.textTertiary,
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
                transition: `all 0.3s ${ease.smooth}`,
              }}>
                {isCompleted ? '✓' : idx + 1}
              </div>

              {/* Connector line */}
              {idx < stages.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: isCompleted || isCurrent ? c.green : c.border,
                  margin: '0 -2px',
                  transition: `background 0.3s ${ease.smooth}`,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Labels underneath */}
      <div style={{
        display: 'flex',
        marginTop: sp[2],
        gap: '4px',
      }}>
        {stages.map((stage, idx) => (
          <div key={stage.key} style={{
            flex: 1,
            fontSize: size.xs,
            color: idx <= currentIndex ? c.text : c.textTertiary,
            textAlign: 'center',
            lineHeight: 1.3,
          }}>
            {stage.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── MODAL: NOUVELLE DEMANDE (MULTI-STEP) ── */
function NewOrderModal({ isOpen, onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    budget: '',
    deadline: '',
    notes: '',
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setFormData({ product: '', quantity: '', budget: '', deadline: '', notes: '' })
    setStep(1)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: c.bgElevated,
        border: `1px solid ${c.border}`,
        width: '100%', maxWidth: 500,
        padding: sp[4],
        boxShadow: shadow.lg,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: sp[3],
        }}>
          <h2 style={{
            margin: 0,
            fontSize: size.lg,
            fontFamily: f.display,
            color: c.text,
          }}>
            Nouvelle demande
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: sp[1],
              color: c.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `color 0.15s ${ease.smooth}`,
            }}
            onMouseOver={(e) => e.target.style.color = c.red}
            onMouseOut={(e) => e.target.style.color = c.textSecondary}>
            <Icon d={icons.close} size={20} color="currentColor" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 3,
          background: c.bgSurface,
          marginBottom: sp[3],
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(step / 3) * 100}%`,
            height: '100%',
            background: c.red,
            transition: `width 0.3s ${ease.smooth}`,
          }} />
        </div>

        {/* Form content */}
        <div style={{ minHeight: 200 }}>
          {step === 1 && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: sp[2],
                fontSize: size.sm,
                color: c.text,
              }}>
                Que recherchez-vous?
              </label>
              <input
                type="text"
                placeholder="Ex: vêtements en coton, chaussures de sport..."
                value={formData.product}
                onChange={(e) => handleChange('product', e.target.value)}
                style={{
                  width: '100%',
                  padding: `${sp[2]} ${sp[2]}`,
                  fontSize: size.sm,
                  fontFamily: f.body,
                  background: c.bgSurface,
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  boxSizing: 'border-box',
                  transition: `border 0.15s ${ease.smooth}`,
                }}
                onFocus={(e) => e.target.style.borderColor = c.red}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: sp[1],
                  fontSize: size.sm,
                  color: c.text,
                }}>Quantité</label>
                <input
                  type="number"
                  placeholder="Ex: 1000"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${sp[2]} ${sp[2]}`,
                    fontSize: size.sm,
                    fontFamily: f.body,
                    background: c.bgSurface,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: sp[1],
                  fontSize: size.sm,
                  color: c.text,
                }}>Budget</label>
                <input
                  type="text"
                  placeholder="Ex: $5000"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${sp[2]} ${sp[2]}`,
                    fontSize: size.sm,
                    fontFamily: f.body,
                    background: c.bgSurface,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: sp[1],
                  fontSize: size.sm,
                  color: c.text,
                }}>Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${sp[2]} ${sp[2]}`,
                    fontSize: size.sm,
                    fontFamily: f.body,
                    background: c.bgSurface,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: sp[2],
                fontSize: size.sm,
                color: c.text,
              }}>Notes supplémentaires (optionnel)</label>
              <textarea
                placeholder="Détails, spécifications, références visuelles..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                style={{
                  width: '100%',
                  padding: `${sp[2]} ${sp[2]}`,
                  fontSize: size.sm,
                  fontFamily: f.body,
                  background: c.bgSurface,
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  boxSizing: 'border-box',
                  minHeight: 120,
                  resize: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: sp[2],
          marginTop: sp[3],
          justifyContent: 'flex-end',
        }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                padding: `${sp[1]} ${sp[3]}`,
                background: c.bgSurface,
                border: `1px solid ${c.border}`,
                color: c.text,
                fontSize: size.sm,
                cursor: 'pointer',
                fontFamily: f.body,
                transition: `all 0.15s ${ease.smooth}`,
              }}
              onMouseOver={(e) => {
                e.target.style.background = c.bgHover
                e.target.style.borderColor = c.gold
              }}
              onMouseOut={(e) => {
                e.target.style.background = c.bgSurface
                e.target.style.borderColor = c.border
              }}>
              Retour
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !formData.product || step === 2 && !formData.quantity}
              style={{
                padding: `${sp[1]} ${sp[3]}`,
                background: c.red,
                border: `1px solid ${c.red}`,
                color: c.white,
                fontSize: size.sm,
                cursor: 'pointer',
                fontFamily: f.body,
                transition: `all 0.15s ${ease.smooth}`,
                opacity: (step === 1 && !formData.product || step === 2 && !formData.quantity) ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                e.target.style.background = c.redDeep
                e.target.style.borderColor = c.redDeep
              }}
              onMouseOut={(e) => {
                e.target.style.background = c.red
                e.target.style.borderColor = c.red
              }}>
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                padding: `${sp[1]} ${sp[3]}`,
                background: c.gold,
                border: `1px solid ${c.gold}`,
                color: c.black,
                fontSize: size.sm,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: f.body,
                transition: `all 0.15s ${ease.smooth}`,
              }}
              onMouseOver={(e) => {
                e.target.style.background = c.goldDim
                e.target.style.borderColor = c.goldDim
              }}
              onMouseOut={(e) => {
                e.target.style.background = c.gold
                e.target.style.borderColor = c.gold
              }}>
              Soumettre
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── MAIN DASHBOARD COMPONENT ── */
export default function Dashboard({ user, profile, onSignOut }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [activeTab, setActiveTab] = useState('messages')
  const [viewMode, setViewMode] = useState('orders') // 'orders' | 'catalogue'
  const messagesEndRef = useRef(null)
  const uploadInputRef = useRef(null)

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders(user.id)
        setOrders(data || [])
        if (data?.length > 0) {
          setSelectedOrder(data[0])
        }
      } catch (err) {
        console.error('Failed to load orders:', err)
      }
    }
    loadOrders()

    // Subscribe to changes
    const sub = subscribeToOrders((payload) => {
      // Reload orders on any change
      getOrders(user.id).then(data => setOrders(data || []))
    })
    return () => sub?.unsubscribe?.()
  }, [user.id])

  // Load messages for selected order
  useEffect(() => {
    if (!selectedOrder) return

    const loadMessages = async () => {
      try {
        const data = await getMessages(selectedOrder.id)
        setMessages(data || [])
        await markMessagesRead(selectedOrder.id, user.id)
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }
    loadMessages()

    const sub = subscribeToMessages(selectedOrder.id, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
    })
    return () => sub?.unsubscribe?.()
  }, [selectedOrder, user.id])

  // Load documents for selected order
  useEffect(() => {
    if (!selectedOrder) return

    const loadDocs = async () => {
      try {
        const data = await getDocuments(selectedOrder.id)
        setDocuments(data || [])
      } catch (err) {
        console.error('Failed to load documents:', err)
      }
    }
    loadDocs()
  }, [selectedOrder])

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedOrder || sendingMsg) return
    setSendingMsg(true)
    try {
      await sendMessage({
        orderId: selectedOrder.id,
        senderId: user.id,
        senderRole: 'client',
        content: newMessage,
      })
      setNewMessage('')
    } catch (err) {
      toast.error('Impossible d\u2019envoyer le message. R\u00e9essayez.')
    } finally {
      setSendingMsg(false)
    }
  }

  // Handle create order
  const handleCreateOrder = async (formData) => {
    if (creatingOrder) return
    setCreatingOrder(true)
    try {
      await createOrder({
        clientId: user.id,
        product: formData.product,
        quantity: parseInt(formData.quantity, 10),
        budget: formData.budget,
        deadline: formData.deadline,
        notes: formData.notes,
      })
      const updated = await getOrders(user.id)
      setOrders(updated)
      toast.success('Demande envoy\u00e9e avec succ\u00e8s !')
    } catch (err) {
      toast.error('Erreur lors de la cr\u00e9ation de la demande.')
    } finally {
      setCreatingOrder(false)
    }
  }

  // Handle document upload
  const handleUploadClick = () => {
    uploadInputRef.current?.click()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedOrder || uploadingFile) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 10 Mo)')
      e.target.value = ''
      return
    }
    // Validate file type
    if (ALLOWED_FILE_TYPES.length && !ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Type de fichier non support\u00e9. Formats accept\u00e9s : images, PDF, Word, Excel')
      e.target.value = ''
      return
    }

    setUploadingFile(true)
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`${selectedOrder.id}/${Date.now()}_${file.name}`, file)

      if (error) throw error

      const updated = await getDocuments(selectedOrder.id)
      setDocuments(updated)
      toast.success('Document ajout\u00e9')
    } catch (err) {
      toast.error('Erreur lors de l\u2019envoi du document.')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  // Handle document download
  const handleDownloadDocument = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path || doc.file_path)
      if (url) {
        window.open(url, '_blank')
      }
    } catch (err) {
      toast.error('Impossible de t\u00e9l\u00e9charger le document.')
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: f.body,
    }}>
      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-panel { width: 100% !important; }
          .order-detail { padding: ${sp[2]} !important; }
          .pipeline-tracker { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${sp[1]}; }
          .pipeline-tracker > * { writing-mode: horizontal-tb; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${sp[2]} ${sp[3]}`,
        background: c.bgSurface,
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          {/* Logo placeholder */}
          <div style={{
            fontSize: size.lg,
            fontFamily: f.display,
            color: c.gold,
            letterSpacing: '0.05em',
            fontWeight: 700,
          }}>
            ◆ CARAXES
          </div>
          <span style={{
            fontSize: size.xs,
            color: c.red,
            fontFamily: f.mono,
            letterSpacing: '0.04em',
            fontWeight: 600,
          }}>CLIENT</span>
          {(() => {
            const tier = getTierByKey(profile?.client_tier || DEFAULT_TIER)
            return (
              <span style={{
                padding: `2px ${sp[1]}`,
                background: tier.colorSoft,
                border: `1px solid ${tier.color}33`,
                color: tier.color,
                fontSize: '10px',
                fontFamily: f.mono,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {tier.icon} {tier.label}
              </span>
            )
          })()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: '2px', background: c.bgSurface, border: `1px solid ${c.border}`, padding: '2px' }}>
            <button
              onClick={() => setViewMode('orders')}
              style={{
                padding: `${sp[1]} ${sp[2]}`, background: viewMode === 'orders' ? c.red : 'transparent',
                border: 'none', color: viewMode === 'orders' ? c.white : c.textSecondary,
                fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer', letterSpacing: '0.03em',
                fontWeight: viewMode === 'orders' ? 600 : 400, transition: `all 0.15s ${ease.smooth}`,
              }}>Commandes</button>
            <button
              onClick={() => setViewMode('catalogue')}
              style={{
                padding: `${sp[1]} ${sp[2]}`, background: viewMode === 'catalogue' ? c.gold : 'transparent',
                border: 'none', color: viewMode === 'catalogue' ? c.black : c.textSecondary,
                fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer', letterSpacing: '0.03em',
                fontWeight: viewMode === 'catalogue' ? 600 : 400, transition: `all 0.15s ${ease.smooth}`,
              }}>Catalogue</button>
          </div>

          {/* Notification bell */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Icon d={icons.bell} size={18} color={c.textSecondary} />
            {Object.values(unreadCounts).some(c => c > 0) && (
              <div style={{
                position: 'absolute',
                top: -4, right: -4,
                width: 8, height: 8,
                borderRadius: '50%',
                background: c.red,
              }} />
            )}
          </div>

          {/* New order button */}
          <button
            onClick={() => setIsNewOrderOpen(true)}
            style={{
              padding: `${sp[1]} ${sp[2]}`,
              background: c.red,
              border: `1px solid ${c.red}`,
              color: c.white,
              fontSize: size.sm,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: f.body,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: `all 0.15s ${ease.smooth}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = c.redDeep
              e.currentTarget.style.borderColor = c.redDeep
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = c.red
              e.currentTarget.style.borderColor = c.red
            }}>
            <Icon d={icons.plus} size={14} color="currentColor" />
            Nouvelle demande
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              padding: sp[1],
              cursor: 'pointer',
              color: c.textSecondary,
              transition: `color 0.15s ${ease.smooth}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = c.gold}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
            title="Paramètres">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d={icons.settings} />
            </svg>
          </button>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            style={{
              background: 'none',
              border: 'none',
              padding: sp[1],
              cursor: 'pointer',
              color: c.textSecondary,
              transition: `color 0.15s ${ease.smooth}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = c.red}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}>
            <Icon d={icons.logout} size={18} color="currentColor" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {viewMode === 'catalogue' ? (
          /* ── CATALOGUE VIEW ── */
          <div style={{ flex: 1, overflowY: 'auto', padding: sp[4], background: c.bg }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {(() => {
                const tier = getTierByKey(profile?.client_tier || DEFAULT_TIER)
                return (
                  <div style={{ marginBottom: sp[4] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[1] }}>
                      <h2 style={{ margin: 0, fontFamily: f.display, fontSize: size.xl, color: c.gold, letterSpacing: '0.04em' }}>
                        Catalogue Produits
                      </h2>
                      <span style={{
                        padding: `4px ${sp[2]}`,
                        background: tier.colorSoft,
                        border: `1px solid ${tier.color}33`,
                        color: tier.color,
                        fontSize: size.xs,
                        fontFamily: f.mono,
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                      }}>
                        Tarif {tier.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6 }}>
                      {CATEGORIES.length} catégories sourcées directement depuis nos usines partenaires en Chine — prix adaptés à votre profil {tier.label.toLowerCase()}
                    </p>
                  </div>
                )
              })()}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: sp[3],
              }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} style={{
                    background: c.bgElevated,
                    border: `1px solid ${c.border}`,
                    padding: sp[3],
                    transition: `all 0.2s ${ease.smooth}`,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = cat.color
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${cat.color}22`
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = c.border
                    e.currentTarget.style.boxShadow = 'none'
                  }}>
                    {/* Top accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cat.color }} />

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                      <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                      <div>
                        <div style={{ fontFamily: f.display, fontSize: size.base, color: c.text, fontWeight: 600 }}>{cat.name}</div>
                        <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>{cat.description}</div>
                      </div>
                    </div>

                    {/* Price grid — tier-adapted */}
                    {(() => {
                      const tierKey = profile?.client_tier || DEFAULT_TIER
                      const tierPrice = getTierPrice(cat, tierKey)
                      const moq = getCategoryMOQ(cat.id, tierKey)
                      return (
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: sp[1],
                          background: c.bgSurface, padding: sp[2], marginBottom: sp[2],
                          border: `1px solid ${c.borderSubtle}`,
                        }}>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Votre prix</div>
                            <div style={{ fontSize: size.sm, fontWeight: 600, color: c.green }}>{tierPrice}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Revente</div>
                            <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{cat.priceFrance}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Marge</div>
                            <div style={{ fontSize: size.sm, fontWeight: 700, color: c.gold }}>{cat.margin}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>MOQ</div>
                            <div style={{ fontSize: size.sm, fontWeight: 600, color: c.amber }}>{moq.toLocaleString('fr-FR')}</div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Notes */}
                    <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5, marginBottom: sp[2] }}>
                      {cat.notes}
                    </div>

                    {/* Locations */}
                    <div style={{ display: 'flex', gap: sp[1], flexWrap: 'wrap' }}>
                      {cat.locations.map(loc => (
                        <span key={loc} style={{
                          padding: `2px ${sp[1]}`, background: c.bgSurface,
                          border: `1px solid ${c.borderSubtle}`, fontSize: '10px',
                          fontFamily: f.mono, color: c.textTertiary, letterSpacing: '0.03em',
                        }}>{loc}</span>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewMode('orders')
                        setIsNewOrderOpen(true)
                      }}
                      style={{
                        marginTop: sp[2], width: '100%', padding: sp[1],
                        background: 'transparent', border: `1px solid ${cat.color}44`,
                        color: cat.color, fontSize: size.xs, fontFamily: f.mono,
                        cursor: 'pointer', letterSpacing: '0.04em', fontWeight: 600,
                        transition: `all 0.15s ${ease.smooth}`,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = cat.color
                        e.currentTarget.style.color = c.white
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = cat.color
                      }}>
                      Commander dans cette catégorie
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* SIDEBAR */}
        <div className="sidebar" style={{
          width: 360,
          background: c.bgWarm,
          borderRight: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{
            padding: sp[2],
            borderBottom: `1px solid ${c.border}`,
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Icon d={icons.search} size={16} color={c.textTertiary} style={{
                position: 'absolute',
                left: sp[2],
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: `${sp[1]} ${sp[2]} ${sp[1]} ${sp[3]}`,
                  paddingLeft: 32,
                  background: c.bgSurface,
                  border: `1px solid ${c.border}`,
                  fontSize: size.sm,
                  color: c.text,
                  fontFamily: f.body,
                  transition: `border 0.15s ${ease.smooth}`,
                }}
                onFocus={(e) => e.target.style.borderColor = c.gold}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div style={{
            display: 'flex',
            gap: sp[1],
            padding: sp[2],
            borderBottom: `1px solid ${c.border}`,
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Toutes', value: 'all' },
              { label: 'En cours', value: 'in-progress' },
              { label: 'Terminées', value: 'delivered' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                style={{
                  padding: `${sp[1]} ${sp[2]}`,
                  background: filterStatus === f.value ? c.red : c.bgSurface,
                  border: `1px solid ${filterStatus === f.value ? c.red : c.border}`,
                  color: filterStatus === f.value ? c.white : c.text,
                  fontSize: size.xs,
                  cursor: 'pointer',
                  fontFamily: f.mono,
                  fontWeight: 500,
                  transition: `all 0.15s ${ease.smooth}`,
                  letterSpacing: '0.02em',
                }}
                onMouseOver={(e) => {
                  if (filterStatus !== f.value) {
                    e.target.style.borderColor = c.gold
                  }
                }}
                onMouseOut={(e) => {
                  if (filterStatus !== f.value) {
                    e.target.style.borderColor = c.border
                  }
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Order list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div style={{
                padding: sp[4],
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  fontSize: size.xs,
                  color: c.textTertiary,
                  marginBottom: sp[2],
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  Aucune commande
                </div>
              </div>
            ) : (
              filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  selected={selectedOrder?.id === order.id}
                  onClick={() => setSelectedOrder(order)}
                  unreadCount={unreadCounts[order.id] || 0}
                />
              ))
            )}
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="main-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: c.bg }}>
          {selectedOrder ? (
            <>
              {/* Order header */}
              <div style={{
                padding: sp[3],
                borderBottom: `1px solid ${c.border}`,
                background: c.bgSurface,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: sp[2],
                }}>
                  <div>
                    <div style={{
                      fontSize: size.xs,
                      color: c.textTertiary,
                      marginBottom: sp[1],
                      fontFamily: f.mono,
                      letterSpacing: '0.03em',
                    }}>
                      {selectedOrder.ref}
                    </div>
                    <h1 style={{
                      margin: 0,
                      fontSize: size.xl,
                      fontFamily: f.display,
                      color: c.text,
                      marginBottom: sp[1],
                    }}>
                      {selectedOrder.product}
                    </h1>
                  </div>
                  <StatusPill status={selectedOrder.status} size="md" />
                </div>

                {/* Metadata row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: sp[2],
                  fontSize: size.sm,
                }}>
                  <div>
                    <div style={{ color: c.textTertiary, marginBottom: '4px', fontFamily: f.mono, fontSize: size.xs }}>
                      Quantité
                    </div>
                    <div style={{ color: c.text, fontWeight: 500 }}>
                      {fmtQty(selectedOrder.quantity)} unités
                    </div>
                  </div>
                  <div>
                    <div style={{ color: c.textTertiary, marginBottom: '4px', fontFamily: f.mono, fontSize: size.xs }}>
                      Budget
                    </div>
                    <div style={{ color: c.text, fontWeight: 500 }}>
                      {selectedOrder.budget}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: c.textTertiary, marginBottom: '4px', fontFamily: f.mono, fontSize: size.xs }}>
                      Deadline
                    </div>
                    <div style={{ color: c.text, fontWeight: 500 }}>
                      {selectedOrder.deadline || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: c.textTertiary, marginBottom: '4px', fontFamily: f.mono, fontSize: size.xs }}>
                      Fournisseur
                    </div>
                    <div style={{ color: c.text, fontWeight: 500 }}>
                      {selectedOrder.city || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pipeline tracker */}
              <div className="pipeline-tracker" style={{ padding: `${sp[3]} ${sp[3]} 0` }}>
                <PipelineTracker status={selectedOrder.status} />
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                padding: `0 ${sp[3]}`,
                borderBottom: `1px solid ${c.border}`,
                gap: sp[3],
              }}>
                {['messages', 'documents'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: `${sp[2]} 0`,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: size.sm,
                      fontWeight: activeTab === tab ? 600 : 400,
                      color: activeTab === tab ? c.red : c.textSecondary,
                      borderBottom: `2px solid ${activeTab === tab ? c.red : 'transparent'}`,
                      transition: `all 0.15s ${ease.smooth}`,
                      fontFamily: f.body,
                      textTransform: 'capitalize',
                      letterSpacing: '0.02em',
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== tab) e.target.style.color = c.text
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== tab) e.target.style.color = c.textSecondary
                    }}>
                      {tab === 'messages' ? 'Messages' : 'Documents'}
                    </button>
                  ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'messages' ? (
                  <>
                    {/* Chat area */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: sp[3],
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      {messages.length === 0 ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          flexDirection: 'column',
                          textAlign: 'center',
                        }}>
                          <Icon d={icons.msg} size={40} color={c.textTertiary} style={{ marginBottom: sp[2], opacity: 0.3 }} />
                          <p style={{ color: c.textTertiary, margin: 0, fontSize: size.sm }}>
                            Aucun message pour le moment
                          </p>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <ChatBubble key={msg.id} msg={msg} />
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message input */}
                    <div style={{
                      padding: sp[3],
                      borderTop: `1px solid ${c.border}`,
                      background: c.bgSurface,
                    }}>
                      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: sp[2] }}>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Votre message..."
                          style={{
                            flex: 1,
                            padding: `${sp[1]} ${sp[2]}`,
                            background: c.bgElevated,
                            border: `1px solid ${c.border}`,
                            color: c.text,
                            fontSize: size.sm,
                            fontFamily: f.body,
                            transition: `border 0.15s ${ease.smooth}`,
                          }}
                          onFocus={(e) => e.target.style.borderColor = c.gold}
                          onBlur={(e) => e.target.style.borderColor = c.border}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          style={{
                            padding: `${sp[1]} ${sp[2]}`,
                            background: newMessage.trim() ? c.red : c.bgHover,
                            border: `1px solid ${newMessage.trim() ? c.red : c.border}`,
                            color: c.white,
                            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: f.body,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: `all 0.15s ${ease.smooth}`,
                          }}
                          onMouseOver={(e) => {
                            if (newMessage.trim()) {
                              e.target.style.background = c.redDeep
                              e.target.style.borderColor = c.redDeep
                            }
                          }}
                          onMouseOut={(e) => {
                            if (newMessage.trim()) {
                              e.target.style.background = c.red
                              e.target.style.borderColor = c.red
                            }
                          }}>
                          <Icon d={icons.send} size={16} color="currentColor" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Documents area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: sp[3] }}>
                      {documents.length === 0 ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          flexDirection: 'column',
                          textAlign: 'center',
                        }}>
                          <div style={{
                            width: 100,
                            height: 100,
                            border: `2px dashed ${c.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: sp[2],
                            cursor: 'pointer',
                            transition: `all 0.15s ${ease.smooth}`,
                          }}
                          onClick={handleUploadClick}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = c.gold
                            e.currentTarget.style.background = c.goldSoft
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = c.border
                            e.currentTarget.style.background = 'transparent'
                          }}>
                            <Icon d={icons.upload} size={40} color={c.textTertiary} />
                          </div>
                          <p style={{ color: c.text, fontSize: size.sm, fontWeight: 600, marginBottom: sp[1] }}>
                            Ajouter des documents
                          </p>
                          <p style={{ color: c.textTertiary, fontSize: size.xs, margin: 0 }}>
                            Cliquez pour télécharger vos fichiers
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                          {documents.map(doc => (
                            <DocumentCard
                              key={doc.id}
                              doc={doc}
                              onDownload={() => handleDownloadDocument(doc)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upload zone */}
                    <div style={{
                      padding: sp[3],
                      borderTop: `1px solid ${c.border}`,
                      background: c.bgSurface,
                    }}>
                      <button
                        onClick={handleUploadClick}
                        style={{
                          width: '100%',
                          padding: sp[2],
                          background: c.bgElevated,
                          border: `2px dashed ${c.border}`,
                          color: c.text,
                          cursor: 'pointer',
                          fontFamily: f.body,
                          fontSize: size.sm,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: sp[1],
                          transition: `all 0.15s ${ease.smooth}`,
                        }}
                        onMouseOver={(e) => {
                          e.target.style.borderColor = c.gold
                          e.target.style.background = c.goldSoft
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = c.border
                          e.target.style.background = c.bgElevated
                        }}>
                        <Icon d={icons.clip} size={16} color="currentColor" />
                        Ajouter un fichier
                      </button>
                      <input
                        ref={uploadInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              textAlign: 'center',
            }}>
              <DragonEmptyState />
              <p style={{
                fontSize: size.lg,
                fontFamily: f.display,
                color: c.textSecondary,
                margin: 0,
                marginBottom: sp[2],
                letterSpacing: '0.03em',
              }}>
                Sélectionnez une commande
              </p>
              <p style={{
                fontSize: size.sm,
                color: c.textTertiary,
                margin: 0,
              }}>
                ou créez une nouvelle demande pour commencer
              </p>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* New order modal */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleCreateOrder}
      />
    </div>
  )
}
