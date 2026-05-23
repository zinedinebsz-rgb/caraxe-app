import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ─── AUTH ───
export async function signInWithEmail(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
}

export async function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithPassword(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: fullName },
    },
  })
}

export async function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function updateUserPassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}

export async function resendConfirmationEmail(email) {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: window.location.origin },
  })
}

// ─── OAUTH (Google / Apple) ───
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
      skipBrowserRedirect: false,
    },
  })
}


export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) { console.error('getSession error:', error); return null }
  return data.session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('getProfile error:', error)
    return null
  }

  // If no profile exists, auto-create one (useful for OAuth signups where no profile is pre-created)
  if (!data) {
    const { data: session } = await supabase.auth.getSession()
    const user = session?.session?.user
    const email = user?.email || ''
    // Extract full name from OAuth metadata (Google returns name in user_metadata)
    const meta = user?.user_metadata || {}
    const fullName = meta.full_name || meta.name || meta.given_name || (email ? email.split('@')[0] : 'Client')
    const avatarUrl = meta.avatar_url || meta.picture || null

    const profilePayload = {
      id: userId,
      email,
      full_name: fullName,
      role: 'client',
      client_tier: 'detaillant',
      onboarding_done: false,
    }
    // Only add avatar_url if present (some schemas may not have this column)
    if (avatarUrl) profilePayload.avatar_url = avatarUrl

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profilePayload)
      .select()
      .maybeSingle()

    if (insertError) {
      console.error('Auto-create profile error:', insertError)
      // If avatar_url column doesn't exist or RLS issue with extra field, retry without it
      if (avatarUrl && insertError.message && insertError.message.includes('avatar_url')) {
        const { data: retry2 } = await supabase
          .from('profiles')
          .insert({
            id: userId, email, full_name: fullName,
            role: 'client', client_tier: 'detaillant', onboarding_done: false,
          })
          .select()
          .maybeSingle()
        if (retry2) return retry2
      }
      // Profile might already exist (race condition) — retry fetch
      const { data: retryData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      return retryData
    }
    return newProfile
  }

  return data
}

// ─── ORDERS ───
export async function getOrders(clientId = null, { page = 0, pageSize = 200, paginate = false } = {}) {
  // SECURITY: Always filter by clientId if provided. RLS policies should prevent unauthorized access,
  // but this app-level safeguard ensures clients never accidentally see other users' orders.
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error, count } = await query
  if (error) throw error
  // Backward-compatible: returns plain array unless paginate:true is passed
  if (paginate) return { data: data || [], count, page, pageSize }
  return data || []
}

export async function createOrder({ clientId, product, quantity, budget, deadline, notes }) {
  requireFields({ clientId, product }, ['clientId', 'product'])
  maxLength(product, 500, 'Produit')
  maxLength(notes, 5000, 'Notes')
  const ref = 'CRX-' + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 100)).padStart(2, '0')
  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: clientId,
      ref,
      product: sanitize(product),
      quantity: parseInt(quantity) || 0,
      budget: sanitize(budget) || 'À définir',
      deadline: sanitize(deadline) || 'À définir',
      notes: sanitize(notes),
      status: 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOrder(orderId, updates) {
  if (!orderId) throw new Error('orderId requis')
  const { data, error } = await supabase
    .from('orders')
    .update(sanitizeObj(updates))
    .eq('id', orderId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw error
}

// ─── MESSAGES ───
export async function getMessages(orderId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage({ orderId, senderId, senderRole, content, attachmentUrl, attachmentName }) {
  requireFields({ orderId, senderId, senderRole }, ['orderId', 'senderId', 'senderRole'])
  maxLength(content, 10000, 'Message')
  const { data, error } = await supabase
    .from('messages')
    .insert({
      order_id: orderId,
      sender_id: senderId,
      sender_role: sanitize(senderRole),
      content: sanitize(content),
      attachment_url: attachmentUrl || null,
      attachment_name: sanitize(attachmentName) || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUnreadCounts(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('order_id')
    .neq('sender_id', userId)
    .eq('read', false)
    .not('order_id', 'is', null)
  if (error) throw error
  const counts = {}
  ;(data || []).forEach(m => { counts[m.order_id] = (counts[m.order_id] || 0) + 1 })
  return counts
}

export async function markMessagesRead(orderId, userId) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('order_id', orderId)
    .neq('sender_id', userId)
    .eq('read', false)
  if (error) throw error
}

// ─── DOCUMENTS ───
export async function getDocuments(orderId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function uploadDocument(orderId, file, uploaderId) {
  validateFile(file)
  const path = `${orderId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('documents')
    .insert({
      order_id: orderId,
      name: file.name,
      size: formatFileSize(file.size),
      storage_path: path,
      uploaded_by: uploaderId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDocumentUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1h
  if (error) throw error
  return data?.signedUrl
}

// ─── REALTIME ───
export function subscribeToMessages(orderId, callback) {
  return supabase
    .channel(`messages:${orderId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `order_id=eq.${orderId}`,
    }, (payload) => callback(payload.new))
    .subscribe()
}

export function subscribeToOrders(callback) {
  return supabase
    .channel('orders-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, (payload) => callback(payload))
    .subscribe()
}

export function subscribeToProducts(callback) {
  return supabase
    .channel('products-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'products',
    }, (payload) => callback(payload))
    .subscribe()
}

export function subscribeToShipments(callback) {
  return supabase
    .channel('shipments-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'shipments',
    }, (payload) => callback(payload))
    .subscribe()
}

export function subscribeToInventory(callback) {
  return supabase
    .channel('inventory-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'inventory',
    }, (payload) => callback(payload))
    .subscribe()
}

// ─── NOTIFICATION SUBSCRIPTIONS ───
export function subscribeToNewClients(callback) {
  return supabase
    .channel('new-clients')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'profiles',
    }, (payload) => callback(payload.new))
    .subscribe()
}

export function subscribeToNewOrders(callback) {
  return supabase
    .channel('new-orders')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
    }, (payload) => callback(payload.new))
    .subscribe()
}

export function subscribeToNewEcomServices(callback) {
  return supabase
    .channel('new-ecom-services')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'ecom_services',
    }, (payload) => callback(payload.new))
    .subscribe()
}

// ─── VALIDATION & SANITIZATION ───

/** Strip HTML tags to prevent XSS — keeps plain text only */
function sanitize(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/<[^>]*>/g, '')         // strip HTML tags
    .replace(/javascript:/gi, '')     // strip JS protocol
    .replace(/on\w+\s*=/gi, '')       // strip event handlers
    .trim()
}

/** Sanitize all string values in an object (shallow) */
function sanitizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const clean = {}
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = typeof v === 'string' ? sanitize(v) : v
  }
  return clean
}

/** Validate required fields — throws if any are missing/empty */
function requireFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') {
      throw new Error(`Champ requis manquant : ${f}`)
    }
  }
}

/** Validate string max length */
function maxLength(str, max, fieldName) {
  if (typeof str === 'string' && str.length > max) {
    throw new Error(`${fieldName} dépasse la limite de ${max} caractères`)
  }
}

// ── File upload validation ──
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  // SVG removed — stored XSS risk (embedded <script> tags execute in browser)
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
]
import { MAX_FILE_SIZE } from './constants'

export function validateFile(file) {
  if (!file) throw new Error('Aucun fichier sélectionné')
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Type de fichier non autorisé : ${file.type}. Types acceptés : images, PDF, Word, Excel, CSV.`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux (${formatFileSize(file.size)}). Maximum : ${formatFileSize(MAX_FILE_SIZE)}.`)
  }
  return true
}

// ─── UTILS ───
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

// ─── UPDATE PROFILE ───
export async function updateProfile(userId, updates) {
  if (!userId) throw new Error('userId requis')
  const { data, error } = await supabase
    .from('profiles')
    .update(sanitizeObj(updates))
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── ALL PROFILES (admin) ───
// Select only fields needed for admin views — no raw passwords or sensitive metadata
const ADMIN_PROFILE_FIELDS = 'id, email, full_name, role, client_tier, phone, company, city, country, avatar_url, onboarding_done, created_at, updated_at'

export async function getAllClients({ page = 0, pageSize = 200, paginate = false } = {}) {
  const { data, error, count } = await supabase
    .from('profiles')
    .select(ADMIN_PROFILE_FIELDS, { count: 'exact' })
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) throw error
  if (paginate) return { data: data || [], count, page, pageSize }
  return data || []
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select(ADMIN_PROFILE_FIELDS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ─── SHIPMENTS (Expédition service) ───
export async function getShipments(clientId = null) {
  let query = supabase.from('shipments').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) { console.warn('shipments table may not exist yet:', error.message); return [] }
  return data || []
}

export async function createShipment(shipment) {
  const { data, error } = await supabase.from('shipments').insert(sanitizeObj(shipment)).select().single()
  if (error) throw error
  return data
}

export async function updateShipment(id, updates) {
  if (!id) throw new Error('shipment id requis')
  const { data, error } = await supabase.from('shipments').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteShipment(id) {
  const { error } = await supabase.from('shipments').delete().eq('id', id)
  if (error) throw error
}

// ─── INVENTORY (Stock service) ───
export async function getInventory(clientId = null) {
  let query = supabase.from('inventory').select('*').order('updated_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) { console.warn('inventory table may not exist yet:', error.message); return [] }
  return data || []
}

export async function updateInventoryItem(id, updates) {
  if (!id) throw new Error('inventory id requis')
  const { data, error } = await supabase.from('inventory').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function createInventoryItem(item) {
  const { data, error } = await supabase.from('inventory').insert(sanitizeObj(item)).select().single()
  if (error) throw error
  return data
}

export async function deleteInventoryItem(id) {
  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (error) throw error
}

// ─── SUPPLIERS (Fournisseurs) ───
export async function getSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true })
  if (error) { console.warn('suppliers table may not exist yet:', error.message); return [] }
  return data || []
}

export async function createSupplier(supplier) {
  const { data, error } = await supabase.from('suppliers').insert(sanitizeObj(supplier)).select().single()
  if (error) throw error
  return data
}

export async function updateSupplier(id, updates) {
  if (!id) throw new Error('supplier id requis')
  const { data, error } = await supabase.from('suppliers').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── LINK ORDER → SUPPLIER ───
export async function linkOrderToSupplier(orderId, supplierId, priceUnit, notes) {
  const { data, error } = await supabase.from('order_suppliers').insert({
    order_id: orderId,
    supplier_id: supplierId,
    price_unit: priceUnit,
    notes: typeof notes === 'string' ? sanitize(notes) : notes,
  }).select().single()
  if (error) throw error
  return data
}

export async function getOrderSuppliers(orderId) {
  const { data, error } = await supabase.from('order_suppliers').select('*, suppliers(*)').eq('order_id', orderId)
  if (error) { console.warn('order_suppliers may not exist:', error.message); return [] }
  return data || []
}

// ─── LINK SHIPMENT → ORDER ───
export async function linkShipmentToOrder(shipmentId, orderId) {
  return updateShipment(shipmentId, { order_id: orderId })
}

// ─── PRODUCTS (Catalogue dynamique) ───
export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('sort_order', { ascending: true })
  if (error) { console.warn('products table may not exist yet:', error.message); return [] }
  return data || []
}

export async function getActiveProducts() {
  const { data, error } = await supabase.from('products').select('*').eq('active', true).order('sort_order', { ascending: true })
  if (error) { console.warn('products:', error.message); return [] }
  return data || []
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(sanitizeObj(product)).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, updates) {
  if (!id) throw new Error('product id requis')
  const { data, error } = await supabase.from('products').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ─── PRODUCT IMAGE UPLOAD ───
export async function uploadProductImage(file, productId) {
  // Validate image files specifically
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!imageTypes.includes(file.type)) throw new Error('Seules les images sont autorisées (JPEG, PNG, WebP, GIF)')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image trop volumineuse (max 5 Mo)')
  const ext = file.name.split('.').pop()
  const path = `${productId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from('products').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('products').getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function deleteProductImage(url) {
  const path = url.split('/storage/v1/object/public/products/')[1]
  if (!path) return
  const { error } = await supabase.storage.from('products').remove([decodeURIComponent(path)])
  if (error) console.warn('delete image error:', error.message)
}

// ─── CATEGORIES (Catalogue dynamique) ───
export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
  if (error) { console.warn('categories table may not exist yet:', error.message); return [] }
  return data || []
}

export async function createCategory(category) {
  const { data, error } = await supabase.from('categories').insert(sanitizeObj(category)).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(id, updates) {
  if (!id) throw new Error('category id requis')
  const { data, error } = await supabase.from('categories').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── SHOPS (E-COMMERCE) ───
export async function getShops(clientId = null) {
  let query = supabase.from('shops').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) { console.warn('shops table may not exist yet:', error.message); return [] }
  return data || []
}

export async function createShop(shop) {
  const { data, error } = await supabase.from('shops').insert(sanitizeObj(shop)).select().single()
  if (error) throw error
  return data
}

export async function updateShop(id, updates) {
  if (!id) throw new Error('shop id requis')
  const { data, error } = await supabase.from('shops').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteShop(id) {
  const { error } = await supabase.from('shops').delete().eq('id', id)
  if (error) throw error
}

// ─── ECOM SERVICES ───
export async function getEcomServices(clientId = null) {
  let query = supabase.from('ecom_services').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) { console.warn('ecom_services table may not exist yet:', error.message); return [] }
  return data || []
}

export async function createEcomService(service) {
  const { data, error } = await supabase.from('ecom_services').insert(sanitizeObj(service)).select().single()
  if (error) throw error
  return data
}

export async function updateEcomService(id, updates) {
  if (!id) throw new Error('ecom_service id requis')
  const { data, error } = await supabase.from('ecom_services').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEcomService(id) {
  const { error } = await supabase.from('ecom_services').delete().eq('id', id)
  if (error) throw error
}

// ─── ECOM ORDER (Commander un service e-com) ───
export async function createEcomOrder({
  clientId, serviceType, pack, platform, shopName, productCategory,
  estimatedProducts, hasBranding, notes, paymentMethod, price, isRecurring, discountPct,
}) {
  requireFields({ clientId, serviceType }, ['clientId', 'serviceType'])
  maxLength(shopName, 200, 'Nom de boutique')
  maxLength(notes, 5000, 'Notes')
  const virementRef = paymentMethod === 'virement'
    ? 'CRX-ECOM-' + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 100)).padStart(2, '0')
    : null

  const { data, error } = await supabase
    .from('ecom_services')
    .insert({
      client_id: clientId,
      service_type: sanitize(serviceType),
      pack: sanitize(pack) || 'custom',
      platform: sanitize(platform) || 'undecided',
      shop_name: sanitize(shopName) || null,
      product_category: sanitize(productCategory) || null,
      estimated_products: estimatedProducts ? parseInt(estimatedProducts) : null,
      has_branding: hasBranding || false,
      notes: sanitize(notes) || null,
      payment_method: sanitize(paymentMethod),
      payment_status: 'pending',
      price: price || 0,
      currency: 'EUR',
      is_recurring: isRecurring || false,
      discount_pct: discountPct || 0,
      virement_reference: virementRef,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── LEADS (Pipeline) ───
export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.warn('leads table may not exist yet:', error.message); return [] }
  return data || []
}

export async function createLead(lead) {
  const { data, error } = await supabase.from('leads').insert(sanitizeObj(lead)).select().single()
  if (error) throw error
  return data
}

export async function updateLead(id, updates) {
  if (!id) throw new Error('lead id requis')
  const { data, error } = await supabase.from('leads').update(sanitizeObj(updates)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

export async function getLeadByEmail(email) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

export async function getLeadByStripeSession(sessionId) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  if (error) return null
  return data
}

export function subscribeToNewLeads(callback) {
  return supabase
    .channel('new-leads')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leads',
    }, (payload) => callback(payload))
    .subscribe()
}

// ─── ADMIN INTERNAL CHAT ───
// Uses the existing messages table with order_id = NULL for team chat
// Admin team chat uses order_id IS NULL (the FK to orders is nullable for this purpose)

export async function getAdminMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .is('order_id', null)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function sendAdminMessage({ senderId, senderName, content }) {
  requireFields({ senderId, content }, ['senderId', 'content'])
  maxLength(content, 10000, 'Message admin')
  const { data, error } = await supabase
    .from('messages')
    .insert({
      order_id: null,
      sender_id: senderId,
      sender_role: 'admin',
      content: sanitize(content),
      attachment_url: null,
      attachment_name: null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function subscribeToAdminMessages(callback) {
  return supabase
    .channel('admin-internal-chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `order_id=is.null`,
    }, (payload) => callback(payload.new))
    .subscribe()
}

// ─── TYPING INDICATOR (presence-based) ───
export function subscribeToTyping(channelName, onPresenceChange) {
  const channel = supabase.channel(channelName, {
    config: { presence: { key: 'typing' } },
  })
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      onPresenceChange(state.typing || [])
    })
    .subscribe()
  return channel
}

export async function setTypingPresence(channel, userId, userName, isTyping) {
  if (isTyping) {
    await channel.track({ user_id: userId, user_name: userName, typing: true })
  } else {
    await channel.untrack()
  }
}

// ─── NOTIFICATION SOUND ───
let _audioCtx = null
export function playNotificationSound() {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    // Resume if suspended (browser autoplay policy)
    if (_audioCtx.state === 'suspended') _audioCtx.resume()
    const oscillator = _audioCtx.createOscillator()
    const gain = _audioCtx.createGain()
    oscillator.connect(gain)
    gain.connect(_audioCtx.destination)
    oscillator.frequency.value = 880
    oscillator.type = 'sine'
    gain.gain.value = 0.15
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3)
    oscillator.start(_audioCtx.currentTime)
    oscillator.stop(_audioCtx.currentTime + 0.3)
  } catch (e) {
    // Silent fail — audio not supported
  }
}
