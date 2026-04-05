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
    redirectTo: `${window.location.origin}/login`,
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
  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: clientId,
      product,
      quantity: parseInt(quantity) || 0,
      budget: budget || 'À définir',
      deadline: deadline || 'À définir',
      notes,
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