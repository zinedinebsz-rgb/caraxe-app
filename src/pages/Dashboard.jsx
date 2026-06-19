import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { c, f, size, sp, shadow, ease, transition, radius, gradient, glass, STATUSES, isDelivered } from '../lib/theme'

const SHIP_STATUSES = ['production', 'QC', 'douanes', 'transit', 'livré']
const SHIP_LABELS = { production: 'Production', QC: 'Contrôle qualité', douanes: 'Douanes', transit: 'En transit', 'livré': 'Livré' }
const shipStatusKey = (s) => (typeof s === 'number' ? (SHIP_STATUSES[s] || 'production') : (s || 'production'))
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
  subscribeToMessages, subscribeToAllMessages, subscribeToOrders, subscribeToProducts, subscribeToShipments, subscribeToInventory, supabase,
  getShipments, createShipment, getInventory, getActiveProducts,
  getShops, createEcomOrder, getEcomServices, getUnreadCounts, playNotificationSound,
} from '../lib/supabase'
import { getCatalog, VERIFIED_SUPPLIERS } from '../lib/catalogsByProfile'
import { FORMATION_CLIENT, FORMATION_ECOMMERCE, FORMATION_INTERNE, FORMATION_TOOLS, SERVICE_TYPES, FORMATION_STRATEGY } from '../lib/formationData'
import { getTierByKey, getTierPrice, getTierMOQ, DEFAULT_TIER } from '../lib/clientTiers'
import StatusPill, { ProgressBar, PipelineStepper } from '../components/StatusPill'
import { useToast } from '../components/Toast'
import LocaleAndPwaControls from '../components/LocaleAndPwaControls.jsx'
import { useI18n } from '../lib/i18n.jsx'
import { sendLocalNotification, notificationPermission } from '../lib/pwa'

import { MAX_FILE_SIZE } from '../lib/constants'
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

const Icon = ({ d, size: s = 20, color = 'currentColor', sw = 1.5 }) => (
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
  menu: 'M4 6h16M4 12h16M4 18h16',
  home: 'M3 12l9-9 9 9v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  trending: 'M13 7l5 5m0 0l-5 5m5-5H6',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtQty = (n) => (n || 0).toLocaleString('fr-FR')

/* ─── PDF Export Utility (lazy-loads jsPDF from CDN) ─── */
async function loadJsPDF() {
  if (typeof window === 'undefined') throw new Error('SSR')
  if (window.jspdf) return window.jspdf
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-jspdf]')
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    s.async = true
    s.dataset.jspdf = 'true'
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load jsPDF'))
    document.head.appendChild(s)
  })
  return window.jspdf
}

async function exportOrderToPDF(order, profile) {
  const { jsPDF } = await loadJsPDF()
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(196, 58, 47)
  doc.text('CARAXES', 50, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('Agent de Sourcing Chine', 50, y + 14)
  doc.text('contact@caraxes.fr · Yiwu, Zhejiang, Chine', 50, y + 26)

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Récap émis le ${dateStr}`, W - 50, y, { align: 'right' })
  if (order.ref) doc.text(`Réf. ${order.ref}`, W - 50, y + 14, { align: 'right' })
  y += 60

  doc.setDrawColor(220, 180, 100)
  doc.setLineWidth(0.6)
  doc.line(50, y, W - 50, y)
  y += 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text(order.product || 'Commande', 50, y)
  y += 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text('CLIENT', 50, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(11)
  if (profile?.full_name) doc.text(profile.full_name, 50, y + 16)
  if (profile?.email) doc.text(profile.email, 50, y + 30)
  if (profile?.phone) doc.text(profile.phone, 50, y + 44)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text('STATUT', W - 200, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(11)
  const statusLabel = String(order.status || '—').toUpperCase()
  doc.text(statusLabel, W - 200, y + 16)
  if (order.created_at) doc.text(`Créée le ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, W - 200, y + 30)
  y += 80

  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.4)
  doc.line(50, y, W - 50, y)
  y += 22
  const rows = [
    ['Quantité', `${fmtQty(order.quantity)} unités`],
    ['Budget', String(order.budget || '–')],
    ['Référence', order.ref || '–'],
  ]
  if (order.city) rows.push(['Ville livraison', order.city])
  doc.setFontSize(10)
  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text(k, 50, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(String(v), 200, y)
    y += 20
  })
  y += 10
  doc.line(50, y, W - 50, y)
  y += 24

  if (order.description) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text('DESCRIPTION DU PROJET', 50, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(String(order.description), W - 100)
    doc.text(lines, 50, y)
    y += lines.length * 14 + 20
  }

  const footerY = doc.internal.pageSize.getHeight() - 50
  doc.setDrawColor(220, 180, 100)
  doc.setLineWidth(0.4)
  doc.line(50, footerY - 10, W - 50, footerY - 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text('CARAXES · Agent de Sourcing Chine · Document généré automatiquement depuis votre espace client.', W / 2, footerY, { align: 'center' })
  doc.text('Questions ? contact@caraxes.fr · WhatsApp : +86 138 1965 2960', W / 2, footerY + 12, { align: 'center' })

  doc.save(`CARAXES-${order.ref || 'commande'}.pdf`)
}
const fmtMoney = (v, decimals = 0) => {
  if (v == null || v === '' || v === 'À définir') return v || '–'
  // If it's already a string with €, currency symbols, ranges etc → display as-is
  if (typeof v === 'string' && /[€$¥£]|^\d+\s*[-–]\s*\d+/.test(v)) return v
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'))
  if (isNaN(n)) return v
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '\u00A0€'
}

/* ─── Animated Card Wrapper ─── */
function AnimCard({ children, delay = 0, style = {}, ...props }) {
  return (
    <div style={{
      animation: `cardReveal 0.55s ${ease.out} both`,
      animationDelay: `${delay}ms`,
      ...style,
    }} {...props}>
      {children}
    </div>
  )
}

/* ─── Cinematic Card — warm depth + gold accent ─── */
function GlassCard({ children, style = {}, hoverLift = true, goldTop = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`,
        border: `1px solid ${c.border}`,
        borderTop: goldTop ? `2px solid ${c.goldDim}` : undefined,
        borderRadius: radius.md,
        padding: sp[4],
        position: 'relative',
        overflow: 'hidden',
        boxShadow: shadow.card,
        transition: `all 0.35s ${ease.luxury}`,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={hoverLift ? (e) => {
        e.currentTarget.style.borderColor = c.borderGold
        e.currentTarget.style.boxShadow = shadow.cardHover
        e.currentTarget.style.transform = 'translateY(-1px)'
      } : undefined}
      onMouseLeave={hoverLift ? (e) => {
        e.currentTarget.style.borderColor = c.border
        e.currentTarget.style.boxShadow = shadow.card
        e.currentTarget.style.transform = 'translateY(0)'
      } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

function DragonMark({ s = 40 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 44 44" fill="none">
      <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.7"/>
      <circle cx="17.5" cy="21" r="1.5" fill={c.gold} opacity="0.8"/>
      <circle cx="26.5" cy="21" r="1.5" fill={c.gold} opacity="0.8"/>
    </svg>
  )
}

function FilmGrain() { return null }

function ArtDecoDivider() {
  return <div style={{ height: '1px', background: gradient.goldLine, margin: `${sp[2]} 0` }} />
}

function DecoPattern() { return null }

function SectionBanner({ title, subtitle, accentColor = c.gold }) {
  return (
    <div style={{
      marginBottom: sp[6], position: 'relative',
      paddingBottom: sp[3],
      borderBottom: `1px solid ${c.border}`,
    }}>
      {subtitle && <p style={{ fontFamily: f.mono, fontSize: '10px', color: accentColor, letterSpacing: '0.14em', textTransform: 'uppercase', margin: `0 0 ${sp[1]}`, fontWeight: 600 }}>{subtitle}</p>}
      <h1 style={{ fontSize: size['2xl'], fontFamily: f.display, fontWeight: 400, fontStyle: 'italic', color: c.text, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{title}</h1>
    </div>
  )
}

function DragonEmptyState({ text = 'Sélectionnez une commande', sub = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${sp[10]} ${sp[4]}`, gap: sp[3], animation: 'cardReveal 0.5s ease' }}>
      <DragonMark s={32} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: f.display, fontSize: size.base, color: c.textSecondary, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{text}</p>
        {sub && <p style={{ fontFamily: f.body, fontSize: size.sm, color: c.textTertiary, margin: `${sp[1]} 0 0` }}>{sub}</p>}
      </div>
    </div>
  )
}

function PipelineVisualization({ orders }) {
  const pipeline = STATUSES.reduce((acc, status) => {
    acc[status.key] = orders.filter(o => (typeof o.status === 'number' ? STATUSES[o.status] : STATUSES.find(s => s.key === o.status))?.key === status.key).length
    return acc
  }, {})

  return (
    <div style={{ marginBottom: sp[4] }}>
      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: sp[2], fontWeight: 600 }}>Pipeline</div>
      <div style={{ display: 'flex', gap: '1px', borderRadius: radius.sm, overflow: 'hidden' }}>
        {STATUSES.map((status, idx) => {
          const count = pipeline[status.key] || 0
          return (
            <div key={status.key} style={{
              flex: 1, padding: `${sp[2]} ${sp[1]}`, textAlign: 'center',
              background: count > 0 ? c.bgSurface : c.bgCard,
              borderBottom: `2px solid ${count > 0 ? status.color : c.borderSubtle}`,
              transition: `all 0.3s ${ease.luxury}`,
            }}>
              <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: count > 0 ? status.color : c.textGhost, letterSpacing: '-0.02em', marginBottom: '2px' }}>
                {count}
              </div>
              <div style={{ fontFamily: f.mono, fontSize: '7px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.3 }}>{status.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrderCardGrid({ order, selected, onClick, unreadCount }) {
  const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]

  return (
    <div onClick={onClick}
      style={{
        background: selected ? c.bgElevated : `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`,
        border: `1px solid ${selected ? c.gold : c.borderSubtle}`,
        borderRadius: radius.md,
        padding: `${sp[3]} ${sp[3]} ${sp[2]}`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: selected ? shadow.cardHover : shadow.xs,
        transition: `all 0.4s ${ease.luxury}`,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `2px solid ${statusObj.color}`,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = c.bgElevated
          e.currentTarget.style.borderColor = c.borderLight
          e.currentTarget.style.boxShadow = shadow.sm
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`
          e.currentTarget.style.borderColor = c.borderSubtle
          e.currentTarget.style.boxShadow = shadow.xs
        }
      }}>

      {unreadCount > 0 && (
        <div style={{
          position: 'absolute', top: sp[1.5], right: sp[1.5],
          minWidth: 18, height: 18, borderRadius: radius.pill,
          background: c.red, color: c.white, fontSize: '10px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
        }}>{unreadCount}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: sp[1.5], marginBottom: sp[1.5] }}>
        <span style={{
          fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
        }}>{order.ref}</span>
      </div>

      <div style={{
        fontFamily: f.display, fontWeight: 700, fontSize: size.sm, marginBottom: sp[2],
        lineHeight: 1.35, color: c.text, letterSpacing: '-0.01em',
      }}>{order.product}</div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: sp[2], fontSize: size.xs, color: c.textTertiary,
      }}>
        <span>{fmtQty(order.quantity)} unites</span>
        <span style={{ color: c.goldDim, fontFamily: f.mono, fontWeight: 500, fontSize: '11px' }}>{order.budget || '–'}</span>
      </div>

      <div style={{ marginBottom: sp[1.5] }}>
        <ProgressBar value={order.progress} color={statusObj.color} height={2} />
      </div>

      <div style={{ marginTop: 'auto', paddingTop: sp[1] }}>
        <StatusPill status={order.status} size="sm" />
      </div>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isAgent = msg.sender_role === 'admin'
  return (
    <div style={{
      display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end',
      marginBottom: sp[1.5],
    }}>
      <div style={{
        maxWidth: '75%', padding: `${sp[1.5]} ${sp[2]}`,
        background: isAgent ? c.bgSurface : 'rgba(196, 58, 47, 0.04)',
        border: `1px solid ${isAgent ? c.borderSubtle : 'rgba(196, 58, 47, 0.08)'}`,
        borderRadius: radius.sm,
        fontSize: size.sm, lineHeight: 1.65, color: c.text,
        position: 'relative',
        transition: `all 0.2s ${ease.smooth}`,
      }}>
        <div style={{
          fontSize: '8px', color: isAgent ? c.goldDim : c.redMuted,
          marginBottom: '4px', fontFamily: f.mono,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {isAgent ? 'Agent CARAXES' : 'Vous'}
          <span style={{ color: c.textGhost, fontWeight: 400, letterSpacing: '0.02em', textTransform: 'none', fontSize: '8px' }}>
            {fmtDate(msg.created_at)}
          </span>
        </div>
        <p style={{ margin: 0, wordWrap: 'break-word', whiteSpace: 'pre-wrap', fontWeight: 400, letterSpacing: '0.01em' }}>
          {msg.content}
        </p>
      </div>
    </div>
  )
}

function DocumentCard({ doc, onDownload }) {
  const fileName = doc.name || doc.file_name || 'Document'
  const fileExt = fileName.split('.').pop().toUpperCase()

  return (
    <div
      onClick={onDownload}
      style={{
        display: 'flex', alignItems: 'center', gap: sp[2],
        padding: `${sp[2]} ${sp[3]}`,
        background: c.bgCard,
        border: `1px solid ${c.borderSubtle}`,
        borderRadius: radius.lg,
        transition: `all 0.25s ${ease.smooth}`,
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.borderLight
        e.currentTarget.style.boxShadow = shadow.xs
        e.currentTarget.style.transform = 'translateX(2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = c.borderSubtle
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateX(0)'
      }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: c.redSoft, border: `1px solid rgba(196, 58, 47, 0.12)`,
        borderRadius: radius.md,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon d={icons.file} size={18} color={c.red} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: size.sm, color: c.text, fontWeight: 500,
          marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{fileName}</div>
        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.06em' }}>{fileExt}</div>
      </div>
      <Icon d={icons.download} size={16} color={c.goldDim} />
    </div>
  )
}

export default function Dashboard({ user, profile, onSignOut }) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { t } = useI18n()
  const isMobile = useIsMobile()

  // ─── STATE ───
  const [viewMode, setViewMode] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [shipments, setShipments] = useState([])
  const [inventory, setInventory] = useState([])
  const [dynamicProducts, setDynamicProducts] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [isEcomSiteCreationOpen, setIsEcomSiteCreationOpen] = useState(false)
  const [ecomStep, setEcomStep] = useState(1)
  const [activeLesson, setActiveLesson] = useState(null)
  const [expandedModules, setExpandedModules] = useState({})
  const [newOrderForm, setNewOrderForm] = useState({ product: '', quantity: '', budget: '', description: '' })
  const [siteCreationForm, setSiteCreationForm] = useState({ shopName: '', platform: 'Shopify', category: '', branding: 'none' })
  const [ecomServices, setEcomServices] = useState([])
  const [formationMode, setFormationMode] = useState('mastery') // 'mastery' | 'express'
  const selectedOrderIdRef = useRef(null)
  const ordersRef = useRef([])
  useEffect(() => { selectedOrderIdRef.current = selectedOrderId }, [selectedOrderId])
  useEffect(() => { ordersRef.current = orders }, [orders])

  // ─── MEMOIZED COMPUTED VALUES ───
  const activeOrders = useMemo(() => orders.filter(o => !isDelivered(o.status)), [orders])
  const deliveredOrders = useMemo(() => orders.filter(o => isDelivered(o.status)), [orders])
  const formationServices = useMemo(() => ecomServices.filter(s => s.service_type === 'formation'), [ecomServices])
  const creationServices = useMemo(() => ecomServices.filter(s => s.service_type === 'creation'), [ecomServices])

  // ─── DATA FETCHING ───
  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      try {
        const [ordersData, shipmentsData, inventoryData, productsData, countsData, servicesData] = await Promise.all([
          getOrders(user.id),
          getShipments(user.id),
          getInventory(user.id),
          getActiveProducts(user.id),
          getUnreadCounts(user.id),
          getEcomServices(user.id),
        ])
        setOrders(ordersData || [])
        setShipments(shipmentsData || [])
        setInventory(inventoryData || [])
        setDynamicProducts(productsData || [])
        setUnreadCounts(countsData || {})
        setEcomServices(servicesData || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      }
    }
    fetchData()

    // ─── REAL-TIME SUBSCRIPTIONS ───
    const unsubOrders = subscribeToOrders((payload) => {
      try {
        const n = payload?.new
        const o = payload?.old
        const belongsToUser = (n && n.client_id === user.id) || (o && o.client_id === user.id)
        if (belongsToUser) {
          if (n && o && n.status !== o.status && notificationPermission() === 'granted') {
            sendLocalNotification({
              title: 'CARAXES — statut mis à jour',
              body: `Commande ${n.ref || n.id?.slice(0, 8) || ''} : ${(typeof n.status === 'number' ? STATUSES[n.status]?.label : n.status) || n.status}`,
              url: '/',
              tag: `order-${n.id}`,
            })
          }
          getOrders(user.id).then((list) => setOrders(list || [])).catch(() => {})
        }
      } catch (_) {}
    })
    const unsubShipments = subscribeToShipments((payload) => {
      const row = payload?.new || payload?.old
      if (row && row.client_id === user.id) {
        getShipments(user.id).then((list) => setShipments(list || [])).catch(() => {})
      }
    })
    const unsubInventory = subscribeToInventory((payload) => {
      const row = payload?.new || payload?.old
      if (row && row.client_id === user.id) {
        getInventory(user.id).then((list) => setInventory(list || [])).catch(() => {})
      }
    })
    const unsubProducts = subscribeToProducts((payload) => {
      const row = payload?.new || payload?.old
      if (row) {
        getActiveProducts(user.id).then((list) => setDynamicProducts(list || [])).catch(() => {})
      }
    })
    // Global: notify on new agent message on any of the client's orders
    const unsubMsgGlobal = subscribeToAllMessages((newMsg) => {
      if (!newMsg.order_id || newMsg.sender_role !== 'admin') return
      if (!ordersRef.current.some(o => o.id === newMsg.order_id)) return
      getUnreadCounts(user.id).then((c) => setUnreadCounts(c || {})).catch(() => {})
      if (newMsg.order_id !== selectedOrderIdRef.current) {
        playNotificationSound()
        if (notificationPermission() === 'granted') {
          sendLocalNotification({ title: 'CARAXES \u2014 nouveau message', body: 'Votre agent vous a r\u00e9pondu', url: '/', tag: `msg-${newMsg.order_id}` })
        }
      }
    }, `client-messages-${user.id}`)

    return () => {
      if (unsubOrders) supabase.removeChannel(unsubOrders)
      if (unsubShipments) supabase.removeChannel(unsubShipments)
      if (unsubInventory) supabase.removeChannel(unsubInventory)
      if (unsubProducts) supabase.removeChannel(unsubProducts)
      if (unsubMsgGlobal) supabase.removeChannel(unsubMsgGlobal)
    }
  }, [user?.id])

  // Fetch messages + documents when order changes
  useEffect(() => {
    if (!selectedOrderId) {
      setMessages([])
      setDocuments([])
      return
    }

    const fetchOrderData = async () => {
      try {
        const [msgsData, docsData] = await Promise.all([
          getMessages(selectedOrderId),
          getDocuments(selectedOrderId),
        ])
        setMessages(msgsData || [])
        setDocuments(docsData || [])
        await markMessagesRead(selectedOrderId, user.id)
      } catch (err) {
        console.error('Error fetching order data:', err)
      }
    }

    fetchOrderData()
    const unsubMessages = subscribeToMessages(selectedOrderId, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
      if (newMsg.sender_role === 'admin') playNotificationSound()
    })

    return () => { if (unsubMessages) supabase.removeChannel(unsubMessages) }
  }, [selectedOrderId, user?.id])

  // ─── HANDLERS ───
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedOrderId) return
    try {
      await sendMessage({ orderId: selectedOrderId, content: messageInput, senderId: user.id, senderRole: 'client' })
      setMessageInput('')
    } catch (err) {
      addToast('Erreur lors de l\'envoi', 'error')
    }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      addToast('Erreur lors du téléchargement', 'error')
    }
  }

  const handleCreateOrder = async () => {
    if (!newOrderForm.product || !newOrderForm.quantity) {
      addToast('Remplissez tous les champs requis', 'error')
      return
    }
    try {
      await createOrder({
        clientId: user.id,
        product: newOrderForm.product,
        quantity: parseInt(newOrderForm.quantity),
        budget: newOrderForm.budget,
        notes: newOrderForm.description,
      })
      setNewOrderForm({ product: '', quantity: '', budget: '', description: '' })
      setIsNewOrderOpen(false)
      addToast('Commande créée', 'success')
    } catch (err) {
      addToast('Erreur lors de la création', 'error')
    }
  }

  const handleCreateSiteOrder = async () => {
    if (!siteCreationForm.shopName || !siteCreationForm.category) {
      addToast('Remplissez les champs requis', 'error')
      return
    }
    try {
      await createEcomOrder({
        clientId: user.id,
        serviceType: 'creation',
        shopName: siteCreationForm.shopName,
        platform: siteCreationForm.platform,
        productCategory: siteCreationForm.category,
        hasBranding: siteCreationForm.branding,
      })

      // Notify admin via N8N webhook (silent, client doesn't know)
      try {
        const n8nUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || ''
      if (!n8nUrl) throw new Error('N8N webhook URL not configured')
      await fetch(`${n8nUrl}/webhook/site-creation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopName: siteCreationForm.shopName,
            platform: siteCreationForm.platform,
            category: siteCreationForm.category,
            branding: siteCreationForm.branding,
            clientId: user.id,
            clientEmail: user.email,
            clientName: profile?.full_name || '',
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (e) { console.warn('Webhook notification failed:', e) }

      setSiteCreationForm({ shopName: '', platform: 'Shopify', category: '', branding: 'none' })
      setIsEcomSiteCreationOpen(false)
      setEcomStep(1)
      addToast('Demande envoyée ! Notre équipe va créer votre boutique.', 'success')
    } catch (err) {
      addToast('Erreur lors de l\'envoi', 'error')
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  const selectedOrder = orders.find(o => o.id === selectedOrderId)
  const catalog = getCatalog(profile?.client_tier || DEFAULT_TIER)

  // ─── Shared input style — cinematic ───
  const inputStyle = {
    padding: `11px ${sp[2]}`,
    background: c.bgInput,
    border: `1px solid ${c.borderSubtle}`,
    borderRadius: radius.sm,
    color: c.text,
    fontFamily: f.body,
    fontSize: size.sm,
    transition: `all 0.25s ${ease.luxury}`,
    outline: 'none',
    letterSpacing: '0.01em',
    boxShadow: shadow.inner,
  }

  const btnPrimary = {
    padding: `10px ${sp[3]}`,
    background: c.gold,
    border: `1px solid ${c.gold}`,
    borderRadius: radius.sm,
    color: c.black,
    fontFamily: f.body,
    fontWeight: 600,
    fontSize: size.sm,
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: `all 0.25s ${ease.luxury}`,
    boxShadow: `0 2px 8px rgba(196, 163, 90, 0.2)`,
  }

  const btnSecondary = {
    padding: `10px ${sp[3]}`,
    background: 'transparent',
    border: `1px solid ${c.border}`,
    borderRadius: radius.sm,
    color: c.textSecondary,
    fontFamily: f.body,
    fontSize: size.sm,
    cursor: 'pointer',
    transition: `all 0.25s ${ease.luxury}`,
  }

  // ─── RENDER ───
  return (
    <div style={{
      display: 'flex', height: '100vh', background: c.bg, color: c.text,
      fontFamily: f.body, overflow: 'hidden',
    }}>
      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder, textarea::placeholder { color: ${c.textGhost}; }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: ${c.goldDim} !important;
          box-shadow: 0 0 0 1px rgba(196, 163, 90, 0.08);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.borderSubtle}; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: ${c.borderLight}; }
        @media (max-width: 768px) {
          .dashboard-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dashboard-content-area { padding: ${sp[3]} ${sp[2]} !important; }
          .dashboard-orders-grid { grid-template-columns: 1fr !important; }
          .dashboard-services-grid { grid-template-columns: 1fr !important; }
          .dashboard-2col { grid-template-columns: 1fr !important; }
          .dashboard-detail-info { grid-template-columns: 1fr 1fr !important; }
          .dashboard-modal-inner {
            max-width: 100% !important; width: 100% !important;
            border-radius: 0 !important; min-height: 100vh !important;
            padding: ${sp[4]} ${sp[3]} !important;
          }
          .dashboard-modal-overlay {
            align-items: flex-start !important;
          }
        }
        @media (max-width: 480px) {
          .dashboard-metrics-grid { grid-template-columns: 1fr !important; }
          .dashboard-detail-info { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ─── MOBILE BACKDROP ─── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.7)',
            zIndex: 49, backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* ─── SIDEBAR — cinematic noir ─── */}
      <div style={{
        width: isMobile ? 260 : (sidebarOpen ? 220 : 0),
        background: gradient.sidebar,
        borderRight: `1px solid ${c.border}`,
        overflow: 'hidden',
        transition: isMobile ? `transform 0.35s ${ease.luxury}` : `width 0.4s ${ease.luxury}`,
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        height: isMobile ? '100vh' : undefined,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : undefined,
        zIndex: isMobile ? 50 : 10,
        flexShrink: 0,
        boxShadow: isMobile && sidebarOpen ? '8px 0 32px rgba(6, 5, 4, 0.5)' : '4px 0 16px rgba(6, 5, 4, 0.25)',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: `${sp[4]} ${sp[3]} ${sp[3]}`,
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1.5] }}>
            <DragonMark s={20} />
            <div style={{ fontFamily: f.mono, fontSize: '11px', fontWeight: 600, color: c.red, letterSpacing: '0.14em' }}>
              CARAXES
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: `${sp[1]} ${sp[2]}`, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px', position: 'relative', zIndex: 2 }}>
          {[
            { key: 'overview', label: t('nav.overview'), icon: icons.home },
            { key: 'orders', label: t('nav.orders'), icon: icons.folder },
            { key: 'catalogue', label: t('nav.catalog'), icon: icons.file, feature: 'catalogue' },
            { key: 'expedition', label: t('nav.shipping'), icon: icons.upload, feature: 'expedition' },
            { key: 'stock', label: t('nav.stock'), icon: icons.folder, feature: 'stock' },
            { key: 'services', label: t('nav.services'), icon: icons.trending },
            { key: 'formation', label: t('nav.formation'), icon: icons.doc, feature: 'formation' },
          ].filter(({ feature }) => {
            if (!feature) return true
            const features = profile?.features || {}
            return features[feature] !== false
          }).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setViewMode(key); setSelectedOrderId(null); if (isMobile) setSidebarOpen(false) }}
              style={{
                padding: `9px ${sp[2]}`,
                background: viewMode === key ? c.bgSurface : 'transparent',
                border: 'none',
                borderRadius: radius.xs,
                color: viewMode === key ? c.text : c.textTertiary,
                fontFamily: f.body,
                fontSize: size.sm,
                fontWeight: viewMode === key ? 600 : 400,
                cursor: 'pointer',
                transition: `all 0.25s ${ease.luxury}`,
                display: 'flex',
                alignItems: 'center',
                gap: sp[1.5],
                position: 'relative',
                textAlign: 'left',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => { if (viewMode !== key) e.currentTarget.style.color = c.textSecondary }}
              onMouseLeave={(e) => { if (viewMode !== key) e.currentTarget.style.color = c.textTertiary }}>
              {viewMode === key && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '2px', height: 16, background: c.gold, borderRadius: radius.pill, boxShadow: `0 0 8px rgba(196, 163, 90, 0.25)` }} />}
              <Icon d={icon} size={16} color={viewMode === key ? c.gold : 'currentColor'} sw={viewMode === key ? 1.8 : 1.3} />
              {label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: `${sp[2]} ${sp[2]}`, borderTop: `1px solid ${c.borderSubtle}`, position: 'relative', zIndex: 2 }}>
          <button onClick={() => navigate('/settings')} style={{
            width: '100%',
            padding: `8px ${sp[2]}`,
            background: 'transparent',
            border: 'none',
            borderRadius: radius.xs,
            color: c.textTertiary,
            cursor: 'pointer',
            fontFamily: f.body,
            fontSize: size.xs,
            transition: `color 0.2s ${ease.luxury}`,
            display: 'flex',
            alignItems: 'center',
            gap: sp[1.5],
            textAlign: 'left',
            marginBottom: '4px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = c.textSecondary}
          onMouseLeave={(e) => e.currentTarget.style.color = c.textTertiary}>
            <Icon d={icons.settings} size={15} color="currentColor" />
            Paramètres
          </button>
          <button onClick={onSignOut} style={{
            width: '100%',
            padding: `8px ${sp[2]}`,
            background: 'transparent',
            border: 'none',
            borderRadius: radius.xs,
            color: c.textTertiary,
            cursor: 'pointer',
            fontFamily: f.body,
            fontSize: size.xs,
            transition: `color 0.2s ${ease.luxury}`,
            display: 'flex',
            alignItems: 'center',
            gap: sp[1.5],
            textAlign: 'left',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = c.red}
          onMouseLeave={(e) => e.currentTarget.style.color = c.textTertiary}>
            <Icon d={icons.logout} size={15} color="currentColor" />
            {t('dashboard.signOut')}
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* HEADER — cinematic depth */}
        <div style={{
          background: c.bgSurface,
          borderBottom: `1px solid ${c.border}`,
          padding: isMobile ? `0 ${sp[2]}` : `0 ${sp[4]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 5,
          height: 52,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(6, 5, 4, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'none',
              border: 'none',
              color: c.textTertiary,
              cursor: 'pointer',
              padding: sp[0.5],
              borderRadius: radius.xs,
              transition: `color 0.2s ${ease.luxury}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = c.textSecondary}
            onMouseLeave={(e) => e.currentTarget.style.color = c.textTertiary}>
              <Icon d={icons.menu} size={18} />
            </button>

            <div style={{ fontFamily: f.body, fontSize: size.sm, fontWeight: 500, color: c.text, letterSpacing: '0.01em' }}>
              {profile?.full_name ? `${profile.full_name.split(' ')[0]}` : 'Dashboard'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: isMobile ? sp[1] : sp[2], alignItems: 'center' }}>
            {!isMobile && <LocaleAndPwaControls compact />}

            {!isMobile && activeOrders.length > 0 && (
              <span style={{
                padding: `3px 8px`, borderRadius: radius.xs,
                background: c.redSoft, color: c.red,
                fontSize: '9px', fontWeight: 600, fontFamily: f.mono, letterSpacing: '0.06em',
              }}>
                {activeOrders.length} en cours
              </span>
            )}

            <button onClick={() => setIsNewOrderOpen(true)} style={{
              padding: isMobile ? '6px 10px' : `6px 14px`,
              background: 'transparent',
              border: `1px solid ${c.borderLight}`,
              borderRadius: radius.xs,
              color: c.text,
              fontFamily: f.body,
              fontSize: size.xs,
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: `all 0.25s ${ease.luxury}`,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.borderLight; e.currentTarget.style.color = c.text }}>
              <Icon d={icons.plus} size={13} color="currentColor" sw={1.8} />
              {!isMobile && t('dashboard.newOrder')}
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="dashboard-content-area" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? `${sp[3]} ${sp[2]}` : `${sp[4]} ${sp[5]}`, position: 'relative', zIndex: 1 }}>
          {viewMode === 'overview' ? (
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              {/* Hero welcome — editorial */}
              <AnimCard delay={0}>
                <SectionBanner
                  title={profile?.full_name ? `Bonjour, ${profile.full_name.split(' ')[0]}` : 'Bienvenue'}
                  subtitle="TABLEAU DE BORD"
                  accentColor={c.gold}
                />
              </AnimCard>

              {/* Metric Row — cinematic depth */}
              <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1px', marginBottom: sp[6], background: c.borderSubtle, borderRadius: radius.md, overflow: 'hidden', boxShadow: shadow.sm }}>
                {[
                  { label: t('dashboard.activeOrders'), value: activeOrders.length, accent: c.red },
                  { label: t('dashboard.shipments'), value: shipments.length, accent: c.teal },
                  { label: t('dashboard.activeServices'), value: ecomServices.length, accent: c.purple },
                  { label: t('nav.formation'), value: formationServices.length > 0 ? t('dashboard.active') : '\u2014', accent: c.gold },
                ].map(({ label, value, accent }, idx) => (
                  <AnimCard key={label} delay={idx * 60}>
                    <div style={{ padding: `${sp[3]} ${sp[3]}`, background: c.bg }}>
                      <div style={{ fontSize: size['2xl'], fontWeight: 700, color: accent, fontFamily: f.display, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: sp[1] }}>{value}</div>
                      <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                  </AnimCard>
                ))}
              </div>

              {/* Économies cumulées — ROI widget */}
              {deliveredOrders.length > 0 && (
                <AnimCard delay={300}>
                  <div style={{
                    marginBottom: sp[6], padding: `${sp[4]} ${sp[5]}`,
                    background: `linear-gradient(160deg, ${c.bgCard} 0%, ${c.bg} 100%)`, border: `1px solid ${c.borderGold}`,
                    borderRadius: radius.md, position: 'relative', overflow: 'hidden',
                    boxShadow: `${shadow.md}, ${shadow.gold}`,
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, ${c.gold}, ${c.red})`,
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: sp[3] }}>
                      <div>
                        <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldDim, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: sp[1], fontWeight: 600 }}>
                          Économies cumulées avec CARAXES
                        </div>
                        <div style={{ fontFamily: f.display, fontSize: size['3xl'], fontWeight: 700, color: c.gold, letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {(() => {
                            const totalBudget = deliveredOrders.reduce((sum, o) => sum + (typeof o.budget === 'number' ? o.budget : parseFloat(String(o.budget || '0').replace(/[^\d.]/g, '')) || 0), 0)
                            const savings = Math.round(totalBudget * 0.35)
                            return savings > 0 ? savings.toLocaleString('fr-FR') + '\u00A0€' : '—'
                          })()}
                        </div>
                        <div style={{ fontFamily: f.body, fontSize: size.xs, color: c.textTertiary, marginTop: sp[1] }}>
                          ~35% d'économie moyenne vs achat direct
                        </div>
                        <div style={{ fontFamily: f.body, fontSize: '10px', color: c.textTertiary, marginTop: sp[0.5], fontStyle: 'italic', opacity: 0.75 }}>
                          Moyenne mesurée sur 12 mois d'opérations CARAXES, vs prix Alibaba/AliExpress pour la même catégorie.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: sp[4], flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>
                            {deliveredOrders.length}
                          </div>
                          <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Commandes livrées</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.green, letterSpacing: '-0.02em' }}>
                            100%
                          </div>
                          <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Conformité qualité</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimCard>
              )}

              {/* Active Services Summary */}
              {ecomServices.length > 0 && (
                <div style={{ marginBottom: sp[6] }}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: sp[3], fontWeight: 600 }}>Services actifs</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[2] }}>
                    {ecomServices.slice(0, 3).map((svc, idx) => {
                      const svcType = SERVICE_TYPES[svc.service_type] || SERVICE_TYPES.creation
                      const currentStep = Math.max(0, svcType.steps.findIndex(s => s.key === svc.status))
                      const progress = Math.round(((currentStep + 1) / svcType.steps.length) * 100)
                      return (
                        <AnimCard key={svc.id} delay={idx * 70}>
                          <GlassCard onClick={() => setViewMode('services')} goldTop={false} style={{ cursor: 'pointer', borderLeft: `2px solid ${svcType.color}`, padding: sp[3] }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1.5], marginBottom: sp[2] }}>
                              <span style={{ fontSize: size.base }}>{svcType.icon}</span>
                              <div>
                                <div style={{ fontFamily: f.body, fontSize: size.sm, fontWeight: 600, color: c.text }}>{svcType.label}</div>
                                <div style={{ fontSize: size.xs, color: c.textTertiary }}>{svc.shop_name || svc.pack || '\u2014'}</div>
                              </div>
                            </div>
                            <div style={{ height: 2, background: c.bgSurface, borderRadius: radius.pill, marginBottom: sp[1], overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${progress}%`, background: svcType.color, transition: 'width 0.5s ease', borderRadius: radius.pill }} />
                            </div>
                            <div style={{ fontSize: '9px', color: svcType.color, fontFamily: f.mono, fontWeight: 600, letterSpacing: '0.06em' }}>
                              {svcType.steps[currentStep]?.label || 'En cours'}
                            </div>
                          </GlassCard>
                        </AnimCard>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {orders.length > 0 && (
                <div style={{ marginBottom: sp[6] }}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: sp[3], fontWeight: 600 }}>Commandes récentes</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[2] }}>
                    {orders.slice(0, 6).map((order, idx) => (
                      <AnimCard key={order.id} delay={idx * 50}>
                        <div onClick={() => { setSelectedOrderId(order.id); setViewMode('orders') }}>
                          <OrderCardGrid order={order} selected={false} onClick={() => {}} unreadCount={unreadCounts[order.id] || 0} />
                        </div>
                      </AnimCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions — editorial row */}
              <div style={{ display: 'flex', gap: sp[2], flexWrap: 'wrap', marginBottom: sp[6] }}>
                {[
                  { label: t('dashboard.addOrder'), action: () => setIsNewOrderOpen(true), accent: c.red },
                  { label: t('dashboard.viewCatalog'), action: () => setViewMode('catalogue'), accent: c.gold },
                  { label: t('dashboard.createShop'), action: () => { setIsEcomSiteCreationOpen(true); setEcomStep(1) }, accent: c.teal },
                  { label: t('dashboard.viewFormation'), action: () => setViewMode('formation'), accent: c.purple },
                ].map(({ label, action, accent }, idx) => (
                  <AnimCard key={label} delay={idx * 50}>
                    <button onClick={action} style={{
                      padding: `${sp[1.5]} ${sp[3]}`,
                      background: 'transparent',
                      border: `1px solid ${c.borderSubtle}`,
                      borderRadius: radius.xs,
                      color: c.textSecondary,
                      fontFamily: f.body,
                      fontSize: size.xs,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: `all 0.3s ${ease.luxury}`,
                      textAlign: 'left',
                      letterSpacing: '0.02em',
                    }} onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = accent
                      e.currentTarget.style.color = accent
                    }} onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = c.borderSubtle
                      e.currentTarget.style.color = c.textSecondary
                    }}>
                      {label}
                    </button>
                  </AnimCard>
                ))}
              </div>

              {/* WhatsApp Contact — subtle */}
              <AnimCard delay={180}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: sp[2],
                  padding: `${sp[2]} 0`,
                  borderTop: `1px solid ${c.borderSubtle}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: size.xs, color: c.textTertiary }}>
                      Une question ? <a href="https://wa.me/message/CARAXES" target="_blank" rel="noopener noreferrer" style={{ color: c.textSecondary, textDecoration: 'underline', textUnderlineOffset: '3px' }}>Contactez votre agent CARAXES sur WhatsApp</a>
                    </div>
                  </div>
                </div>
              </AnimCard>
            </div>
          ) : viewMode === 'orders' ? (
            <div className="dashboard-orders-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: sp[4], maxWidth: 1300, margin: '0 auto' }}>
              {/* Orders List */}
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: sp[1.5], marginBottom: sp[3] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Commandes</h2>
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.06em' }}>{orders.length}</span>
                </div>
                {orders.length === 0 ? (
                  <DragonEmptyState text="Aucune commande" sub="Créez votre première commande" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3] }}>
                    {orders.map((order, idx) => (
                      <AnimCard key={order.id} delay={idx * 50}>
                        <div onClick={() => setSelectedOrderId(order.id)}>
                          <OrderCardGrid order={order} selected={selectedOrderId === order.id} onClick={() => setSelectedOrderId(order.id)} unreadCount={unreadCounts[order.id] || 0} />
                        </div>
                      </AnimCard>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Detail Panel — fullscreen modal on mobile */}
              {isMobile && selectedOrderId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.7)', zIndex: 100, backdropFilter: 'blur(2px)' }} onClick={() => setSelectedOrderId(null)} />
              )}
              <GlassCard hoverLift={false} goldTop={true} style={{
                padding: sp[3],
                maxHeight: isMobile ? '85vh' : 'calc(100vh - 260px)',
                overflowY: 'auto',
                position: isMobile ? 'fixed' : 'sticky',
                top: isMobile ? 'auto' : 0,
                bottom: isMobile ? 0 : undefined,
                left: isMobile ? 0 : undefined,
                right: isMobile ? 0 : undefined,
                borderRadius: isMobile ? `${radius.lg} ${radius.lg} 0 0` : radius.lg,
                zIndex: isMobile ? 101 : undefined,
                transform: isMobile && !selectedOrderId ? 'translateY(100%)' : 'translateY(0)',
                transition: `transform 0.35s ${ease.luxury}`,
                display: isMobile && !selectedOrderId ? 'none' : undefined,
              }}>
                {/* Mobile close handle */}
                {isMobile && selectedOrderId && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: sp[2] }}>
                    <div onClick={() => setSelectedOrderId(null)} style={{ width: 40, height: 4, background: c.borderLight, borderRadius: radius.pill, cursor: 'pointer' }} />
                  </div>
                )}
                {!selectedOrder ? (
                  <DragonEmptyState text="Sélectionnez une commande" sub="pour voir les détails, messages et documents" />
                ) : (
                  <>
                    {isMobile && (
                      <button onClick={() => setSelectedOrderId(null)} style={{
                        position: 'absolute', top: sp[2], right: sp[2], background: 'none', border: 'none',
                        color: c.textTertiary, cursor: 'pointer', padding: sp[0.5], zIndex: 2,
                      }}><Icon d={icons.close} size={18} /></button>
                    )}
                    <div style={{ marginBottom: sp[3] }}>
                      <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.goldDim, marginBottom: sp[1], letterSpacing: '0.1em', fontWeight: 600 }}>{selectedOrder.ref}</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text, margin: `0 0 ${sp[2]}` }}>{selectedOrder.product}</h3>
                      <StatusPill status={selectedOrder.status} />
                    </div>

                    {/* Timeline d'avancement */}
                    <div style={{ marginBottom: sp[3] }}>
                      <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[1] }}>Avancement</div>
                      <div style={{ overflowX: 'auto', paddingBottom: '26px' }}>
                        <div style={{ minWidth: 380 }}>
                          <PipelineStepper currentStatus={selectedOrder.status} />
                        </div>
                      </div>
                    </div>

                    {/* PDF Download */}
                    <button
                      onClick={async () => {
                        try {
                          await exportOrderToPDF(selectedOrder, profile)
                        } catch (err) {
                          console.error('PDF export failed:', err)
                          alert('Impossible de générer le PDF — vérifie ta connexion.')
                        }
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: `8px ${sp[3]}`, marginBottom: sp[3],
                        background: 'transparent',
                        border: `1px solid ${c.gold}33`,
                        color: c.gold,
                        fontFamily: f.mono, fontSize: '10px', fontWeight: 600,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: `all 0.2s ${ease.smooth}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = `${c.gold}08` }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.gold}33`; e.currentTarget.style.background = 'transparent' }}
                    >
                      <Icon d={icons.download} size={12} color={c.gold} />
                      Télécharger en PDF
                    </button>

                    <ArtDecoDivider />

                    {/* Info */}
                    <div className="dashboard-detail-info" style={{ marginTop: sp[3], marginBottom: sp[3], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                      <div style={{ padding: sp[2], background: c.bgInput, borderRadius: radius.lg }}>
                        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[0.5] }}>QUANTITE</div>
                        <div style={{ fontSize: size.md, fontWeight: 600, color: c.text }}>{fmtQty(selectedOrder.quantity)}</div>
                      </div>
                      <div style={{ padding: sp[2], background: c.bgInput, borderRadius: radius.lg }}>
                        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[0.5] }}>BUDGET</div>
                        <div style={{ fontSize: size.md, fontWeight: 600, color: c.gold }}>{selectedOrder.budget || '–'}</div>
                      </div>
                    </div>

                    {selectedOrder.description && (
                      <div style={{ marginBottom: sp[3], padding: sp[3], background: c.bgInput, borderRadius: radius.lg, fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6 }}>
                        {selectedOrder.description}
                      </div>
                    )}

                    <ArtDecoDivider />

                    {/* Messages */}
                    <div style={{ marginTop: sp[3], marginBottom: sp[3] }}>
                      <h4 style={{ fontFamily: f.display, fontSize: size.base, color: c.text, marginBottom: sp[2], fontWeight: 600 }}>Messages</h4>
                      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: sp[2], paddingRight: sp[1] }}>
                        {messages.length === 0 ? (
                          <p style={{ fontSize: size.sm, color: c.textTertiary, textAlign: 'center', padding: sp[4] }}>Aucun message</p>
                        ) : (
                          messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)
                        )}
                      </div>
                      {/* Clean bottom-border input style */}
                      <div style={{
                        display: 'flex', gap: sp[1], alignItems: 'center',
                        borderTop: `1px solid ${c.borderSubtle}`,
                        paddingTop: sp[2],
                      }}>
                        <input
                          type="text"
                          placeholder="Votre message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          style={{
                            flex: 1,
                            padding: `10px 0`,
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `1px solid ${c.borderSubtle}`,
                            color: c.text,
                            fontSize: size.sm,
                            fontFamily: f.body,
                            outline: 'none',
                            transition: transition.fast,
                          }}
                        />
                        <button onClick={handleSendMessage} style={{
                          width: 40, height: 40,
                          background: c.gold,
                          border: 'none',
                          borderRadius: radius.lg,
                          color: c.black,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: transition.fast,
                          flexShrink: 0,
                        }}>
                          <Icon d={icons.send} size={16} color={c.black} />
                        </button>
                      </div>
                    </div>

                    {/* Documents */}
                    {documents.length > 0 && (
                      <div>
                        <h4 style={{ fontFamily: f.display, fontSize: size.base, color: c.text, marginBottom: sp[2], fontWeight: 600 }}>Certificats & Conformité</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1.5] }}>
                          {documents.map(doc => (
                            <DocumentCard key={doc.id} doc={doc} onDownload={() => handleDownloadDocument(doc)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </GlassCard>
            </div>
          ) : viewMode === 'catalogue' ? (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <AnimCard delay={0}>
                <SectionBanner
                  title="Catalogue produits"
                  subtitle="SOURCING"
                  accentColor={c.gold}
                />
              </AnimCard>
              {catalog.map((cat, idx) => (
                <AnimCard key={cat.id} delay={idx * 80}>
                  <div style={{ marginBottom: sp[5] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[3] }}>
                      <span style={{ fontSize: size.xl }}>{cat.icon}</span>
                      <div>
                        <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>{cat.name}</h3>
                        <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `4px 0 0` }}>{cat.description}</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3], marginBottom: sp[3] }}>
                      {cat.topProducts.map(prod => (
                        <GlassCard key={prod} style={{ padding: sp[3] }}>
                          <p style={{ fontSize: size.sm, color: c.text, fontWeight: 600, margin: 0, marginBottom: sp[1] }}>{prod}</p>
                          <p style={{ fontSize: size.xs, color: c.textSecondary, margin: 0 }}>Prix: {cat.priceRange} | MOQ: {cat.moq}</p>
                        </GlassCard>
                      ))}
                    </div>
                    <ArtDecoDivider />
                  </div>
                </AnimCard>
              ))}
            </div>
          ) : viewMode === 'formation' ? (() => {
            const hasCreation = ecomServices.some(s => s.service_type === 'creation')
            const formationTabs = [
              { key: 'mastery', label: 'E-Commerce Mastery', sub: 'GRATUIT — 8 modules complets', accent: c.purple, badge: 'OFFERT' },
              { key: 'tools', label: 'Outils Interactifs', sub: 'GRATUIT — 5 outils pratiques', accent: c.teal, badge: 'OFFERT' },
              ...(hasCreation ? [{ key: 'complete', label: 'Formation Complète 20h', sub: 'Incluse avec votre offre Création', accent: c.gold, badge: 'BONUS' }] : []),
              { key: 'express', label: 'Prise en main Dashboard', sub: 'Guide rapide (2H)', accent: c.textSecondary },
            ]
            return (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <AnimCard delay={0}>
                <SectionBanner
                  title="Centre de Formation"
                  subtitle="FORMATION GRATUITE"
                  accentColor={c.purple}
                />
              </AnimCard>

              {/* Free banner */}
              <AnimCard delay={80}>
                <GlassCard style={{
                  marginBottom: sp[4],
                  display: 'flex', alignItems: 'center', gap: sp[3],
                  borderLeft: `3px solid ${c.purple}`,
                }}>
                  <div style={{ width: 48, height: 48, background: `${c.purple}15`, borderRadius: radius.lg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>&#127891;</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text }}>Formation 100% gratuite</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.6 }}>
                      8 modules complets + 5 outils interactifs pour lancer votre business e-commerce.
                      {!hasCreation && <span style={{ color: c.gold }}> Passez à l'offre Création (1 490\u20AC) pour débloquer la formation complète 20h + votre boutique clé en main.</span>}
                      {hasCreation && <span style={{ color: c.gold }}> Vous avez accès à la formation complète 20h en bonus avec votre offre Création.</span>}
                    </div>
                  </div>
                </GlassCard>
              </AnimCard>

              {/* Formation Switcher */}
              <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[4], flexWrap: 'wrap' }}>
                {formationTabs.map(({ key, label, sub, accent, badge }, idx) => (
                  <AnimCard key={key} delay={120 + idx * 60} style={{ flex: '1 1 200px' }}>
                    <button onClick={() => { setFormationMode(key); setActiveLesson(null) }} style={{
                      width: '100%',
                      padding: `${sp[2]} ${sp[3]}`, background: formationMode === key ? `${accent}10` : gradient.card,
                      border: `1px solid ${formationMode === key ? accent : c.borderSubtle}`,
                      borderRadius: radius.xl,
                      cursor: 'pointer', textAlign: 'left', transition: `all 0.3s ${ease.out}`,
                      position: 'relative',
                      boxShadow: formationMode === key ? `0 0 16px ${accent}12` : shadow.card,
                    }} onMouseEnter={(e) => { if (formationMode !== key) e.currentTarget.style.borderColor = accent }}
                       onMouseLeave={(e) => { if (formationMode !== key) e.currentTarget.style.borderColor = c.borderSubtle }}>
                      {badge && <span style={{ position: 'absolute', top: -8, right: 10, padding: '2px 8px', background: badge === 'OFFERT' ? c.green : c.gold, color: '#fff', fontSize: '8px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.08em', borderRadius: radius.sm }}>{badge}</span>}
                      <div style={{ fontSize: size.sm, color: formationMode === key ? accent : c.text, fontWeight: 700, fontFamily: f.display }}>{label}</div>
                      <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: '4px' }}>{sub}</div>
                    </button>
                  </AnimCard>
                ))}
              </div>

              {/* CTA Création si pas encore client */}
              {!hasCreation && formationMode === 'mastery' && (
                <AnimCard delay={200}>
                  <GlassCard style={{
                    marginBottom: sp[4],
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: sp[2],
                    borderLeft: `3px solid ${c.gold}`,
                  }}>
                    <div>
                      <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold }}>Passez au niveau supérieur</div>
                      <div style={{ fontSize: size.xs, color: c.textSecondary }}>Création boutique complète + Formation 20h approfondie pour 1 490\u20AC</div>
                    </div>
                    <a href="https://buy.stripe.com/28EeV66yS6HZ3H92cjfEk00" target="_blank" rel="noopener noreferrer" style={{
                      ...btnPrimary, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                      OFFRE CREATION — 1 490\u20AC
                    </a>
                  </GlassCard>
                </AnimCard>
              )}

              {/* Tools View */}
              {formationMode === 'tools' ? (
                <div>
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginBottom: sp[3] }}>
                    Outils interactifs inclus avec la formation — utilisez-les pour piloter votre business.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {FORMATION_TOOLS.map((tool, idx) => (
                      <AnimCard key={tool.id} delay={idx * 60}>
                        <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'block', textDecoration: 'none',
                        }}>
                          <GlassCard style={{ borderTop: `2px solid ${tool.color}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                              <div style={{ width: 36, height: 36, background: `${tool.color}12`, borderRadius: radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size.lg, color: tool.color, fontWeight: 700 }}>
                                {tool.icon}
                              </div>
                              <div>
                                <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text }}>{tool.title}</div>
                              </div>
                            </div>
                            <p style={{ fontSize: size.xs, color: c.textSecondary, margin: 0, lineHeight: 1.6 }}>{tool.description}</p>
                            <div style={{ marginTop: sp[2], fontSize: '10px', color: tool.color, fontFamily: f.mono, fontWeight: 600, letterSpacing: '0.08em' }}>
                              OUVRIR L'OUTIL \u2192
                            </div>
                          </GlassCard>
                        </a>
                      </AnimCard>
                    ))}
                  </div>
                </div>
              ) : (() => {
                const currentFormation = formationMode === 'complete' ? FORMATION_INTERNE : formationMode === 'express' ? FORMATION_CLIENT : FORMATION_ECOMMERCE
                return activeLesson ? (() => {
                  const lesson = currentFormation.modules.flatMap(m => m.lessons).find(l => l.id === activeLesson)
                  const parentModule = currentFormation.modules.find(m => m.lessons.some(l => l.id === activeLesson))
                  if (!lesson) return null
                  const linkedTool = lesson.tool ? FORMATION_TOOLS.find(t => t.id === lesson.tool) : null
                  return (
                    <AnimCard delay={0}>
                      <button onClick={() => setActiveLesson(null)} style={{
                        background: 'none', border: 'none', color: c.textSecondary,
                        fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer',
                        marginBottom: sp[3], display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
                      }}>
                        <Icon d={icons.back} size={14} /> Retour aux modules
                      </button>
                      <GlassCard hoverLift={false} style={{ borderRadius: radius['2xl'] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '10px', color: parentModule?.color || c.gold, marginBottom: sp[1], letterSpacing: '0.1em', fontWeight: 600 }}>
                          {parentModule?.icon} {parentModule?.title}
                        </div>
                        <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, margin: `0 0 ${sp[1]}` }}>{lesson.title}</h2>
                        <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `0 0 ${sp[3]}`, fontFamily: f.mono }}>Durée: {lesson.duration}</p>
                        <div style={{ fontSize: size.sm, color: c.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{lesson.content}</div>

                        {linkedTool && (
                          <>
                            <ArtDecoDivider opacity={0.2} />
                            <div style={{ marginTop: sp[3], padding: sp[3], background: `${linkedTool.color}06`, border: `1px solid ${linkedTool.color}20`, borderRadius: radius.lg }}>
                              <div style={{ fontSize: '10px', color: linkedTool.color, fontFamily: f.mono, fontWeight: 600, letterSpacing: '0.08em', marginBottom: sp[1] }}>OUTIL PRATIQUE</div>
                              <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text, marginBottom: sp[1] }}>{linkedTool.title}</div>
                              <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `0 0 ${sp[2]}` }}>{linkedTool.description}</p>
                              <a href={linkedTool.url} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-block', padding: `8px ${sp[3]}`, background: linkedTool.color,
                                color: '#fff', textDecoration: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 600,
                                borderRadius: radius.lg,
                              }}>
                                Ouvrir l'outil
                              </a>
                            </div>
                          </>
                        )}

                        <ArtDecoDivider opacity={0.15} />
                        <div style={{ marginTop: sp[3], display: 'flex', gap: sp[2] }}>
                          <a href={`mailto:zinedine@caraxes.fr?subject=Question sur ${lesson.title}`} style={{
                            padding: `10px ${sp[3]}`, background: c.red, color: '#fff', textDecoration: 'none',
                            fontFamily: f.body, fontSize: size.sm, fontWeight: 600, borderRadius: radius.lg,
                          }}>
                            Poser une question
                          </a>
                          <a href="https://wa.me/message/CARAXES" target="_blank" rel="noopener noreferrer" style={{
                            padding: `10px ${sp[3]}`, background: '#25D366', color: '#fff', textDecoration: 'none',
                            fontFamily: f.body, fontSize: size.sm, fontWeight: 600, borderRadius: radius.lg,
                          }}>
                            WhatsApp
                          </a>
                        </div>
                      </GlassCard>
                    </AnimCard>
                  )
                })() : (
                  <>
                    <p style={{ fontSize: size.sm, color: c.textSecondary, marginBottom: sp[3] }}>
                      {currentFormation.subtitle} — <span style={{ color: c.gold, fontFamily: f.mono }}>{currentFormation.duration}</span>
                    </p>
                    <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[3] }}>
                      <a href="/programme-formation-caraxes.pdf" download target="_blank" style={{
                        padding: `10px ${sp[3]}`, background: c.red, color: '#fff', textDecoration: 'none',
                        fontFamily: f.body, fontSize: size.sm, fontWeight: 600, borderRadius: radius.lg,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <Icon d={icons.download} size={14} color="#fff" /> Programme PDF
                      </a>
                      <button onClick={() => setFormationMode('tools')} style={{
                        padding: `10px ${sp[3]}`, background: c.teal, color: '#fff', border: 'none',
                        fontFamily: f.body, fontSize: size.sm, fontWeight: 600, cursor: 'pointer',
                        borderRadius: radius.lg,
                      }}>
                        Outils interactifs
                      </button>
                    </div>
                    {currentFormation.modules.map((module, modIdx) => (
                      <AnimCard key={module.id} delay={modIdx * 50}>
                        <GlassCard hoverLift={false} goldTop={false} style={{
                          marginBottom: sp[3],
                          overflow: 'hidden', borderLeft: `3px solid ${module.color || c.gold}`,
                          padding: 0,
                        }}>
                          <button onClick={() => toggleModule(module.id)} style={{
                            width: '100%', padding: sp[3], background: 'transparent', border: 'none',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', transition: `all 0.2s ${ease.luxury}`,
                            borderRadius: `${radius.xl} ${radius.xl} 0 0`,
                          }} onMouseEnter={(e) => e.currentTarget.style.background = c.bgHover}
                             onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <div>
                              <div style={{ fontFamily: f.mono, fontSize: '10px', color: module.color || c.gold, marginBottom: sp[1], letterSpacing: '0.1em', fontWeight: 600 }}>
                                {module.icon} MODULE {String(modIdx + 1).padStart(2, '0')} — {module.title.toUpperCase()}
                              </div>
                              <p style={{ fontSize: size.xs, color: c.textSecondary, margin: 0 }}>{module.lessons.length} leçons \u2022 {module.duration}</p>
                            </div>
                            <Icon d={expandedModules[module.id] ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7 7 7'} size={16} color={module.color || c.gold} />
                          </button>

                          {expandedModules[module.id] && (
                            <div style={{ borderTop: `1px solid ${c.borderSubtle}`, padding: sp[3] }}>
                              {module.lessons.map(lesson => {
                                const hasTool = lesson.tool ? FORMATION_TOOLS.find(t => t.id === lesson.tool) : null
                                return (
                                  <button key={lesson.id} onClick={() => setActiveLesson(lesson.id)} style={{
                                    width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgInput, border: 'none',
                                    borderRadius: radius.lg,
                                    cursor: 'pointer', textAlign: 'left', marginBottom: sp[1],
                                    transition: `all 0.2s ${ease.luxury}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  }} onMouseEnter={(e) => { e.currentTarget.style.background = c.bgHover; e.currentTarget.style.borderLeft = `2px solid ${c.gold}` }}
                                     onMouseLeave={(e) => { e.currentTarget.style.background = c.bgInput; e.currentTarget.style.borderLeft = 'none' }}>
                                    <div style={{ textAlign: 'left' }}>
                                      <p style={{ fontSize: size.sm, color: c.text, margin: 0, fontWeight: 500 }}>{lesson.title}</p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginTop: '4px' }}>
                                        <span style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>{lesson.duration}</span>
                                        {hasTool && <span style={{ fontSize: '9px', color: hasTool.color, fontFamily: f.mono, fontWeight: 700, padding: '2px 8px', background: `${hasTool.color}10`, letterSpacing: '0.06em', borderRadius: radius.sm }}>OUTIL</span>}
                                      </div>
                                    </div>
                                    <Icon d="M9 5l7 7-7 7" size={14} color={c.textSecondary} />
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </GlassCard>
                      </AnimCard>
                    ))}
                  </>
                )
              })()}
            </div>
          )})()
          : viewMode === 'expedition' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <AnimCard delay={0}>
                <SectionBanner
                  title="Suivi des expéditions"
                  subtitle="LOGISTIQUE"
                  accentColor={c.teal}
                />
              </AnimCard>
              <AnimCard delay={40}>
                {(() => {
                  const activeShip = shipments.find(x => shipStatusKey(x.status) === 'transit') || shipments.find(x => shipStatusKey(x.status) !== 'livré') || null
                  const shipIdx = activeShip ? Math.max(0, SHIP_STATUSES.indexOf(shipStatusKey(activeShip.status))) : 3
                  const STEP_LABELS = ['Production', 'QC', 'Douanes', 'Transit', 'Livré']
                  return (
                    <GlassCard goldTop={false} style={{ borderTop: `2px solid ${c.gold}`, marginBottom: sp[3] }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
                        <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>◆ Couloir logistique</span>
                        {activeShip && <span style={{ fontFamily: f.mono, fontSize: size.xs, color: c.textSecondary }}>{(activeShip.origin || 'Yiwu')} → {(activeShip.destination || 'Le Havre')}</span>}
                      </div>
                      <svg viewBox="0 0 860 120" style={{ width: '100%', height: 'auto', display: 'block' }}>
                        <path d="M30 90 C250 20, 620 20, 830 50" fill="none" stroke={c.borderLight} strokeWidth="2" />
                        <path d="M30 90 C250 20, 620 20, 830 50" fill="none" stroke={c.gold} strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000"><animate attributeName="stroke-dashoffset" from="1000" to="0" dur="2.6s" begin="0.3s" fill="freeze" /></path>
                        <circle cx="30" cy="90" r="5" fill={c.text} />
                        <circle cx="830" cy="50" r="5" fill={c.gold} />
                        <circle r="6" fill={c.red}><animateMotion dur="2.6s" begin="0.3s" fill="freeze" path="M30 90 C250 20, 620 20, 830 50" /></circle>
                        <text x="24" y="112" fill={c.textTertiary} fontSize="11" fontFamily="monospace">{activeShip?.origin || 'Yiwu / Shenzhen'}</text>
                        <text x="730" y="40" fill={c.textTertiary} fontSize="11" fontFamily="monospace">{activeShip?.destination || 'Le Havre'}</text>
                      </svg>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: sp[2] }}>
                        {STEP_LABELS.map((lab, i) => (
                          <div key={lab} style={{ display: 'flex', alignItems: 'center', flex: i === STEP_LABELS.length - 1 ? '0 0 auto' : 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <div style={{ width: 12, height: 12, transform: 'rotate(45deg)', background: i <= shipIdx ? c.gold : 'transparent', border: `1.5px solid ${i <= shipIdx ? c.gold : c.border}`, boxShadow: i === shipIdx ? `0 0 0 4px ${c.goldGlow}` : 'none', transition: `all 0.4s ${ease.out}` }} />
                              <span style={{ fontFamily: f.mono, fontSize: '9px', letterSpacing: '0.04em', textTransform: 'uppercase', color: i <= shipIdx ? c.gold : c.textTertiary, fontWeight: i === shipIdx ? 700 : 400 }}>{lab}</span>
                            </div>
                            {i < STEP_LABELS.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 4px', marginBottom: '18px', background: i < shipIdx ? c.gold : c.border }} />}
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )
                })()}
              </AnimCard>
              {shipments.length === 0 ? (
                <DragonEmptyState text="Aucune expédition" sub="Vos envois apparaîtront ici" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                  {shipments.map((ship, idx) => {
                    const shipKey = shipStatusKey(ship.status)
                    const shipColorMap = { production: c.red, QC: c.amber, douanes: c.purple, transit: c.teal, 'livré': c.green }
                    const statusObj = { color: shipColorMap[shipKey] || c.teal, label: SHIP_LABELS[shipKey] || shipKey }
                    return (
                      <AnimCard key={ship.id} delay={idx * 50}>
                        <GlassCard goldTop={false} style={{ borderTop: `2px solid ${statusObj.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[2] }}>
                            <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.goldDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[1], fontWeight: 600 }}>
                              {ship.tracking_number || 'N/A'}
                            </div>
                            <span style={{ fontSize: size.xs, color: c.textTertiary }}>{fmtDate(ship.created_at)}</span>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', fontSize: size.xs, fontFamily: f.mono, fontWeight: 500, letterSpacing: '0.04em', background: statusObj.color + '18', color: statusObj.color, border: `1px solid ${statusObj.color}33`, whiteSpace: 'nowrap' }}><span style={{ width: 5, height: 5, background: statusObj.color, transform: 'rotate(45deg)', flexShrink: 0 }} />{statusObj.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], margin: `${sp[2]} 0`, fontSize: size.sm, color: c.textSecondary }}>
                            <span>{ship.origin || 'Yiwu'}</span>
                            <span style={{ color: c.goldDim }}>\u2192</span>
                            <span>{ship.destination || 'Destination'}</span>
                          </div>
                        </GlassCard>
                      </AnimCard>
                    )
                  })}
                </div>
              )}
            </div>
          ) : viewMode === 'stock' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <AnimCard delay={0}>
                <SectionBanner
                  title="Gestion de stock"
                  subtitle="INVENTAIRE"
                  accentColor={c.purple}
                />
              </AnimCard>
              {inventory.length === 0 ? (
                <DragonEmptyState text="Aucun stock" sub="Votre inventaire apparaîtra ici" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                  {inventory.map((item, idx) => {
                    const isLow = item.quantity < (item.alert_threshold ?? 10)
                    return (
                      <AnimCard key={item.id} delay={idx * 40}>
                        <GlassCard goldTop={false} hoverLift={true} style={{
                          borderLeft: isLow ? `3px solid ${c.red}` : `1px solid ${c.borderSubtle}`,
                          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: sp[3],
                        }}>
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 600, color: c.text, marginBottom: sp[1] }}>{item.product_name}</div>
                            <div style={{ fontSize: size.xs, color: c.textSecondary }}>Localisation: {item.location || 'Entrepôt'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: f.mono, fontSize: size.lg, fontWeight: 700, color: isLow ? c.red : c.gold }}>
                              {fmtQty(item.quantity)}
                            </div>
                            {isLow && <div style={{ fontSize: '10px', color: c.red, fontWeight: 600, padding: '2px 8px', background: c.redSoft, borderRadius: radius.pill, display: 'inline-block', marginTop: sp[0.5] }}>BAS</div>}
                          </div>
                        </GlassCard>
                      </AnimCard>
                    )
                  })}
                </div>
              )}
            </div>
          ) : viewMode === 'services' ? (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <AnimCard delay={0}>
                <SectionBanner
                  title="E-commerce & Services"
                  subtitle="OFFRE COMPLETE"
                  accentColor={c.teal}
                />
              </AnimCard>

              {/* ─── CATALOGUE DE SERVICES ─── */}
              <div style={{ marginBottom: sp[5] }}>
                <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600, letterSpacing: '-0.01em' }}>Nos services</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: sp[3] }}>
                  {/* Création Boutique */}
                  <AnimCard delay={80}>
                    <button onClick={() => { setIsEcomSiteCreationOpen(true); setEcomStep(1) }} style={{
                      width: '100%',
                      background: gradient.card, border: `2px solid ${c.teal}`, borderRadius: radius.lg, padding: sp[4],
                      cursor: 'pointer', textAlign: 'center', transition: `all 0.3s ${ease.out}`,
                      position: 'relative', fontFamily: f.body, color: c.text, boxShadow: shadow.card,
                    }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = shadow.cardHover }}
                       onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.teal; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadow.card }}>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>&#127978;</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Création Boutique</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Shopify, WooCommerce, PrestaShop</p>
                      <p style={{ fontSize: size.lg, color: c.gold, fontFamily: f.display, fontWeight: 700, margin: `${sp[2]} 0 0` }}>1 490\u20AC</p>
                    </button>
                  </AnimCard>

                  {/* Gestion Mensuelle */}
                  <AnimCard delay={160}>
                    <GlassCard goldTop={false} hoverLift={true} style={{
                      border: `2px solid ${c.gold}`, textAlign: 'center', position: 'relative', borderRadius: radius.lg,
                    }}>
                      <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '3px 10px', background: c.gold, color: c.black, fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.08em', borderRadius: radius.pill }}>DISPONIBLE</div>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>&#9881;</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Gestion Mensuelle</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Gestion récurrente de vos commandes</p>
                      <p style={{ fontSize: size.sm, color: c.gold, fontFamily: f.display, fontWeight: 700, margin: `${sp[2]} 0` }}>Sur devis</p>
                      <a href="https://wa.me/message/CARAXES?text=Bonjour%2C%20je%20souhaite%20activer%20la%20Gestion%20Mensuelle" target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-block', ...btnPrimary, textDecoration: 'none',
                      }}>
                        DEMANDER UN DEVIS
                      </a>
                    </GlassCard>
                  </AnimCard>

                  {/* Formation */}
                  <AnimCard delay={240}>
                    <GlassCard goldTop={false} hoverLift={true} style={{
                      border: `2px solid ${c.purple}`, textAlign: 'center', position: 'relative', borderRadius: radius.lg,
                    }}>
                      <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '3px 10px', background: c.green, color: '#fff', fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.08em', borderRadius: radius.pill }}>GRATUIT</div>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>&#127891;</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Formation E-Commerce</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 ${sp[2]}` }}>8 modules + 5 outils — offert à tous</p>
                      <button onClick={() => setViewMode('formation')} style={{
                        padding: `10px ${sp[3]}`, background: c.purple, color: '#fff', border: 'none',
                        fontFamily: f.body, fontSize: size.sm, fontWeight: 600, cursor: 'pointer',
                        borderRadius: radius.lg,
                      }}>
                        ACCEDER
                      </button>
                    </GlassCard>
                  </AnimCard>

                  {/* Packing — Bientôt */}
                  <AnimCard delay={320}>
                    <GlassCard goldTop={false} hoverLift={false} style={{
                      border: `2px solid ${c.borderSubtle}`, textAlign: 'center', opacity: 0.5, position: 'relative',
                      cursor: 'not-allowed', borderRadius: radius.lg,
                    }}>
                      <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '3px 10px', background: c.textTertiary, color: c.black, fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.06em', borderRadius: radius.pill }}>
                        BIENTOT
                      </div>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>&#128230;</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Packing & Fulfillment</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Préparation et expédition</p>
                    </GlassCard>
                  </AnimCard>
                </div>
              </div>

              {/* ─── MES SERVICES ACTIFS ─── */}
              {ecomServices.length > 0 ? (
                <div style={{ marginBottom: sp[5] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600, letterSpacing: '-0.01em' }}>Mes services actifs</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                    {ecomServices.map((svc, idx) => {
                      const svcType = SERVICE_TYPES[svc.service_type] || SERVICE_TYPES.creation
                      const currentStepIdx = Math.max(0, svcType.steps.findIndex(s => s.key === svc.status))
                      return (
                        <AnimCard key={svc.id} delay={idx * 80}>
                          <GlassCard goldTop={false} hoverLift={false} style={{
                            overflow: 'hidden', borderTop: `2px solid ${svcType.color}`, borderRadius: radius.lg,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                                <span style={{ fontSize: size.xl }}>{svcType.icon}</span>
                                <div>
                                  <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text }}>{svcType.label}</div>
                                  <div style={{ fontSize: size.xs, color: c.textSecondary }}>{svc.shop_name || svc.platform || svc.pack || '\u2014'}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: size.xs, color: c.textTertiary }}>{fmtDate(svc.created_at)}</div>
                            </div>

                            {/* Progress Steps */}
                            <div style={{ display: 'flex', gap: 0, marginBottom: sp[2] }}>
                              {svcType.steps.map((step, stepIdx) => (
                                <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                  <div style={{
                                    width: 28, height: 28,
                                    background: stepIdx <= currentStepIdx ? svcType.color : c.bgSurface,
                                    border: `2px solid ${stepIdx <= currentStepIdx ? svcType.color : c.borderSubtle}`,
                                    borderRadius: radius.pill,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 700, color: stepIdx <= currentStepIdx ? '#fff' : c.textTertiary,
                                    zIndex: 1,
                                    transition: transition.normal,
                                  }}>
                                    {stepIdx < currentStepIdx ? '\u2713' : stepIdx + 1}
                                  </div>
                                  {stepIdx < svcType.steps.length - 1 && (
                                    <div style={{
                                      position: 'absolute', top: 14, left: '60%', right: '-40%',
                                      height: 2, background: stepIdx < currentStepIdx ? svcType.color : c.borderSubtle,
                                      borderRadius: radius.pill,
                                    }} />
                                  )}
                                  <div style={{ fontSize: '8px', color: stepIdx <= currentStepIdx ? svcType.color : c.textTertiary, fontFamily: f.mono, marginTop: sp[1], textAlign: 'center', fontWeight: stepIdx === currentStepIdx ? 700 : 400, letterSpacing: '0.04em' }}>
                                    {step.label}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div style={{ padding: `${sp[2]} ${sp[3]}`, background: `${svcType.color}06`, border: `1px solid ${svcType.color}15`, borderRadius: radius.lg, marginTop: sp[2] }}>
                              <div style={{ fontSize: size.xs, color: c.text }}>{svcType.steps[currentStepIdx]?.description || 'En cours de traitement'}</div>
                            </div>
                          </GlassCard>
                        </AnimCard>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <DragonEmptyState text="Aucun service actif" sub="Souscrivez à un service pour commencer" />
              )}

              {/* ─── MES BOUTIQUES ─── */}
              {creationServices.length > 0 && (
                <div style={{ marginTop: sp[5] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600, letterSpacing: '-0.01em' }}>Mes boutiques</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                    {creationServices.map(svc => {
                      const svcType = SERVICE_TYPES.creation
                      const stepIdx = Math.max(0, svcType.steps.findIndex(s => s.key === svc.status))
                      return (
                        <GlassCard key={svc.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                            <span style={{ fontSize: size.lg }}>&#127978;</span>
                            <div>
                              <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text }}>{svc.shop_name || 'Ma boutique'}</div>
                              <div style={{ fontSize: size.xs, color: c.textSecondary }}>{svc.platform || 'Shopify'}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '10px', fontFamily: f.mono, fontWeight: 700, color: svcType.color, padding: '4px 12px', background: `${svcType.color}10`, letterSpacing: '0.06em', borderRadius: radius.pill }}>
                            {svcType.steps[stepIdx]?.label || 'En cours'}
                          </div>
                        </GlassCard>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: c.textSecondary }}>Section non disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── NEW ORDER MODAL ─── */}
      {isNewOrderOpen && (
        <div className="dashboard-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewOrderOpen(false) }}>
          <div className="dashboard-modal-inner" style={{
            background: `linear-gradient(180deg, ${c.bgElevated} 0%, ${c.bgCard} 100%)`, border: `1px solid ${c.border}`,
            borderTop: `2px solid ${c.goldDim}`,
            borderRadius: isMobile ? 0 : radius.lg, padding: isMobile ? `${sp[4]} ${sp[3]}` : sp[5], maxWidth: isMobile ? '100%' : 440, width: isMobile ? '100%' : '90%',
            minHeight: isMobile ? '100vh' : undefined,
            animation: `cardReveal 0.3s ${ease.luxury}`,
            position: 'relative',
            boxShadow: shadow.xl,
          }}>
            <button onClick={() => setIsNewOrderOpen(false)} style={{
              position: 'absolute', top: sp[2], right: sp[2], background: 'none', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: sp[0.5],
            }}><Icon d={icons.close} size={16} /></button>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldDim, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: sp[1], fontWeight: 600 }}>Nouvelle demande</div>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, margin: `0 0 ${sp[4]}`, fontWeight: 700, letterSpacing: '-0.02em' }}>Créer une commande</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], marginBottom: sp[4] }}>
              <input type="text" placeholder="Produit" value={newOrderForm.product} onChange={(e) => setNewOrderForm({ ...newOrderForm, product: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Quantité" value={newOrderForm.quantity} onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Budget" value={newOrderForm.budget} onChange={(e) => setNewOrderForm({ ...newOrderForm, budget: e.target.value })} style={inputStyle} />
              <textarea placeholder="Description détaillée du produit, spécifications…" value={newOrderForm.description} onChange={(e) => setNewOrderForm({ ...newOrderForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 100, resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: sp[2] }}>
              <button onClick={handleCreateOrder} style={{ flex: 1, ...btnPrimary }}>Envoyer</button>
              <button onClick={() => setIsNewOrderOpen(false)} style={{ flex: 1, ...btnSecondary }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SITE CREATION MODAL ─── */}
      {isEcomSiteCreationOpen && (
        <div className="dashboard-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsEcomSiteCreationOpen(false); setEcomStep(1) } }}>
          <div className="dashboard-modal-inner" style={{
            background: `linear-gradient(180deg, ${c.bgElevated} 0%, ${c.bgCard} 100%)`, border: `1px solid ${c.border}`,
            borderTop: `2px solid ${c.goldDim}`,
            borderRadius: isMobile ? 0 : radius.lg, padding: isMobile ? `${sp[4]} ${sp[3]}` : sp[5], maxWidth: isMobile ? '100%' : 440, width: isMobile ? '100%' : '90%',
            minHeight: isMobile ? '100vh' : undefined,
            animation: `cardReveal 0.3s ${ease.luxury}`,
            position: 'relative',
            boxShadow: shadow.xl,
          }}>
            <button onClick={() => { setIsEcomSiteCreationOpen(false); setEcomStep(1) }} style={{
              position: 'absolute', top: sp[2], right: sp[2], background: 'none', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: sp[0.5],
            }}><Icon d={icons.close} size={16} /></button>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: sp[0.5], marginBottom: sp[3] }}>
              {[1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: 2, borderRadius: radius.pill, background: ecomStep >= s ? c.gold : c.borderSubtle, transition: `background 0.3s ${ease.luxury}` }} />
              ))}
            </div>

            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.teal, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: sp[1], fontWeight: 600 }}>Étape {ecomStep}/2</div>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, margin: `0 0 ${sp[4]}`, fontWeight: 700, letterSpacing: '-0.02em' }}>Création boutique</h2>
            {ecomStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], marginBottom: sp[4] }}>
                <input type="text" placeholder="Nom de la boutique" value={siteCreationForm.shopName} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, shopName: e.target.value })} style={inputStyle} />
                <select value={siteCreationForm.platform} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, platform: e.target.value })} style={inputStyle}>
                  <option>Shopify</option>
                  <option>WooCommerce</option>
                  <option>PrestaShop</option>
                </select>
              </div>
            )}
            {ecomStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], marginBottom: sp[4] }}>
                <input type="text" placeholder="Catégorie de produits" value={siteCreationForm.category} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, category: e.target.value })} style={inputStyle} />
                <select value={siteCreationForm.branding} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, branding: e.target.value })} style={inputStyle}>
                  <option value="none">Pas de branding</option>
                  <option value="custom">Branding personnalisé</option>
                  <option value="premium">Branding premium</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: sp[2] }}>
              {ecomStep === 2 && (
                <button onClick={() => setEcomStep(1)} style={{ flex: 1, ...btnSecondary }}>Retour</button>
              )}
              {ecomStep === 1 ? (
                <button onClick={() => setEcomStep(2)} style={{ flex: 1, ...btnPrimary }}>Suivant</button>
              ) : (
                <button onClick={handleCreateSiteOrder} style={{ flex: 1, ...btnPrimary }}>Envoyer</button>
              )}
              <button onClick={() => { setIsEcomSiteCreationOpen(false); setEcomStep(1) }} style={{ flex: 1, ...btnSecondary }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING WHATSAPP BUTTON ─── */}
      <a href="https://wa.me/message/CARAXES" target="_blank" rel="noopener noreferrer" style={{
        position: 'fixed', bottom: isMobile ? 16 : 20, right: isMobile ? 16 : 20, width: 44, height: 44,
        background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.sm,
        zIndex: 999, boxShadow: '0 2px 8px rgba(37, 211, 102, 0.2)',
        transition: `transform 0.3s ${ease.luxury}, box-shadow 0.3s ${ease.luxury}`,
        textDecoration: 'none',
      }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)' }}
         onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 211, 102, 0.2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}
