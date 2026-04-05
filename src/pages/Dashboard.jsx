import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
  subscribeToMessages, subscribeToOrders, supabase,
} from '../lib/supabase'
import { CATEGORIES } from '../lib/categories'
import { getTierByKey, getTierPrice, getCategoryMOQ, DEFAULT_TIER } from '../lib/clientTiers'
import StatusPill, { ProgressBar } from '../components/StatusPill'
import { useToast } from '../components/Toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024
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

/* ── DRAGON EMPTY STATE ── */
function DragonEmptyState({ text = 'S\u00e9lectionnez une commande', sub = '' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center',
      padding: sp[4],
    }}>
      <svg viewBox="0 0 200 200" width={100} height={100} style={{ opacity: 0.12, marginBottom: sp[4] }}>
        <path d="M100 20 L130 60 L100 50 L70 60 Z" fill={c.gold} stroke={c.gold} strokeWidth="1" />
        <circle cx="100" cy="100" r="40" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M70 100 Q60 90 60 80 Q60 70 75 70" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M130 100 Q140 90 140 80 Q140 70 125 70" fill="none" stroke={c.gold} strokeWidth="1" />
        <circle cx="85" cy="95" r="3" fill={c.gold} />
        <circle cx="115" cy="95" r="3" fill={c.gold} />
        <path d="M100 110 Q90 120 85 130" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M100 110 Q110 120 115 130" fill="none" stroke={c.gold} strokeWidth="1" />
        <path d="M80 140 L90 160 L100 155 L110 160 L120 140" fill="none" stroke={c.gold} strokeWidth="1" />
      </svg>
      <p style={{
        fontSize: size.md, fontFamily: f.display, color: c.textSecondary,
        margin: 0, marginBottom: sp[1], letterSpacing: '0.02em',
      }}>{text}</p>
      {sub && <p style={{ fontSize: size.sm, color: c.textTertiary, margin: 0 }}>{sub}</p>}
    </div>
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
        padding: `14px ${sp[3]}`,
        cursor: 'pointer',
        background: selected ? c.bgElevated : hovered ? `oklch(11% 0.006 50)` : 'transparent',
        borderLeft: `2px solid ${selected ? c.red : 'transparent'}`,
        borderBottom: `1px solid ${c.borderSubtle}`,
        transition: `all 0.25s ${ease.luxury}`,
        position: 'relative',
        transform: hovered && !selected ? 'translateX(2px)' : 'translateX(0)',
      }}>
      {/* Unread badge — premium pulse */}
      {unreadCount > 0 && (
        <div style={{
          position: 'absolute', top: 14, right: sp[2],
          minWidth: 18, height: 18, borderRadius: '9999px',
          background: c.red, color: c.white, fontSize: '9px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
          boxShadow: `0 0 0 0 ${c.redGlow}`,
          animation: 'unreadPulse 2s ease infinite',
        }}>{unreadCount}</div>
      )}

      {/* Ref */}
      <div style={{
        fontFamily: f.mono, fontSize: '9px', color: selected ? c.gold : c.textTertiary,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px',
        transition: transition.color,
      }}>{order.ref}</div>

      {/* Product name */}
      <div style={{
        fontWeight: 600, fontSize: size.sm, marginBottom: '8px',
        lineHeight: 1.35, color: selected ? c.text : hovered ? c.text : 'oklch(82% 0.01 70)',
        transition: transition.color,
        fontFamily: f.body, letterSpacing: '0.01em',
      }}>{order.product}</div>

      {/* Meta row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize: size.xs, color: c.textSecondary, fontWeight: 300 }}>
          {fmtQty(order.quantity)} unites &middot; {order.budget}
        </span>
        <StatusPill status={order.status} size="sm" />
      </div>

      {/* Progress bar */}
      <ProgressBar value={order.progress} color={statusObj.color} height={2} />
    </div>
  )
}

/* ── CHAT BUBBLE — premium ── */
function ChatBubble({ msg }) {
  const isAgent = msg.sender_role === 'admin'
  return (
    <div style={{
      display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end',
      marginBottom: sp[2],
      animation: `fadeSlideIn 0.3s ${ease.out}`,
    }}>
      <div style={{
        maxWidth: '72%', padding: `14px ${sp[3]}`,
        background: isAgent ? c.bgElevated : c.redSoft,
        border: `1px solid ${isAgent ? c.border : c.redGlow}`,
        fontSize: size.sm, lineHeight: 1.7, color: c.text,
        position: 'relative',
        boxShadow: isAgent ? shadow.xs : `0 1px 4px oklch(55% 0.22 25 / 0.08)`,
      }}>
        {/* Sender tag */}
        <div style={{
          fontSize: '9px', color: isAgent ? c.gold : c.red,
          marginBottom: '8px', fontFamily: f.mono,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {isAgent && <div style={{ width: 4, height: 4, background: c.gold, transform: 'rotate(45deg)', opacity: 0.6 }} />}
          {isAgent ? 'Agent CARAXES' : 'Vous'}
          <span style={{ color: c.textGhost || c.textTertiary, fontWeight: 400, letterSpacing: '0.02em', textTransform: 'none', fontSize: '9px' }}>
            {fmtDate(msg.created_at)}
          </span>
        </div>
        <p style={{ margin: 0, wordWrap: 'break-word', whiteSpace: 'pre-wrap', fontWeight: 300 }}>
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
      onClick={onDownload}
      style={{
        display: 'flex', alignItems: 'center', gap: sp[2],
        padding: `${sp[2]} ${sp[3]}`,
        background: hovered ? c.bgHover : c.bgElevated,
        border: `1px solid ${hovered ? c.gold : c.border}`,
        transition: `all 0.2s ${ease.smooth}`,
        cursor: 'pointer',
      }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: c.redSoft, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon d={icons.file} size={18} color={c.red} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: size.sm, color: c.text, fontWeight: 500,
          marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{fileName}</div>
        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.03em' }}>
          {fileExt} &middot; {fmtDate(doc.created_at)}
        </div>
      </div>
      <div style={{
        opacity: hovered ? 1 : 0.4,
        transition: `opacity 0.2s ${ease.smooth}`,
      }}>
        <Icon d={icons.download} size={16} color={c.gold} />
      </div>
    </div>
  )
}

/* ── PIPELINE TRACKER (REDESIGNED) ── */
function PipelineTracker({ status }) {
  const stages = STATUSES
  const currentIndex = stages.findIndex(s => s.key === status)

  return (
    <div style={{
      background: c.bgElevated, border: `1px solid ${c.border}`,
      padding: `${sp[3]} ${sp[3]}`, marginBottom: sp[3],
    }}>
      <div style={{
        fontSize: '10px', color: c.textTertiary, marginBottom: sp[2],
        fontFamily: f.mono, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
      }}>
        Progression
      </div>

      {/* Track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: sp[2] }}>
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Step marker */}
              <div style={{
                width: isCurrent ? 36 : 28, height: isCurrent ? 36 : 28,
                background: isCurrent ? stage.color : isCompleted ? c.green : c.bgSurface,
                border: `2px solid ${isCurrent ? stage.color : isCompleted ? c.green : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: f.mono, fontSize: isCurrent ? size.xs : '10px', fontWeight: 700,
                color: isCurrent || isCompleted ? c.white : c.textTertiary,
                flexShrink: 0, zIndex: 2,
                transition: `all 0.35s ${ease.out}`,
                boxShadow: isCurrent ? `0 0 16px ${stage.color}44` : 'none',
              }}>
                {isCompleted ? '\u2713' : idx + 1}
              </div>
              {/* Connector */}
              {idx < stages.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', margin: '0 -1px',
                  background: idx < currentIndex ? c.green : c.border,
                  transition: `background 0.35s ${ease.smooth}`,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: '3px' }}>
        {stages.map((stage, idx) => (
          <div key={stage.key} style={{
            flex: 1, textAlign: 'center',
            fontSize: '10px', lineHeight: 1.3,
            color: idx === currentIndex ? stage.color : idx < currentIndex ? c.text : c.textTertiary,
            fontWeight: idx === currentIndex ? 700 : 400,
            fontFamily: idx === currentIndex ? f.mono : f.body,
            transition: `all 0.3s ${ease.smooth}`,
          }}>
            {stage.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── MODAL: NOUVELLE DEMANDE ── */
function NewOrderModal({ isOpen, onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: '', quantity: '', budget: '', deadline: '', notes: '',
  })

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const handleNext = () => { if (step < 3) setStep(step + 1) }
  const handleBack = () => { if (step > 1) setStep(step - 1) }
  const handleSubmit = () => {
    if (!formData.product.trim()) return
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) return
    onSubmit(formData)
    setFormData({ product: '', quantity: '', budget: '', deadline: '', notes: '' })
    setStep(1); onClose()
  }

  if (!isOpen) return null

  const modalInput = {
    width: '100%', padding: `14px ${sp[2]}`,
    fontSize: size.sm, fontFamily: f.body,
    background: c.bgSurface, border: `1px solid ${c.border}`,
    color: c.text, boxSizing: 'border-box', outline: 'none',
    transition: `border-color 0.2s ${ease.smooth}, box-shadow 0.2s ${ease.smooth}`,
  }
  const modalLabel = {
    display: 'block', marginBottom: sp[1],
    fontSize: '10px', fontFamily: f.mono, color: c.textTertiary,
    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
  }

  const stepLabels = ['Produit', 'D\u00e9tails', 'Notes']

  return (
    <div style={{
      position: 'fixed', inset: 0, background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: `fadeIn 0.2s ${ease.out}`,
    }} onClick={onClose}>
      <div style={{
        background: c.bgElevated, border: `1px solid ${c.border}`,
        width: '100%', maxWidth: 480, padding: sp[4], boxShadow: shadow.lg,
        position: 'relative',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
          <div>
            <h2 style={{ margin: 0, fontSize: size.lg, fontFamily: f.display, color: c.text, letterSpacing: '-0.01em' }}>
              Nouvelle demande
            </h2>
            <div style={{ display: 'flex', gap: sp[2], marginTop: sp[1] }}>
              {stepLabels.map((label, i) => (
                <span key={i} style={{
                  fontSize: '9px', fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: i + 1 === step ? c.red : i + 1 < step ? c.green : c.textTertiary,
                  fontWeight: i + 1 === step ? 700 : 400,
                }}>{i + 1}. {label}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: sp[1],
            color: c.textSecondary, display: 'flex', alignItems: 'center',
          }}>
            <Icon d={icons.close} size={18} color="currentColor" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 2, background: c.bgSurface, marginBottom: sp[4], overflow: 'hidden' }}>
          <div style={{
            width: `${(step / 3) * 100}%`, height: '100%', background: c.red,
            transition: `width 0.4s ${ease.out}`,
          }} />
        </div>

        {/* Content */}
        <div style={{ minHeight: 180 }}>
          {step === 1 && (
            <div>
              <label style={modalLabel}>Que recherchez-vous ?</label>
              <input type="text" placeholder="Ex: v\u00eatements coton, chaussures sport..."
                value={formData.product} onChange={(e) => handleChange('product', e.target.value)}
                style={modalInput} autoFocus
                onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
              />
              <p style={{ margin: `${sp[2]} 0 0`, fontSize: size.xs, color: c.textTertiary, lineHeight: 1.6 }}>
                D\u00e9crivez le produit que vous souhaitez sourcer depuis la Chine.
              </p>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
              <div>
                <label style={modalLabel}>Quantit\u00e9</label>
                <input type="number" placeholder="Ex: 1000" value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={modalLabel}>Budget</label>
                <input type="text" placeholder="Ex: 5 000 \u20ac" value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={modalLabel}>D\u00e9lai souhait\u00e9</label>
                <input type="date" value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={modalLabel}>Notes (optionnel)</label>
              <textarea placeholder="Sp\u00e9cifications, r\u00e9f\u00e9rences visuelles, exigences..."
                value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)}
                style={{ ...modalInput, minHeight: 140, resize: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: sp[2], marginTop: sp[4], justifyContent: 'flex-end' }}>
          {step > 1 && (
            <button onClick={handleBack} style={{
              padding: `12px ${sp[3]}`, background: 'transparent',
              border: `1px solid ${c.border}`, color: c.text,
              fontSize: size.sm, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`,
            }}
              onMouseOver={(e) => { e.target.style.borderColor = c.gold }}
              onMouseOut={(e) => { e.target.style.borderColor = c.border }}
            >Retour</button>
          )}
          {step < 3 ? (
            <button onClick={handleNext}
              disabled={step === 1 && !formData.product || step === 2 && !formData.quantity}
              style={{
                padding: `12px ${sp[3]}`, background: c.red,
                border: `1px solid ${c.red}`, color: c.white,
                fontSize: size.sm, cursor: 'pointer', fontFamily: f.body, fontWeight: 600,
                transition: `all 0.2s ${ease.smooth}`,
                opacity: (step === 1 && !formData.product || step === 2 && !formData.quantity) ? 0.4 : 1,
              }}
              onMouseOver={(e) => { e.target.style.background = c.redDeep }}
              onMouseOut={(e) => { e.target.style.background = c.red }}
            >Suivant</button>
          ) : (
            <button onClick={handleSubmit} style={{
              padding: `12px ${sp[4]}`, background: c.gold,
              border: `1px solid ${c.gold}`, color: c.black,
              fontSize: size.sm, fontWeight: 700, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
            }}
              onMouseOver={(e) => { e.target.style.background = c.goldDim }}
              onMouseOut={(e) => { e.target.style.background = c.gold }}
            >Soumettre la demande</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── MAIN DASHBOARD ── */
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
  const [viewMode, setViewMode] = useState('orders')
  const messagesEndRef = useRef(null)
  const uploadInputRef = useRef(null)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders(user.id)
        setOrders(data || [])
        if (data?.length > 0) setSelectedOrder(data[0])
      } catch (err) { console.error('Failed to load orders:', err) }
    }
    loadOrders()
    const sub = subscribeToOrders(() => {
      getOrders(user.id).then(data => setOrders(data || []))
    })
    return () => sub?.unsubscribe?.()
  }, [user.id])

  useEffect(() => {
    if (!selectedOrder) return
    const loadMessages = async () => {
      try {
        const data = await getMessages(selectedOrder.id)
        setMessages(data || [])
        await markMessagesRead(selectedOrder.id, user.id)
      } catch (err) { console.error('Failed to load messages:', err) }
    }
    loadMessages()
    const sub = subscribeToMessages(selectedOrder.id, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
    })
    return () => sub?.unsubscribe?.()
  }, [selectedOrder, user.id])

  useEffect(() => {
    if (!selectedOrder) return
    const loadDocs = async () => {
      try {
        const data = await getDocuments(selectedOrder.id)
        setDocuments(data || [])
      } catch (err) { console.error('Failed to load documents:', err) }
    }
    loadDocs()
  }, [selectedOrder])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const lastMsgTime = useRef(0)
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedOrder || sendingMsg) return
    const now = Date.now()
    if (now - lastMsgTime.current < 1000) return // 1 msg/sec throttle
    lastMsgTime.current = now
    setSendingMsg(true)
    try {
      await sendMessage({ orderId: selectedOrder.id, senderId: user.id, senderRole: 'client', content: newMessage })
      setNewMessage('')
    } catch (err) { toast.error('Impossible d\u2019envoyer le message.') }
    finally { setSendingMsg(false) }
  }

  const handleCreateOrder = async (formData) => {
    if (creatingOrder) return
    setCreatingOrder(true)
    try {
      await createOrder({
        clientId: user.id, product: formData.product,
        quantity: parseInt(formData.quantity, 10), budget: formData.budget,
        deadline: formData.deadline, notes: formData.notes,
      })
      const updated = await getOrders(user.id)
      setOrders(updated)
      toast.success('Demande envoy\u00e9e !')
    } catch (err) { toast.error('Erreur lors de la cr\u00e9ation.') }
    finally { setCreatingOrder(false) }
  }

  const handleUploadClick = () => uploadInputRef.current?.click()

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedOrder || uploadingFile) return
    if (file.size > MAX_FILE_SIZE) { toast.error('Fichier trop volumineux (max 10 Mo)'); e.target.value = ''; return }
    if (ALLOWED_FILE_TYPES.length && !ALLOWED_FILE_TYPES.includes(file.type)) { toast.error('Type de fichier non support\u00e9'); e.target.value = ''; return }
    setUploadingFile(true)
    try {
      const { error } = await supabase.storage.from('documents').upload(`${selectedOrder.id}/${Date.now()}_${file.name}`, file)
      if (error) throw error
      const updated = await getDocuments(selectedOrder.id)
      setDocuments(updated)
      toast.success('Document ajout\u00e9')
    } catch (err) { toast.error('Erreur lors de l\u2019envoi.') }
    finally { setUploadingFile(false); e.target.value = '' }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path || doc.file_path)
      if (url) window.open(url, '_blank')
    } catch (err) { toast.error('T\u00e9l\u00e9chargement impossible.') }
  }

  const tier = getTierByKey(profile?.client_tier || DEFAULT_TIER)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: c.bg, color: c.text, fontFamily: f.body,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-panel { width: 100% !important; }
        }
        input::placeholder, textarea::placeholder { color: ${c.textTertiary}; opacity: 0.5; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; }
        @keyframes unreadPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${c.redGlow}; }
          50% { box-shadow: 0 0 0 6px oklch(55% 0.22 25 / 0); }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${sp[3]}`, height: 56,
        background: c.bgSurface, borderBottom: `1px solid ${c.border}`,
        position: 'relative', zIndex: 10,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <span style={{
            fontSize: size.md, fontFamily: f.display, fontWeight: 700,
            letterSpacing: '0.06em', color: c.text,
          }}>
            CARAXE<span style={{ color: c.red }}>S</span>
          </span>
          <div style={{
            width: '1px', height: 20, background: c.border, margin: `0 ${sp[1]}`,
          }} />
          <span style={{
            fontSize: '9px', fontFamily: f.mono, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 700, color: c.gold,
          }}>Espace Client</span>
          <span style={{
            padding: '2px 8px', background: tier.colorSoft,
            border: `1px solid ${tier.color}33`, color: tier.color,
            fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>{tier.icon} {tier.label}</span>
        </div>

        {/* Center — View toggle */}
        <div style={{
          display: 'flex', gap: '1px', background: c.border, padding: '1px',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          {[
            { key: 'orders', label: 'Commandes', activeColor: c.red },
            { key: 'catalogue', label: 'Catalogue', activeColor: c.gold },
          ].map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)} style={{
              padding: `6px ${sp[3]}`, background: viewMode === v.key ? v.activeColor : c.bgSurface,
              border: 'none', color: viewMode === v.key ? (v.key === 'catalogue' ? c.black : c.white) : c.textSecondary,
              fontSize: '10px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: `all 0.2s ${ease.smooth}`,
            }}>{v.label}</button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
          {/* Notification */}
          <button style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: c.textSecondary, display: 'flex', position: 'relative',
            transition: `color 0.2s ${ease.smooth}`,
          }}
            onMouseOver={(e) => e.currentTarget.style.color = c.gold}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
          >
            <Icon d={icons.bell} size={16} color="currentColor" />
            {Object.values(unreadCounts).some(c => c > 0) && (
              <div style={{
                position: 'absolute', top: 6, right: 6, width: 6, height: 6,
                borderRadius: '50%', background: c.red,
              }} />
            )}
          </button>

          {/* New order */}
          <button onClick={() => setIsNewOrderOpen(true)} style={{
            padding: `6px ${sp[2]}`, background: c.red,
            border: 'none', color: c.white, fontSize: '10px', fontWeight: 700,
            cursor: 'pointer', fontFamily: f.mono, letterSpacing: '0.06em',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px',
            transition: `all 0.25s ${ease.luxury}`,
            boxShadow: `0 2px 8px oklch(55% 0.22 25 / 0.20)`,
          }}
            onMouseOver={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = `0 4px 16px oklch(55% 0.22 25 / 0.30)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = `0 2px 8px oklch(55% 0.22 25 / 0.20)`; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Icon d={icons.plus} size={12} color="currentColor" />
            Demande
          </button>

          {/* Settings */}
          <button onClick={() => navigate('/settings')} style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: c.textSecondary, display: 'flex',
            transition: `color 0.2s ${ease.smooth}`,
          }}
            onMouseOver={(e) => e.currentTarget.style.color = c.gold}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d={icons.settings} />
            </svg>
          </button>

          {/* Sign out */}
          <button onClick={onSignOut} style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: c.textSecondary, display: 'flex',
            transition: `color 0.2s ${ease.smooth}`,
          }}
            onMouseOver={(e) => e.currentTarget.style.color = c.red}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
          >
            <Icon d={icons.logout} size={16} color="currentColor" />
          </button>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {viewMode === 'catalogue' ? (
          /* ── CATALOGUE ── */
          <div style={{ flex: 1, overflowY: 'auto', padding: sp[4], background: c.bg }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ marginBottom: sp[5] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[1] }}>
                  <div style={{ width: 24, height: '1px', background: c.gold }} />
                  <span style={{
                    fontFamily: f.mono, fontSize: '10px', color: c.gold,
                    letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                  }}>Catalogue Produits</span>
                </div>
                <h2 style={{
                  margin: 0, fontFamily: f.display, fontSize: size['2xl'],
                  color: c.text, letterSpacing: '-0.02em', fontWeight: 500,
                }}>
                  Nos cat\u00e9gories <em style={{ fontStyle: 'italic', color: c.gold }}>sourc\u00e9es</em>
                </h2>
                <p style={{
                  margin: `${sp[2]} 0 0`, fontSize: size.sm, color: c.textSecondary,
                  lineHeight: 1.7, maxWidth: 600,
                }}>
                  {CATEGORIES.length} cat\u00e9gories disponibles, prix adapt\u00e9s \u00e0 votre profil {tier.label.toLowerCase()}.
                  Directement depuis nos usines partenaires en Chine.
                </p>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: sp[3],
              }}>
                {CATEGORIES.map(cat => {
                  const tierKey = profile?.client_tier || DEFAULT_TIER
                  const tierPrice = getTierPrice(cat, tierKey)
                  const moq = getCategoryMOQ(cat.id, tierKey)
                  return (
                    <div key={cat.id} style={{
                      background: c.bgElevated, border: `1px solid ${c.border}`,
                      padding: sp[3], transition: `all 0.25s ${ease.smooth}`,
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = cat.color
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 4px 24px ${cat.color}15`
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = c.border
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}>
                      {/* Top accent */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: cat.color }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[3] }}>
                        <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontFamily: f.display, fontSize: size.base, color: c.text, fontWeight: 600 }}>{cat.name}</div>
                          <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>{cat.description}</div>
                        </div>
                      </div>

                      {/* Price grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: sp[1],
                        background: c.bgSurface, padding: `${sp[2]}`, marginBottom: sp[2],
                        border: `1px solid ${c.borderSubtle}`,
                      }}>
                        {[
                          { label: 'Votre prix', value: tierPrice, color: c.green },
                          { label: 'Revente', value: cat.priceFrance, color: c.text },
                          { label: 'Marge', value: cat.margin, color: c.gold },
                          { label: 'MOQ', value: moq.toLocaleString('fr-FR'), color: c.amber },
                        ].map((m, i) => (
                          <div key={i}>
                            <div style={{
                              fontFamily: f.mono, fontSize: '8px', color: c.textTertiary,
                              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px',
                            }}>{m.label}</div>
                            <div style={{ fontSize: size.sm, fontWeight: 700, color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.6, marginBottom: sp[2] }}>
                        {cat.notes}
                      </div>

                      {/* Locations */}
                      <div style={{ display: 'flex', gap: sp[1], flexWrap: 'wrap', marginBottom: sp[2] }}>
                        {cat.locations.map(loc => (
                          <span key={loc} style={{
                            padding: '2px 8px', background: c.bgSurface,
                            border: `1px solid ${c.borderSubtle}`, fontSize: '9px',
                            fontFamily: f.mono, color: c.textTertiary, letterSpacing: '0.04em',
                          }}>{loc}</span>
                        ))}
                      </div>

                      <button onClick={(e) => {
                        e.stopPropagation(); setViewMode('orders'); setIsNewOrderOpen(true)
                      }} style={{
                        width: '100%', padding: '10px',
                        background: 'transparent', border: `1px solid ${cat.color}44`,
                        color: cat.color, fontSize: '10px', fontFamily: f.mono,
                        cursor: 'pointer', letterSpacing: '0.06em', fontWeight: 700,
                        textTransform: 'uppercase', transition: `all 0.2s ${ease.smooth}`,
                      }}
                        onMouseOver={(e) => { e.currentTarget.style.background = cat.color; e.currentTarget.style.color = c.white }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cat.color }}
                      >Commander</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── SIDEBAR ── */}
            <div className="sidebar" style={{
              width: 340, background: c.bgWarm,
              borderRight: `1px solid ${c.border}`,
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Search */}
              <div style={{ padding: `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.border}` }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}>
                    <Icon d={icons.search} size={14} color={c.textTertiary} />
                  </div>
                  <input type="text" placeholder="Rechercher..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: `10px 12px 10px 34px`,
                      background: c.bgSurface, border: `1px solid ${c.border}`,
                      fontSize: size.sm, color: c.text, fontFamily: f.body,
                      outline: 'none', boxSizing: 'border-box',
                      transition: `border-color 0.2s ${ease.smooth}`,
                    }}
                    onFocus={(e) => e.target.style.borderColor = c.gold}
                    onBlur={(e) => e.target.style.borderColor = c.border}
                  />
                </div>
              </div>

              {/* Filters */}
              <div style={{
                display: 'flex', gap: '4px', padding: `${sp[1]} ${sp[2]}`,
                borderBottom: `1px solid ${c.border}`,
              }}>
                {[
                  { label: 'Toutes', value: 'all' },
                  { label: 'En cours', value: 'in-progress' },
                  { label: 'Termin\u00e9es', value: 'delivered' },
                ].map(fl => (
                  <button key={fl.value} onClick={() => setFilterStatus(fl.value)} style={{
                    padding: `6px ${sp[2]}`,
                    background: filterStatus === fl.value ? c.red : 'transparent',
                    border: `1px solid ${filterStatus === fl.value ? c.red : c.border}`,
                    color: filterStatus === fl.value ? c.white : c.textSecondary,
                    fontSize: '10px', cursor: 'pointer', fontFamily: f.mono,
                    fontWeight: filterStatus === fl.value ? 700 : 500,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    transition: `all 0.2s ${ease.smooth}`,
                  }}
                    onMouseOver={(e) => { if (filterStatus !== fl.value) e.target.style.borderColor = c.gold }}
                    onMouseOut={(e) => { if (filterStatus !== fl.value) e.target.style.borderColor = c.border }}
                  >{fl.label}</button>
                ))}
              </div>

              {/* Order list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredOrders.length === 0 ? (
                  <div style={{
                    padding: sp[4], textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, border: `1px solid ${c.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: sp[2], background: c.bgElevated,
                    }}>
                      <Icon d={icons.folder} size={20} color={c.textTertiary} />
                    </div>
                    <span style={{
                      fontSize: size.xs, color: c.textTertiary,
                      fontFamily: f.mono, letterSpacing: '0.04em',
                    }}>Aucune commande</span>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order}
                      selected={selectedOrder?.id === order.id}
                      onClick={() => setSelectedOrder(order)}
                      unreadCount={unreadCounts[order.id] || 0}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── MAIN PANEL ── */}
            <div className="main-panel" style={{
              flex: 1, display: 'flex', flexDirection: 'column', background: c.bg,
            }}>
              {selectedOrder ? (
                <>
                  {/* Order header */}
                  <div style={{
                    padding: `${sp[3]} ${sp[4]}`,
                    borderBottom: `1px solid ${c.border}`,
                    background: c.bgSurface,
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: sp[2],
                    }}>
                      <div>
                        <div style={{
                          fontSize: '10px', color: c.textTertiary, marginBottom: '6px',
                          fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>{selectedOrder.ref}</div>
                        <h1 style={{
                          margin: 0, fontSize: size.xl, fontFamily: f.display,
                          color: c.text, letterSpacing: '-0.02em',
                        }}>{selectedOrder.product}</h1>
                      </div>
                      <StatusPill status={selectedOrder.status} size="md" />
                    </div>

                    {/* Metadata */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: sp[3], fontSize: size.sm,
                    }}>
                      {[
                        { label: 'Quantit\u00e9', value: `${fmtQty(selectedOrder.quantity)} unit\u00e9s` },
                        { label: 'Budget', value: selectedOrder.budget },
                        { label: 'D\u00e9lai', value: selectedOrder.deadline || '\u2014' },
                        { label: 'Fournisseur', value: selectedOrder.city || '\u2014' },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{
                            color: c.textTertiary, marginBottom: '4px',
                            fontFamily: f.mono, fontSize: '9px',
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                          }}>{m.label}</div>
                          <div style={{ color: c.text, fontWeight: 600 }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline */}
                  <div style={{ padding: `${sp[3]} ${sp[4]} 0` }}>
                    <PipelineTracker status={selectedOrder.status} />
                  </div>

                  {/* WhatsApp CTA */}
                  <div style={{ padding: `0 ${sp[4]} ${sp[2]}` }}>
                    <a
                      href={`https://wa.me/8613800000000?text=${encodeURIComponent(`Bonjour CARAXES, je vous contacte au sujet de ma commande ${selectedOrder.ref} (${selectedOrder.product}).`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: `6px ${sp[2]}`, fontSize: '10px', fontFamily: f.mono,
                        letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
                        color: '#25D366', border: `1px solid #25D36633`,
                        background: '#25D36608', textDecoration: 'none',
                        transition: `all 0.2s ${ease.smooth}`, cursor: 'pointer',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#25D36618'; e.currentTarget.style.borderColor = '#25D36666' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#25D36608'; e.currentTarget.style.borderColor = '#25D36633' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Contacter sur WhatsApp
                    </a>
                  </div>

                  {/* Tabs */}
                  <div style={{
                    display: 'flex', padding: `0 ${sp[4]}`,
                    borderBottom: `1px solid ${c.border}`, gap: sp[4],
                  }}>
                    {['messages', 'documents'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: `${sp[2]} 0`, background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: size.sm,
                        fontWeight: activeTab === tab ? 700 : 400,
                        color: activeTab === tab ? c.red : c.textSecondary,
                        borderBottom: `2px solid ${activeTab === tab ? c.red : 'transparent'}`,
                        transition: `all 0.2s ${ease.smooth}`,
                        fontFamily: activeTab === tab ? f.mono : f.body,
                        letterSpacing: activeTab === tab ? '0.04em' : '0.01em',
                        textTransform: activeTab === tab ? 'uppercase' : 'capitalize',
                      }}
                        onMouseOver={(e) => { if (activeTab !== tab) e.target.style.color = c.text }}
                        onMouseOut={(e) => { if (activeTab !== tab) e.target.style.color = c.textSecondary }}
                      >{tab === 'messages' ? 'Messages' : 'Documents'}</button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'messages' ? (
                      <>
                        <div style={{
                          flex: 1, overflowY: 'auto', padding: sp[4],
                          display: 'flex', flexDirection: 'column',
                        }}>
                          {messages.length === 0 ? (
                            <DragonEmptyState
                              text="Aucun message"
                              sub="D\u00e9marrez la conversation avec votre agent"
                            />
                          ) : (
                            messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div style={{
                          padding: `${sp[2]} ${sp[4]}`,
                          borderTop: `1px solid ${c.border}`, background: c.bgSurface,
                        }}>
                          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: sp[2] }}>
                            <input type="text" value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Votre message..."
                              style={{
                                flex: 1, padding: `12px ${sp[2]}`,
                                background: c.bgElevated, border: `1px solid ${c.border}`,
                                color: c.text, fontSize: size.sm, fontFamily: f.body,
                                outline: 'none', boxSizing: 'border-box',
                                transition: `border-color 0.2s ${ease.smooth}`,
                              }}
                              onFocus={(e) => e.target.style.borderColor = c.gold}
                              onBlur={(e) => e.target.style.borderColor = c.border}
                            />
                            <button type="submit" disabled={!newMessage.trim()} style={{
                              padding: `12px ${sp[2]}`,
                              background: newMessage.trim() ? c.red : c.bgHover,
                              border: 'none', color: c.white,
                              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.smooth}`,
                            }}
                              onMouseOver={(e) => { if (newMessage.trim()) e.currentTarget.style.background = c.redDeep }}
                              onMouseOut={(e) => { if (newMessage.trim()) e.currentTarget.style.background = c.red }}
                            >
                              <Icon d={icons.send} size={14} color="currentColor" />
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
                          {documents.length === 0 ? (
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              height: '100%', flexDirection: 'column',
                            }}>
                              <div style={{
                                width: 80, height: 80, border: `2px dashed ${c.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: sp[2], cursor: 'pointer',
                                transition: `all 0.2s ${ease.smooth}`,
                              }}
                                onClick={handleUploadClick}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = c.gold
                                  e.currentTarget.style.background = c.goldSoft
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = c.border
                                  e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                <Icon d={icons.upload} size={28} color={c.textTertiary} />
                              </div>
                              <p style={{ color: c.text, fontSize: size.sm, fontWeight: 600, marginBottom: sp[1], margin: `0 0 ${sp[1]} 0` }}>
                                Ajouter des documents
                              </p>
                              <p style={{ color: c.textTertiary, fontSize: size.xs, margin: 0 }}>
                                Images, PDF, Word, Excel
                              </p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                              {documents.map(doc => (
                                <DocumentCard key={doc.id} doc={doc}
                                  onDownload={() => handleDownloadDocument(doc)}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{
                          padding: `${sp[2]} ${sp[4]}`,
                          borderTop: `1px solid ${c.border}`, background: c.bgSurface,
                        }}>
                          <button onClick={handleUploadClick} style={{
                            width: '100%', padding: '12px',
                            background: c.bgElevated, border: `1px dashed ${c.border}`,
                            color: c.textSecondary, cursor: 'pointer', fontFamily: f.body,
                            fontSize: size.sm, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: sp[1],
                            transition: `all 0.2s ${ease.smooth}`,
                          }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}
                          >
                            <Icon d={icons.clip} size={14} color="currentColor" />
                            Ajouter un fichier
                          </button>
                          <input ref={uploadInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <DragonEmptyState
                  text="S\u00e9lectionnez une commande"
                  sub="ou cr\u00e9ez une nouvelle demande pour commencer"
                />
              )}
            </div>
          </>
        )}
      </div>

      <NewOrderModal isOpen={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} onSubmit={handleCreateOrder} />
    </div>
  )
}
