/* ── CARAXES Admin — Shared Context ── */
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  getOrders, updateOrder, deleteOrder, getMessages, sendMessage,
  getDocuments, uploadDocument, getDocumentUrl, getAllClients, getAllProfiles, createOrder,
  subscribeToMessages, subscribeToOrders, subscribeToNewClients, subscribeToNewOrders, subscribeToNewEcomServices, subscribeToNewLeads, supabase, updateProfile, resetPassword,
  getAdminMessages, sendAdminMessage, subscribeToAdminMessages, playNotificationSound,
  getLeads, updateLead, deleteLead,
  getShipments, createShipment, updateShipment, deleteShipment, getInventory, updateInventoryItem, createInventoryItem, deleteInventoryItem,
  getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage,
  getCategories, createCategory, updateCategory, deleteCategory,
  getShops, createShop, updateShop, deleteShop,
  getEcomServices, createEcomService, updateEcomService, deleteEcomService,
} from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import { useI18n } from '../../lib/i18n.jsx'

const AdminContext = createContext(null)

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}

export function AdminProvider({ user, profile, onSignOut, children }) {
  const toast = useToast()
  const { t, isRtl } = useI18n()
  const tToast = useCallback((key, vars = {}) => {
    const msg = t(`toast.${key}`)
    return Object.entries(vars).reduce((str, [k, v]) => str.replace(`{${k}}`, v), msg)
  }, [t])

  // ── Core data ──
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [shipments, setShipments] = useState([])
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [shops, setShops] = useState([])
  const [ecomServices, setEcomServices] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Navigation ──
  const [mainTab, setMainTab] = useState('overview')

  // ── Notifications ──
  const [notifications, setNotifications] = useState([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)

  // ── Confirm dialog ──
  const [confirmDialog, setConfirmDialog] = useState({ open: false })

  // ── Team chat unread (for sidebar badge) ──
  const [teamUnreadCount, setTeamUnreadCount] = useState(0)

  const loadAllRef = useRef(null)
  const debounceRef = useRef(null)

  const loadAll = useCallback(async () => {
    try {
      const [ordersData, clientsData, profilesData, shipmentsData, inventoryData, productsData, categoriesData, shopsData, ecomData, leadsData] = await Promise.all([getOrders().catch(() => []), getAllClients().catch(() => []), getAllProfiles().catch(() => []), getShipments().catch(() => []), getInventory().catch(() => []), getProducts().catch(() => []), getCategories().catch(() => []), getShops().catch(() => []), getEcomServices().catch(() => []), getLeads().catch(() => [])])
      setOrders(ordersData); setClients(clientsData); setAllProfiles(profilesData); setShipments(shipmentsData); setInventory(inventoryData); setProducts(productsData); setCategories(categoriesData); setShops(shopsData); setEcomServices(ecomData); setLeads(leadsData)
    } catch (err) {
      console.error('loadAll error:', err)
      toast.error(t('toast.loadDataError'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced loadAll — coalesces rapid realtime events into a single fetch
  const debouncedLoadAll = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { loadAll() }, 500)
  }, [loadAll])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    const ch = subscribeToOrders(() => debouncedLoadAll())
    return () => { supabase.removeChannel(ch) }
  }, [debouncedLoadAll])

  // ── NOTIFICATION SYSTEM ──
  const addNotification = useCallback((type, title, detail) => {
    const notif = { id: Date.now(), type, title, detail, time: new Date(), read: false }
    setNotifications(prev => [notif, ...prev].slice(0, 50))
    playNotificationSound()
    if (Notification?.permission === 'granted') {
      new Notification(`CARAXES — ${title}`, { body: detail, icon: '/img/dragon-crest.jpg' })
    }
  }, [])

  const requestNotifPermission = useCallback(() => {
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Realtime subscriptions ──
  useEffect(() => {
    const ch = subscribeToNewClients((newProfile) => {
      const name = newProfile.full_name || newProfile.email || 'Inconnu'
      toast.success(tToast('newClientNotif', { name }))
      addNotification('client', 'Nouveau client', name)
      debouncedLoadAll()
    })
    return () => { supabase.removeChannel(ch) }
  }, [addNotification, debouncedLoadAll])

  useEffect(() => {
    const ch = subscribeToNewOrders((newOrder) => {
      const cl = allProfiles.find(x => x.id === newOrder.client_id)
      const name = cl ? (cl.full_name || cl.email) : 'Client'
      toast.success(tToast('newOrderNotif', { name }))
      addNotification('order', 'Nouvelle commande', `${newOrder.product || 'Produit'} — ${name}`)
      debouncedLoadAll()
    })
    return () => { supabase.removeChannel(ch) }
  }, [addNotification, debouncedLoadAll, allProfiles])

  useEffect(() => {
    const ch = subscribeToNewEcomServices((newService) => {
      const cl = allProfiles.find(x => x.id === newService.client_id)
      const name = cl ? (cl.full_name || cl.email) : 'Client'
      const typeLabel = newService.service_type === 'creation' ? 'Création boutique' : newService.service_type === 'formation' ? 'Formation' : newService.service_type
      toast.success(tToast('newEcomNotif', { type: typeLabel }))
      addNotification('ecom', 'Nouvelle demande e-com', `${typeLabel} — ${name}`)
      debouncedLoadAll()
    })
    return () => { supabase.removeChannel(ch) }
  }, [addNotification, debouncedLoadAll, allProfiles])

  useEffect(() => {
    const ch = subscribeToNewLeads((payload) => {
      if (payload.eventType === 'INSERT') {
        const lead = payload.new
        toast.info(tToast('newLeadNotif', { name: lead.full_name || lead.email }))
        addNotification('lead', 'Nouveau prospect', `${lead.full_name || lead.email} — ${lead.service_type}`)
      } else if (payload.eventType === 'UPDATE' && payload.new.status === 'paid') {
        toast.success(tToast('paymentReceivedNotif', { name: payload.new.full_name || payload.new.email }))
        addNotification('lead', 'Paiement confirme', `${payload.new.full_name || payload.new.email} a paye`)
      }
      debouncedLoadAll()
    })
    return () => { supabase.removeChannel(ch) }
  }, [addNotification, debouncedLoadAll])

  // ── Team Chat: unread badge when not on tab ──
  useEffect(() => {
    if (mainTab === 'team_chat') {
      setTeamUnreadCount(0)
      return
    }
    const sub = subscribeToAdminMessages((newMsg) => {
      if (newMsg.sender_id !== user?.id) {
        setTeamUnreadCount(prev => prev + 1)
        playNotificationSound()
      }
    })
    return () => { sub?.unsubscribe?.() || supabase.removeChannel(sub) }
  }, [mainTab, user?.id])

  // Reset on tab switch
  useEffect(() => {
    window.scrollTo(0, 0)
    const scrollContainer = document.querySelector('.admin-scroll')
    if (scrollContainer) scrollContainer.scrollTop = 0
  }, [mainTab])

  const unreadNotifs = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  // ── Helpers (memoized) ──
  const profilesMap = useMemo(() => {
    const map = new Map()
    allProfiles.forEach(p => map.set(p.id, p))
    clients.forEach(c => { if (!map.has(c.id)) map.set(c.id, c) })
    return map
  }, [allProfiles, clients])

  const clientName = useCallback((clientId) => {
    const cl = profilesMap.get(clientId)
    return cl ? (cl.full_name || cl.email) : 'Inconnu'
  }, [profilesMap])
  const clientInitial = useCallback((clientId) => clientName(clientId).charAt(0).toUpperCase(), [clientName])
  const getClientOrderCount = useCallback((clientId) => orders.filter(o => o.client_id === clientId).length, [orders])
  const getClientLastOrderDate = useCallback((clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId)
    if (clientOrders.length === 0) return null
    return new Date(clientOrders[0].created_at)
  }, [orders])

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 6 && o.status !== 'delivered').length, [orders])
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 6 || o.status === 'delivered' || o.status === 'livré').length, [orders])

  const value = useMemo(() => ({
    // Props
    user, profile, onSignOut,
    // i18n
    t, tToast, isRtl,
    // Toast
    toast,
    // Data
    orders, setOrders, clients, setClients, allProfiles, setAllProfiles,
    shipments, setShipments, inventory, setInventory,
    products, setProducts, categories, setCategories,
    shops, setShops, ecomServices, setEcomServices, leads, setLeads,
    loading,
    loadAll,
    // Navigation
    mainTab, setMainTab,
    // Notifications
    notifications, setNotifications, showNotifPanel, setShowNotifPanel,
    unreadNotifs, markAllRead, addNotification, requestNotifPermission, playNotificationSound,
    // Team chat
    teamUnreadCount, setTeamUnreadCount,
    // Confirm dialog
    confirmDialog, setConfirmDialog,
    // Helpers
    clientName, clientInitial, getClientOrderCount, getClientLastOrderDate,
    activeOrders, deliveredOrders,
    // Supabase re-exports (for tab components)
    supabase,
    updateOrder, deleteOrder, getMessages, sendMessage, getDocuments, uploadDocument, getDocumentUrl,
    createOrder, subscribeToMessages,
    updateProfile, resetPassword,
    getAdminMessages, sendAdminMessage, subscribeToAdminMessages,
    updateLead, deleteLead,
    createShipment, updateShipment, deleteShipment,
    updateInventoryItem, createInventoryItem, deleteInventoryItem,
    createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage,
    createCategory, updateCategory, deleteCategory,
    createShop, updateShop, deleteShop,
    createEcomService, updateEcomService, deleteEcomService,
    sendPushToUser: null, // imported separately by tabs that need it
  }), [
    user, profile, onSignOut, t, tToast, isRtl, toast,
    orders, clients, allProfiles, shipments, inventory, products, categories, shops, ecomServices, leads, loading,
    loadAll, mainTab, notifications, showNotifPanel, unreadNotifs, markAllRead, addNotification, requestNotifPermission,
    teamUnreadCount, confirmDialog, clientName, clientInitial, getClientOrderCount, getClientLastOrderDate, activeOrders, deliveredOrders,
  ])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
