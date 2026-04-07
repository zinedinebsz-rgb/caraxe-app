import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients, getAllProfiles, createOrder,
  subscribeToMessages, subscribeToOrders, supabase, updateProfile, resetPassword,
  getShipments, createShipment, updateShipment, deleteShipment, getInventory, updateInventoryItem, createInventoryItem, deleteInventoryItem,
  getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage,
  getCategories, createCategory, updateCategory, deleteCategory,
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
  const [passwordAction, setPasswordAction] = useState(null) // 'reset' | 'set' | 'reset-account' | 'done' | null
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [lastSetPassword, setLastSetPassword] = useState('') // password just set, for display
  const [shipments, setShipments] = useState([])
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', price_min: '', price_max: '', moq: '1', margin_estimate: '', tags: '', tier_keys: ['retail','wholesale','ecommerce'], active: true, featured: false })
  const [editingProduct, setEditingProduct] = useState(null)
  const [productUploading, setProductUploading] = useState(false)
  const productFileRef = useRef(null)
  const [showCreateShipment, setShowCreateShipment] = useState(false)
  const [createShipmentData, setCreateShipmentData] = useState({ client_id: '', tracking_number: '', method: 'maritime', destination: '', weight_kg: '', notes: '', status: 'production' })
  const [showCreateInventory, setShowCreateInventory] = useState(false)
  const [createInventoryData, setCreateInventoryData] = useState({ client_id: '', product_name: '', sku: '', quantity: '', alert_threshold: '10', warehouse: 'France', unit_price: '', notes: '' })
  const [editingShipment, setEditingShipment] = useState(null)
  const [editShipmentData, setEditShipmentData] = useState({})
  const [editingInventoryItem, setEditingInventoryItem] = useState(null)
  const [editInventoryData, setEditInventoryData] = useState({})
  const [expandedTier, setExpandedTier] = useState(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦', description: '', sort_order: 0, active: true, tier_keys: ['retail','wholesale','ecommerce'] })
  const [editingCategory, setEditingCategory] = useState(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)

  const loadAll = useCallback(async () => {
    const [ordersData, clientsData, profilesData, shipmentsData, inventoryData, productsData, categoriesData] = await Promise.all([getOrders(), getAllClients(), getAllProfiles(), getShipments(), getInventory(), getProducts(), getCategories()])
    setOrders(ordersData); setClients(clientsData); setAllProfiles(profilesData); setShipments(shipmentsData); setInventory(inventoryData); setProducts(productsData); setCategories(categoriesData); setLoading(false)
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
    const isDone = o.status === 6 || o.status === 'delivered' || o.status === 'livré' || o.status === 'completed' || o.status === 'livré'
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
      toast.error("Impossible d'envoyer le message.")
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
          // Auto-create shipment when order goes to "shipping" (index 5)
          if (statusIndex === 5) {
            const order = orders.find(o => o.id === selectedId)
            if (order) {
              const alreadyHasShipment = shipments.some(s => s.order_id === selectedId)
              if (!alreadyHasShipment) {
                try {
                  await createShipment({
                    client_id: order.client_id,
                    order_id: order.id,
                    product_name: order.product || null,
                    tracking_number: null,
                    method: 'maritime',
                    destination: order.city || 'France',
                    origin: 'Chine',
                    weight_kg: null,
                    notes: `Auto-créé depuis commande ${order.ref}`,
                    status: 0,
                  })
                  toast.success('Expédition créée automatiquement')
                } catch (shipErr) { console.warn('Auto-shipment failed:', shipErr) }
              }
            }
          }
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
    } catch (err) { toast.error("Erreur lors de l'envoi du fichier.") }
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

  const shipStatusToInt = { production: 0, QC: 1, douanes: 2, transit: 3, 'livré': 4 }
  const shipStatusToStr = ['production', 'QC', 'douanes', 'transit', 'livré']

  const handleCreateShipment = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!createShipmentData.client_id || !createShipmentData.destination) return
    try {
      await createShipment({
        client_id: createShipmentData.client_id,
        order_id: createShipmentData.order_id || null,
        product_name: createShipmentData.product_name || null,
        tracking_number: createShipmentData.tracking_number || null,
        method: createShipmentData.method,
        destination: createShipmentData.destination,
        origin: createShipmentData.origin || 'Chine',
        weight_kg: createShipmentData.weight_kg ? parseFloat(createShipmentData.weight_kg) : null,
        notes: createShipmentData.notes || null,
        status: shipStatusToInt[createShipmentData.status] ?? 0,
      })
      setCreateShipmentData({ client_id: '', order_id: '', product_name: '', tracking_number: '', method: 'maritime', destination: '', origin: 'Chine', weight_kg: '', notes: '', status: 'production' })
      setShowCreateShipment(false)
      await loadAll()
      toast.success('Envoi enregistré')
    } catch (err) { console.error('Create shipment error:', err); toast.error('Erreur: ' + (err?.message || "création impossible")) }
  }

  const handleCreateInventory = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!createInventoryData.client_id || !createInventoryData.product_name) return
    try {
      await createInventoryItem({
        client_id: createInventoryData.client_id,
        product_name: createInventoryData.product_name,
        sku: createInventoryData.sku || null,
        quantity: createInventoryData.quantity ? parseInt(createInventoryData.quantity) : 0,
        alert_threshold: createInventoryData.alert_threshold ? parseInt(createInventoryData.alert_threshold) : 10,
        warehouse: createInventoryData.warehouse || 'France',
        unit_price: createInventoryData.unit_price ? parseFloat(createInventoryData.unit_price) : null,
        notes: createInventoryData.notes || null,
      })
      setCreateInventoryData({ client_id: '', product_name: '', sku: '', quantity: '', alert_threshold: '10', warehouse: 'France', unit_price: '', notes: '' })
      setShowCreateInventory(false)
      await loadAll()
      toast.success('Article ajouté au stock')
    } catch (err) { toast.error("Erreur lors de la creation de l'article.") }
  }

  const handleSaveShipment = async () => {
    if (!editingShipment) return
    try {
      const payload = {}
      if (editShipmentData.tracking_number != null) payload.tracking_number = editShipmentData.tracking_number
      if (editShipmentData.method != null) payload.method = editShipmentData.method
      if (editShipmentData.destination != null) payload.destination = editShipmentData.destination
      if (editShipmentData.weight_kg != null) payload.weight_kg = editShipmentData.weight_kg ? parseFloat(editShipmentData.weight_kg) : null
      if (editShipmentData.status != null) payload.status = shipStatusToInt[editShipmentData.status] ?? (typeof editShipmentData.status === 'number' ? editShipmentData.status : 0)
      if (editShipmentData.notes != null) payload.notes = editShipmentData.notes
      if (editShipmentData.eta != null) payload.eta = editShipmentData.eta
      if (editShipmentData.origin != null) payload.origin = editShipmentData.origin
      await updateShipment(editingShipment.id, payload)
      setEditingShipment(null)
      await loadAll()
      toast.success('Envoi mis à jour')
    } catch (err) { toast.error('Erreur: ' + err.message) }
  }

  const handleDeleteShipment = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer cet envoi',
      message: 'Cette action est irréversible. Confirmer la suppression ?',
      onConfirm: async () => {
        setConfirmDialog({ open: false })
        try {
          await deleteShipment(id)
          await loadAll()
          toast.success('Envoi supprimé')
        } catch (err) { toast.error('Erreur: ' + err.message) }
      },
    })
  }

  const handleSaveInventory = async () => {
    if (!editingInventoryItem) return
    try {
      const payload = {}
      if (editInventoryData.product_name != null) payload.product_name = editInventoryData.product_name
      if (editInventoryData.sku != null) payload.sku = editInventoryData.sku
      if (editInventoryData.quantity != null) payload.quantity = parseInt(editInventoryData.quantity) || 0
      if (editInventoryData.alert_threshold != null) payload.alert_threshold = parseInt(editInventoryData.alert_threshold) || 10
      if (editInventoryData.warehouse != null) payload.warehouse = editInventoryData.warehouse
      if (editInventoryData.unit_price != null) payload.unit_price = editInventoryData.unit_price ? parseFloat(editInventoryData.unit_price) : null
      if (editInventoryData.notes != null) payload.notes = editInventoryData.notes
      await updateInventoryItem(editingInventoryItem.id, payload)
      setEditingInventoryItem(null)
      await loadAll()
      toast.success('Article mis à jour')
    } catch (err) { toast.error('Erreur: ' + err.message) }
  }

  const handleDeleteInventory = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer cet article',
      message: 'Cette action est irréversible. Confirmer la suppression ?',
      onConfirm: async () => {
        setConfirmDialog({ open: false })
        try {
          await deleteInventoryItem(id)
          await loadAll()
          toast.success('Article supprimé')
        } catch (err) { toast.error('Erreur: ' + err.message) }
      },
    })
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
    { key: 'overview', label: "Vue d'ensemble", icon: icons.trending },
    { key: 'commandes', label: 'Commandes', icon: icons.file },
    { key: 'catalogue', label: 'Catalogue', icon: icons.doc },
    { key: 'expedition', label: 'Expédition', icon: icons.send, color: c.teal },
    { key: 'stock', label: 'Stock & E-com', icon: icons.save, color: c.purple },
    { key: 'clients', label: 'Clients', icon: icons.users },
  ]

  const activeOrders = orders.filter(o => o.status !== 6 && o.status !== 'delivered').length
  const deliveredOrders = orders.filter(o => o.status === 6 || o.status === 'delivered' || o.status === 'livré').length

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
          .admin-scroll { padding: 12px !important; }
          .admin-product-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .admin-scroll { padding: 8px !important; }
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
          {mainTab === 'overview' && (() => {
            const shipmentsInTransit = shipments.filter(s => s.status === 'transit')
            const shipmentsWaiting = shipments.filter(s => s.status === 'production' || s.status === 'QC' || s.status === 'douanes')
            const lowStockItems = inventory.filter(item => (item.quantity || 0) <= (item.alert_threshold || 0))
            const ecomClients = allProfiles.filter(p => p.client_tier === 'ecommerce')
            const stockClients = allProfiles.filter(p => (p.services_enabled || []).includes('stock'))
            const logisticsClients = allProfiles.filter(p => (p.services_enabled || []).includes('logistics'))
            const grossistes = allProfiles.filter(p => p.client_tier === 'grossiste')
            const detaillants = allProfiles.filter(p => p.client_tier === 'retail')
            const thisMonth = orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth() && new Date(o.created_at).getFullYear() === new Date().getFullYear())
            const stockValue = inventory.reduce((acc, item) => acc + ((item.unit_price || 0) * (item.quantity || 0)), 0)
            const totalQty = inventory.reduce((acc, item) => acc + (item.quantity || 0), 0)
            const unreadMsgs = messages.filter(m => m.receiver_id === user?.id && !m.read).length

            return (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              {/* Welcome + Backup */}
              <div style={{ marginBottom: sp[4], animation: 'fadeSlideIn 0.5s ease-out', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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

              {/* ── ALERTES URGENTES ── */}
              {(lowStockItems.length > 0 || unreadMsgs > 0 || shipmentsWaiting.length > 0) && (
                <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[4], flexWrap: 'wrap', animation: 'fadeSlideIn 0.4s ease-out' }}>
                  {lowStockItems.length > 0 && (
                    <div onClick={() => setMainTab('stock')} style={{
                      padding: `${sp[2]} ${sp[3]}`, background: `${c.red}10`, border: `1px solid ${c.red}30`,
                      display: 'flex', alignItems: 'center', gap: sp[2], cursor: 'pointer',
                      transition: `all 0.2s ${ease.smooth}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${c.red}20` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${c.red}10` }}>
                      <span style={{ fontSize: '14px' }}>⚠</span>
                      <span style={{ fontSize: size.xs, color: c.red, fontWeight: 600 }}>{lowStockItems.length} alerte{lowStockItems.length > 1 ? 's' : ''} stock bas</span>
                    </div>
                  )}
                  {unreadMsgs > 0 && (
                    <div style={{
                      padding: `${sp[2]} ${sp[3]}`, background: `${c.gold}10`, border: `1px solid ${c.gold}30`,
                      display: 'flex', alignItems: 'center', gap: sp[2],
                    }}>
                      <Icon d={icons.msg} size={14} color={c.gold} />
                      <span style={{ fontSize: size.xs, color: c.gold, fontWeight: 600 }}>{unreadMsgs} message{unreadMsgs > 1 ? 's' : ''} non lu{unreadMsgs > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {shipmentsWaiting.length > 0 && (
                    <div onClick={() => setMainTab('expedition')} style={{
                      padding: `${sp[2]} ${sp[3]}`, background: `${c.teal}10`, border: `1px solid ${c.teal}30`,
                      display: 'flex', alignItems: 'center', gap: sp[2], cursor: 'pointer',
                      transition: `all 0.2s ${ease.smooth}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${c.teal}20` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${c.teal}10` }}>
                      <Icon d={icons.send} size={14} color={c.teal} />
                      <span style={{ fontSize: size.xs, color: c.teal, fontWeight: 600 }}>{shipmentsWaiting.length} envoi{shipmentsWaiting.length > 1 ? 's' : ''} en attente</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── STATS PRINCIPALES (6 cards) ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: sp[3], marginBottom: sp[4] }}>
                {[
                  { label: 'Clients', value: allProfiles.length, color: c.gold, sub: `${grossistes.length} grossistes · ${detaillants.length} détaillants · ${ecomClients.length} e-com`, click: () => setMainTab('clients') },
                  { label: 'Commandes', value: orders.length, color: c.red, sub: `${activeOrders} en cours · ${deliveredOrders} livrées`, click: () => setMainTab('commandes') },
                  { label: 'Ce mois', value: thisMonth.length, color: c.blue, sub: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), click: () => setMainTab('commandes') },
                  { label: 'Expéditions', value: shipments.length, color: c.teal, sub: `${shipmentsInTransit.length} en transit · ${shipmentsWaiting.length} en attente`, click: () => setMainTab('expedition') },
                  { label: 'Stock (articles)', value: inventory.length, color: c.purple, sub: `${totalQty} unités · ${lowStockItems.length} alertes`, click: () => setMainTab('stock') },
                  { label: 'Valeur stock', value: `${stockValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`, color: c.gold, sub: `${stockClients.length} client${stockClients.length > 1 ? 's' : ''} service stock`, click: () => setMainTab('stock') },
                ].map((stat, i) => (
                  <div key={i} onClick={stat.click} style={{
                    padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                    position: 'relative', overflow: 'hidden', cursor: 'pointer',
                    transition: `all 0.35s ${ease.luxury}`,
                    animation: `cardReveal 0.5s ${ease.out} ${i * 80}ms both`,
                    boxShadow: shadow.card,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = shadow.cardHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadow.card }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${stat.color}, transparent)`, opacity: 0.7 }} />
                    <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: sp[1] }}>
                      {stat.label}
                    </div>
                    <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono, marginTop: sp[1], letterSpacing: '0.02em', lineHeight: 1.4 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── CLIENTS PAR SERVICE ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[3], marginBottom: sp[4], animation: 'fadeSlideIn 0.5s ease-out 0.15s both' }}>
                {[
                  { label: 'Sourcing', desc: 'Recherche fournisseurs & négociation', count: allProfiles.length, icon: '◆', color: c.red, note: 'Inclus pour tous' },
                  { label: 'Expédition', desc: 'Logistique Chine → France', count: logisticsClients.length, icon: '▸', color: c.teal, note: `${logisticsClients.length} client${logisticsClients.length > 1 ? 's' : ''} actif${logisticsClients.length > 1 ? 's' : ''}` },
                  { label: 'Stock & E-com', desc: 'Stockage + gestion boutique en ligne', count: stockClients.length, icon: '⬡', color: c.purple, note: `${stockClients.length} client${stockClients.length > 1 ? 's' : ''} · ${inventory.length} réf.` },
                ].map((svc, i) => (
                  <div key={i} style={{
                    padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: svc.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[1] }}>
                      <span style={{ fontSize: '12px', color: svc.color }}>{svc.icon}</span>
                      <span style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: svc.color }}>{svc.label}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: c.textSecondary, lineHeight: 1.4, margin: 0, marginBottom: sp[2] }}>{svc.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: sp[1], borderTop: `1px solid ${c.borderSubtle}` }}>
                      <span style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: svc.color }}>{svc.count}</span>
                      <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{svc.note}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── PIPELINE ── */}
              <div style={{ marginBottom: sp[4], padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, animation: 'fadeSlideIn 0.5s ease-out 0.2s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
                  <div>
                    <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 600, letterSpacing: '-0.01em' }}>Pipeline Commandes</h3>
                    <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono, marginTop: '2px', letterSpacing: '0.04em' }}>Répartition par statut</div>
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.gold }}>{orders.length}</div>
                </div>
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

              {/* ── EXPÉDITIONS ACTIVES + STOCK E-COM (2 colonnes) ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3], marginBottom: sp[4], animation: 'fadeSlideIn 0.5s ease-out 0.25s both' }}>

                {/* Expéditions liées aux commandes */}
                <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.teal, opacity: 0.6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                      <Icon d={icons.send} size={16} color={c.teal} />
                      <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Expéditions</span>
                    </div>
                    <button onClick={() => setMainTab('expedition')} style={{
                      padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                      color: c.teal, fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
                      cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.teal }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                      Voir tout →
                    </button>
                  </div>
                  <p style={{ fontSize: '10px', color: c.textTertiary, marginBottom: sp[2], lineHeight: 1.4 }}>
                    Envois liés aux commandes en cours — suivi logistique Chine → France
                  </p>
                  {shipments.length === 0 ? (
                    <div style={{ padding: sp[3], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
                      Aucun envoi — créez un envoi depuis l'onglet Expédition
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {shipments.slice(0, 5).map((s, i) => (
                        <div key={s.id || i} onClick={() => setMainTab('expedition')} style={{
                          padding: `${sp[1]} ${sp[2]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: c.bgElevated, cursor: 'pointer', transition: `background 0.15s ${ease.smooth}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.bg }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.bgElevated }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.teal, fontWeight: 600 }}>{s.tracking_number || '—'}</span>
                            <span style={{ fontSize: size.xs, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName(s.client_id)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                            <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{s.method || ''}</span>
                            <span style={{
                              padding: '2px 6px', fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
                              background: s.status === 'livré' ? `${c.green}15` : s.status === 'transit' ? `${c.gold}15` : `${c.red}15`,
                              color: s.status === 'livré' ? c.green : s.status === 'transit' ? c.gold : c.red,
                            }}>{s.status || '?'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stock & E-commerce */}
                <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.purple, opacity: 0.6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                      <Icon d={icons.save} size={16} color={c.purple} />
                      <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Stock & E-commerce</span>
                    </div>
                    <button onClick={() => setMainTab('stock')} style={{
                      padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                      color: c.purple, fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
                      cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.purple }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                      Voir tout →
                    </button>
                  </div>
                  <p style={{ fontSize: '10px', color: c.textTertiary, marginBottom: sp[2], lineHeight: 1.4 }}>
                    Inventaire des clients qui nous confient le stockage et la gestion de leur boutique e-commerce
                  </p>
                  {inventory.length === 0 ? (
                    <div style={{ padding: sp[3], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
                      Aucun article — les clients e-com avec service Stock apparaîtront ici
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {inventory.slice(0, 5).map((item, i) => {
                        const isLow = (item.quantity || 0) <= (item.alert_threshold || 0)
                        return (
                          <div key={item.id || i} onClick={() => setMainTab('stock')} style={{
                            padding: `${sp[1]} ${sp[2]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: isLow ? `${c.red}08` : c.bgElevated, cursor: 'pointer',
                            transition: `background 0.15s ${ease.smooth}`,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.bg }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isLow ? `${c.red}08` : c.bgElevated }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: size.xs, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{item.product_name}</span>
                              {item.sku && <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{item.sku}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                              <span style={{ fontSize: size.xs, fontFamily: f.mono, fontWeight: 600, color: isLow ? c.red : c.text }}>{item.quantity || 0} u.</span>
                              {isLow && <span style={{ fontSize: '8px', padding: '1px 4px', background: `${c.red}20`, color: c.red, fontFamily: f.mono, fontWeight: 700 }}>BAS</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── ACTIVITÉ RÉCENTE ── */}
              <div style={{ animation: 'fadeSlideIn 0.5s ease-out 0.3s both' }}>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Activité récente
                </h3>
                <ArtDecoDivider width={80} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: sp[2] }}>
                  {orders.length === 0 ? (
                    <DragonEmptyState title="Pas de commandes" subtitle="Créez votre première commande pour voir l'activité ici" />
                  ) : (
                    orders.slice(0, 10).map((order, i) => {
                      const orderShipments = shipments.filter(s => s.client_id === order.client_id)
                      const hasShipment = orderShipments.length > 0
                      return (
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
                            {hasShipment && <span style={{ fontSize: '9px', padding: '1px 5px', background: `${c.teal}15`, color: c.teal, fontFamily: f.mono, fontWeight: 600, flexShrink: 0 }}>📦 {orderShipments.length}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                            <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{fmtDate(order.created_at)}</span>
                            <StatusPill status={order.status} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            )
          })()}

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
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>Catalogue Produits</h2>
                  <ArtDecoDivider width={100} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                    {products.length} produit{products.length > 1 ? 's' : ''} personnalisé{products.length > 1 ? 's' : ''} · {TIERS.length} profils · {(() => { const s = new Set(); TIERS.forEach(t => getCatalog(t.key).forEach(ct => s.add(ct.id))); return s.size })()} catégories
                  </p>
                </div>
                <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', category: '', price_min: '', price_max: '', moq: '1', margin_estimate: '', tags: '', tier_keys: ['retail','wholesale','ecommerce'], active: true, featured: false }); setShowProductModal(true) }} style={{
                  padding: `10px ${sp[3]}`, background: c.red, color: c.text, border: 'none',
                  fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  transition: `all 0.3s ${ease.out}`, display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Icon d={icons.plus} size={16} color={c.text} />
                  Nouveau produit
                </button>
              </div>

              {/* Search bar */}
              <div style={{ marginBottom: sp[4], position: 'relative' }}>
                <Icon d={icons.search} size={14} color={c.textTertiary} />
                <input type="text" value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Rechercher un produit, une catégorie..."
                  style={{ ...inputStyle, paddingLeft: sp[5] }}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              {/* ═══ SECTION 1: PRODUITS PERSONNALISÉS (Supabase) ═══ */}
              <div style={{ marginBottom: sp[5] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[3] }}>
                  <div style={{ width: 24, height: '1px', background: c.red }} />
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.red, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Produits personnalisés
                  </span>
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary }}>({products.length})</span>
                </div>

                {products.length === 0 ? (
                  <div style={{ padding: sp[4], textAlign: 'center', color: c.textTertiary, background: c.bgSurface, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: '32px', marginBottom: sp[1], opacity: 0.3 }}>📦</div>
                    <p style={{ fontSize: size.sm, fontWeight: 600, marginBottom: sp[1] }}>Aucun produit personnalisé</p>
                    <p style={{ fontSize: size.xs, color: c.textTertiary, maxWidth: 400, margin: '0 auto' }}>
                      Cliquez sur « Nouveau produit » pour ajouter des produits au catalogue client.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {products.filter(p => !catalogSearch || p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category?.toLowerCase().includes(catalogSearch.toLowerCase())).map((prod, i) => (
                      <div key={prod.id} style={{
                        background: c.bgSurface, border: `1px solid ${c.border}`, overflow: 'hidden',
                        transition: `all 0.3s ${ease.out}`, cursor: 'pointer', opacity: prod.active ? 1 : 0.5,
                        animation: `fadeSlideIn 0.3s ease-out ${i * 50}ms both`,
                      }}
                      onClick={() => {
                        setEditingProduct(prod)
                        setProductForm({
                          name: prod.name || '', description: prod.description || '', category: prod.category || '',
                          price_min: prod.price_min || '', price_max: prod.price_max || '', moq: prod.moq || '1',
                          margin_estimate: prod.margin_estimate || '', tags: (prod.tags || []).join(', '),
                          tier_keys: prod.tier_keys || ['retail','wholesale','ecommerce'],
                          active: prod.active !== false, featured: prod.featured || false,
                        })
                        setShowProductModal(true)
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                        <div style={{ height: 160, background: c.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                          {prod.image_urls?.[0] ? (
                            <img src={prod.image_urls[0]} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '40px', opacity: 0.2 }}>📷</span>
                          )}
                          {prod.featured && (
                            <span style={{ position: 'absolute', top: 8, right: 8, background: c.gold, color: c.black, fontSize: '9px', fontWeight: 700, padding: '2px 8px', fontFamily: f.mono }}>STAR</span>
                          )}
                          {!prod.active && (
                            <span style={{ position: 'absolute', top: 8, left: 8, background: c.red, color: c.white, fontSize: '9px', fontWeight: 700, padding: '2px 8px', fontFamily: f.mono }}>INACTIF</span>
                          )}
                        </div>
                        <div style={{ padding: sp[2] }}>
                          <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, marginBottom: '4px' }}>{prod.name}</div>
                          {prod.category && <span style={{ fontSize: '9px', color: c.gold, fontFamily: f.mono, padding: '1px 6px', background: c.goldSoft, border: `1px solid ${c.gold}33` }}>{prod.category}</span>}
                          {prod.description && <p style={{ fontSize: '11px', color: c.textSecondary, marginTop: '6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.description}</p>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${c.borderSubtle}` }}>
                          {[
                            { label: 'Prix', value: prod.price_min && prod.price_max ? `${prod.price_min}-${prod.price_max}` : prod.price_min || '-', color: c.green },
                            { label: 'Marge', value: prod.margin_estimate || '-', color: c.gold },
                            { label: 'MOQ', value: prod.moq || '-', color: c.amber },
                          ].map((cell, j) => (
                            <div key={j} style={{ padding: `${sp[1]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.xs, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ SECTION 2: CATALOGUE PAR PROFIL (interactif) ═══ */}
              <div style={{ marginBottom: sp[4] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[3] }}>
                  <div style={{ width: 24, height: '1px', background: c.gold }} />
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Catalogue par profil client
                  </span>
                </div>
                <p style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3], lineHeight: 1.5 }}>
                  Catalogue statique affiché aux clients selon leur profil. Cliquez sur un profil pour voir les catégories, produits phares, prix et MOQ.
                </p>

                {/* Tier selector pills */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: sp[3], flexWrap: 'wrap' }}>
                  {TIERS.map(tier => (
                    <button key={tier.key} onClick={() => setExpandedTier(expandedTier === tier.key ? null : tier.key)} style={{
                      padding: `8px ${sp[3]}`, border: `1px solid ${expandedTier === tier.key ? tier.color : c.border}`,
                      background: expandedTier === tier.key ? `${tier.color}15` : c.bgSurface,
                      color: expandedTier === tier.key ? tier.color : c.textSecondary,
                      fontFamily: f.body, fontSize: size.sm, fontWeight: expandedTier === tier.key ? 700 : 500,
                      cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                    onMouseEnter={(e) => { if (expandedTier !== tier.key) { e.currentTarget.style.borderColor = tier.color; e.currentTarget.style.color = tier.color } }}
                    onMouseLeave={(e) => { if (expandedTier !== tier.key) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary } }}>
                      <span style={{ fontSize: '16px' }}>{tier.icon}</span>
                      {tier.label}
                      <span style={{ fontFamily: f.mono, fontSize: '9px', opacity: 0.7 }}>{getCatalog(tier.key).length}</span>
                      <span style={{ fontSize: '10px', transform: expandedTier === tier.key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                    </button>
                  ))}
                </div>

                {/* Expanded tier categories */}
                {expandedTier && (() => {
                  const tier = TIERS.find(t => t.key === expandedTier)
                  const cats = getCatalog(expandedTier).filter(cat => !catalogSearch || cat.name.toLowerCase().includes(catalogSearch.toLowerCase()) || cat.topProducts?.some(p => p.toLowerCase().includes(catalogSearch.toLowerCase())))
                  if (!tier) return null
                  return (
                    <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                      {/* Tier info bar */}
                      <div style={{ display: 'flex', gap: sp[3], padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Commande min.</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: tier.color }}>{tier.minOrderValue.toLocaleString('fr-FR')}€</div>
                        </div>
                        <div style={{ width: '1px', background: c.border }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Catégories</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.text }}>{cats.length}</div>
                        </div>
                        <div style={{ width: '1px', background: c.border }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Multiplicateur</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.gold }}>×{tier.priceMultiplier}</div>
                        </div>
                      </div>

                      {/* Category cards grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: sp[3] }}>
                        {cats.map((cat, ci) => (
                          <div key={cat.id} style={{
                            background: c.bgSurface, border: `1px solid ${c.border}`, overflow: 'hidden',
                            animation: `fadeSlideIn 0.3s ease-out ${ci * 40}ms both`,
                            transition: `all 0.2s ${ease.smooth}`,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = tier.color }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                            {/* Category header */}
                            <div style={{ padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'center', gap: sp[2] }}>
                              <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, color: c.text }}>{cat.name}</div>
                                <div style={{ fontSize: '11px', color: c.textSecondary, lineHeight: 1.4, marginTop: '2px' }}>{cat.description}</div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${c.borderSubtle}` }}>
                              {[
                                { label: 'Prix', value: getTierPrice(cat, expandedTier), color: c.green },
                                { label: 'MOQ', value: getTierMOQ(cat, expandedTier), color: c.amber },
                                { label: 'Marge', value: cat.margin || '-', color: c.gold },
                              ].map((cell, j) => (
                                <div key={j} style={{ padding: `${sp[1]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'center' }}>
                                  <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                                  <div style={{ fontFamily: f.mono, fontSize: size.xs, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Top products */}
                            {cat.topProducts && cat.topProducts.length > 0 && (
                              <div style={{ padding: `${sp[2]} ${sp[3]}` }}>
                                <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Produits phares</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {cat.topProducts.map((tp, tpi) => (
                                    <span key={tpi} style={{
                                      padding: '2px 8px', background: c.bgElevated, border: `1px solid ${c.borderSubtle}`,
                                      fontSize: '10px', color: c.textSecondary, fontFamily: f.body,
                                    }}>{tp}</span>
                                  ))}
                                </div>
                                {cat.locations && (
                                  <div style={{ marginTop: '6px', fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
                                    📍 {cat.locations.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* ═══ SECTION 3: GESTION DES CATEGORIES ═══ */}
              <div style={{ marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <div style={{ width: 24, height: '1px', background: c.gold }} />
                    <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      Gestion des categories
                    </span>
                  </div>
                  <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', icon: '📦', description: '', sort_order: 0, active: true, tier_keys: ['retail','wholesale','ecommerce'] }); setShowCategoryModal(true) }} style={{
                    padding: `8px ${sp[3]}`, background: c.red, color: c.text, border: 'none',
                    fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                    transition: `all 0.3s ${ease.out}`, display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
                    <Icon d={icons.plus} size={16} color={c.text} />
                    Nouvelle categorie
                  </button>
                </div>
                <p style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3], lineHeight: 1.5 }}>
                  Gérez les catégories de produits utilisées dans le catalogue client.
                </p>

                {categories.length === 0 ? (
                  <DragonEmptyState title="Aucune categorie" subtitle="Crée votre premiere categorie pour organiser le catalogue" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {categories.map((cat, idx) => {
                      const productCount = products.filter(p => p.category === cat.name).length
                      return (
                        <div key={cat.id} style={{
                          background: c.bgSurface, border: `1px solid ${c.border}`, overflow: 'hidden',
                          animation: `fadeSlideIn 0.3s ease-out ${idx * 40}ms both`,
                          transition: `all 0.2s ${ease.smooth}`,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.boxShadow = `0 4px 12px ${c.gold}22` }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = 'none' }}>
                          {/* Category header */}
                          <div style={{ padding: sp[3], borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'flex-start', gap: sp[2], justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: '6px' }}>
                                <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, color: c.text }}>{cat.name}</div>
                                  {!cat.active && <span style={{ fontSize: '9px', color: c.red, fontFamily: f.mono, fontWeight: 600 }}>INACTIVE</span>}
                                </div>
                              </div>
                              {cat.description && <p style={{ fontSize: '11px', color: c.textSecondary, lineHeight: 1.4 }}>{cat.description}</p>}
                            </div>
                          </div>

                          {/* Stats */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${c.borderSubtle}` }}>
                            <div style={{ padding: `${sp[1]} ${sp[2]}`, borderRight: `1px solid ${c.borderSubtle}`, textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Produits</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.gold }}>{productCount}</div>
                            </div>
                            <div style={{ padding: `${sp[1]} ${sp[2]}`, textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Ordre</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.amber }}>{cat.sort_order}</div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ padding: sp[2], display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon, description: cat.description || '', sort_order: cat.sort_order || 0, active: cat.active, tier_keys: cat.tier_keys || ['retail','wholesale','ecommerce'] }); setShowCategoryModal(true) }} style={{
                              flex: 1, padding: '6px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = `${c.gold}11` }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
                              <Icon d={icons.edit} size={12} /> Editer
                            </button>
                            <button onClick={async () => {
                              if (!confirm(`Supprimer la categorie "${cat.name}" ?`)) return
                              try {
                                await deleteCategory(cat.id)
                                await loadAll()
                                toast.success('Categorie supprimee')
                              } catch (err) { toast.error('Erreur: ' + err.message) }
                            }} style={{
                              flex: 1, padding: '6px', background: 'transparent', border: `1px solid ${c.red}33`, color: c.red, fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.background = `${c.red}11` }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.red}33`; e.currentTarget.style.background = 'transparent' }}>
                              <Icon d={icons.trash} size={12} /> Supprimer
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── CATEGORY DETAIL/EDIT MODAL ── */}
              {showCategoryModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: c.bgOverlay, zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
                  animation: 'fadeSlideIn 0.2s ease-out',
                }} onClick={() => setShowCategoryModal(false)}>
                  <div style={{
                    background: c.bgBase, border: `1px solid ${c.border}`, width: '90%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto',
                    borderRadius: '2px', animation: 'cardReveal 0.3s ease-out',
                  }} onClick={e => e.stopPropagation()}>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      try {
                        if (editingCategory) {
                          await updateCategory(editingCategory.id, categoryForm)
                          toast.success('Categorie mise a jour')
                        } else {
                          await createCategory(categoryForm)
                          toast.success('Categorie creee')
                        }
                        setShowCategoryModal(false)
                        await loadAll()
                      } catch (err) { toast.error('Erreur: ' + err.message) }
                    }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ padding: sp[4], borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0 }}>
                          {editingCategory ? 'Editer la categorie' : 'Nouvelle categorie'}
                        </h3>
                        <button type="button" onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
                          <Icon d={icons.close} size={20} color={c.textSecondary} />
                        </button>
                      </div>

                      <div style={{ flex: 1, padding: sp[4], overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                        <div>
                          <label style={labelStyle}>Nom *</label>
                          <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                            placeholder="Ex: Textile, Alimentaire..." style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div>
                          <label style={labelStyle}>Icone (emoji)</label>
                          <input type="text" maxLength="2" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})}
                            placeholder="📦" style={{...inputStyle, fontSize: '18px', textAlign: 'center'}}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          <div style={{ fontSize: '9px', color: c.textTertiary, marginTop: '4px' }}>Entrez un emoji ou copiez/collez le votre</div>
                        </div>

                        <div>
                          <label style={labelStyle}>Description</label>
                          <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                            placeholder="Description de la categorie..." style={{...inputStyle, minHeight: '60px', fontFamily: f.body}}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div>
                          <label style={labelStyle}>Ordre de tri</label>
                          <input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({...categoryForm, sort_order: parseInt(e.target.value) || 0})}
                            placeholder="0" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          <div style={{ fontSize: '9px', color: c.textTertiary, marginTop: '4px' }}>Ordre d'affichage (ascendant)</div>
                        </div>

                        <div>
                          <label style={{ ...labelStyle, marginBottom: sp[2] }}>Tiers disponibles</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['retail', 'wholesale', 'ecommerce'].map(tier => (
                              <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                                <input type="checkbox" checked={categoryForm.tier_keys.includes(tier)} onChange={e => {
                                  if (e.target.checked) {
                                    setCategoryForm({...categoryForm, tier_keys: [...categoryForm.tier_keys, tier]})
                                  } else {
                                    setCategoryForm({...categoryForm, tier_keys: categoryForm.tier_keys.filter(t => t !== tier)})
                                  }
                                }} />
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                          <input type="checkbox" checked={categoryForm.active} onChange={e => setCategoryForm({...categoryForm, active: e.target.checked})} />
                          Actif (visible aux clients)
                        </label>
                      </div>

                      <div style={{ padding: sp[4], borderTop: `1px solid ${c.border}`, display: 'flex', gap: sp[2] }}>
                        {editingCategory && (
                          <button type="button" onClick={async () => {
                            if (!confirm('Supprimer cette categorie ?')) return
                            try {
                              await deleteCategory(editingCategory.id)
                              setShowCategoryModal(false)
                              await loadAll()
                              toast.success('Categorie supprimee')
                            } catch (err) { toast.error('Erreur: ' + err.message) }
                          }} style={{
                            padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                            border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                            Supprimer
                          </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button type="button" onClick={() => setShowCategoryModal(false)} style={{
                          padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                          border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button type="submit" style={{
                          padding: `10px ${sp[3]}`, background: c.red, color: c.text,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: 'pointer', transition: `all 0.3s ${ease.out}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
                          {editingCategory ? 'Sauvegarder' : 'Creer la categorie'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── PRODUCT DETAIL/EDIT MODAL ── */}
              {showProductModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: c.bgOverlay, zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
                  animation: 'fadeSlideIn 0.2s ease-out',
                }} onClick={() => setShowProductModal(false)}>
                  <div style={{
                    background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
                    maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
                    animation: 'fadeSlideIn 0.3s ease-out',
                  }} onClick={(e) => e.stopPropagation()} className="admin-scroll">
                    <button onClick={() => setShowProductModal(false)} style={{
                      position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
                      color: c.textTertiary, cursor: 'pointer', padding: 0, width: '28px', height: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = c.red }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = c.textTertiary }}>
                      <Icon d={icons.close} size={16} />
                    </button>

                    <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px' }}>
                      {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                    </h2>
                    <ArtDecoDivider width={80} />

                    {/* Image upload section */}
                    {editingProduct && (
                      <div style={{ marginTop: sp[3], marginBottom: sp[3] }}>
                        <label style={labelStyle}>Images</label>
                        <div style={{ display: 'flex', gap: sp[2], flexWrap: 'wrap', marginBottom: sp[1] }}>
                          {(editingProduct.image_urls || []).map((url, i) => (
                            <div key={i} style={{ width: 80, height: 80, position: 'relative', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button onClick={async () => {
                                await deleteProductImage(url)
                                const newUrls = editingProduct.image_urls.filter((_, j) => j !== i)
                                await updateProduct(editingProduct.id, { image_urls: newUrls })
                                setEditingProduct({ ...editingProduct, image_urls: newUrls })
                                toast.success('Image supprimée')
                              }} style={{
                                position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none',
                                color: c.white, cursor: 'pointer', width: 18, height: 18, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>x</button>
                            </div>
                          ))}
                          <button onClick={() => productFileRef.current?.click()} disabled={productUploading} style={{
                            width: 80, height: 80, border: `2px dashed ${c.border}`, background: 'transparent',
                            color: c.textTertiary, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', fontSize: '10px', gap: '4px',
                          }}>
                            <Icon d={icons.plus} size={16} color={c.textTertiary} />
                            {productUploading ? '...' : 'Photo'}
                          </button>
                        </div>
                        <input ref={productFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !editingProduct) return
                          setProductUploading(true)
                          try {
                            const url = await uploadProductImage(file, editingProduct.id)
                            const newUrls = [...(editingProduct.image_urls || []), url]
                            await updateProduct(editingProduct.id, { image_urls: newUrls })
                            setEditingProduct({ ...editingProduct, image_urls: newUrls })
                            toast.success('Image ajoutée')
                          } catch (err) { toast.error("Erreur upload: " + err.message) }
                          setProductUploading(false)
                          e.target.value = ''
                        }} />
                      </div>
                    )}

                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      if (!productForm.name.trim()) return
                      const payload = {
                        name: productForm.name, description: productForm.description, category: productForm.category,
                        price_min: productForm.price_min ? parseFloat(productForm.price_min) : null,
                        price_max: productForm.price_max ? parseFloat(productForm.price_max) : null,
                        moq: productForm.moq ? parseInt(productForm.moq) : 1,
                        margin_estimate: productForm.margin_estimate,
                        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                        tier_keys: productForm.tier_keys,
                        active: productForm.active, featured: productForm.featured,
                      }
                      try {
                        if (editingProduct) {
                          await updateProduct(editingProduct.id, payload)
                          toast.success('Produit mis à jour')
                        } else {
                          await createProduct(payload)
                          toast.success('Produit créé')
                        }
                        setShowProductModal(false)
                        await loadAll()
                      } catch (err) { toast.error('Erreur: ' + err.message) }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
                      <div>
                        <label style={labelStyle}>Nom du produit *</label>
                        <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                          placeholder="Ex: Tapis de priere premium" style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                      </div>

                      <div>
                        <label style={labelStyle}>Description</label>
                        <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}
                          placeholder="Description du produit..." style={{...inputStyle, minHeight: '60px', fontFamily: f.body}}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                        <div>
                          <label style={labelStyle}>Catégorie</label>
                          <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                            <option value="">Selectionner une categorie</option>
                            {categories.filter(c => c.active).map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>MOQ</label>
                          <input type="number" value={productForm.moq} onChange={e => setProductForm({...productForm, moq: e.target.value})}
                            placeholder="1" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                        <div>
                          <label style={labelStyle}>Prix min (CNY)</label>
                          <input type="number" step="0.01" value={productForm.price_min} onChange={e => setProductForm({...productForm, price_min: e.target.value})}
                            placeholder="0" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Prix max (CNY)</label>
                          <input type="number" step="0.01" value={productForm.price_max} onChange={e => setProductForm({...productForm, price_max: e.target.value})}
                            placeholder="0" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Marge estimée</label>
                          <input type="text" value={productForm.margin_estimate} onChange={e => setProductForm({...productForm, margin_estimate: e.target.value})}
                            placeholder="x3-x5" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Tags (separes par virgule)</label>
                        <input type="text" value={productForm.tags} onChange={e => setProductForm({...productForm, tags: e.target.value})}
                          placeholder="halal, premium, bestseller" style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                      </div>

                      {/* Toggles */}
                      <div style={{ display: 'flex', gap: sp[3] }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                          <input type="checkbox" checked={productForm.active} onChange={e => setProductForm({...productForm, active: e.target.checked})} />
                          Actif (visible clients)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                          <input type="checkbox" checked={productForm.featured} onChange={e => setProductForm({...productForm, featured: e.target.checked})} />
                          Mis en avant
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                        {editingProduct && (
                          <button type="button" onClick={async () => {
                            if (!confirm('Supprimer ce produit ?')) return
                            try {
                              for (const url of (editingProduct.image_urls || [])) { await deleteProductImage(url) }
                              await deleteProduct(editingProduct.id)
                              setShowProductModal(false)
                              await loadAll()
                              toast.success('Produit supprime')
                            } catch (err) { toast.error('Erreur: ' + err.message) }
                          }} style={{
                            padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                            border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                            Supprimer
                          </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button type="button" onClick={() => setShowProductModal(false)} style={{
                          padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                          border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button type="submit" style={{
                          padding: `10px ${sp[3]}`, background: c.red, color: c.text,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: 'pointer', transition: `all 0.3s ${ease.out}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
                          {editingProduct ? 'Sauvegarder' : 'Creer le produit'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXPEDITION TAB ── */}
          {mainTab === 'expedition' && (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Expédition & Logistique
                  </h2>
                  <ArtDecoDivider width={80} color={c.teal} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                    Suivi des envois et logistique
                  </p>
                </div>
                <button onClick={() => setShowCreateShipment(true)} style={{
                  padding: `10px ${sp[3]}`, background: c.teal, color: c.text, border: 'none',
                  fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  transition: `all 0.3s ${ease.out}`, display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '3px', boxShadow: shadow.md,
                }}>
                  <Icon d={icons.plus} size={16} color={c.text} />
                  Nouvel envoi
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: sp[3], marginBottom: sp[4] }}>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.05s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>TOTAL ENVOIS</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.teal }}>{shipments.length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.1s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>EN TRANSIT</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.gold }}>{shipments.filter(s => s.status === 'transit').length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.15s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>LIVRÉS</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.teal }}>{shipments.filter(s => s.status === 'livré').length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.2s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>EN ATTENTE</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.red }}>{shipments.filter(s => s.status === 'production' || s.status === 'QC' || s.status === 'douanes').length}</p>
                </div>
              </div>

              {/* Shipments list/table */}
              <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', overflow: 'hidden' }}>
                {shipments.length === 0 ? (
                  <div style={{ padding: sp[4], textAlign: 'center', color: c.textTertiary }}>
                    <p style={{ fontSize: size.sm, marginBottom: sp[2] }}>Aucun envoi enregistré</p>
                    <p style={{ fontSize: size.xs, color: c.textTertiary }}>Les envois apparaîtront ici une fois créés</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: size.sm }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${c.border}`, background: c.bg }}>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Client</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Tracking</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Statut</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Méthode</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Origine</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Destination</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>ETA</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Poids</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipments.map((shipment, idx) => (
                          <tr key={shipment.id || idx} style={{ borderBottom: `1px solid ${c.borderSubtle}`, animation: `fadeSlideIn 0.4s ease-out ${0.05 + idx * 0.02}s both` }}>
                            <td style={{ padding: sp[3], color: c.text }}>{clientName(shipment.client_id) || 'N/A'}</td>
                            <td style={{ padding: sp[3], color: c.textSecondary, fontFamily: f.mono, fontSize: size.xs }}>{shipment.tracking_number || '—'}</td>
                            <td style={{ padding: sp[3] }}>
                              <span style={{
                                display: 'inline-block', padding: '3px 8px',
                                background: (shipStatusToStr[shipment.status] || shipment.status) === 'livré' ? 'oklch(65% 0.13 142 / 0.1)' :
                                           (shipStatusToStr[shipment.status] || shipment.status) === 'transit' ? 'oklch(55% 0.22 25 / 0.1)' : 'oklch(42% 0.18 345 / 0.1)',
                                color: (shipStatusToStr[shipment.status] || shipment.status) === 'livré' ? c.teal :
                                       (shipStatusToStr[shipment.status] || shipment.status) === 'transit' ? c.gold : c.red,
                                fontSize: size.xs, fontFamily: f.mono, borderRadius: '2px',
                              }}>
                                {shipStatusToStr[shipment.status] || shipment.status || 'unknown'}
                              </span>
                            </td>
                            <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{shipment.method || '—'}</td>
                            <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{shipment.origin || '—'}</td>
                            <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{shipment.destination || '—'}</td>
                            <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{shipment.eta || '—'}</td>
                            <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{shipment.weight_kg ? `${shipment.weight_kg} kg` : '—'}</td>
                            <td style={{ padding: sp[3], display: 'flex', gap: sp[1] }}>
                              <button onClick={() => {
                                setEditingShipment(shipment)
                                setEditShipmentData({
                                  tracking_number: shipment.tracking_number || '',
                                  method: shipment.method || 'maritime',
                                  destination: shipment.destination || '',
                                  weight_kg: shipment.weight_kg || shipment.weight || '',
                                  status: (typeof shipment.status === 'number' ? shipStatusToStr[shipment.status] : shipment.status) || 'production',
                                  notes: shipment.notes || '',
                                  eta: shipment.eta || '',
                                  origin: shipment.origin || '',
                                })
                              }} style={{
                                padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                                color: c.teal, fontSize: size.xs, cursor: 'pointer', fontFamily: f.mono,
                                transition: `all 0.3s ${ease.out}`, borderRadius: '2px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${c.teal}15`; e.currentTarget.style.borderColor = c.teal }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.border }}>
                                <Icon d={icons.edit} size={12} color={c.teal} />
                              </button>
                              <button onClick={() => handleDeleteShipment(shipment.id)} style={{
                                padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                                color: c.red, fontSize: size.xs, cursor: 'pointer', fontFamily: f.mono,
                                transition: `all 0.3s ${ease.out}`, borderRadius: '2px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${c.red}15`; e.currentTarget.style.borderColor = c.red }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.border }}>
                                <Icon d={icons.trash} size={12} color={c.red} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STOCK TAB ── */}
          {mainTab === 'stock' && (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4], animation: 'fadeSlideIn 0.4s ease-out' }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Stock & E-commerce
                  </h2>
                  <ArtDecoDivider width={80} color={c.purple} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1], lineHeight: 1.5 }}>
                    Inventaire des clients qui nous confient le stockage et la gestion de leur boutique en ligne.
                    <br /><span style={{ fontSize: size.xs, color: c.textTertiary }}>Service réservé aux profils E-commerce avec option « Stock & Boutique » activée.</span>
                  </p>
                </div>
                <button onClick={() => setShowCreateInventory(true)} style={{
                  padding: `10px ${sp[3]}`, background: c.purple, color: c.text, border: 'none',
                  fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  transition: `all 0.3s ${ease.out}`, display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '3px', boxShadow: shadow.md,
                }}>
                  <Icon d={icons.plus} size={16} color={c.text} />
                  Nouvel article
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: sp[3], marginBottom: sp[4] }}>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.05s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>RÉFÉRENCES</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.purple }}>{inventory.length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.1s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>QUANTITÉ TOTALE</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.purple }}>{inventory.reduce((acc, item) => acc + (item.quantity || 0), 0)}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.15s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>ALERTES STOCK</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.red }}>{inventory.filter(item => (item.quantity || 0) <= (item.alert_threshold || 0)).length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', animation: 'fadeSlideIn 0.4s ease-out 0.2s both' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>VALEUR ESTIMÉE</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.gold }}>€ {inventory.reduce((acc, item) => acc + ((item.unit_price || 0) * (item.quantity || 0)), 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Inventory table */}
              <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px', overflow: 'hidden' }}>
                {inventory.length === 0 ? (
                  <div style={{ padding: sp[4], textAlign: 'center', color: c.textTertiary }}>
                    <p style={{ fontSize: size.sm, marginBottom: sp[2] }}>Aucun article en stock</p>
                    <p style={{ fontSize: size.xs, color: c.textTertiary }}>Créez des articles pour commencer à gérer votre inventaire</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: size.sm }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${c.border}`, background: c.bg }}>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Produit</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>SKU</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Quantité</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Seuil alerte</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Entrepôt</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Statut</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Mis à jour</th>
                          <th style={{ padding: sp[3], textAlign: 'left', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item, idx) => {
                          const isLowStock = (item.quantity || 0) <= (item.alert_threshold || 0)
                          return (
                            <tr key={item.id || idx} style={{
                              borderBottom: `1px solid ${c.borderSubtle}`,
                              background: isLowStock ? 'oklch(42% 0.18 345 / 0.05)' : 'transparent',
                              animation: `fadeSlideIn 0.4s ease-out ${0.05 + idx * 0.02}s both`
                            }}>
                              <td style={{ padding: sp[3], color: c.text }}>{item.product_name || 'N/A'}</td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontFamily: f.mono, fontSize: size.xs }}>{item.sku || '—'}</td>
                              <td style={{ padding: sp[3], color: isLowStock ? c.red : c.text, fontWeight: isLowStock ? 600 : 400 }}>{item.quantity || 0}</td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{item.alert_threshold || '—'}</td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{item.warehouse || '—'}</td>
                              <td style={{ padding: sp[3] }}>
                                <span style={{
                                  display: 'inline-block', padding: '3px 8px',
                                  background: isLowStock ? 'oklch(42% 0.18 345 / 0.1)' : 'oklch(65% 0.13 142 / 0.1)',
                                  color: isLowStock ? c.red : c.teal,
                                  fontSize: size.xs, fontFamily: f.mono, borderRadius: '2px',
                                }}>
                                  {isLowStock ? 'ALERTE' : 'OK'}
                                </span>
                              </td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString('fr-FR') : '—'}</td>
                              <td style={{ padding: sp[3], display: 'flex', gap: sp[1] }}>
                                <button onClick={() => {
                                  setEditingInventoryItem(item)
                                  setEditInventoryData({
                                    product_name: item.product_name || '',
                                    sku: item.sku || '',
                                    quantity: item.quantity || 0,
                                    alert_threshold: item.alert_threshold || 10,
                                    warehouse: item.warehouse || 'France',
                                    unit_price: item.unit_price || '',
                                    notes: item.notes || '',
                                  })
                                }} style={{
                                  padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                                  color: c.purple, fontSize: size.xs, cursor: 'pointer', fontFamily: f.mono,
                                  transition: `all 0.3s ${ease.out}`, borderRadius: '2px',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = `${c.purple}15`; e.currentTarget.style.borderColor = c.purple }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.border }}>
                                  <Icon d={icons.edit} size={12} color={c.purple} />
                                </button>
                                <button onClick={() => handleDeleteInventory(item.id)} style={{
                                  padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                                  color: c.red, fontSize: size.xs, cursor: 'pointer', fontFamily: f.mono,
                                  transition: `all 0.3s ${ease.out}`, borderRadius: '2px',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = `${c.red}15`; e.currentTarget.style.borderColor = c.red }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.border }}>
                                  <Icon d={icons.trash} size={12} color={c.red} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
                                {client.role === 'admin' && (
                                  <span style={{
                                    padding: '1px 6px', background: `${c.purple}20`, border: `1px solid ${c.purple}40`,
                                    fontSize: '8px', fontFamily: f.mono, fontWeight: 700, color: c.purple,
                                    letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                                  }}>ADMIN</span>
                                )}
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

                        {/* Services toggles */}
                        <div style={{ display: 'flex', gap: '6px', padding: `0 ${sp[3]} ${sp[2]}`, flexWrap: 'wrap' }}>
                          {[
                            { key: 'sourcing', label: 'Sourcing', color: c.red, icon: '◆', free: true },
                            { key: 'logistics', label: 'Expédition', color: c.teal, icon: '▸' },
                            { key: 'stock', label: 'Stock & Boutique', color: c.purple, icon: '⬡' },
                          ].map(svc => {
                            const enabled = (client.services_enabled || ['sourcing']).includes(svc.key)
                            return (
                              <button key={svc.key} onClick={(e) => {
                                e.stopPropagation()
                                if (svc.free) return // sourcing always on
                                const current = client.services_enabled || ['sourcing']
                                const next = enabled
                                  ? current.filter(s => s !== svc.key)
                                  : [...current, svc.key]
                                updateProfile(client.id, { services_enabled: next }).then(() => loadAll())
                              }} style={{
                                padding: '3px 8px',
                                background: enabled ? `${svc.color}18` : 'transparent',
                                border: `1px solid ${enabled ? svc.color + '40' : c.borderSubtle}`,
                                color: enabled ? svc.color : c.textGhost,
                                fontSize: '9px', fontFamily: f.mono, fontWeight: enabled ? 600 : 400,
                                cursor: svc.free ? 'default' : 'pointer',
                                letterSpacing: '0.03em',
                                transition: `all 0.15s ${ease.smooth}`,
                                display: 'flex', alignItems: 'center', gap: '4px',
                                opacity: svc.free ? 0.7 : 1,
                              }}>
                                <span style={{ fontSize: '8px' }}>{enabled ? '●' : '○'}</span>
                                {svc.icon} {svc.label}
                                {svc.free && <span style={{ fontSize: '7px', opacity: 0.6 }}>INCLUS</span>}
                              </button>
                            )
                          })}
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
                            <Icon d={icons.lock} size={10} color="currentColor" /> G&eacute;rer
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
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
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
                  <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.md }}>Gestion du compte</div>
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

                <div style={{ height: 1, background: c.border, margin: `${sp[1]} 0` }} />

                <button onClick={() => setPasswordAction('reset-account')} style={{
                  width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                  color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: sp[2], transition: `all 0.2s ${ease.smooth}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'oklch(55% 0.18 35)'; e.currentTarget.style.background = 'oklch(55% 0.18 35 / 0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
                  <Icon d={icons.refresh} size={16} color="oklch(55% 0.18 35)" />
                  <div>
                    <div style={{ fontWeight: 700 }}>Réinitialiser le compte</div>
                    <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>Remet l'onboarding à zéro — le client devra reconfigurer son profil</div>
                  </div>
                </button>

                <div style={{ height: 1, background: c.border, margin: `${sp[1]} 0` }} />

                {/* Toggle admin role */}
                <button onClick={async () => {
                  const isAdmin = clientPasswordModal.role === 'admin'
                  const newRole = isAdmin ? 'client' : 'admin'
                  try {
                    await updateProfile(clientPasswordModal.id, { role: newRole })
                    toast.success(isAdmin ? 'Compte repassé en client' : 'Compte promu admin')
                    setClientPasswordModal(null)
                    loadAll()
                  } catch (err) {
                    toast.error('Erreur: ' + (err.message || 'Inconnue'))
                  }
                }} style={{
                  width: '100%', padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                  color: c.text, fontSize: size.sm, fontFamily: f.body, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: sp[2], transition: `all 0.2s ${ease.smooth}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.purple; e.currentTarget.style.background = `${c.purple}10` }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
                  <Icon d={icons.shield} size={16} color={c.purple} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{clientPasswordModal.role === 'admin' ? 'Retirer les droits admin' : 'Passer en admin'}</div>
                    <div style={{ fontSize: size.xs, color: c.textTertiary, marginTop: '2px' }}>
                      {clientPasswordModal.role === 'admin'
                        ? 'Ce compte redeviendra un compte client standard'
                        : 'Ce compte aura accès au panel d\'administration'
                      }
                    </div>
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
                    Ce mot de passe temporaire remplacera l'ancien. Communiquez-le au client de manière sécurisée.
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
                      setLastSetPassword(newTempPassword)
                      setPasswordAction('done')
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

            {/* Password just set — display for copy */}
            {passwordAction === 'done' && lastSetPassword && (
              <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div style={{
                  padding: sp[3], background: 'oklch(35% 0.12 145 / 0.12)', border: '1px solid oklch(55% 0.15 145 / 0.3)', marginBottom: sp[3],
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Mot de passe défini</div>
                  <div style={{
                    fontFamily: f.mono, fontSize: size.lg, fontWeight: 700, color: c.text,
                    padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}`,
                    userSelect: 'all', cursor: 'text', letterSpacing: '0.05em',
                  }}>{lastSetPassword}</div>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, margin: `${sp[2]} 0 0`, lineHeight: 1.5 }}>
                    Communiquez ce mot de passe au client. Il ne sera plus visible apr&egrave;s fermeture.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: sp[2] }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(lastSetPassword)
                    toast.success('Mot de passe copié')
                  }} style={{
                    flex: 1, padding: `10px ${sp[2]}`, background: c.gold, border: 'none',
                    color: c.bg, fontSize: size.sm, fontFamily: f.body, fontWeight: 700, cursor: 'pointer',
                  }}>Copier le mot de passe</button>
                  <button onClick={() => {
                    setClientPasswordModal(null); setLastSetPassword(''); setNewTempPassword('')
                  }} style={{
                    flex: 1, padding: `10px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                    color: c.textTertiary, fontSize: size.sm, fontFamily: f.body, fontWeight: 600, cursor: 'pointer',
                  }}>Fermer</button>
                </div>
              </div>
            )}

            {/* Reset account flow */}
            {passwordAction === 'reset-account' && (
              <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div style={{
                  padding: sp[3], background: 'oklch(55% 0.18 35 / 0.08)', border: '1px solid oklch(55% 0.18 35 / 0.25)', marginBottom: sp[3],
                }}>
                  <p style={{ fontSize: size.sm, color: c.text, lineHeight: 1.6, margin: 0 }}>
                    <strong>Attention :</strong> Cette action remet le compte de <strong>{clientPasswordModal.full_name || clientPasswordModal.email}</strong> à zéro.
                    Le client devra refaire l'onboarding (choix du profil, catalogue, infos de contact).
                  </p>
                </div>
                <div style={{
                  padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3],
                  fontSize: size.xs, color: c.textTertiary, lineHeight: 1.5,
                }}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1], color: c.textTertiary }}>Ce qui sera réinitialisé</div>
                  <div>&#x25C6; Onboarding remis à « non complété »</div>
                  <div>&#x25C6; Profil client (tier, contact, société) vidé</div>
                  <div style={{ marginTop: sp[1], color: c.gold }}>&#x25C6; Les commandes existantes sont conservées</div>
                </div>
                <div style={{ display: 'flex', gap: sp[2] }}>
                  <button onClick={() => setPasswordAction(null)} style={{
                    flex: 1, padding: `10px ${sp[2]}`, background: 'transparent', border: `1px solid ${c.border}`,
                    color: c.textTertiary, fontSize: size.sm, fontFamily: f.body, fontWeight: 600, cursor: 'pointer',
                  }}>Annuler</button>
                  <button onClick={async () => {
                    setPasswordLoading(true)
                    try {
                      await updateProfile(clientPasswordModal.id, {
                        onboarding_done: false,
                        client_tier: null,
                        company_name: null,
                        phone: null,
                        city: null,
                      })
                      toast.success('Compte réinitialisé — le client devra refaire l\'onboarding')
                      setClientPasswordModal(null)
                      loadAll()
                    } catch (err) {
                      toast.error('Erreur: ' + (err.message || 'Inconnue'))
                    } finally { setPasswordLoading(false) }
                  }} disabled={passwordLoading} style={{
                    flex: 1, padding: `10px ${sp[2]}`, background: 'oklch(55% 0.18 35)', border: 'none',
                    color: c.white, fontSize: size.sm, fontFamily: f.body, fontWeight: 700,
                    cursor: passwordLoading ? 'wait' : 'pointer', opacity: passwordLoading ? 0.6 : 1,
                  }}>
                    {passwordLoading ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
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

      {/* ═══════ MODAL: Nouvel envoi ═══════ */}
      {showCreateShipment && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }} onClick={() => setShowCreateShipment(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
            animation: 'fadeSlideIn 0.3s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCreateShipment(false)} style={{
              position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: 0, width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = c.teal }}
            onMouseLeave={(e) => { e.currentTarget.style.color = c.textTertiary }}>
              <Icon d={icons.close} size={16} />
            </button>

            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.01em', color: c.teal }}>
              Nouvel envoi
            </h2>
            <ArtDecoDivider width={80} color={c.teal} />

            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select value={createShipmentData.client_id} onChange={e => setCreateShipmentData({...createShipmentData, client_id: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: sp[3]}}
                  onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                  <option value="">Choisir un client...</option>
                  {allProfiles.map(cl => (<option key={cl.id} value={cl.id}>{cl.full_name || cl.email}</option>))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Commande liée</label>
                <select value={createShipmentData.order_id} onChange={e => {
                  const ord = orders.find(o => o.id === e.target.value)
                  setCreateShipmentData({...createShipmentData, order_id: e.target.value, product_name: ord?.product || createShipmentData.product_name, client_id: ord?.client_id || createShipmentData.client_id})
                }}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: sp[3]}}
                  onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                  <option value="">Aucune (envoi libre)</option>
                  {orders.map(o => (<option key={o.id} value={o.id}>{o.ref} — {o.product} ({clientName(o.client_id)})</option>))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Produit</label>
                <input type="text" value={createShipmentData.product_name} onChange={e => setCreateShipmentData({...createShipmentData, product_name: e.target.value})}
                  placeholder="Nom du produit..." style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Destination *</label>
                  <input type="text" value={createShipmentData.destination} onChange={e => setCreateShipmentData({...createShipmentData, destination: e.target.value})}
                    placeholder="Paris, Lyon..." style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Méthode</label>
                  <select value={createShipmentData.method} onChange={e => setCreateShipmentData({...createShipmentData, method: e.target.value})}
                    style={{...inputStyle, cursor: 'pointer', appearance: 'none'}}
                    onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                    <option value="maritime">Maritime</option>
                    <option value="aerien">Aérien</option>
                    <option value="ferroviaire">Ferroviaire</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Statut</label>
                <select value={createShipmentData.status} onChange={e => setCreateShipmentData({...createShipmentData, status: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none'}}
                  onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                  <option value="production">En production</option>
                  <option value="QC">Contrôle qualité</option>
                  <option value="douanes">Douanes</option>
                  <option value="transit">En transit</option>
                  <option value="livré">Livré</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>N. de suivi</label>
                  <input type="text" value={createShipmentData.tracking_number} onChange={e => setCreateShipmentData({...createShipmentData, tracking_number: e.target.value})}
                    placeholder="Tracking number" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Poids (kg)</label>
                  <input type="number" step="0.1" value={createShipmentData.weight_kg} onChange={e => setCreateShipmentData({...createShipmentData, weight_kg: e.target.value})}
                    placeholder="0" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={createShipmentData.notes} onChange={e => setCreateShipmentData({...createShipmentData, notes: e.target.value})}
                  placeholder="Details..." style={{...inputStyle, minHeight: '60px', fontFamily: f.body}}
                  onFocus={(e) => { e.target.style.borderColor = c.teal; e.target.style.boxShadow = `0 0 0 3px ${c.teal}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                <button type="button" onClick={() => setShowCreateShipment(false)} style={{
                  flex: 1, padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                  border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
                  Annuler
                </button>
                <button type="submit" style={{
                  flex: 1, padding: `10px ${sp[3]}`, background: c.teal, color: c.text,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: 'pointer', transition: `all 0.3s ${ease.out}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: Nouvel article stock ═══════ */}
      {showCreateInventory && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }} onClick={() => setShowCreateInventory(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
            animation: 'fadeSlideIn 0.3s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCreateInventory(false)} style={{
              position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: 0, width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: `all 0.2s ${ease.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = c.purple }}
            onMouseLeave={(e) => { e.currentTarget.style.color = c.textTertiary }}>
              <Icon d={icons.close} size={16} />
            </button>

            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.01em', color: c.purple }}>
              Nouvel article
            </h2>
            <ArtDecoDivider width={80} color={c.purple} />

            <form onSubmit={handleCreateInventory} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select value={createInventoryData.client_id} onChange={e => setCreateInventoryData({...createInventoryData, client_id: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: sp[3]}}
                  onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                  <option value="">Choisir un client...</option>
                  {allProfiles.map(cl => (<option key={cl.id} value={cl.id}>{cl.full_name || cl.email}</option>))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Produit *</label>
                  <input type="text" value={createInventoryData.product_name} onChange={e => setCreateInventoryData({...createInventoryData, product_name: e.target.value})}
                    placeholder="Nom du produit" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input type="text" value={createInventoryData.sku} onChange={e => setCreateInventoryData({...createInventoryData, sku: e.target.value})}
                    placeholder="REF-001" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Quantité</label>
                  <input type="number" value={createInventoryData.quantity} onChange={e => setCreateInventoryData({...createInventoryData, quantity: e.target.value})}
                    placeholder="0" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Alerte seuil</label>
                  <input type="number" value={createInventoryData.alert_threshold} onChange={e => setCreateInventoryData({...createInventoryData, alert_threshold: e.target.value})}
                    placeholder="10" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Prix unit.</label>
                  <input type="number" step="0.01" value={createInventoryData.unit_price} onChange={e => setCreateInventoryData({...createInventoryData, unit_price: e.target.value})}
                    placeholder="0.00" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Entrepôt</label>
                <input type="text" value={createInventoryData.warehouse} onChange={e => setCreateInventoryData({...createInventoryData, warehouse: e.target.value})}
                  placeholder="France" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={createInventoryData.notes} onChange={e => setCreateInventoryData({...createInventoryData, notes: e.target.value})}
                  placeholder="Details..." style={{...inputStyle, minHeight: '60px', fontFamily: f.body}}
                  onFocus={(e) => { e.target.style.borderColor = c.purple; e.target.style.boxShadow = `0 0 0 3px ${c.purple}22` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                <button type="button" onClick={() => setShowCreateInventory(false)} style={{
                  flex: 1, padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                  border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
                  Annuler
                </button>
                <button type="submit" style={{
                  flex: 1, padding: `10px ${sp[3]}`, background: c.purple, color: c.text,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                  cursor: 'pointer', transition: `all 0.3s ${ease.out}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                  Ajouter au stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: Edit Shipment ═══════ */}
      {editingShipment && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }} onClick={() => setEditingShipment(null)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
            animation: 'fadeSlideIn 0.3s ease-out',
          }} onClick={(e) => e.stopPropagation()} className="admin-scroll">
            <button onClick={() => setEditingShipment(null)} style={{
              position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: 0,
            }}>
              <Icon d={icons.close} size={16} />
            </button>

            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px', color: c.teal }}>
              Modifier l'envoi
            </h2>
            <ArtDecoDivider width={80} />
            <div style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3] }}>
              Client : {clientName(editingShipment.client_id)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={editShipmentData.status} onChange={e => setEditShipmentData({...editShipmentData, status: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none'}}>
                  <option value="production">En production</option>
                  <option value="QC">Contrôle qualité</option>
                  <option value="douanes">Douanes</option>
                  <option value="transit">En transit</option>
                  <option value="livré">Livré</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>N. de suivi</label>
                  <input type="text" value={editShipmentData.tracking_number} onChange={e => setEditShipmentData({...editShipmentData, tracking_number: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Méthode</label>
                  <select value={editShipmentData.method} onChange={e => setEditShipmentData({...editShipmentData, method: e.target.value})}
                    style={{...inputStyle, cursor: 'pointer', appearance: 'none'}}>
                    <option value="maritime">Maritime</option>
                    <option value="aerien">Aérien</option>
                    <option value="ferroviaire">Ferroviaire</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Origine</label>
                  <input type="text" value={editShipmentData.origin} onChange={e => setEditShipmentData({...editShipmentData, origin: e.target.value})}
                    placeholder="Yiwu, Shenzhen..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Destination</label>
                  <input type="text" value={editShipmentData.destination} onChange={e => setEditShipmentData({...editShipmentData, destination: e.target.value})}
                    style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Poids (kg)</label>
                  <input type="number" step="0.1" value={editShipmentData.weight_kg} onChange={e => setEditShipmentData({...editShipmentData, weight_kg: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ETA</label>
                  <input type="text" value={editShipmentData.eta} onChange={e => setEditShipmentData({...editShipmentData, eta: e.target.value})}
                    placeholder="2026-05-15" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={editShipmentData.notes} onChange={e => setEditShipmentData({...editShipmentData, notes: e.target.value})}
                  style={{...inputStyle, minHeight: '60px', fontFamily: f.body}} />
              </div>
              <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                <button type="button" onClick={() => handleDeleteShipment(editingShipment.id)} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                  border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Supprimer</button>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setEditingShipment(null)} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                  border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Annuler</button>
                <button type="button" onClick={handleSaveShipment} style={{
                  padding: `10px ${sp[3]}`, background: c.teal, color: c.text,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Sauvegarder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: Edit Inventory ═══════ */}
      {editingInventoryItem && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }} onClick={() => setEditingInventoryItem(null)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
            animation: 'fadeSlideIn 0.3s ease-out',
          }} onClick={(e) => e.stopPropagation()} className="admin-scroll">
            <button onClick={() => setEditingInventoryItem(null)} style={{
              position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
              color: c.textTertiary, cursor: 'pointer', padding: 0,
            }}>
              <Icon d={icons.close} size={16} />
            </button>

            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px', color: c.purple }}>
              Modifier l'article
            </h2>
            <ArtDecoDivider width={80} />
            <div style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3] }}>
              Client : {clientName(editingInventoryItem.client_id)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Produit</label>
                  <input type="text" value={editInventoryData.product_name} onChange={e => setEditInventoryData({...editInventoryData, product_name: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input type="text" value={editInventoryData.sku} onChange={e => setEditInventoryData({...editInventoryData, sku: e.target.value})}
                    style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                <div>
                  <label style={labelStyle}>Quantité</label>
                  <input type="number" value={editInventoryData.quantity} onChange={e => setEditInventoryData({...editInventoryData, quantity: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Seuil alerte</label>
                  <input type="number" value={editInventoryData.alert_threshold} onChange={e => setEditInventoryData({...editInventoryData, alert_threshold: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Prix unitaire</label>
                  <input type="number" step="0.01" value={editInventoryData.unit_price} onChange={e => setEditInventoryData({...editInventoryData, unit_price: e.target.value})}
                    style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Entrepôt</label>
                <input type="text" value={editInventoryData.warehouse} onChange={e => setEditInventoryData({...editInventoryData, warehouse: e.target.value})}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={editInventoryData.notes} onChange={e => setEditInventoryData({...editInventoryData, notes: e.target.value})}
                  style={{...inputStyle, minHeight: '60px', fontFamily: f.body}} />
              </div>
              <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                <button type="button" onClick={() => handleDeleteInventory(editingInventoryItem.id)} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                  border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Supprimer</button>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setEditingInventoryItem(null)} style={{
                  padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                  border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Annuler</button>
                <button type="button" onClick={handleSaveInventory} style={{
                  padding: `10px ${sp[3]}`, background: c.purple, color: c.text,
                  border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                }}>Sauvegarder</button>
              </div>
            </div>
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
