import { useState, useEffect, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients, getAllProfiles, createOrder,
  subscribeToMessages, subscribeToOrders, supabase, updateProfile, resetPassword,
  getShipments, createShipment, updateShipment, deleteShipment, getInventory, updateInventoryItem, createInventoryItem, deleteInventoryItem,
  getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage,
  getCategories, createCategory, updateCategory, deleteCategory,
  getShops, createShop, updateShop, deleteShop,
  getEcomServices, createEcomService, updateEcomService, deleteEcomService,
} from '../lib/supabase'
import { CATALOGS, getCatalog } from '../lib/catalogsByProfile'
import { TIERS, getTierByKey, DEFAULT_TIER, getTierPrice, getTierMOQ } from '../lib/clientTiers'
import StatusPill, { ProgressBar, PipelineStepper } from '../components/StatusPill'
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


const ArtDecoDivider = ({ width = 80, color = c.gold }) => (
  <div style={{ width, height: 1, background: color, opacity: 0.3, margin: `${sp[1]} 0` }} />
)

const DragonEmptyState = ({ title, subtitle }) => (
  <div style={{ textAlign: 'center', padding: sp[6] }}>
    <h4 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, color: c.text }}>{title}</h4>
    <p style={{ fontSize: size.sm, color: c.textSecondary, maxWidth: '300px', margin: '0 auto', lineHeight: 1.6 }}>{subtitle}</p>
  </div>
)

/* ── CHAT BUBBLE ── */
const ChatBubble = ({ msg, isAdmin }) => (
  <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
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
  const [mainTab, setMainTab] = useState('overview')
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
  const [clientTierFilter, setClientTierFilter] = useState(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  // ── Catalog overrides (edit/delete static catalog items) ──
  const [catalogOverrides, setCatalogOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('caraxes_catalog_overrides') || '{}') } catch { return {} }
  })
  const [deletedCatalogItems, setDeletedCatalogItems] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('caraxes_catalog_deleted') || '[]')) } catch { return new Set() }
  })
  const [showCatalogItemModal, setShowCatalogItemModal] = useState(false)
  const [editingCatalogItem, setEditingCatalogItem] = useState(null)
  const [editingCatalogTier, setEditingCatalogTier] = useState(null)
  const [catalogItemForm, setCatalogItemForm] = useState({ name: '', icon: '📦', description: '', priceRange: '', moq: '', margin: '', topProducts: '', locations: '' })

  const saveCatalogOverride = (tierKey, catId, data) => {
    const key = `${tierKey}_${catId}`
    const next = { ...catalogOverrides, [key]: data }
    setCatalogOverrides(next)
    localStorage.setItem('caraxes_catalog_overrides', JSON.stringify(next))
  }
  const deleteCatalogItem = (tierKey, catId) => {
    const key = `${tierKey}_${catId}`
    const next = new Set(deletedCatalogItems)
    next.add(key)
    setDeletedCatalogItems(next)
    localStorage.setItem('caraxes_catalog_deleted', JSON.stringify([...next]))
  }
  const getEffectiveCatalog = (tierKey) => {
    return getCatalog(tierKey)
      .filter(cat => !deletedCatalogItems.has(`${tierKey}_${cat.id}`))
      .map(cat => {
        const override = catalogOverrides[`${tierKey}_${cat.id}`]
        return override ? { ...cat, ...override } : cat
      })
  }
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦', description: '', sort_order: 0, active: true, tier_keys: ['retail','wholesale','ecommerce'] })
  const [editingCategory, setEditingCategory] = useState(null)
  const [shops, setShops] = useState([])
  const [showShopModal, setShowShopModal] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [shopForm, setShopForm] = useState({ name: '', platform: 'shopify', domain: '', template: 'classic', notes: '', client_id: '', logo_url: '', products_synced: 0, monthly_orders: 0, monthly_revenue: 0 })
  const [selectedShopId, setSelectedShopId] = useState(null)
  const [shopSearch, setShopSearch] = useState('')
  const [shopStatusFilter, setShopStatusFilter] = useState(null)
  // ── E-com Services ──
  const [ecomServices, setEcomServices] = useState([])
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [serviceForm, setServiceForm] = useState({ client_id: '', service_type: 'creation', pack: 'starter', platform: 'shopify', price: '', notes: '', shop_id: '' })
  const [serviceFilter, setServiceFilter] = useState(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)

  const loadAll = useCallback(async () => {
    try {
      const [ordersData, clientsData, profilesData, shipmentsData, inventoryData, productsData, categoriesData, shopsData, ecomData] = await Promise.all([getOrders(), getAllClients(), getAllProfiles(), getShipments(), getInventory(), getProducts(), getCategories(), getShops().catch(() => []), getEcomServices().catch(() => [])])
      setOrders(ordersData); setClients(clientsData); setAllProfiles(profilesData); setShipments(shipmentsData); setInventory(inventoryData); setProducts(productsData); setCategories(categoriesData); setShops(shopsData); setEcomServices(ecomData)
    } catch (err) {
      console.error('loadAll error:', err)
      toast.error('Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    const ch = subscribeToOrders(() => loadAll())
    return () => { supabase.removeChannel(ch) }
  }, [loadAll])

  const selected = orders.find(o => o.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    let active = true
    Promise.all([getMessages(selectedId), getDocuments(selectedId)])
      .then(([m, d]) => { if (active) { setMessages(m); setDocuments(d) } })
      .catch(err => { if (active) console.error('Error loading messages/docs:', err) })
    return () => { active = false }
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const ch = subscribeToMessages(selectedId, (msg) => setMessages(prev => [...prev, msg]))
    return () => { supabase.removeChannel(ch) }
  }, [selectedId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  // Scroll to top on mount (page refresh)
  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Reset detail view & scroll when switching tabs (vue d'ensemble)
  useEffect(() => {
    setSelectedId(null)
    setMobileShowDetail(false)
    // Scroll admin container to top
    const scrollContainer = document.querySelector('.admin-scroll')
    if (scrollContainer) scrollContainer.scrollTop = 0
    window.scrollTo(0, 0)
  }, [mainTab])

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
    const isDone = o.status === 6 || o.status === 'delivered' || o.status === 'livré' || o.status === 'completed'
    if (filter === 'active' && isDone) return false
    if (filter === 'done' && !isDone) return false
    if (search) {
      const q = search.toLowerCase()
      return (o.product || '').toLowerCase().includes(q) || o.ref?.toLowerCase().includes(q) || clientName(o.client_id).toLowerCase().includes(q)
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
    { key: 'stock', label: 'Stock', icon: icons.save, color: c.purple },
    { key: 'boutiques', label: 'Boutiques', icon: icons.link, color: c.gold },
    { key: 'services', label: 'Services', icon: icons.shield, color: c.amber },
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
          .admin-client-table { overflow-x: auto !important; }
          .admin-header-badge { display: none !important; }
          .admin-header-settings { display: none !important; }
          .admin-header-logout { display: none !important; }
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
              transition: `border-color 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
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
          <button className="admin-header-logout" onClick={onSignOut} style={{
            background: 'transparent', border: `1px solid ${c.border}`,
            width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: c.textTertiary, cursor: 'pointer',
            transition: `border-color 0.2s ${ease.smooth}`,
          }}>
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
                      transition: `border-color 0.2s ${ease.smooth}`,
                    }}>
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
              cursor: 'pointer', transition: `background 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[1],
            }}>
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
              <div style={{ marginBottom: sp[4], display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700, marginBottom: sp[1], letterSpacing: '-0.02em' }}>
                    Bienvenue, {profile?.full_name?.split(' ')[0]}
                  </h1>
                  <p style={{ fontFamily: f.body, fontSize: size.sm, color: c.textSecondary }}>
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
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
                <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[4], flexWrap: 'wrap' }}>
                  {lowStockItems.length > 0 && (
                    <div onClick={() => setMainTab('stock')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('stock') } }} style={{
                      padding: `${sp[2]} ${sp[3]}`, background: `${c.red}10`, border: `1px solid ${c.red}30`,
                      display: 'flex', alignItems: 'center', gap: sp[2], cursor: 'pointer',
                    }}>
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
                    <div onClick={() => setMainTab('expedition')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('expedition') } }} style={{
                      padding: `${sp[2]} ${sp[3]}`, background: `${c.teal}10`, border: `1px solid ${c.teal}30`,
                      display: 'flex', alignItems: 'center', gap: sp[2], cursor: 'pointer',
                    }}>
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
                  { label: 'Boutiques', value: shops.length, color: c.gold, sub: `${shops.filter(s => s.status === 'active').length} actives · ${shops.filter(s => s.status === 'building' || s.status === 'draft').length} en cours`, click: () => setMainTab('boutiques') },
                ].map((stat, i) => (
                  <div key={i} onClick={stat.click} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stat.click() } }} style={{
                    padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                    position: 'relative', overflow: 'hidden', cursor: 'pointer',
                    boxShadow: shadow.card,
                  }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[3], marginBottom: sp[4] }}>
                {[
                  { label: 'Sourcing', desc: 'Recherche fournisseurs & négociation', count: allProfiles.length, icon: '◆', color: c.red, note: 'Inclus pour tous' },
                  { label: 'Expédition', desc: 'Logistique Chine → France', count: logisticsClients.length, icon: '▸', color: c.teal, note: `${logisticsClients.length} actif${logisticsClients.length > 1 ? 's' : ''}` },
                  { label: 'Stock', desc: 'Entrepôt Chine + inventaire', count: stockClients.length, icon: '⬡', color: c.purple, note: `${inventory.length} réf.` },
                  { label: 'Boutiques', desc: 'E-commerce clé en main', count: shops.length, icon: '◉', color: c.gold, note: `${shops.filter(s => s.status === 'active').length} active${shops.filter(s => s.status === 'active').length > 1 ? 's' : ''}`, click: () => setMainTab('boutiques') },
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
              <div style={{ marginBottom: sp[4], padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}` }}>
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
                        <div style={{ width: 7, height: 7, background: st.color, flexShrink: 0, transform: 'rotate(45deg)' }} />
                        <span style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary, letterSpacing: '0.02em' }}>{st.label}</span>
                        <span style={{ fontSize: '10px', fontFamily: f.mono, color: st.color, fontWeight: 700 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── EXPÉDITIONS ACTIVES + STOCK E-COM (2 colonnes) ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3], marginBottom: sp[4] }}>

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
                      cursor: 'pointer',
                    }}>
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
                        <div key={s.id || i} onClick={() => setMainTab('expedition')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('expedition') } }} style={{
                          padding: `${sp[1]} ${sp[2]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: c.bgElevated, cursor: 'pointer',
                        }}>
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
                          <div key={item.id || i} onClick={() => setMainTab('stock')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('stock') } }} style={{
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

              {/* ── BOUTIQUES E-COMMERCE ── */}
              <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.gold, opacity: 0.6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <span style={{ fontSize: '14px', color: c.gold }}>◉</span>
                    <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Boutiques E-commerce</span>
                    <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold, fontWeight: 700, background: `${c.gold}15`, padding: '2px 6px', marginLeft: sp[1] }}>
                      {shops.length}
                    </span>
                  </div>
                  <button onClick={() => setMainTab('boutiques')} style={{
                    padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                    color: c.gold, fontSize: '9px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Gérer →
                  </button>
                </div>
                {shops.length === 0 ? (
                  <div style={{ padding: sp[2], textAlign: 'center', color: c.textTertiary, fontSize: size.xs }}>
                    Aucune boutique — créez-en une depuis l'onglet Boutiques
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: sp[2] }}>
                    {shops.slice(0, 6).map(shop => {
                      const statusColors = { draft: c.textTertiary, building: c.amber || c.gold, review: c.blue, active: c.green, paused: c.red, archived: c.textTertiary }
                      const statusLabels = { draft: 'Brouillon', building: 'Construction', review: 'Revue', active: 'Active', paused: 'Pause', archived: 'Archivée' }
                      const client = allProfiles.find(p => p.id === shop.client_id)
                      return (
                        <div key={shop.id} onClick={() => { setMainTab('boutiques'); setSelectedShopId(shop.id) }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainTab('boutiques'); setSelectedShopId(shop.id) } }} style={{
                          padding: sp[2], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`,
                          cursor: 'pointer', transition: `border-color 0.2s ${ease.smooth}`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = c.gold}
                        onMouseLeave={e => e.currentTarget.style.borderColor = c.borderSubtle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: size.sm, fontWeight: 700, color: c.text }}>{shop.name}</span>
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: statusColors[shop.status] || c.textTertiary,
                            }} title={statusLabels[shop.status] || shop.status} />
                          </div>
                          <div style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{client?.full_name?.split(' ')[0] || '—'}</span>
                            <span style={{ color: c.gold }}>{shop.platform}</span>
                          </div>
                          {(shop.monthly_revenue > 0 || shop.monthly_orders > 0) && (
                            <div style={{ marginTop: '4px', fontSize: '9px', fontFamily: f.mono, color: c.textSecondary }}>
                              {shop.monthly_orders || 0} cmd · {(shop.monthly_revenue || 0).toLocaleString('fr-FR')}€/mois
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── SERVICES E-COM ── */}
              {ecomServices.length > 0 && (
                <div style={{ marginBottom: sp[4], padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.amber, opacity: 0.6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[2] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                      <span style={{ fontSize: '14px', color: c.amber }}>◉</span>
                      <span style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>Services E-com</span>
                      <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.amber, fontWeight: 700, background: `${c.amber}15`, padding: '2px 6px', marginLeft: sp[1] }}>
                        {ecomServices.length}
                      </span>
                    </div>
                    <button onClick={() => setMainTab('services')} style={{
                      padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                      color: c.amber, fontSize: '9px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Gérer →
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: sp[2] }}>
                    {ecomServices.slice(0, 4).map(svc => {
                      const serviceTypes = { creation: 'Création', gestion: 'Gestion', formation: 'Formation', marketing: 'Marketing' }
                      const serviceIcons = { creation: '🏪', gestion: '⚙️', formation: '📚', marketing: '📣' }
                      const svcClient = allProfiles.find(p => p.id === svc.client_id)
                      const tasks = svc.tasks || []
                      const done = tasks.filter(t => t.done).length
                      const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
                      return (
                        <div key={svc.id} onClick={() => setMainTab('services')} style={{
                          padding: sp[2], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
                          transition: `border-color 0.2s ease`,
                        }} onMouseEnter={e => e.currentTarget.style.borderColor = c.amber} onMouseLeave={e => e.currentTarget.style.borderColor = c.borderSubtle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: size.sm, fontWeight: 700 }}>{serviceIcons[svc.service_type]} {serviceTypes[svc.service_type]}</span>
                            <span style={{ fontSize: '9px', fontFamily: f.mono, color: pct === 100 ? c.green : c.amber }}>{pct}%</span>
                          </div>
                          <div style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary }}>{svcClient?.full_name?.split(' ')[0] || '—'} · {svc.pack}</div>
                          <div style={{ height: 3, background: c.bgHover, marginTop: '6px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? c.green : c.amber, transition: 'width 0.3s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── ACTIVITÉ RÉCENTE ── */}
              <div>
                <h3 style={{ fontFamily: f.display, fontSize: size.lg, marginBottom: sp[1], fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Activité récente
                </h3>
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
                          borderBottom: `1px solid ${c.borderSubtle}`,
                          cursor: 'pointer',
                        }}
                        onClick={() => { setMainTab('commandes'); setSelectedId(order.id) }}>
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
                          cursor: sendingMsg ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px', opacity: sendingMsg ? 0.6 : 1,
                        }}>
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
                            borderBottom: `1px solid ${c.borderSubtle}`,
                          }}>
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
                              letterSpacing: '0.04em', flexShrink: 0,
                            }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4] }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>Catalogue Produits</h2>
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                    {products.length} produit{products.length > 1 ? 's' : ''} personnalisé{products.length > 1 ? 's' : ''} · {TIERS.length} profils · {(() => { const s = new Set(); TIERS.forEach(t => getEffectiveCatalog(t.key).forEach(ct => s.add(ct.id))); return s.size })()} catégories
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
                    {products.filter(p => !catalogSearch || p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category?.toLowerCase().includes(catalogSearch.toLowerCase())).map((prod, i) => {
                      const openEditModal = () => {
                        setEditingProduct(prod)
                        setProductForm({
                          name: prod.name || '', description: prod.description || '', category: prod.category || '',
                          price_min: prod.price_min || '', price_max: prod.price_max || '', moq: prod.moq || '1',
                          margin_estimate: prod.margin_estimate || '', tags: (prod.tags || []).join(', '),
                          tier_keys: prod.tier_keys || ['retail','wholesale','ecommerce'],
                          active: prod.active !== false, featured: prod.featured || false,
                        })
                        setShowProductModal(true)
                      }
                      const handleDelete = async (e) => {
                        e.stopPropagation()
                        setConfirmDialog({
                          open: true,
                          title: 'Supprimer',
                          message: `Supprimer « ${prod.name} » ? Cette action est irréversible.`,
                          onConfirm: async () => {
                            try {
                              for (const url of (prod.image_urls || [])) { await deleteProductImage(url) }
                              await deleteProduct(prod.id)
                              await loadAll()
                              toast.success('Produit supprimé')
                            } catch (err) { toast.error('Erreur: ' + err.message) }
                          }
                        })
                        return
                      }
                      const handleToggleActive = async (e) => {
                        e.stopPropagation()
                        try {
                          await updateProduct(prod.id, { active: !prod.active })
                          await loadAll()
                          toast.success(prod.active ? 'Produit désactivé' : 'Produit activé')
                        } catch (err) { toast.error('Erreur: ' + err.message) }
                      }
                      return (
                      <div key={prod.id} className="catalog-card" style={{
                        background: c.bgSurface, border: `1px solid ${c.border}`, overflow: 'hidden',
                        transition: `all 0.3s ${ease.out}`, cursor: 'pointer', opacity: prod.active ? 1 : 0.6,
                        position: 'relative',
                      }}
                      onClick={openEditModal}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = c.gold
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        const overlay = e.currentTarget.querySelector('.card-actions')
                        if (overlay) overlay.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = c.border
                        e.currentTarget.style.transform = 'translateY(0)'
                        const overlay = e.currentTarget.querySelector('.card-actions')
                        if (overlay) overlay.style.opacity = '0'
                      }}>
                        {/* Image + Badges */}
                        <div style={{ height: 160, background: c.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                          {prod.image_urls?.[0] ? (
                            <img src={prod.image_urls[0]} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '40px', opacity: 0.2 }}>📷</span>
                          )}
                          {prod.featured && (
                            <span style={{ position: 'absolute', top: 8, left: 8, background: c.gold, color: c.black, fontSize: '9px', fontWeight: 700, padding: '2px 8px', fontFamily: f.mono, zIndex: 2 }}>STAR</span>
                          )}
                          {!prod.active && (
                            <span style={{ position: 'absolute', top: 8, left: prod.featured ? 60 : 8, background: c.red, color: c.white, fontSize: '9px', fontWeight: 700, padding: '2px 8px', fontFamily: f.mono, zIndex: 2 }}>INACTIF</span>
                          )}

                          {/* ── Hover action buttons ── */}
                          <div className="card-actions" style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[2],
                            opacity: 0, transition: `opacity 0.25s ${ease.out}`, zIndex: 3,
                          }}>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal() }} title="Modifier" style={{
                              width: 40, height: 40, border: `1px solid ${c.gold}`, background: `${c.gold}22`,
                              color: c.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.out}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.gold; e.currentTarget.style.color = c.black }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = `${c.gold}22`; e.currentTarget.style.color = c.gold }}>
                              <Icon d={icons.edit || 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'} size={18} />
                            </button>
                            <button onClick={handleToggleActive} title={prod.active ? 'Désactiver' : 'Activer'} style={{
                              width: 40, height: 40, border: `1px solid ${prod.active ? c.amber : c.green}`, background: prod.active ? `${c.amber}22` : `${c.green}22`,
                              color: prod.active ? c.amber : c.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.out}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = prod.active ? c.amber : c.green; e.currentTarget.style.color = c.black }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = prod.active ? `${c.amber}22` : `${c.green}22`; e.currentTarget.style.color = prod.active ? c.amber : c.green }}>
                              <Icon d={prod.active ? 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' : 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'} size={18} />
                            </button>
                            <button onClick={handleDelete} title="Supprimer" style={{
                              width: 40, height: 40, border: `1px solid ${c.red}`, background: `${c.red}22`,
                              color: c.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.out}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.color = c.white }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = `${c.red}22`; e.currentTarget.style.color = c.red }}>
                              <Icon d={icons.close} size={18} />
                            </button>
                          </div>
                        </div>
                        {/* Card content */}
                        <div style={{ padding: sp[2] }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                          </div>
                          {prod.category && <span style={{ fontSize: '9px', color: c.gold, fontFamily: f.mono, padding: '1px 6px', background: c.goldSoft, border: `1px solid ${c.gold}33` }}>{prod.category}</span>}
                          {prod.description && <p style={{ fontSize: '11px', color: c.textSecondary, marginTop: '6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.description}</p>}
                        </div>
                        {/* Stats bar */}
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
                      )
                    })}
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
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '16px' }}>{tier.icon}</span>
                      {tier.label}
                      <span style={{ fontFamily: f.mono, fontSize: '9px', opacity: 0.7 }}>{getEffectiveCatalog(tier.key).length}</span>
                      <span style={{ fontSize: '10px', transform: expandedTier === tier.key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                    </button>
                  ))}
                </div>

                {/* Expanded tier categories */}
                {expandedTier && (() => {
                  const tier = TIERS.find(t => t.key === expandedTier)
                  const cats = getEffectiveCatalog(expandedTier).filter(cat => !catalogSearch || cat.name.toLowerCase().includes(catalogSearch.toLowerCase()) || cat.topProducts?.some(p => p.toLowerCase().includes(catalogSearch.toLowerCase())))
                  if (!tier) return null
                  return (
                    <div style={{  }}>
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
                                { label: 'MOQ', value: getTierMOQ(cat.moq, expandedTier), color: c.amber },
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

                            {/* ── Action buttons (edit/delete) ── */}
                            <div style={{ padding: `${sp[1]} ${sp[3]}`, display: 'flex', gap: '6px', borderTop: `1px solid ${c.borderSubtle}` }}>
                              <button onClick={() => {
                                setEditingCatalogItem(cat)
                                setEditingCatalogTier(expandedTier)
                                setCatalogItemForm({
                                  name: cat.name || '', icon: cat.icon || '📦', description: cat.description || '',
                                  priceRange: cat.priceRange || '', moq: String(cat.moq || ''), margin: cat.margin || '',
                                  topProducts: (cat.topProducts || []).join(', '), locations: (cat.locations || []).join(', '),
                                })
                                setShowCatalogItemModal(true)
                              }} style={{
                                flex: 1, padding: '6px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text,
                                fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = `${c.gold}11` }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
                                <Icon d={icons.edit} size={12} /> Modifier
                              </button>
                              <button onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: 'Supprimer cette catégorie ?',
                                  message: `Voulez-vous supprimer "${cat.name}" du catalogue ${tier.label} ?`,
                                  onConfirm: () => {
                                    deleteCatalogItem(expandedTier, cat.id)
                                    toast.success(`"${cat.name}" supprimé du catalogue`)
                                  }
                                })
                              }} style={{
                                flex: 1, padding: '6px', background: 'transparent', border: `1px solid ${c.red}33`, color: c.red,
                                fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.background = `${c.red}11` }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.red}33`; e.currentTarget.style.background = 'transparent' }}>
                                <Icon d={icons.trash} size={12} /> Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* ═══ SECTION 3: GESTION DES CATEGORIES ═══ */}
              <div style={{ marginBottom: sp[4] }}>
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
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
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
                              setConfirmDialog({
                                open: true,
                                title: 'Supprimer',
                                message: `Supprimer la categorie "${cat.name}" ?`,
                                onConfirm: async () => {
                                  try {
                                    await deleteCategory(cat.id)
                                    await loadAll()
                                    toast.success('Categorie supprimee')
                                  } catch (err) { toast.error('Erreur: ' + err.message) }
                                }
                              })
                              return
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
                }} onClick={() => setShowCategoryModal(false)}>
                  <div style={{
                    background: c.bgBase, border: `1px solid ${c.border}`, width: '90%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto',
                    borderRadius: '2px',
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
                            setConfirmDialog({
                              open: true,
                              title: 'Supprimer',
                              message: 'Supprimer cette categorie ?',
                              onConfirm: async () => {
                                try {
                                  await deleteCategory(editingCategory.id)
                                  setShowCategoryModal(false)
                                  await loadAll()
                                  toast.success('Categorie supprimee')
                                } catch (err) { toast.error('Erreur: ' + err.message) }
                              }
                            })
                            return
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

              {/* ── CATALOG ITEM EDIT MODAL ── */}
              {showCatalogItemModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: c.bgOverlay, zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
                }} onClick={() => setShowCatalogItemModal(false)}>
                  <div style={{
                    background: c.bgBase, border: `1px solid ${c.border}`, width: '90%', maxWidth: '520px', maxHeight: '85vh', overflow: 'auto',
                    borderRadius: '2px',
                  }} onClick={e => e.stopPropagation()}>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!editingCatalogItem || !editingCatalogTier) return
                      const override = {
                        name: catalogItemForm.name,
                        icon: catalogItemForm.icon,
                        description: catalogItemForm.description,
                        priceRange: catalogItemForm.priceRange,
                        moq: parseInt(catalogItemForm.moq) || 0,
                        margin: catalogItemForm.margin,
                        topProducts: catalogItemForm.topProducts.split(',').map(s => s.trim()).filter(Boolean),
                        locations: catalogItemForm.locations.split(',').map(s => s.trim()).filter(Boolean),
                      }
                      saveCatalogOverride(editingCatalogTier, editingCatalogItem.id, override)
                      toast.success(`"${override.name}" modifié`)
                      setShowCatalogItemModal(false)
                    }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ padding: sp[4], borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0 }}>
                          Modifier la catégorie
                        </h3>
                        <button type="button" onClick={() => setShowCatalogItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
                          <Icon d={icons.close} size={20} color={c.textSecondary} />
                        </button>
                      </div>

                      <div style={{ flex: 1, padding: sp[4], overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: sp[2] }}>
                          <div>
                            <label style={labelStyle}>Nom *</label>
                            <input type="text" required value={catalogItemForm.name} onChange={e => setCatalogItemForm({...catalogItemForm, name: e.target.value})}
                              style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                          <div>
                            <label style={labelStyle}>Icône</label>
                            <input type="text" maxLength="2" value={catalogItemForm.icon} onChange={e => setCatalogItemForm({...catalogItemForm, icon: e.target.value})}
                              style={{...inputStyle, fontSize: '18px', textAlign: 'center', width: '56px'}}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Description</label>
                          <textarea value={catalogItemForm.description} onChange={e => setCatalogItemForm({...catalogItemForm, description: e.target.value})}
                            style={{...inputStyle, minHeight: '50px', fontFamily: f.body}}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                          <div>
                            <label style={labelStyle}>Fourchette prix</label>
                            <input type="text" value={catalogItemForm.priceRange} onChange={e => setCatalogItemForm({...catalogItemForm, priceRange: e.target.value})}
                              placeholder="1-5€" style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                          <div>
                            <label style={labelStyle}>MOQ</label>
                            <input type="number" value={catalogItemForm.moq} onChange={e => setCatalogItemForm({...catalogItemForm, moq: e.target.value})}
                              placeholder="100" style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                          <div>
                            <label style={labelStyle}>Marge</label>
                            <input type="text" value={catalogItemForm.margin} onChange={e => setCatalogItemForm({...catalogItemForm, margin: e.target.value})}
                              placeholder="×2 à ×3" style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Produits phares (séparés par virgule)</label>
                          <input type="text" value={catalogItemForm.topProducts} onChange={e => setCatalogItemForm({...catalogItemForm, topProducts: e.target.value})}
                            placeholder="Produit 1, Produit 2, ..." style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div>
                          <label style={labelStyle}>Localisations (séparées par virgule)</label>
                          <input type="text" value={catalogItemForm.locations} onChange={e => setCatalogItemForm({...catalogItemForm, locations: e.target.value})}
                            placeholder="Yiwu, Guangzhou, ..." style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                      </div>

                      <div style={{ padding: sp[4], borderTop: `1px solid ${c.border}`, display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowCatalogItemModal(false)} style={{
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
                          Sauvegarder
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
                }} onClick={() => setShowProductModal(false)}>
                  <div style={{
                    background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
                    maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
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
                            <div key={url} style={{ width: 80, height: 80, position: 'relative', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                              <img src={url} alt={`Image du produit ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button onClick={async () => {
                                try {
                                  await deleteProductImage(url)
                                  const newUrls = editingProduct.image_urls.filter((_, j) => j !== i)
                                  await updateProduct(editingProduct.id, { image_urls: newUrls })
                                  setEditingProduct({ ...editingProduct, image_urls: newUrls })
                                  toast.success('Image supprimée')
                                } catch (err) { toast.error('Erreur: ' + (err.message || 'Inconnue')) }
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
                            setConfirmDialog({
                              open: true,
                              title: 'Supprimer',
                              message: 'Supprimer ce produit ?',
                              onConfirm: async () => {
                                try {
                                  for (const url of (editingProduct.image_urls || [])) { await deleteProductImage(url) }
                                  await deleteProduct(editingProduct.id)
                                  setShowProductModal(false)
                                  await loadAll()
                                  toast.success('Produit supprime')
                                } catch (err) { toast.error('Erreur: ' + err.message) }
                              }
                            })
                            return
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4] }}>
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
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>TOTAL ENVOIS</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.teal }}>{shipments.length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>EN TRANSIT</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.gold }}>{shipments.filter(s => s.status === 'transit').length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>LIVRÉS</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.teal }}>{shipments.filter(s => s.status === 'livré').length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
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
                          <tr key={shipment.id || idx} style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4] }}>
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
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>RÉFÉRENCES</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.purple }}>{inventory.length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>QUANTITÉ TOTALE</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.purple }}>{inventory.reduce((acc, item) => acc + (item.quantity || 0), 0)}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, marginBottom: sp[1] }}>ALERTES STOCK</p>
                  <p style={{ fontSize: size.lg, fontWeight: 700, color: c.red }}>{inventory.filter(item => (item.quantity || 0) <= (item.alert_threshold || 0)).length}</p>
                </div>
                <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
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

          {/* ── BOUTIQUES TAB ── */}
          {mainTab === 'boutiques' && (() => {
            const statusColors = { draft: c.textTertiary, building: c.amber, review: c.blue, active: c.green, paused: c.red, archived: c.textTertiary }
            const statusLabels = { draft: 'Brouillon', building: 'En construction', review: 'En revue', active: 'Active', paused: 'En pause', archived: 'Archivée' }
            const platformLabels = { shopify: 'Shopify', woocommerce: 'WooCommerce', prestashop: 'PrestaShop', custom: 'Sur mesure' }
            const templateLabels = { classic: 'Classic', modern: 'Modern', minimal: 'Minimal', editorial: 'Éditorial' }
            const filteredShops = shops.filter(s => {
              if (shopStatusFilter && s.status !== shopStatusFilter) return false
              if (shopSearch) {
                const q = shopSearch.toLowerCase()
                const client = allProfiles.find(p => p.id === s.client_id)
                if (!(s.name || '').toLowerCase().includes(q) && !(s.domain || '').toLowerCase().includes(q) && !(client?.full_name || '').toLowerCase().includes(q) && !(client?.email || '').toLowerCase().includes(q)) return false
              }
              return true
            })
            const totalRevenue = shops.reduce((sum, s) => sum + (parseFloat(s.monthly_revenue) || 0), 0)
            const totalProducts = shops.reduce((sum, s) => sum + (s.products_synced || 0), 0)
            const totalOrders = shops.reduce((sum, s) => sum + (s.monthly_orders || 0), 0)
            const selectedShop = selectedShopId ? shops.find(s => s.id === selectedShopId) : null
            const selectedShopClient = selectedShop ? allProfiles.find(p => p.id === selectedShop.client_id) : null

            // Setup progress steps
            const setupSteps = [
              { key: 'draft', label: 'Création', desc: 'Projet initialisé' },
              { key: 'building', label: 'Construction', desc: 'Design et développement' },
              { key: 'review', label: 'Revue client', desc: 'Validation du client' },
              { key: 'active', label: 'En ligne', desc: 'Boutique publiée' },
            ]
            const statusOrder = ['draft', 'building', 'review', 'active']
            const getStepIndex = (status) => { const idx = statusOrder.indexOf(status); return idx >= 0 ? idx : -1 }

            return (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* ── LEFT: SHOP LIST ── */}
              <div className="admin-scroll admin-sidebar" style={{ width: selectedShop ? '380px' : '100%', flexShrink: 0, overflowY: 'auto', padding: sp[4], borderRight: selectedShop ? `1px solid ${c.border}` : 'none', transition: 'width 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
                  <div>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      Boutiques E-commerce
                    </h2>
                    <ArtDecoDivider width={50} />
                    <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1], lineHeight: 1.5 }}>
                      {filteredShops.length}/{shops.length} boutique{shops.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button onClick={() => { setEditingShop(null); setShopForm({ name: '', platform: 'shopify', domain: '', template: 'classic', notes: '', client_id: '', logo_url: '', products_synced: 0, monthly_orders: 0, monthly_revenue: 0 }); setShowShopModal(true) }} style={{
                    padding: `10px ${sp[3]}`, background: c.gold, color: c.bg, border: 'none',
                    fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <Icon d={icons.plus} size={16} color={c.bg} />
                    Nouvelle boutique
                  </button>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedShop ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
                  {[
                    { label: 'Boutiques', value: shops.length, color: c.gold, sub: `${shops.filter(s => s.status === 'active').length} actives` },
                    { label: 'Revenus/mois', value: `${totalRevenue.toLocaleString('fr-FR')}€`, color: c.green, sub: `${totalOrders} commandes` },
                    ...(!selectedShop ? [
                      { label: 'Produits sync.', value: totalProducts, color: c.teal, sub: `${[...new Set(shops.map(s => s.platform))].length} plateformes` },
                      { label: 'En construction', value: shops.filter(s => s.status === 'building' || s.status === 'draft').length, color: c.amber, sub: `${shops.filter(s => s.status === 'review').length} en revue` },
                    ] : []),
                  ].map((stat, i) => (
                    <div key={i} style={{ padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}` }}>
                      <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{stat.label}</div>
                      <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginTop: '2px' }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: sp[2], marginBottom: sp[3], flexWrap: 'wrap', alignItems: 'center', padding: `${sp[1]} ${sp[2]}`, background: c.bgSurface, border: `1px solid ${c.border}` }}>
                  <div style={{ position: 'relative', flex: '1 1 140px', minWidth: 120 }}>
                    <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <Icon d={icons.search} size={11} color={c.textTertiary} />
                    </div>
                    <input type="text" value={shopSearch} onChange={e => setShopSearch(e.target.value)}
                      placeholder="Rechercher..."
                      style={{ width: '100%', padding: '6px 8px 6px 26px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontSize: '10px', fontFamily: f.body, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = c.gold}
                      onBlur={e => e.target.style.borderColor = c.border} />
                  </div>
                  <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                    {[null, 'active', 'building', 'draft', 'review', 'paused'].map(st => (
                      <button key={st || 'all'} onClick={() => setShopStatusFilter(shopStatusFilter === st ? null : st)} style={{
                        padding: '4px 8px', fontSize: '8px', fontFamily: f.mono, fontWeight: shopStatusFilter === st ? 700 : 500,
                        background: shopStatusFilter === st ? (statusColors[st] || c.gold) : 'transparent',
                        color: shopStatusFilter === st ? c.bg : c.textTertiary,
                        border: `1px solid ${shopStatusFilter === st ? (statusColors[st] || c.gold) : c.border}`,
                        cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{st ? (statusLabels[st]?.split(' ')[0] || st) : 'Tous'}</button>
                    ))}
                  </div>
                </div>

                {/* Shop list */}
                {filteredShops.length === 0 ? (
                  <DragonEmptyState title="Aucune boutique" subtitle={shopSearch || shopStatusFilter ? 'Aucun résultat pour ces filtres' : 'Créez une boutique pour commencer'} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {filteredShops.map(shop => {
                      const client = allProfiles.find(p => p.id === shop.client_id)
                      const isSelected = selectedShopId === shop.id
                      return (
                        <div key={shop.id} onClick={() => setSelectedShopId(isSelected ? null : shop.id)} style={{
                          padding: `${sp[2]} ${sp[3]}`, background: isSelected ? `${c.gold}08` : c.bgSurface,
                          borderBottom: `1px solid ${isSelected ? `${c.gold}33` : c.borderSubtle}`,
                          borderLeft: isSelected ? `3px solid ${c.gold}` : '3px solid transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: `all 0.15s ${ease.smooth}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 36, height: 36, flexShrink: 0,
                              background: `${c.gold}12`, border: `1.5px solid ${c.gold}30`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold,
                            }}>{(shop.name || '?')[0].toUpperCase()}</div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</span>
                                <span style={{
                                  padding: '2px 6px', fontSize: '7px', fontFamily: f.mono, fontWeight: 700,
                                  color: statusColors[shop.status] || c.textTertiary,
                                  background: `${statusColors[shop.status] || c.textTertiary}15`,
                                  letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                                }}>{statusLabels[shop.status]?.split(' ')[0] || shop.status}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px', display: 'flex', gap: sp[1] }}>
                                <span>{client?.full_name?.split(' ')[0] || client?.email?.split('@')[0] || '—'}</span>
                                <span style={{ color: c.gold }}>{platformLabels[shop.platform] || shop.platform}</span>
                                {(shop.monthly_revenue > 0) && <span style={{ color: c.green }}>{parseFloat(shop.monthly_revenue).toLocaleString('fr-FR')}€/m</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono, flexShrink: 0 }}>
                            {shop.products_synced || 0} prod.
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── RIGHT: SHOP DETAIL ── */}
              {selectedShop && (
                <div className="admin-scroll admin-detail" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
                  {/* Detail header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4] }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[1] }}>
                        <div style={{
                          width: 48, height: 48,
                          background: `${c.gold}15`, border: `2px solid ${c.gold}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold,
                        }}>{selectedShop.name[0].toUpperCase()}</div>
                        <div>
                          <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>{selectedShop.name}</h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginTop: '4px' }}>
                            <span style={{
                              padding: '3px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                              color: statusColors[selectedShop.status], background: `${statusColors[selectedShop.status]}15`,
                              border: `1px solid ${statusColors[selectedShop.status]}33`, letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>{statusLabels[selectedShop.status] || selectedShop.status}</span>
                            <span style={{ padding: '3px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 600, color: c.gold, background: `${c.gold}12`, border: `1px solid ${c.gold}25` }}>
                              {platformLabels[selectedShop.platform] || selectedShop.platform}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: sp[1] }}>
                      <button onClick={() => {
                        setEditingShop(selectedShop)
                        setShopForm({
                          name: selectedShop.name || '', platform: selectedShop.platform || 'shopify',
                          domain: selectedShop.domain || '', template: selectedShop.template || 'classic',
                          notes: selectedShop.notes || '', client_id: selectedShop.client_id || '',
                          logo_url: selectedShop.logo_url || '', products_synced: selectedShop.products_synced || 0,
                          monthly_orders: selectedShop.monthly_orders || 0, monthly_revenue: selectedShop.monthly_revenue || 0,
                        })
                        setShowShopModal(true)
                      }} style={{
                        padding: `8px ${sp[3]}`, background: c.gold, color: c.bg, border: 'none',
                        fontFamily: f.body, fontSize: size.xs, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Icon d={icons.edit} size={13} color={c.bg} /> Modifier
                      </button>
                      <button onClick={() => setSelectedShopId(null)} style={{
                        padding: '8px', background: 'transparent', border: `1px solid ${c.border}`,
                        color: c.textTertiary, cursor: 'pointer',
                      }}>
                        <Icon d={icons.close} size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Setup progress */}
                  <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
                    <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Progression</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {setupSteps.map((step, i) => {
                        const currentIdx = getStepIndex(selectedShop.status)
                        const isPaused = selectedShop.status === 'paused' || selectedShop.status === 'archived'
                        const isCompleted = !isPaused && i <= currentIdx
                        const isCurrent = !isPaused && i === currentIdx
                        return (
                          <div key={step.key} style={{ flex: 1, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: 28, height: 28, flexShrink: 0,
                                background: isCompleted ? (isCurrent ? c.gold : `${c.gold}30`) : c.bgElevated,
                                border: `2px solid ${isCompleted ? c.gold : c.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: f.mono, fontSize: '10px', fontWeight: 700,
                                color: isCompleted ? (isCurrent ? c.bg : c.gold) : c.textTertiary,
                                transition: 'all 0.3s ease',
                              }}>
                                {isCompleted && !isCurrent ? '✓' : i + 1}
                              </div>
                              {i < setupSteps.length - 1 && (
                                <div style={{ flex: 1, height: 2, background: isCompleted && i < currentIdx ? c.gold : c.border, margin: '0 4px', transition: 'background 0.3s ease' }} />
                              )}
                            </div>
                            <div style={{ marginTop: '6px', paddingRight: sp[2] }}>
                              <div style={{ fontSize: '10px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? c.gold : c.textSecondary }}>{step.label}</div>
                              <div style={{ fontSize: '8px', color: c.textTertiary, marginTop: '1px' }}>{step.desc}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {(selectedShop.status === 'paused' || selectedShop.status === 'archived') && (
                      <div style={{ marginTop: sp[2], padding: `${sp[1]} ${sp[2]}`, background: `${c.red}10`, border: `1px solid ${c.red}25`, fontSize: '10px', color: c.red, fontWeight: 600 }}>
                        Boutique {selectedShop.status === 'paused' ? 'en pause' : 'archivée'}
                      </div>
                    )}
                  </div>

                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[2], marginBottom: sp[3] }}>
                    {[
                      { label: 'Produits', value: selectedShop.products_synced || 0, color: c.teal, icon: '📦' },
                      { label: 'Commandes/mois', value: selectedShop.monthly_orders || 0, color: c.blue, icon: '🛒' },
                      { label: 'Revenus/mois', value: `${parseFloat(selectedShop.monthly_revenue || 0).toLocaleString('fr-FR')}€`, color: c.green, icon: '💰' },
                      { label: 'Template', value: templateLabels[selectedShop.template] || selectedShop.template || '—', color: c.gold, icon: '🎨' },
                    ].map((kpi, i) => (
                      <div key={i} style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', marginBottom: '6px' }}>{kpi.icon}</div>
                        <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                        <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Detail grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3], marginBottom: sp[3] }}>
                    {/* Client info */}
                    <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}` }}>
                      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Client</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                        <div style={{
                          width: 40, height: 40,
                          background: `${c.gold}12`, border: `1.5px solid ${c.gold}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.gold,
                        }}>{(selectedShopClient?.full_name || selectedShopClient?.email || '?')[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{selectedShopClient?.full_name || '—'}</div>
                          <div style={{ fontSize: size.xs, color: c.textTertiary }}>{selectedShopClient?.email || '—'}</div>
                          {selectedShopClient?.company && <div style={{ fontSize: '10px', color: c.textSecondary, marginTop: '2px' }}>{selectedShopClient.company}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Tech info */}
                    <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}` }}>
                      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Configuration</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                          <span style={{ color: c.textTertiary }}>Plateforme</span>
                          <span style={{ color: c.gold, fontWeight: 600 }}>{platformLabels[selectedShop.platform] || selectedShop.platform}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                          <span style={{ color: c.textTertiary }}>Template</span>
                          <span style={{ color: c.text }}>{templateLabels[selectedShop.template] || selectedShop.template || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                          <span style={{ color: c.textTertiary }}>Domaine</span>
                          {selectedShop.domain ? (
                            <span style={{ color: c.teal, fontWeight: 500, cursor: 'pointer' }} onClick={() => window.open(`https://${selectedShop.domain}`, '_blank')}>{selectedShop.domain} ↗</span>
                          ) : (
                            <span style={{ color: c.textTertiary, fontStyle: 'italic' }}>Non configuré</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                          <span style={{ color: c.textTertiary }}>Créée le</span>
                          <span style={{ color: c.text }}>{selectedShop.created_at ? new Date(selectedShop.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: size.xs }}>
                          <span style={{ color: c.textTertiary }}>Mise à jour</span>
                          <span style={{ color: c.text }}>{selectedShop.updated_at ? fmtDate(selectedShop.updated_at) : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme config preview */}
                  {selectedShop.theme_config && typeof selectedShop.theme_config === 'object' && Object.keys(selectedShop.theme_config).length > 0 && (
                    <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
                      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Thème</div>
                      <div style={{ display: 'flex', gap: sp[3], flexWrap: 'wrap', alignItems: 'center' }}>
                        {selectedShop.theme_config.primary_color && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                            <div style={{ width: 20, height: 20, background: selectedShop.theme_config.primary_color, border: `1px solid ${c.border}` }} />
                            <span style={{ fontSize: size.xs, color: c.textSecondary }}>Primaire</span>
                          </div>
                        )}
                        {selectedShop.theme_config.secondary_color && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                            <div style={{ width: 20, height: 20, background: selectedShop.theme_config.secondary_color, border: `1px solid ${c.border}` }} />
                            <span style={{ fontSize: size.xs, color: c.textSecondary }}>Secondaire</span>
                          </div>
                        )}
                        {selectedShop.theme_config.font && (
                          <span style={{ fontSize: size.xs, color: c.textSecondary }}>Police : <span style={{ fontWeight: 600, color: c.text }}>{selectedShop.theme_config.font}</span></span>
                        )}
                        {selectedShop.theme_config.style && (
                          <span style={{ padding: '3px 8px', fontSize: '9px', fontFamily: f.mono, color: c.gold, background: `${c.gold}12`, border: `1px solid ${c.gold}25`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{selectedShop.theme_config.style}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedShop.notes && (
                    <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
                      <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>Notes internes</div>
                      <p style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{selectedShop.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2] }}>
                    {selectedShop.domain && (
                      <button onClick={() => window.open(`https://${selectedShop.domain}`, '_blank')} style={{
                        padding: `8px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.teal}40`,
                        color: c.teal, fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Icon d={icons.link} size={13} color={c.teal} /> Visiter le site
                      </button>
                    )}
                    <button onClick={async () => {
                      setConfirmDialog({
                        open: true,
                        title: 'Supprimer',
                        message: 'Supprimer cette boutique ?',
                        onConfirm: async () => {
                          try { await deleteShop(selectedShop.id); setSelectedShopId(null); await loadAll(); toast.success('Boutique supprimée') }
                          catch (err) { toast.error('Erreur: ' + err.message) }
                        }
                      })
                      return
                    }} style={{
                      padding: `8px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.red}33`,
                      color: c.red, fontSize: size.xs, fontWeight: 600, cursor: 'pointer', fontFamily: f.body,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Icon d={icons.trash} size={13} color={c.red} /> Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
            )
          })()}

          {/* ── BOUTIQUE MODAL ── */}
          {showShopModal && (
            <div style={{
              position: 'fixed', inset: 0, background: c.bgOverlay, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
            }} onClick={() => setShowShopModal(false)}>
              <div style={{
                background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
                maxWidth: '520px', width: '90%', maxHeight: '85vh', overflowY: 'auto',
              }} onClick={e => e.stopPropagation()} className="admin-scroll">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700 }}>
                    {editingShop ? 'Modifier la boutique' : 'Nouvelle boutique'}
                  </h2>
                  <button onClick={() => setShowShopModal(false)} style={{ background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer' }}>
                    <Icon d={icons.close} size={16} />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!shopForm.name.trim() || !shopForm.client_id) { toast.error('Nom et client requis'); return }
                  try {
                    if (editingShop) {
                      await updateShop(editingShop.id, shopForm)
                      toast.success('Boutique mise à jour')
                    } else {
                      await createShop(shopForm)
                      toast.success('Boutique créée')
                    }
                    setShowShopModal(false)
                    await loadAll()
                  } catch (err) { toast.error('Erreur: ' + err.message) }
                }} style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>

                  <div>
                    <label style={labelStyle}>Client *</label>
                    <select value={shopForm.client_id} onChange={e => setShopForm({...shopForm, client_id: e.target.value})} style={inputStyle}>
                      <option value="">Sélectionner un client</option>
                      {allProfiles.filter(p => p.role !== 'admin').map(p => (
                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Nom de la boutique *</label>
                    <input type="text" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})}
                      placeholder="Ex: La Boutique de Fatima" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                      onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                    <div>
                      <label style={labelStyle}>Plateforme</label>
                      <select value={shopForm.platform} onChange={e => setShopForm({...shopForm, platform: e.target.value})} style={inputStyle}>
                        <option value="shopify">Shopify</option>
                        <option value="woocommerce">WooCommerce</option>
                        <option value="prestashop">PrestaShop</option>
                        <option value="custom">Sur mesure</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Template</label>
                      <select value={shopForm.template} onChange={e => setShopForm({...shopForm, template: e.target.value})} style={inputStyle}>
                        <option value="classic">Classic</option>
                        <option value="modern">Modern</option>
                        <option value="minimal">Minimal</option>
                        <option value="editorial">Éditorial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Domaine</label>
                    <input type="text" value={shopForm.domain} onChange={e => setShopForm({...shopForm, domain: e.target.value})}
                      placeholder="maboutique.myshopify.com" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                      onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                  </div>

                  {editingShop && (
                    <div>
                      <label style={labelStyle}>Statut</label>
                      <select value={editingShop.status} onChange={async (e) => {
                        try {
                          await updateShop(editingShop.id, { status: e.target.value })
                          setEditingShop({ ...editingShop, status: e.target.value })
                          toast.success('Statut mis à jour')
                          await loadAll()
                        } catch (err) { toast.error('Erreur: ' + err.message) }
                      }} style={inputStyle}>
                        <option value="draft">Brouillon</option>
                        <option value="building">En construction</option>
                        <option value="review">En revue client</option>
                        <option value="active">Active</option>
                        <option value="paused">En pause</option>
                        <option value="archived">Archivée</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>URL du logo</label>
                    <input type="text" value={shopForm.logo_url} onChange={e => setShopForm({...shopForm, logo_url: e.target.value})}
                      placeholder="https://..." style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                      onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                    <div>
                      <label style={labelStyle}>Produits sync.</label>
                      <input type="number" min="0" value={shopForm.products_synced} onChange={e => setShopForm({...shopForm, products_synced: parseInt(e.target.value) || 0})}
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                        onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Cmd/mois</label>
                      <input type="number" min="0" value={shopForm.monthly_orders} onChange={e => setShopForm({...shopForm, monthly_orders: parseInt(e.target.value) || 0})}
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                        onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Revenu/mois (€)</label>
                      <input type="number" min="0" step="0.01" value={shopForm.monthly_revenue} onChange={e => setShopForm({...shopForm, monthly_revenue: parseFloat(e.target.value) || 0})}
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                        onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={shopForm.notes} onChange={e => setShopForm({...shopForm, notes: e.target.value})}
                      placeholder="Notes internes..." style={{ ...inputStyle, minHeight: 60, fontFamily: f.body }}
                      onFocus={e => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                      onBlur={e => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                  </div>

                  <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                    {editingShop && (
                      <button type="button" onClick={async () => {
                        setConfirmDialog({
                          open: true,
                          title: 'Supprimer',
                          message: 'Supprimer cette boutique ?',
                          onConfirm: async () => {
                            try { await deleteShop(editingShop.id); setShowShopModal(false); await loadAll(); toast.success('Boutique supprimée') }
                            catch (err) { toast.error('Erreur: ' + err.message) }
                          }
                        })
                        return
                      }} style={{
                        padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                        border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                      }}>Supprimer</button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={() => setShowShopModal(false)} style={{
                      padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                      border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                    }}>Annuler</button>
                    <button type="submit" style={{
                      padding: `10px ${sp[3]}`, background: c.gold, color: c.bg,
                      border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                    }}>{editingShop ? 'Sauvegarder' : 'Créer la boutique'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── SERVICES E-COM TAB ── */}
          {mainTab === 'services' && (() => {
            const serviceTypes = { creation: 'Création', gestion: 'Gestion', formation: 'Formation', marketing: 'Marketing' }
            const serviceColors = { creation: c.gold, gestion: c.teal, formation: c.blue, marketing: c.purple }
            const serviceIcons = { creation: '🏪', gestion: '⚙️', formation: '📚', marketing: '📣' }
            const packLabels = { starter: 'Starter', pro: 'Pro', premium: 'Premium' }
            const statusLabels = { pending: 'En attente', onboarding: 'Onboarding', in_progress: 'En cours', review: 'Revue', delivered: 'Livré', active: 'Actif', paused: 'Pause' }
            const statusColors = { pending: c.textTertiary, onboarding: c.amber, in_progress: c.blue, review: c.purple, delivered: c.green, active: c.green, paused: c.red }

            const defaultTasks = {
              creation: [
                { key: 'branding', label: 'Branding & identité visuelle', done: false },
                { key: 'domain', label: 'Domaine & hébergement', done: false },
                { key: 'theme', label: 'Thème & design', done: false },
                { key: 'catalogue', label: 'Catalogue produits', done: false },
                { key: 'payment', label: 'Paiement configuré', done: false },
                { key: 'shipping', label: 'Livraison configurée', done: false },
                { key: 'legal', label: 'Pages légales (CGV, mentions)', done: false },
                { key: 'seo', label: 'SEO de base', done: false },
                { key: 'launch', label: 'Mise en ligne', done: false },
              ],
              gestion: [
                { key: 'stock', label: 'Mise à jour stock', done: false },
                { key: 'orders', label: 'Traitement commandes', done: false },
                { key: 'sav', label: 'SAV & retours', done: false },
                { key: 'analytics', label: 'Rapport analytics', done: false },
                { key: 'promo', label: 'Calendrier promos', done: false },
              ],
              formation: [
                { key: 'dashboard', label: 'Tour du dashboard', done: false },
                { key: 'orders_mgmt', label: 'Gestion commandes', done: false },
                { key: 'catalogue_mgmt', label: 'Gestion catalogue', done: false },
                { key: 'photos', label: 'Photos produits', done: false },
                { key: 'seo_basics', label: 'Bases SEO', done: false },
                { key: 'sav_guide', label: 'Guide SAV', done: false },
              ],
              marketing: [
                { key: 'ad_setup', label: 'Compte pub configuré', done: false },
                { key: 'audience', label: 'Audiences définies', done: false },
                { key: 'creative', label: 'Créas publicitaires', done: false },
                { key: 'launch_campaign', label: 'Campagne lancée', done: false },
                { key: 'reporting', label: 'Reporting & optimisation', done: false },
              ],
            }

            const filtered = ecomServices.filter(s => {
              if (serviceFilter && s.service_type !== serviceFilter) return false
              if (serviceSearch) {
                const q = serviceSearch.toLowerCase()
                const client = allProfiles.find(p => p.id === s.client_id)
                if (!(serviceTypes[s.service_type] || '').toLowerCase().includes(q) && !(client?.full_name || '').toLowerCase().includes(q) && !(client?.email || '').toLowerCase().includes(q)) return false
              }
              return true
            })

            const byType = Object.keys(serviceTypes).map(t => ({ type: t, count: ecomServices.filter(s => s.service_type === t).length, active: ecomServices.filter(s => s.service_type === t && (s.status === 'active' || s.status === 'in_progress')).length }))
            const totalRevenue = ecomServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)

            const handleSaveService = async (e) => {
              e.preventDefault()
              try {
                const payload = {
                  client_id: serviceForm.client_id || null,
                  service_type: serviceForm.service_type,
                  pack: serviceForm.pack,
                  platform: serviceForm.platform,
                  price: parseFloat(serviceForm.price) || 0,
                  notes: serviceForm.notes,
                  shop_id: serviceForm.shop_id || null,
                  tasks: defaultTasks[serviceForm.service_type] || [],
                  status: 'pending',
                }
                if (editingService) {
                  const { tasks: _, status: __, ...updatePayload } = payload
                  await updateEcomService(editingService.id, updatePayload)
                } else {
                  payload.started_at = new Date().toISOString()
                  await createEcomService(payload)
                }
                setShowServiceModal(false)
                setEditingService(null)
                loadAll()
                toast.success(editingService ? 'Service mis à jour' : 'Service créé')
              } catch (err) {
                toast.error('Erreur: ' + err.message)
              }
            }

            const handleToggleTask = async (service, taskIndex) => {
              const tasks = [...(service.tasks || [])]
              tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done }
              const allDone = tasks.every(t => t.done)
              const updates = { tasks }
              if (allDone && service.status === 'in_progress') {
                updates.status = 'delivered'
                updates.delivered_at = new Date().toISOString()
              }
              try {
                await updateEcomService(service.id, updates)
                loadAll()
              } catch (err) { toast.error('Erreur: ' + err.message) }
            }

            const handleStatusChange = async (service, newStatus) => {
              try {
                const updates = { status: newStatus }
                if (newStatus === 'in_progress' && !service.started_at) updates.started_at = new Date().toISOString()
                if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString()
                await updateEcomService(service.id, updates)
                loadAll()
                toast.success('Statut mis à jour')
              } catch (err) { toast.error('Erreur: ' + err.message) }
            }

            return (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>Services E-commerce</h2>
                  <ArtDecoDivider width={50} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>{ecomServices.length} service{ecomServices.length > 1 ? 's' : ''} actif{ecomServices.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => { setEditingService(null); setServiceForm({ client_id: '', service_type: 'creation', pack: 'starter', platform: 'shopify', price: '', notes: '', shop_id: '' }); setShowServiceModal(true) }} style={{
                  padding: `10px ${sp[3]}`, background: c.amber, color: c.bg, border: 'none',
                  fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Icon d={icons.plus} size={16} color={c.bg} />
                  Nouveau service
                </button>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: sp[2], marginBottom: sp[3] }}>
                {byType.map(t => (
                  <div key={t.type} onClick={() => setServiceFilter(serviceFilter === t.type ? null : t.type)} style={{
                    padding: `${sp[2]} ${sp[3]}`, background: serviceFilter === t.type ? `${serviceColors[t.type]}15` : c.bgElevated,
                    border: `1px solid ${serviceFilter === t.type ? serviceColors[t.type] : c.border}`, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{serviceIcons[t.type]}</div>
                    <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: serviceColors[t.type] }}>{t.count}</div>
                    <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{serviceTypes[t.type]}</div>
                    <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginTop: '2px' }}>{t.active} actif{t.active > 1 ? 's' : ''}</div>
                  </div>
                ))}
                <div style={{ padding: `${sp[2]} ${sp[3]}`, background: c.bgElevated, border: `1px solid ${c.border}` }}>
                  <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>CA Total</div>
                  <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: c.green }}>{totalRevenue.toLocaleString('fr-FR')}€</div>
                  <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginTop: '2px' }}>{ecomServices.filter(s => s.status === 'delivered' || s.status === 'active').length} livrés</div>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: sp[3], maxWidth: 300 }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <Icon d={icons.search} size={13} color={c.textTertiary} />
                </div>
                <input type="text" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Rechercher un service..."
                  style={{ width: '100%', padding: '8px 12px 8px 30px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontSize: size.sm, fontFamily: f.body, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = c.amber}
                  onBlur={e => e.target.style.borderColor = c.border}
                />
              </div>

              {/* Service cards */}
              {filtered.length === 0 ? (
                <DragonEmptyState title="Aucun service" subtitle="Créez votre premier service e-commerce pour un client." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                  {filtered.map(svc => {
                    const client = allProfiles.find(p => p.id === svc.client_id)
                    const shop = shops.find(s => s.id === svc.shop_id)
                    const tasks = svc.tasks || []
                    const doneTasks = tasks.filter(t => t.done).length
                    const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

                    return (
                      <div key={svc.id} style={{ background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[3], transition: 'all 0.2s ease' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[2] }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                            <span style={{ fontSize: '20px' }}>{serviceIcons[svc.service_type]}</span>
                            <div>
                              <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700 }}>
                                {serviceTypes[svc.service_type]} — {packLabels[svc.pack] || svc.pack}
                              </div>
                              <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>
                                {client?.full_name || 'Client inconnu'} · {svc.platform} · {svc.price ? `${svc.price}€` : 'Gratuit'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                            {/* Status dropdown */}
                            <select value={svc.status} onChange={e => handleStatusChange(svc, e.target.value)} style={{
                              padding: '4px 8px', fontSize: '10px', fontFamily: f.mono, background: c.bgElevated,
                              color: statusColors[svc.status] || c.text, border: `1px solid ${statusColors[svc.status] || c.border}`,
                              cursor: 'pointer', outline: 'none',
                            }}>
                              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            {/* Edit button */}
                            <button onClick={() => {
                              setEditingService(svc)
                              setServiceForm({ client_id: svc.client_id || '', service_type: svc.service_type, pack: svc.pack || 'starter', platform: svc.platform || 'shopify', price: svc.price || '', notes: svc.notes || '', shop_id: svc.shop_id || '' })
                              setShowServiceModal(true)
                            }} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`, color: c.textSecondary, cursor: 'pointer' }}>
                              <Icon d={icons.edit} size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {tasks.length > 0 && (
                          <div style={{ marginBottom: sp[2] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progression</span>
                              <span style={{ fontFamily: f.mono, fontSize: '9px', color: progress === 100 ? c.green : c.amber }}>{doneTasks}/{tasks.length} — {progress}%</span>
                            </div>
                            <div style={{ height: 4, background: c.bgElevated, borderRadius: 0, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? c.green : serviceColors[svc.service_type], transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        )}

                        {/* Tasks checklist */}
                        {tasks.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px' }}>
                            {tasks.map((task, idx) => (
                              <div key={task.key || idx} onClick={() => handleToggleTask(svc, idx)} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                                background: task.done ? `${c.green}08` : 'transparent', cursor: 'pointer',
                                borderLeft: `2px solid ${task.done ? c.green : c.border}`,
                                transition: 'all 0.15s ease',
                              }}>
                                <div style={{
                                  width: 14, height: 14, border: `1.5px solid ${task.done ? c.green : c.border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  background: task.done ? c.green : 'transparent',
                                }}>
                                  {task.done && <Icon d={icons.check} size={9} color={c.bg} sw={2.5} />}
                                </div>
                                <span style={{
                                  fontSize: '11px', fontFamily: f.body, color: task.done ? c.textSecondary : c.text,
                                  textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.3,
                                }}>{task.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Shop link + notes */}
                        {(shop || svc.notes) && (
                          <div style={{ marginTop: sp[2], paddingTop: sp[1], borderTop: `1px solid ${c.border}`, display: 'flex', gap: sp[3], flexWrap: 'wrap' }}>
                            {shop && <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold }}>🔗 {shop.name} ({shop.domain || shop.platform})</span>}
                            {svc.notes && <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>{svc.notes}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Create/Edit Service Modal */}
              {showServiceModal && (
                <div style={{ position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: sp[3] }} onClick={() => setShowServiceModal(false)}>
                  <div style={{ background: c.bgSurface, border: `1px solid ${c.border}`, width: '100%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto', padding: sp[4] }} onClick={e => e.stopPropagation()}>
                    <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: sp[3] }}>
                      {editingService ? 'Modifier le service' : 'Nouveau service e-com'}
                    </h3>
                    <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                      {/* Client */}
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Client</label>
                        <select value={serviceForm.client_id} onChange={e => setServiceForm(p => ({ ...p, client_id: e.target.value }))} required style={{
                          width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                        }}>
                          <option value="">Sélectionner un client</option>
                          {allProfiles.filter(p => p.role === 'client').map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                        </select>
                      </div>
                      {/* Type + Pack */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                        <div>
                          <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Type de service</label>
                          <select value={serviceForm.service_type} onChange={e => setServiceForm(p => ({ ...p, service_type: e.target.value }))} style={{
                            width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                          }}>
                            {Object.entries(serviceTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Pack</label>
                          <select value={serviceForm.pack} onChange={e => setServiceForm(p => ({ ...p, pack: e.target.value }))} style={{
                            width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                          }}>
                            {Object.entries(packLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      {/* Platform + Price */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                        <div>
                          <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Plateforme</label>
                          <select value={serviceForm.platform} onChange={e => setServiceForm(p => ({ ...p, platform: e.target.value }))} style={{
                            width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                          }}>
                            <option value="shopify">Shopify</option>
                            <option value="woocommerce">WooCommerce</option>
                            <option value="prestashop">PrestaShop</option>
                            <option value="custom">Sur mesure</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Prix (EUR)</label>
                          <input type="number" value={serviceForm.price} onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))} placeholder="0" style={{
                            width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', boxSizing: 'border-box',
                          }} />
                        </div>
                      </div>
                      {/* Linked shop */}
                      {shops.length > 0 && (
                        <div>
                          <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Boutique liée (optionnel)</label>
                          <select value={serviceForm.shop_id} onChange={e => setServiceForm(p => ({ ...p, shop_id: e.target.value }))} style={{
                            width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none',
                          }}>
                            <option value="">Aucune</option>
                            {shops.filter(s => !serviceForm.client_id || s.client_id === serviceForm.client_id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>)}
                          </select>
                        </div>
                      )}
                      {/* Notes */}
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Notes</label>
                        <textarea value={serviceForm.notes} onChange={e => setServiceForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notes internes..." style={{
                          width: '100%', padding: '8px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        }} />
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end', marginTop: sp[2] }}>
                        {editingService && (
                          <button type="button" onClick={async () => {
                            setConfirmDialog({
                              open: true, title: 'Supprimer ce service ?', message: 'Cette action est irréversible.',
                              onConfirm: async () => {
                                try { await deleteEcomService(editingService.id); setShowServiceModal(false); setEditingService(null); loadAll(); toast.success('Service supprimé') }
                                catch (err) { toast.error('Erreur: ' + err.message) }
                              }
                            })
                          }} style={{
                            padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                            border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                          }}>Supprimer</button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button type="button" onClick={() => setShowServiceModal(false)} style={{
                          padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                          border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button type="submit" style={{
                          padding: `10px ${sp[3]}`, background: c.amber, color: c.bg,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>{editingService ? 'Sauvegarder' : 'Créer le service'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
            )
          })()}

          {/* ── CLIENTS TAB ── */}
          {mainTab === 'clients' && (() => {
            const filteredClients = allProfiles.filter(cl => {
              if (clientTierFilter && (cl.client_tier || DEFAULT_TIER) !== clientTierFilter) return false
              if (search && !(cl.full_name || '').toLowerCase().includes(search.toLowerCase()) && !(cl.email || '').toLowerCase().includes(search.toLowerCase()) && !(cl.company || '').toLowerCase().includes(search.toLowerCase())) return false
              return true
            })
            return (
            <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Clients
                  </h2>
                  <ArtDecoDivider width={80} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, marginTop: sp[1] }}>
                    {filteredClients.length}/{allProfiles.length} profil{allProfiles.length > 1 ? 's' : ''}
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

              {/* Filters bar */}
              <div style={{
                display: 'flex', gap: sp[2], marginBottom: sp[3], flexWrap: 'wrap', alignItems: 'center',
                padding: `${sp[2]} ${sp[3]}`, background: c.bgSurface, border: `1px solid ${c.border}`,
              }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon d={icons.search} size={12} color={c.textTertiary} />
                  </div>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un client..."
                    style={{
                      width: '100%', padding: '8px 10px 8px 30px', background: c.bgElevated,
                      border: `1px solid ${c.border}`, color: c.text, fontSize: size.xs,
                      fontFamily: f.body, outline: 'none', boxSizing: 'border-box',
                      transition: `border-color 0.2s ${ease.smooth}`,
                    }}
                    onFocus={e => e.target.style.borderColor = c.gold}
                    onBlur={e => e.target.style.borderColor = c.border} />
                </div>

                {/* Tier filter pills */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => setClientTierFilter(null)} style={{
                    padding: '6px 12px', fontSize: '9px', fontFamily: f.mono, fontWeight: !clientTierFilter ? 700 : 500,
                    background: !clientTierFilter ? c.gold : 'transparent', color: !clientTierFilter ? c.bg : c.textTertiary,
                    border: `1px solid ${!clientTierFilter ? c.gold : c.border}`, cursor: 'pointer',
                    letterSpacing: '0.04em', textTransform: 'uppercase', transition: `all 0.15s ${ease.smooth}`,
                  }}>Tous</button>
                  {TIERS.map(t => (
                    <button key={t.key} onClick={() => setClientTierFilter(clientTierFilter === t.key ? null : t.key)} style={{
                      padding: '6px 12px', fontSize: '9px', fontFamily: f.mono, fontWeight: clientTierFilter === t.key ? 700 : 500,
                      background: clientTierFilter === t.key ? t.color : 'transparent',
                      color: clientTierFilter === t.key ? c.bg : c.textTertiary,
                      border: `1px solid ${clientTierFilter === t.key ? t.color : c.border}`, cursor: 'pointer',
                      letterSpacing: '0.04em', textTransform: 'uppercase', transition: `all 0.15s ${ease.smooth}`,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{ fontSize: '12px' }}>{t.icon}</span> {t.label}
                      <span style={{ opacity: 0.7, fontSize: '8px' }}>{allProfiles.filter(p => (p.client_tier || DEFAULT_TIER) === t.key).length}</span>
                    </button>
                  ))}
                </div>
              </div>

              {filteredClients.length === 0 ? (
                <DragonEmptyState title="Aucun client" subtitle={search || clientTierFilter ? 'Aucun résultat pour ces filtres' : 'Invitez des clients pour commencer'} />
              ) : (
                /* ── CLIENT TABLE ── */
                <div className="admin-client-table" style={{ background: c.bgSurface, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 0.8fr 0.8fr 1fr',
                    padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.border}`, background: c.bgElevated,
                    gap: sp[2],
                  }}>
                    {['Client', 'Profil', 'Services', 'Commandes', 'Dernière', 'Actions'].map(h => (
                      <div key={h} style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</div>
                    ))}
                  </div>

                  {/* Table rows */}
                  {filteredClients.map((client, i) => {
                    const orderCount = getClientOrderCount(client.id)
                    const lastOrderDate = getClientLastOrderDate(client.id)
                    const initial = (client.full_name || client.email).charAt(0).toUpperCase()
                    const tier = getTierByKey(client.client_tier || DEFAULT_TIER)
                    const isSelected = selectedClientTab === client.id
                    return (
                      <div key={client.id}>
                        {/* Main row */}
                        <div
                          onClick={() => setSelectedClientTab(isSelected ? null : client.id)}
                          style={{
                            display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 0.8fr 0.8fr 1fr',
                            padding: `${sp[2]} ${sp[3]}`, gap: sp[2],
                            borderBottom: `1px solid ${isSelected ? tier.color + '33' : c.borderSubtle}`,
                            background: isSelected ? `${tier.color}08` : 'transparent',
                            cursor: 'pointer', alignItems: 'center',
                          }}>

                          {/* Client identity */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], minWidth: 0 }}>
                            <div style={{
                              width: 36, height: 36, flexShrink: 0,
                              background: `${tier.color}15`, border: `2px solid ${tier.color}44`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: tier.color,
                            }}>{initial}</div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {client.full_name || client.email}
                                </span>
                                {client.role === 'admin' && (
                                  <span style={{
                                    padding: '1px 5px', background: `${c.purple}20`, border: `1px solid ${c.purple}40`,
                                    fontSize: '7px', fontFamily: f.mono, fontWeight: 700, color: c.purple,
                                    letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                                  }}>ADMIN</span>
                                )}
                              </div>
                              <div style={{ fontSize: '10px', color: c.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {client.email}
                                {client.company && <span style={{ color: c.textSecondary }}> &middot; {client.company}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Tier pill */}
                          <div>
                            <span style={{
                              padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: `${tier.color}15`, border: `1px solid ${tier.color}33`,
                              fontSize: '9px', fontFamily: f.mono, fontWeight: 700, color: tier.color,
                              letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>
                              <span style={{ fontSize: '11px' }}>{tier.icon}</span>
                              {tier.label}
                            </span>
                          </div>

                          {/* Services */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {[
                              { key: 'sourcing', label: 'Sourcing', color: c.red },
                              { key: 'logistics', label: 'Logistique', color: c.teal },
                              { key: 'stock', label: 'Stock', color: c.purple },
                            ].map(svc => {
                              const enabled = (client.services_enabled || ['sourcing']).includes(svc.key)
                              return enabled ? (
                                <span key={svc.key} style={{
                                  padding: '2px 6px', background: `${svc.color}12`, border: `1px solid ${svc.color}30`,
                                  fontSize: '8px', fontFamily: f.mono, fontWeight: 600, color: svc.color,
                                  letterSpacing: '0.03em',
                                }}>{svc.label}</span>
                              ) : null
                            })}
                          </div>

                          {/* Orders count */}
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: orderCount > 0 ? c.gold : c.textTertiary }}>
                            {orderCount}
                          </div>

                          {/* Last order */}
                          <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
                            {lastOrderDate ? lastOrderDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '–'}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setShowCreateOrder(true); setCreateOrderData(prev => ({ ...prev, clientId: client.id })) }} style={{
                              padding: '5px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                              color: c.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                              fontSize: '9px', fontFamily: f.mono, fontWeight: 600,
                              letterSpacing: '0.03em',
                            }}>
                              <Icon d={icons.plus} size={10} color="currentColor" /> CMD
                            </button>
                            <button onClick={() => { setClientPasswordModal(client); setPasswordAction(null); setNewTempPassword('') }} style={{
                              padding: '5px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                              color: c.textTertiary, cursor: 'pointer', display: 'flex', alignItems: 'center',
                              transition: `all 0.2s ${ease.smooth}`,
                            }}
                            >
                              <Icon d={icons.lock} size={12} color="currentColor" />
                            </button>
                          </div>
                        </div>

                        {/* ── EXPANDED CLIENT DETAIL ── */}
                        {isSelected && (
                          <div style={{
                            padding: `${sp[3]} ${sp[4]}`, background: `${tier.color}05`,
                            borderBottom: `2px solid ${tier.color}33`,
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[4] }}>
                              {/* Left: Profile + Tier management */}
                              <div>
                                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2] }}>
                                  Profil & Services
                                </div>

                                {/* Contact details */}
                                <div style={{ marginBottom: sp[3] }}>
                                  {client.company && <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text, marginBottom: '4px' }}>{client.company}</div>}
                                  {client.phone && <div style={{ fontSize: size.xs, color: c.textSecondary, marginBottom: '2px' }}>Tel: {client.phone}</div>}
                                  {client.city && <div style={{ fontSize: size.xs, color: c.textSecondary }}>Ville: {client.city}</div>}
                                  {!client.company && !client.phone && !client.city && (
                                    <div style={{ fontSize: size.xs, color: c.textTertiary, fontStyle: 'italic' }}>Aucune info de contact renseign&eacute;e</div>
                                  )}
                                </div>

                                {/* Tier selector */}
                                <div style={{ marginBottom: sp[3] }}>
                                  <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Changer le profil</div>
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {TIERS.map(t => (
                                      <button key={t.key} onClick={() => {
                                        updateProfile(client.id, { client_tier: t.key }).then(() => loadAll()).catch(err => console.error('Error:', err))
                                      }} style={{
                                        flex: 1, padding: '6px 4px',
                                        background: (client.client_tier || DEFAULT_TIER) === t.key ? t.color : c.bgElevated,
                                        border: `1px solid ${(client.client_tier || DEFAULT_TIER) === t.key ? t.color : c.border}`,
                                        color: (client.client_tier || DEFAULT_TIER) === t.key ? c.bg : c.textTertiary,
                                        fontSize: '9px', fontFamily: f.mono, fontWeight: (client.client_tier || DEFAULT_TIER) === t.key ? 700 : 400,
                                        cursor: 'pointer', transition: `all 0.15s ${ease.smooth}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                                      }}
                                      onMouseEnter={e => { if ((client.client_tier || DEFAULT_TIER) !== t.key) { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.color = t.color } }}
                                      onMouseLeave={e => { if ((client.client_tier || DEFAULT_TIER) !== t.key) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textTertiary } }}>
                                        <span style={{ fontSize: '12px' }}>{t.icon}</span> {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Services toggles */}
                                <div>
                                  <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>Services actifs</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {[
                                      { key: 'sourcing', label: 'Sourcing Chine', color: c.red, icon: '\u25C6', desc: 'Inclus — recherche fournisseurs', free: true },
                                      { key: 'logistics', label: 'Expédition & Logistique', color: c.teal, icon: '▸', desc: 'Fret maritime, aérien, express' },
                                      { key: 'stock', label: 'Stock & E-commerce', color: c.purple, icon: '\u2B21', desc: 'Stockage Yiwu + boutique en ligne' },
                                    ].map(svc => {
                                      const enabled = (client.services_enabled || ['sourcing']).includes(svc.key)
                                      return (
                                        <button key={svc.key} onClick={() => {
                                          if (svc.free) return
                                          const current = client.services_enabled || ['sourcing']
                                          const next = enabled ? current.filter(s => s !== svc.key) : [...current, svc.key]
                                          updateProfile(client.id, { services_enabled: next }).then(() => loadAll()).catch(err => { toast.error('Erreur: ' + (err.message || 'Inconnue')); console.error('Error:', err) })
                                        }} style={{
                                          padding: `${sp[1]} ${sp[2]}`, textAlign: 'left',
                                          background: enabled ? `${svc.color}08` : 'transparent',
                                          border: `1px solid ${enabled ? svc.color + '30' : c.borderSubtle}`,
                                          cursor: svc.free ? 'default' : 'pointer',
                                          transition: `all 0.2s ${ease.smooth}`,
                                          display: 'flex', alignItems: 'center', gap: sp[2],
                                        }}>
                                          <div style={{
                                            width: 20, height: 20, flexShrink: 0,
                                            background: enabled ? svc.color : c.bgElevated,
                                            border: `1px solid ${enabled ? svc.color : c.border}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', color: enabled ? c.bg : c.textTertiary,
                                          }}>{enabled ? '\u2713' : ''}</div>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: size.xs, fontWeight: 600, color: enabled ? svc.color : c.textSecondary }}>{svc.label}</div>
                                            <div style={{ fontSize: '9px', color: c.textTertiary }}>{svc.desc}</div>
                                          </div>
                                          {svc.free && <span style={{ fontSize: '8px', fontFamily: f.mono, color: c.textTertiary, opacity: 0.6 }}>INCLUS</span>}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Orders */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[2] }}>
                                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Commandes ({orderCount})
                                  </div>
                                </div>
                                {orders.filter(o => o.client_id === client.id).length === 0 ? (
                                  <div style={{ padding: sp[3], background: c.bgElevated, border: `1px solid ${c.borderSubtle}`, textAlign: 'center' }}>
                                    <div style={{ fontSize: size.xs, color: c.textTertiary }}>Aucune commande</div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 220, overflowY: 'auto' }}>
                                    {orders.filter(o => o.client_id === client.id).slice(0, 8).map(order => {
                                      const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]
                                      return (
                                        <div key={order.id} style={{
                                          padding: `${sp[1]} ${sp[2]}`, background: c.bgElevated,
                                          border: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', gap: sp[2],
                                          transition: `all 0.2s ${ease.smooth}`,
                                        }}
                                        onClick={() => { setMainTab('commandes'); setSelectedId(order.id) }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = c.bgSurface }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderSubtle; e.currentTarget.style.background = c.bgElevated }}>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: size.xs, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product}</div>
                                            <div style={{ fontSize: '9px', color: c.textTertiary, fontFamily: f.mono }}>{order.ref} &middot; {(order.quantity || 0).toLocaleString('fr-FR')}u</div>
                                          </div>
                                          <StatusPill status={order.status} />
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })()}
        </main>
      </div>

      {/* ════════════ MODAL: Client Password ════════════ */}
      {clientPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: c.bgOverlay, display: 'flex', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
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
                    await loadAll()
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
              <div style={{  }}>
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
              <div style={{  }}>
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
                      const { error } = await resetPassword(clientPasswordModal.email)
                      if (error) throw error
                      toast.success('Email de réinitialisation envoyé à ' + clientPasswordModal.email)
                      setPasswordAction('done')
                      setLastSetPassword('')
                    } catch (err) {
                      toast.error('Erreur: ' + (err.message || 'Inconnue'))
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
              <div style={{  }}>
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
              <div style={{  }}>
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
        }} onClick={() => setShowCreateOrder(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
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
        }} onClick={() => setShowCreateShipment(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
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
        }} onClick={() => setShowCreateInventory(false)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
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
        }} onClick={() => setEditingShipment(null)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
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
        }} onClick={() => setEditingInventoryItem(null)}>
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
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
        onConfirm={async () => { setConfirmDialog({ open: false }); if (confirmDialog.onConfirm) await confirmDialog.onConfirm() }}
        onCancel={() => setConfirmDialog({ open: false })}
        danger
      />
    </div>
  )
}
