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

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
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

  // If no profile exists, auto-create one
  if (!data) {
    const { data: session } = await supabase.auth.getSession()
    const email = session?.session?.user?.email || ''
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'client',
        client_tier: 'detaillant',
        onboarding_done: false,
      })
      .select()
      .maybeSingle()

    if (insertError) {
      console.error('Auto-create profile error:', insertError)
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
export async function getOrders(clientId = null) {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createOrder({ clientId, product, quantity, budget, deadline, notes }) {
  // Generate unique ref: CRX-XXXXXX (timestamp-based)
  const ref = 'CRX-' + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 100)).padStart(2, '0')
  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: clientId,
      ref,
      product,
      quantity: parseInt(quantity) || 0,
      budget: budget || 'À définir',
      deadline: deadline || 'À définir',
      notes,
      status: 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOrder(orderId, updates) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
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
  const { data, error } = await supabase
    .from('messages')
    .insert({
      order_id: orderId,
      sender_id: senderId,
      sender_role: senderRole,
      content,
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
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
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1h
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

// ─── UTILS ───
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

// ─── UPDATE PROFILE ───
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── ALL PROFILES (admin) ───
export async function getAllClients() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
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
  const { data, error } = await supabase.from('shipments').insert(shipment).select().single()
  if (error) throw error
  return data
}

export async function updateShipment(id, updates) {
  const { data, error } = await supabase.from('shipments').update(updates).eq('id', id).select().single()
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
  const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function createInventoryItem(item) {
  const { data, error } = await supabase.from('inventory').insert(item).select().single()
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
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
  if (error) throw error
  return data
}

export async function updateSupplier(id, updates) {
  const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── LINK ORDER → SUPPLIER ───
export async function linkOrderToSupplier(orderId, supplierId, priceUnit, notes) {
  const { data, error } = await supabase.from('order_suppliers').insert({
    order_id: orderId,
    supplier_id: supplierId,
    price_unit: priceUnit,
    notes,
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
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ─── PRODUCT IMAGE UPLOAD ───
export async function uploadProductImage(file, productId) {
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
  const { data, error } = await supabase.from('categories').insert(category).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── WELCOME MESSAGE ───
// Note: messages are tied to order_id (per-order chat), so a welcome message
// without an order cannot be inserted. This function is a no-op until a
// notifications table or global messages system is implemented.
export async function sendWelcomeMessage(userId) {
  // Intentionally no-op — the messages table requires order_id.
  // Welcome info is shown in the onboarding UI instead.
  return
}