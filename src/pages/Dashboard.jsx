import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
  subscribeToMessages, subscribeToOrders, subscribeToProducts, subscribeToShipments, subscribeToInventory, supabase,
  getShipments, createShipment, getInventory, getActiveProducts, sendWelcomeMessage,
  getShops, createEcomOrder, getEcomServices, getUnreadCounts,
} from '../lib/supabase'
import { getCatalog, VERIFIED_SUPPLIERS } from '../lib/catalogsByProfile'
import { FORMATION_CLIENT, FORMATION_ECOMMERCE, FORMATION_INTERNE, FORMATION_TOOLS, SERVICE_TYPES, FORMATION_STRATEGY } from '../lib/formationData'
import { getTierByKey, getTierPrice, getTierMOQ, DEFAULT_TIER } from '../lib/clientTiers'
import StatusPill, { ProgressBar, PipelineStepper } from '../components/StatusPill'
import { useToast } from '../components/Toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

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
  menu: 'M4 6h16M4 12h16M4 18h16',
  home: 'M3 12l9-9 9 9v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  trending: 'M13 7l5 5m0 0l-5 5m5-5H6',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtQty = (n) => (n || 0).toLocaleString('fr-FR')

function DragonMark({ s = 40 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 44 44" fill="none" style={{
      filter: `drop-shadow(0 0 16px oklch(55% 0.22 25 / 0.3))`,
      transition: 'filter 0.3s ease',
    }}>
      <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.9"/>
      <circle cx="17.5" cy="21" r="2.2" fill={c.gold} opacity="0.95"/>
      <circle cx="26.5" cy="21" r="2.2" fill={c.gold} opacity="0.95"/>
      <path d="M22 27 Q20 30 18 32" stroke={c.gold} strokeWidth="0.8" opacity="0.6"/>
    </svg>
  )
}

function FilmGrain() {
  return (
    <svg style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', opacity: 0.04, mixBlendMode: 'overlay', zIndex: 1,
    }}>
      <defs>
        <filter id="dashGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="5" stitchTiles="stitch" seed="2"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#dashGrain)"/>
    </svg>
  )
}

function ArtDecoDivider({ width = 80, opacity = 0.35 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity }}>
      <div style={{ width: 5, height: 5, background: c.gold, transform: 'rotate(45deg)', opacity: 0.8 }} />
      <div style={{ width, height: '1px', background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
    </div>
  )
}

function DecoPattern({ color = c.gold, opacity = 0.06 }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }} viewBox="0 0 200 200" preserveAspectRatio="none">
      <defs>
        <pattern id="deco-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4"/>
          <circle cx="20" cy="20" r="1.5" fill={color} opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#deco-grid)"/>
    </svg>
  )
}

function SectionBanner({ title, subtitle, accentColor = c.gold, icon }) {
  return (
    <div className="section-banner" style={{
      height: 100, marginBottom: sp[4], position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${c.bgElevated}, ${c.bg})`,
      border: `1px solid ${c.borderSubtle}`,
    }}>
      <DecoPattern color={accentColor} opacity={0.08} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent 60%)` }} />
      <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, border: `1px solid ${accentColor}22`, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', bottom: -8, right: 40, width: 16, height: 16, border: `1px solid ${accentColor}15`, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp[5]}`, zIndex: 1 }}>
        <div>
          {subtitle && <p style={{ fontFamily: f.mono, fontSize: '10px', color: accentColor, letterSpacing: '0.12em', textTransform: 'uppercase', margin: `0 0 ${sp[1]}`, fontWeight: 600 }}>◆ {subtitle}</p>}
          <h1 style={{ fontSize: size['2xl'], fontFamily: f.display, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        </div>
        {icon && <div style={{ opacity: 0.15 }}>{icon}</div>}
      </div>
    </div>
  )
}

function DragonEmptyState({ text = 'Sélectionnez une commande', sub = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: sp[6], gap: sp[3], animation: 'fadeSlideUp 0.6s ease' }}>
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 80, height: 80, border: `1px solid ${c.gold}22`, transform: 'rotate(45deg)' }} />
        <DragonMark s={36} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, fontWeight: 600, margin: 0, letterSpacing: '0.03em' }}>{text}</p>
        {sub && <p style={{ fontFamily: f.body, fontSize: size.xs, color: c.textTertiary, margin: `${sp[1]} 0 0`, letterSpacing: '0.01em' }}>{sub}</p>}
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
      <h3 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600 }}>Pipeline des commandes</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: sp[2] }}>
        {STATUSES.map(status => (
          <div key={status.key} style={{
            background: status.bg,
            border: `1px solid ${status.color}33`,
            padding: sp[3],
            textAlign: 'center',
            position: 'relative',
            transition: `all 0.25s ${ease.luxury}`,
          }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: status.color, letterSpacing: '0.08em', marginBottom: sp[1], fontWeight: 600 }}>◆ {status.label}</div>
            <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: status.color }}>
              {pipeline[status.key] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrderCardGrid({ order, selected, onClick, unreadCount }) {
  const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]

  return (
    <div onClick={onClick}
      style={{
        background: c.bgElevated,
        border: `1px solid ${selected ? c.gold : c.border}`,
        padding: sp[3],
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: `all 0.25s ${ease.luxury}`,
        display: 'flex',
        flexDirection: 'column',
        animation: `cardReveal 0.5s ${ease.out} both`,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = c.gold
          e.currentTarget.style.boxShadow = `0 8px 24px oklch(55% 0.22 25 / 0.15)`
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = c.border
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: statusObj.color }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRight: `2px solid ${c.gold}22`, borderBottom: `2px solid ${c.gold}22`, pointerEvents: 'none' }} />

      {unreadCount > 0 && (
        <div style={{
          position: 'absolute', top: sp[2], right: sp[2],
          minWidth: 22, height: 22, borderRadius: 0,
          background: c.red, color: c.white, fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
          boxShadow: `0 2px 8px oklch(55% 0.22 25 / 0.2)`,
        }}>{unreadCount}</div>
      )}

      <div style={{
        fontFamily: f.mono, fontSize: '10px', color: c.gold,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[2],
        fontWeight: 600,
      }}>◆ {order.ref}</div>

      <div style={{
        fontFamily: f.display, fontWeight: 700, fontSize: size.base, marginBottom: sp[2],
        lineHeight: 1.3, color: c.text,
        letterSpacing: '-0.01em',
      }}>{order.product}</div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: sp[2], fontSize: size.xs, color: c.textSecondary,
      }}>
        <span>{fmtQty(order.quantity)} unités</span>
        <span>{order.budget}</span>
      </div>

      <div style={{ marginBottom: sp[2] }}>
        <ProgressBar value={order.progress} color={statusObj.color} height={2} />
      </div>

      <div style={{ marginTop: 'auto' }}>
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
      marginBottom: sp[2],
    }}>
      <div style={{
        maxWidth: '72%', padding: `12px ${sp[3]}`,
        background: isAgent ? c.bgElevated : c.redSoft,
        border: `1px solid ${isAgent ? c.border : c.gold}`,
        fontSize: size.sm, lineHeight: 1.6, color: c.text,
        position: 'relative',
        boxShadow: isAgent ? shadow.xs : `0 4px 12px oklch(55% 0.22 25 / 0.12)`,
        transition: `all 0.2s ${ease.smooth}`,
      }}>
        <div style={{
          fontSize: '8px', color: isAgent ? c.gold : c.red,
          marginBottom: '6px', fontFamily: f.mono,
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <div style={{ width: 3, height: 3, background: isAgent ? c.gold : c.red, transform: 'rotate(45deg)', opacity: 0.7 }} />
          {isAgent ? 'Agent CARAXES' : 'Vous'}
          <span style={{ color: c.textTertiary, fontWeight: 400, letterSpacing: '0.02em', textTransform: 'none', fontSize: '8px' }}>
            {fmtDate(msg.created_at)}
          </span>
        </div>
        <p style={{ margin: 0, wordWrap: 'break-word', whiteSpace: 'pre-wrap', fontWeight: 300, letterSpacing: '0.3px' }}>
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
        background: c.bgElevated,
        border: `1px solid ${c.border}`,
        transition: `all 0.25s ${ease.smooth}`,
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.gold
        e.currentTarget.style.boxShadow = `0 2px 8px oklch(55% 0.15 85 / 0.12)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = c.border
        e.currentTarget.style.boxShadow = 'none'
      }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: c.redSoft, border: `1px solid ${c.gold}33`,
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
      <Icon d={icons.download} size={14} color={c.gold} />
    </div>
  )
}

export default function Dashboard({ user, profile, onSignOut }) {
  const navigate = useNavigate()
  const { addToast } = useToast()

  // ─── STATE ───
  const [viewMode, setViewMode] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    const unsubOrders = subscribeToOrders(user.id, (newOrders) => setOrders(newOrders))
    const unsubShipments = subscribeToShipments(user.id, (newShipments) => setShipments(newShipments))
    const unsubInventory = subscribeToInventory(user.id, (newInventory) => setInventory(newInventory))
    const unsubProducts = subscribeToProducts(user.id, (newProducts) => setDynamicProducts(newProducts))

    return () => {
      unsubOrders?.()
      unsubShipments?.()
      unsubInventory?.()
      unsubProducts?.()
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
    const unsubMessages = subscribeToMessages(selectedOrderId, (newMsgs) => setMessages(newMsgs))

    return () => unsubMessages?.()
  }, [selectedOrderId, user?.id])

  // ─── HANDLERS ───
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedOrderId) return
    try {
      await sendMessage(selectedOrderId, messageInput, user.id, 'client')
      setMessageInput('')
    } catch (err) {
      addToast('Erreur lors de l\'envoi', 'error')
    }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.file_path)
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
        client_id: user.id,
        product: newOrderForm.product,
        quantity: parseInt(newOrderForm.quantity),
        budget: newOrderForm.budget,
        description: newOrderForm.description,
        status: 'pending',
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
        client_id: user.id,
        serviceType: 'creation',
        details: {
          shopName: siteCreationForm.shopName,
          platform: siteCreationForm.platform,
          category: siteCreationForm.category,
          branding: siteCreationForm.branding,
        },
      })

      // Notify admin via N8N webhook (silent, client doesn't know)
      try {
        await fetch('https://caraxes13.app.n8n.cloud/webhook/site-creation', {
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
  const catalog = getCatalog(profile?.tier_key || DEFAULT_TIER.key)

  // ─── RENDER ───
  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: c.bg, color: c.text,
      fontFamily: f.body,
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        input::placeholder { color: ${c.textGhost}; }
        input:focus { outline: none; }
      `}</style>

      {/* ─── SIDEBAR ─── */}
      <div style={{
        width: sidebarOpen ? 280 : 0,
        background: c.bgElevated,
        border: `1px solid ${c.border}`,
        overflow: 'hidden',
        transition: `width 0.3s ${ease.smooth}`,
        display: 'flex',
        flexDirection: 'column',
        '@media (max-width: 768px)': {
          position: 'fixed',
          zIndex: 1000,
          height: '100vh',
        }
      }}>
        <div style={{ padding: sp[4], borderBottom: `1px solid ${c.border}` }}>
          <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.red, letterSpacing: '-0.02em' }}>
            CARAXES
          </div>
        </div>

        <nav style={{ flex: 1, padding: sp[3], overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[2] }}>
          {[
            { key: 'overview', label: 'Aperçu', icon: icons.home },
            { key: 'orders', label: 'Commandes', icon: icons.folder },
            { key: 'catalogue', label: 'Catalogue', icon: icons.file, feature: 'catalogue' },
            { key: 'expedition', label: 'Expéditions', icon: icons.upload, feature: 'expedition' },
            { key: 'stock', label: 'Stock', icon: icons.folder, feature: 'stock' },
            { key: 'services', label: 'Mes Services', icon: icons.trending },
            { key: 'boutique', label: 'E-commerce', icon: icons.msg, feature: 'ecommerce' },
            { key: 'formation', label: 'Formation', icon: icons.doc, feature: 'formation' },
          ].filter(({ feature }) => {
            if (!feature) return true
            const features = profile?.features || {}
            return features[feature] !== false
          }).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setViewMode(key); setSelectedOrderId(null) }}
              style={{
                padding: `${sp[2]} ${sp[3]}`,
                background: viewMode === key ? c.bgHover : 'transparent',
                border: `1px solid ${viewMode === key ? c.gold : 'transparent'}`,
                color: viewMode === key ? c.gold : c.textSecondary,
                fontFamily: f.body,
                fontSize: size.sm,
                cursor: 'pointer',
                transition: `all 0.2s ${ease.luxury}`,
                display: 'flex',
                alignItems: 'center',
                gap: sp[2],
              }}>
              <Icon d={icon} size={16} color="currentColor" />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: sp[3], borderTop: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: sp[1] }}>
          <button onClick={onSignOut} style={{
            padding: `${sp[2]} ${sp[3]}`,
            background: 'transparent',
            border: `1px solid ${c.border}`,
            color: c.textSecondary,
            cursor: 'pointer',
            fontFamily: f.body,
            fontSize: size.sm,
            transition: `all 0.2s ${ease.luxury}`,
            display: 'flex',
            alignItems: 'center',
            gap: sp[2],
          }}>
            <Icon d={icons.logout} size={16} color="currentColor" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* HEADER */}
        <div style={{
          background: c.bgElevated,
          border: `1px solid ${c.border}`,
          padding: `${sp[3]} ${sp[5]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none',
            border: 'none',
            color: c.text,
            cursor: 'pointer',
            padding: 0,
          }}>
            <Icon d={icons.menu} size={24} />
          </button>

          <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.red, letterSpacing: '-0.02em' }}>
            CARAXES
          </div>

          <div style={{ display: 'flex', gap: sp[3], alignItems: 'center' }}>
            <button onClick={() => setIsNewOrderOpen(true)} style={{
              padding: `8px ${sp[3]}`,
              background: c.red,
              border: 'none',
              color: '#fff',
              fontFamily: f.mono,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.06em',
              transition: `all 0.2s ${ease.luxury}`,
            }} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
              + NOUVELLE COMMANDE
            </button>
            <button onClick={onSignOut} style={{
              background: 'none',
              border: 'none',
              color: c.textSecondary,
              cursor: 'pointer',
              padding: 0,
              fontFamily: f.mono,
              fontSize: '11px',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Icon d={icons.logout} size={16} />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: sp[5] }}>
          {viewMode === 'overview' ? (
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <SectionBanner
                title="Bienvenue"
                subtitle="APERÇU"
                accentColor={c.gold}
                icon={<DragonMark s={56} />}
              />

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: sp[3], marginBottom: sp[5] }}>
                {[
                  { label: 'Commandes actives', value: orders.filter(o => o.status !== 'delivered').length, accent: c.red },
                  { label: 'Expéditions', value: shipments.length, accent: c.teal },
                  { label: 'Services actifs', value: ecomServices.length, accent: c.purple },
                  { label: 'Formation', value: ecomServices.filter(s => s.service_type === 'formation').length > 0 ? 'Active' : '—', accent: c.gold },
                ].map(({ label, value, accent }) => (
                  <div key={label} style={{
                    background: c.bgElevated,
                    border: `1px solid ${c.border}`,
                    padding: sp[3],
                    animation: `cardReveal 0.5s ${ease.out} both`,
                  }}>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, fontFamily: f.mono, marginBottom: sp[1], letterSpacing: '0.06em' }}>◆ {label.toUpperCase()}</div>
                    <div style={{ fontSize: size['2xl'], fontWeight: 700, color: accent }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Active Services Summary */}
              {ecomServices.length > 0 && (
                <div style={{ marginBottom: sp[5] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600 }}>Mes services actifs</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {ecomServices.slice(0, 3).map((svc, idx) => {
                      const svcType = SERVICE_TYPES[svc.service_type] || SERVICE_TYPES.creation
                      const currentStep = svcType.steps.findIndex(s => s.key === svc.status) || 0
                      const progress = Math.round(((currentStep + 1) / svcType.steps.length) * 100)
                      return (
                        <div key={svc.id} onClick={() => setViewMode('services')} style={{
                          background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[3],
                          cursor: 'pointer', position: 'relative', overflow: 'hidden',
                          animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${idx * 80}ms`,
                          transition: `all 0.25s ${ease.luxury}`,
                        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = svcType.color }}
                           onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: svcType.color }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                            <span style={{ fontSize: size.lg }}>{svcType.icon}</span>
                            <div>
                              <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text }}>{svcType.label}</div>
                              <div style={{ fontSize: size.xs, color: c.textSecondary }}>{svc.shop_name || svc.pack || '—'}</div>
                            </div>
                          </div>
                          <div style={{ height: 3, background: c.bgSurface, marginBottom: sp[1] }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: svcType.color, transition: 'width 0.5s ease' }} />
                          </div>
                          <div style={{ fontSize: '10px', color: svcType.color, fontFamily: f.mono, fontWeight: 600 }}>
                            {svcType.steps[currentStep]?.label || 'En cours'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* WhatsApp Quick Contact */}
              <div style={{
                background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[4],
                marginBottom: sp[5], display: 'flex', alignItems: 'center', gap: sp[3],
              }}>
                <div style={{ width: 48, height: 48, background: '#25D36622', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '24px' }}>💬</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, marginBottom: '4px' }}>Support WhatsApp</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary }}>Une question ? Contactez directement votre agent CARAXES</div>
                </div>
                <a href="https://wa.me/message/CARAXES" target="_blank" rel="noopener noreferrer" style={{
                  padding: `8px ${sp[3]}`, background: '#25D366', border: 'none', color: '#fff',
                  fontFamily: f.mono, fontSize: '11px', fontWeight: 700, textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}>
                  CONTACTER
                </a>
              </div>

              {/* Recent Orders */}
              {orders.length > 0 && (
                <div style={{ marginBottom: sp[5] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600 }}>Commandes récentes</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {orders.slice(0, 6).map((order, idx) => (
                      <div key={order.id} onClick={() => { setSelectedOrderId(order.id); setViewMode('orders') }} style={{ animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${idx * 50}ms` }}>
                        <OrderCardGrid order={order} selected={false} onClick={() => {}} unreadCount={unreadCounts[order.id] || 0} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: sp[3] }}>
                {[
                  { label: 'Ajouter une commande', action: () => setIsNewOrderOpen(true), accent: c.red },
                  { label: 'Voir le catalogue', action: () => setViewMode('catalogue'), accent: c.gold },
                  { label: 'Créer une boutique', action: () => { setIsEcomSiteCreationOpen(true); setEcomStep(1) }, accent: c.teal },
                  { label: 'Consulter la formation', action: () => setViewMode('formation'), accent: c.purple },
                ].map(({ label, action, accent }) => (
                  <button key={label} onClick={action} style={{
                    padding: sp[3],
                    background: c.bgElevated,
                    border: `1px solid ${c.border}`,
                    color: accent,
                    fontFamily: f.display,
                    fontSize: size.sm,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: `all 0.25s ${ease.luxury}`,
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accent
                    e.currentTarget.style.boxShadow = `0 8px 24px ${accent}22`
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = c.border
                    e.currentTarget.style.boxShadow = 'none'
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : viewMode === 'orders' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[4], maxWidth: 1400, margin: '0 auto', '@media (max-width: 900px)': { gridTemplateColumns: '1fr' } }}>
              {/* Orders List */}
              <div>
                <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600 }}>Mes commandes ({orders.length})</h2>
                {orders.length === 0 ? (
                  <DragonEmptyState text="Aucune commande" sub="Créez votre première commande" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3] }}>
                    {orders.map((order, idx) => (
                      <div key={order.id} onClick={() => setSelectedOrderId(order.id)} style={{ animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${idx * 50}ms` }}>
                        <OrderCardGrid order={order} selected={selectedOrderId === order.id} onClick={() => setSelectedOrderId(order.id)} unreadCount={unreadCounts[order.id] || 0} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Detail Panel */}
              <div style={{
                background: c.bgElevated,
                border: `1px solid ${c.border}`,
                padding: sp[4],
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
                position: 'sticky',
                top: 0,
              }}>
                {!selectedOrder ? (
                  <DragonEmptyState text="Sélectionnez une commande" sub="pour voir les détails, messages et documents" />
                ) : (
                  <>
                    <div style={{ marginBottom: sp[3] }}>
                      <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, marginBottom: sp[1], letterSpacing: '0.08em', fontWeight: 600 }}>◆ {selectedOrder.ref}</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text, margin: `0 0 ${sp[2]}` }}>{selectedOrder.product}</h3>
                      <StatusPill status={selectedOrder.status} />
                    </div>

                    <ArtDecoDivider />

                    {/* Info */}
                    <div style={{ marginTop: sp[3], marginBottom: sp[3], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                      <div>
                        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>QUANTITÉ</div>
                        <div style={{ fontSize: size.base, fontWeight: 600, color: c.text }}>{fmtQty(selectedOrder.quantity)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>BUDGET</div>
                        <div style={{ fontSize: size.base, fontWeight: 600, color: c.gold }}>{selectedOrder.budget}</div>
                      </div>
                    </div>

                    {selectedOrder.description && (
                      <div style={{ marginBottom: sp[3], padding: sp[2], background: c.bgSurface, fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5 }}>
                        {selectedOrder.description}
                      </div>
                    )}

                    <ArtDecoDivider />

                    {/* Messages */}
                    <div style={{ marginTop: sp[3], marginBottom: sp[3] }}>
                      <h4 style={{ fontFamily: f.display, fontSize: size.base, color: c.text, marginBottom: sp[2], fontWeight: 600 }}>Messages</h4>
                      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: sp[2] }}>
                        {messages.length === 0 ? (
                          <p style={{ fontSize: size.xs, color: c.textTertiary, textAlign: 'center', padding: sp[3] }}>Aucun message</p>
                        ) : (
                          messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: sp[1] }}>
                        <input
                          type="text"
                          placeholder="Votre message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          style={{
                            flex: 1,
                            padding: `8px ${sp[2]}`,
                            background: c.bgSurface,
                            border: `1px solid ${c.border}`,
                            color: c.text,
                            fontSize: size.sm,
                            fontFamily: f.body,
                          }}
                        />
                        <button onClick={handleSendMessage} style={{
                          padding: `8px ${sp[3]}`,
                          background: c.gold,
                          border: 'none',
                          color: c.black,
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}>
                          <Icon d={icons.send} size={14} color={c.black} />
                        </button>
                      </div>
                    </div>

                    {/* Documents */}
                    {documents.length > 0 && (
                      <div>
                        <h4 style={{ fontFamily: f.display, fontSize: size.base, color: c.text, marginBottom: sp[2], fontWeight: 600 }}>Documents</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
                          {documents.map(doc => (
                            <DocumentCard key={doc.id} doc={doc} onDownload={() => handleDownloadDocument(doc)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : viewMode === 'catalogue' ? (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <SectionBanner
                title="Catalogue produits"
                subtitle="SOURCING"
                accentColor={c.gold}
              />
              {catalog.map((cat, idx) => (
                <div key={cat.id} style={{ marginBottom: sp[5], animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${idx * 80}ms` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[3] }}>
                    <span style={{ fontSize: size.xl }}>{cat.icon}</span>
                    <div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>{cat.name}</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `4px 0 0` }}>{cat.description}</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3], marginBottom: sp[3] }}>
                    {cat.topProducts.map(prod => (
                      <div key={prod} style={{
                        background: c.bgElevated,
                        border: `1px solid ${c.border}`,
                        padding: sp[3],
                        cursor: 'pointer',
                        transition: `all 0.25s ${ease.luxury}`,
                      }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                        <p style={{ fontSize: size.sm, color: c.text, fontWeight: 600, margin: 0, marginBottom: sp[1] }}>{prod}</p>
                        <p style={{ fontSize: size.xs, color: c.textSecondary, margin: 0 }}>Prix: {cat.priceRange} | MOQ: {cat.moq}</p>
                      </div>
                    ))}
                  </div>
                  <ArtDecoDivider />
                </div>
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
              <SectionBanner
                title="Centre de Formation"
                subtitle="FORMATION GRATUITE"
                accentColor={c.purple}
              />

              {/* Free banner */}
              <div style={{
                background: `linear-gradient(135deg, ${c.purple}15, ${c.teal}10)`,
                border: `1px solid ${c.purple}30`, padding: sp[3], marginBottom: sp[4],
                display: 'flex', alignItems: 'center', gap: sp[3],
              }}>
                <div style={{ width: 48, height: 48, background: `${c.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>🎓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text }}>Formation 100% gratuite</div>
                  <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5 }}>
                    8 modules complets + 5 outils interactifs pour lancer votre business e-commerce.
                    {!hasCreation && <span style={{ color: c.gold }}> Passez à l'offre Création (1 490€) pour débloquer la formation complète 20h + votre boutique clé en main.</span>}
                    {hasCreation && <span style={{ color: c.gold }}> Vous avez accès à la formation complète 20h en bonus avec votre offre Création.</span>}
                  </div>
                </div>
              </div>

              {/* Formation Switcher */}
              <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[4], flexWrap: 'wrap' }}>
                {formationTabs.map(({ key, label, sub, accent, badge }) => (
                  <button key={key} onClick={() => { setFormationMode(key); setActiveLesson(null) }} style={{
                    padding: `${sp[2]} ${sp[3]}`, background: formationMode === key ? `${accent}15` : c.bgElevated,
                    border: `1px solid ${formationMode === key ? accent : c.border}`,
                    cursor: 'pointer', textAlign: 'left', transition: `all 0.25s ${ease.luxury}`, flex: '1 1 200px',
                    position: 'relative',
                  }} onMouseEnter={(e) => { if (formationMode !== key) e.currentTarget.style.borderColor = accent }}
                     onMouseLeave={(e) => { if (formationMode !== key) e.currentTarget.style.borderColor = c.border }}>
                    {badge && <span style={{ position: 'absolute', top: -6, right: 8, padding: '1px 6px', background: badge === 'OFFERT' ? c.green : c.gold, color: '#fff', fontSize: '8px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.08em' }}>{badge}</span>}
                    <div style={{ fontSize: size.sm, color: formationMode === key ? accent : c.text, fontWeight: 700, fontFamily: f.display }}>{label}</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: '2px' }}>{sub}</div>
                  </button>
                ))}
              </div>

              {/* CTA Création si pas encore client */}
              {!hasCreation && formationMode === 'mastery' && (
                <div style={{
                  background: c.bgElevated, border: `1px solid ${c.gold}30`, padding: sp[3], marginBottom: sp[4],
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: sp[2],
                }}>
                  <div>
                    <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold }}>Passez au niveau supérieur</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary }}>Création boutique complète + Formation 20h approfondie pour 1 490€</div>
                  </div>
                  <a href="https://buy.stripe.com/28EeV66yS6HZ3H92cjfEk00" target="_blank" rel="noopener noreferrer" style={{
                    padding: `8px ${sp[3]}`, background: c.gold, color: c.black, textDecoration: 'none',
                    fontFamily: f.mono, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>
                    OFFRE CRÉATION — 1 490€
                  </a>
                </div>
              )}

              {/* Tools View */}
              {formationMode === 'tools' ? (
                <div>
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginBottom: sp[3] }}>
                    Outils interactifs inclus avec la formation — utilisez-les pour piloter votre business.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {FORMATION_TOOLS.map((tool, idx) => (
                      <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" style={{
                        background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[3],
                        textDecoration: 'none', position: 'relative', overflow: 'hidden',
                        display: 'block', transition: `all 0.25s ${ease.luxury}`,
                        animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${idx * 60}ms`,
                      }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                         onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tool.color }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[2] }}>
                          <div style={{ width: 36, height: 36, background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size.lg, color: tool.color, fontWeight: 700 }}>
                            {tool.icon}
                          </div>
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text }}>{tool.title}</div>
                          </div>
                        </div>
                        <p style={{ fontSize: size.xs, color: c.textSecondary, margin: 0, lineHeight: 1.5 }}>{tool.description}</p>
                        <div style={{ marginTop: sp[2], fontSize: '10px', color: tool.color, fontFamily: f.mono, fontWeight: 600, letterSpacing: '0.08em' }}>
                          OUVRIR L'OUTIL →
                        </div>
                      </a>
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
                    <div style={{ animation: `cardReveal 0.4s ${ease.out} both` }}>
                      <button onClick={() => setActiveLesson(null)} style={{
                        background: 'none', border: 'none', color: c.textSecondary,
                        fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer',
                        marginBottom: sp[3], display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
                      }}>
                        <Icon d={icons.back} size={14} /> Retour aux modules
                      </button>
                      <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[4] }}>
                        <div style={{ fontFamily: f.mono, fontSize: '10px', color: parentModule?.color || c.gold, marginBottom: sp[1], letterSpacing: '0.08em', fontWeight: 600 }}>
                          {parentModule?.icon} {parentModule?.title}
                        </div>
                        <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, margin: `0 0 ${sp[1]}` }}>{lesson.title}</h2>
                        <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `0 0 ${sp[3]}`, fontFamily: f.mono }}>Durée: {lesson.duration}</p>
                        <div style={{ fontSize: size.sm, color: c.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{lesson.content}</div>

                        {linkedTool && (
                          <>
                            <ArtDecoDivider opacity={0.3} />
                            <div style={{ marginTop: sp[3], padding: sp[3], background: `${linkedTool.color}08`, border: `1px solid ${linkedTool.color}25` }}>
                              <div style={{ fontSize: '10px', color: linkedTool.color, fontFamily: f.mono, fontWeight: 600, letterSpacing: '0.08em', marginBottom: sp[1] }}>◆ OUTIL PRATIQUE</div>
                              <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text, marginBottom: sp[1] }}>{linkedTool.title}</div>
                              <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `0 0 ${sp[2]}` }}>{linkedTool.description}</p>
                              <a href={linkedTool.url} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-block', padding: `6px ${sp[2]}`, background: linkedTool.color,
                                color: '#fff', textDecoration: 'none', fontFamily: f.mono, fontSize: '11px', fontWeight: 700,
                              }}>
                                Ouvrir l'outil
                              </a>
                            </div>
                          </>
                        )}

                        <ArtDecoDivider opacity={0.2} />
                        <div style={{ marginTop: sp[3], display: 'flex', gap: sp[2] }}>
                          <a href={`mailto:zinedine@caraxes.fr?subject=Question sur ${lesson.title}`} style={{
                            padding: `8px ${sp[3]}`, background: c.red, color: '#fff', textDecoration: 'none',
                            fontFamily: f.mono, fontSize: '11px', fontWeight: 700,
                          }}>
                            Poser une question
                          </a>
                          <a href="https://wa.me/message/CARAXES" target="_blank" rel="noopener noreferrer" style={{
                            padding: `8px ${sp[3]}`, background: '#25D366', color: '#fff', textDecoration: 'none',
                            fontFamily: f.mono, fontSize: '11px', fontWeight: 700,
                          }}>
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })() : (
                  <>
                    <p style={{ fontSize: size.sm, color: c.textSecondary, marginBottom: sp[3] }}>
                      {currentFormation.subtitle} — <span style={{ color: c.gold, fontFamily: f.mono }}>{currentFormation.duration}</span>
                    </p>
                    <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[3] }}>
                      <a href="/programme-formation-caraxes.pdf" download target="_blank" style={{
                        padding: `8px ${sp[3]}`, background: c.red, color: '#fff', textDecoration: 'none',
                        fontFamily: f.mono, fontSize: '11px', fontWeight: 700,
                      }}>
                        <Icon d={icons.download} size={12} color="#fff" /> Programme PDF
                      </a>
                      <button onClick={() => setFormationMode('tools')} style={{
                        padding: `8px ${sp[3]}`, background: c.teal, color: '#fff', border: 'none',
                        fontFamily: f.mono, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        Outils interactifs
                      </button>
                    </div>
                    {currentFormation.modules.map((module, modIdx) => (
                      <div key={module.id} style={{
                        background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3],
                        overflow: 'hidden', borderLeft: `3px solid ${module.color || c.gold}`,
                        animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${modIdx * 50}ms`,
                      }}>
                        <button onClick={() => toggleModule(module.id)} style={{
                          width: '100%', padding: sp[3], background: 'transparent', border: 'none',
                          cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', transition: `all 0.2s ${ease.luxury}`,
                        }} onMouseEnter={(e) => e.currentTarget.style.background = c.bgHover}
                           onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: '10px', color: module.color || c.gold, marginBottom: sp[1], letterSpacing: '0.08em', fontWeight: 600 }}>
                              {module.icon} MODULE {String(modIdx + 1).padStart(2, '0')} — {module.title.toUpperCase()}
                            </div>
                            <p style={{ fontSize: size.xs, color: c.textSecondary, margin: 0 }}>{module.lessons.length} leçons • {module.duration}</p>
                          </div>
                          <Icon d={expandedModules[module.id] ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7 7 7'} size={16} color={module.color || c.gold} />
                        </button>

                        {expandedModules[module.id] && (
                          <div style={{ borderTop: `1px solid ${c.border}`, padding: sp[3] }}>
                            {module.lessons.map(lesson => {
                              const hasTool = lesson.tool ? FORMATION_TOOLS.find(t => t.id === lesson.tool) : null
                              return (
                                <button key={lesson.id} onClick={() => setActiveLesson(lesson.id)} style={{
                                  width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgSurface, border: 'none',
                                  cursor: 'pointer', textAlign: 'left', marginBottom: sp[1],
                                  transition: `all 0.2s ${ease.luxury}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }} onMouseEnter={(e) => e.currentTarget.style.background = c.bgHover}
                                   onMouseLeave={(e) => e.currentTarget.style.background = c.bgSurface}>
                                  <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: size.sm, color: c.text, margin: 0, fontWeight: 500 }}>{lesson.title}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginTop: '4px' }}>
                                      <span style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono }}>⏱ {lesson.duration}</span>
                                      {hasTool && <span style={{ fontSize: '9px', color: hasTool.color, fontFamily: f.mono, fontWeight: 700, padding: '1px 6px', background: `${hasTool.color}15`, letterSpacing: '0.06em' }}>OUTIL</span>}
                                    </div>
                                  </div>
                                  <Icon d="M9 5l7 7-7 7" size={14} color={c.textSecondary} />
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          )})()
          : viewMode === 'expedition' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <SectionBanner
                title="Suivi des expéditions"
                subtitle="LOGISTIQUE"
                accentColor={c.teal}
              />
              {shipments.length === 0 ? (
                <DragonEmptyState text="Aucune expédition" sub="Vos envois apparaîtront ici" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                  {shipments.map((ship, idx) => {
                    const statusObj = (typeof ship.status === 'number' ? STATUSES[ship.status] : STATUSES.find(s => s.key === ship.status)) || STATUSES[0]
                    return (
                      <div key={ship.id} style={{
                        background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[3],
                        position: 'relative', animation: `cardReveal 0.5s ${ease.out} both`,
                        animationDelay: `${idx * 50}ms`,
                      }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: statusObj.color }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[2] }}>
                          <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[1], fontWeight: 600 }}>
                            ◆ {ship.tracking_number || 'N/A'}
                          </div>
                          <span style={{ fontSize: size.xs, color: c.textTertiary }}>{fmtDate(ship.created_at)}</span>
                        </div>
                        <StatusPill status={ship.status} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], margin: `${sp[2]} 0`, fontSize: size.sm, color: c.textSecondary }}>
                          <span>{ship.origin || 'Yiwu'}</span>
                          <span>→</span>
                          <span>{ship.destination || 'Destination'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : viewMode === 'stock' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <SectionBanner
                title="Gestion de stock"
                subtitle="INVENTAIRE"
                accentColor={c.purple}
              />
              {inventory.length === 0 ? (
                <DragonEmptyState text="Aucun stock" sub="Votre inventaire apparaîtra ici" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                  {inventory.map((item, idx) => {
                    const isLow = item.quantity < (item.min_stock || 10)
                    return (
                      <div key={item.id} style={{
                        background: c.bgElevated, border: `1px solid ${isLow ? c.red : c.border}`, padding: sp[3],
                        position: 'relative', animation: `cardReveal 0.5s ${ease.out} both`,
                        animationDelay: `${idx * 40}ms`, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: sp[3],
                      }}>
                        {isLow && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.red }} />}
                        <div>
                          <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 600, color: c.text, marginBottom: sp[1] }}>{item.product_name}</div>
                          <div style={{ fontSize: size.xs, color: c.textSecondary }}>Localisation: {item.location || 'Entrepôt'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: f.mono, fontSize: size.lg, fontWeight: 700, color: isLow ? c.red : c.gold }}>
                            {fmtQty(item.quantity)}
                          </div>
                          {isLow && <div style={{ fontSize: '10px', color: c.red, fontWeight: 600 }}>⚠ BAS</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : viewMode === 'services' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <SectionBanner
                title="Mes Services"
                subtitle="SUIVI"
                accentColor={c.purple}
              />

              {ecomServices.length === 0 ? (
                <div>
                  <DragonEmptyState text="Aucun service actif" sub="Souscrivez à un service pour commencer" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3], marginTop: sp[4] }}>
                    {/* Création — actif */}
                    <div style={{
                      background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[4],
                      textAlign: 'center', position: 'relative',
                    }}>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>🏪</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Création Boutique</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Boutique complète + Formation 20h offerte</p>
                      <p style={{ fontSize: size.lg, color: c.gold, fontFamily: f.display, fontWeight: 700, margin: `${sp[2]} 0` }}>1 490€</p>
                      <a href="https://buy.stripe.com/28EeV66yS6HZ3H92cjfEk00" target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-block', padding: `8px ${sp[3]}`, background: SERVICE_TYPES.creation.color,
                        color: '#fff', textDecoration: 'none', fontFamily: f.mono, fontSize: '11px', fontWeight: 700,
                      }}>
                        SOUSCRIRE
                      </a>
                    </div>
                    {/* Gestion — bientôt */}
                    <div style={{
                      background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[4],
                      textAlign: 'center', opacity: 0.5, position: 'relative', cursor: 'not-allowed',
                    }}>
                      <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '2px 8px', background: c.textTertiary, color: c.black, fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.08em' }}>BIENTÔT</div>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>⚙</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Gestion Mensuelle</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 ${sp[2]}` }}>Gestion récurrente de vos commandes</p>
                      <div style={{ padding: `8px ${sp[3]}`, background: c.textTertiary, color: c.black, fontFamily: f.mono, fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>BIENTÔT DISPONIBLE</div>
                    </div>
                    {/* Formation — gratuite, lien vers l'onglet */}
                    <div style={{
                      background: c.bgElevated, border: `1px solid ${c.purple}30`, padding: sp[4],
                      textAlign: 'center', position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '2px 8px', background: c.green, color: '#fff', fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.08em' }}>GRATUIT</div>
                      <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>🎓</div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Formation E-Commerce</h3>
                      <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 ${sp[2]}` }}>8 modules + 5 outils — offert à tous</p>
                      <button onClick={() => setViewMode('formation')} style={{
                        padding: `8px ${sp[3]}`, background: c.purple, color: '#fff', border: 'none',
                        fontFamily: f.mono, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        ACCÉDER GRATUITEMENT
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[4] }}>
                  {ecomServices.map((svc, idx) => {
                    const svcType = SERVICE_TYPES[svc.service_type] || SERVICE_TYPES.creation
                    const currentStepIdx = Math.max(0, svcType.steps.findIndex(s => s.key === svc.status))
                    return (
                      <div key={svc.id} style={{
                        background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[4],
                        position: 'relative', overflow: 'hidden',
                        animation: `cardReveal 0.5s ${ease.out} both`, animationDelay: `${idx * 80}ms`,
                      }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: svcType.color }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                            <span style={{ fontSize: size.xl }}>{svcType.icon}</span>
                            <div>
                              <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text }}>{svcType.label}</div>
                              <div style={{ fontSize: size.xs, color: c.textSecondary }}>{svc.shop_name || svc.platform || svc.pack || '—'}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: size.xs, color: c.textTertiary }}>{fmtDate(svc.created_at)}</div>
                        </div>

                        {/* Progress Steps */}
                        <div style={{ display: 'flex', gap: 0, marginBottom: sp[2] }}>
                          {svcType.steps.map((step, stepIdx) => (
                            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                              <div style={{
                                width: 24, height: 24,
                                background: stepIdx <= currentStepIdx ? svcType.color : c.bgSurface,
                                border: `2px solid ${stepIdx <= currentStepIdx ? svcType.color : c.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 700, color: stepIdx <= currentStepIdx ? '#fff' : c.textTertiary,
                                zIndex: 1,
                              }}>
                                {stepIdx < currentStepIdx ? '✓' : stepIdx + 1}
                              </div>
                              {stepIdx < svcType.steps.length - 1 && (
                                <div style={{
                                  position: 'absolute', top: 12, left: '60%', right: '-40%',
                                  height: 2, background: stepIdx < currentStepIdx ? svcType.color : c.border,
                                }} />
                              )}
                              <div style={{ fontSize: '8px', color: stepIdx <= currentStepIdx ? svcType.color : c.textTertiary, fontFamily: f.mono, marginTop: sp[1], textAlign: 'center', fontWeight: stepIdx === currentStepIdx ? 700 : 400, letterSpacing: '0.04em' }}>
                                {step.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ padding: `${sp[2]} ${sp[3]}`, background: `${svcType.color}08`, border: `1px solid ${svcType.color}20`, marginTop: sp[2] }}>
                          <div style={{ fontSize: size.xs, color: c.text }}>{svcType.steps[currentStepIdx]?.description || 'En cours de traitement'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : viewMode === 'boutique' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <SectionBanner
                title="Services E-commerce"
                subtitle="BOUTIQUE EN LIGNE"
                accentColor={c.teal}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3] }}>
                <button onClick={() => { setIsEcomSiteCreationOpen(true); setEcomStep(1) }} style={{
                  background: c.bgElevated, border: `2px solid ${c.teal}`, padding: sp[4],
                  cursor: 'pointer', textAlign: 'center', transition: `all 0.25s ${ease.luxury}`,
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.teal }}>
                  <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>🏪</div>
                  <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Créer mon site</h3>
                  <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Shopify, WooCommerce, PrestaShop</p>
                </button>

                {/* Gestion - Grisé Bientôt */}
                <div style={{
                  background: c.bgElevated, border: `2px solid ${c.border}`, padding: sp[4],
                  textAlign: 'center', opacity: 0.5, position: 'relative', cursor: 'not-allowed',
                }}>
                  <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '2px 8px', background: c.textTertiary, color: c.black, fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.06em' }}>
                    BIENTÔT
                  </div>
                  <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>⚙</div>
                  <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Gestion Mensuelle</h3>
                  <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Gestion récurrente de vos commandes</p>
                </div>

                {/* Packing - Grisé Bientôt */}
                <div style={{
                  background: c.bgElevated, border: `2px solid ${c.border}`, padding: sp[4],
                  textAlign: 'center', opacity: 0.5, position: 'relative', cursor: 'not-allowed',
                }}>
                  <div style={{ position: 'absolute', top: sp[2], right: sp[2], padding: '2px 8px', background: c.textTertiary, color: c.black, fontSize: '9px', fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.06em' }}>
                    BIENTÔT
                  </div>
                  <div style={{ fontSize: size.xl, marginBottom: sp[2] }}>📦</div>
                  <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>Packing & Fulfillment</h3>
                  <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `${sp[1]} 0 0` }}>Préparation et expédition</p>
                </div>
              </div>

              {/* Mes boutiques actives */}
              {ecomServices.filter(s => s.service_type === 'creation').length > 0 && (
                <div style={{ marginTop: sp[5] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600 }}>Mes boutiques</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                    {ecomServices.filter(s => s.service_type === 'creation').map(svc => {
                      const svcType = SERVICE_TYPES.creation
                      const stepIdx = Math.max(0, svcType.steps.findIndex(s => s.key === svc.status))
                      return (
                        <div key={svc.id} style={{
                          background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[3],
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                            <span style={{ fontSize: size.lg }}>🏪</span>
                            <div>
                              <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text }}>{svc.shop_name || 'Ma boutique'}</div>
                              <div style={{ fontSize: size.xs, color: c.textSecondary }}>{svc.platform || 'Shopify'}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '10px', fontFamily: f.mono, fontWeight: 700, color: svcType.color, padding: '4px 8px', background: `${svcType.color}15`, letterSpacing: '0.06em' }}>
                            {svcType.steps[stepIdx]?.label || 'En cours'}
                          </div>
                        </div>
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
        <div style={{ position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[5], maxWidth: 500, width: '90%', animation: `cardReveal 0.3s ${ease.out}` }}>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, margin: `0 0 ${sp[3]}`, fontWeight: 700 }}>Nouvelle commande</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], marginBottom: sp[3] }}>
              <input type="text" placeholder="Produit" value={newOrderForm.product} onChange={(e) => setNewOrderForm({ ...newOrderForm, product: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }} />
              <input type="number" placeholder="Quantité" value={newOrderForm.quantity} onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }} />
              <input type="text" placeholder="Budget" value={newOrderForm.budget} onChange={(e) => setNewOrderForm({ ...newOrderForm, budget: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }} />
              <textarea placeholder="Description" value={newOrderForm.description} onChange={(e) => setNewOrderForm({ ...newOrderForm, description: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, minHeight: 100, resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: sp[2] }}>
              <button onClick={handleCreateOrder} style={{ flex: 1, padding: '10px', background: c.gold, border: 'none', color: c.black, fontWeight: 700, cursor: 'pointer' }}>Créer</button>
              <button onClick={() => setIsNewOrderOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SITE CREATION MODAL ─── */}
      {isEcomSiteCreationOpen && (
        <div style={{ position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, padding: sp[5], maxWidth: 500, width: '90%', animation: `cardReveal 0.3s ${ease.out}` }}>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, margin: `0 0 ${sp[3]}`, fontWeight: 700 }}>Créer mon site e-commerce</h2>
            {ecomStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], marginBottom: sp[3] }}>
                <input type="text" placeholder="Nom de la boutique" value={siteCreationForm.shopName} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, shopName: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }} />
                <select value={siteCreationForm.platform} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, platform: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }}>
                  <option>Shopify</option>
                  <option>WooCommerce</option>
                  <option>PrestaShop</option>
                </select>
              </div>
            )}
            {ecomStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2], marginBottom: sp[3] }}>
                <input type="text" placeholder="Catégorie de produits" value={siteCreationForm.category} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, category: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }} />
                <select value={siteCreationForm.branding} onChange={(e) => setSiteCreationForm({ ...siteCreationForm, branding: e.target.value })} style={{ padding: '10px', background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body }}>
                  <option value="none">Pas de branding</option>
                  <option value="custom">Branding personnalisé</option>
                  <option value="premium">Branding premium</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: sp[2] }}>
              {ecomStep === 2 && (
                <button onClick={() => setEcomStep(1)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, cursor: 'pointer' }}>Retour</button>
              )}
              {ecomStep === 1 ? (
                <button onClick={() => setEcomStep(2)} style={{ flex: 1, padding: '10px', background: c.gold, border: 'none', color: c.black, fontWeight: 700, cursor: 'pointer' }}>Suivant</button>
              ) : (
                <button onClick={handleCreateSiteOrder} style={{ flex: 1, padding: '10px', background: c.gold, border: 'none', color: c.black, fontWeight: 700, cursor: 'pointer' }}>Envoyer</button>
              )}
              <button onClick={() => { setIsEcomSiteCreationOpen(false); setEcomStep(1) }} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING WHATSAPP BUTTON ─── */}
      <a href="https://wa.me/message/CARAXES" target="_blank" rel="noopener noreferrer" style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
        background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
        transition: `transform 0.25s ${ease.out}, box-shadow 0.25s ${ease.out}`,
        textDecoration: 'none',
      }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37, 211, 102, 0.4)' }}
         onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 211, 102, 0.3)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}
