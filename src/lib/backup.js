/**
 * CARAXES — Emergency Backup Export
 * Exports all business data as a structured CSV zip or single CSV file
 * Zero dependencies — pure browser APIs
 */

import { getOrders, getAllProfiles, supabase } from './supabase'

const SEPARATOR = ','
const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility

function escapeCSV(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toCSV(headers, rows) {
  const lines = [headers.map(escapeCSV).join(SEPARATOR)]
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(SEPARATOR))
  }
  return BOM + lines.join('\n')
}

function downloadFile(content, filename, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export all CARAXES data as a single JSON file (most complete backup)
 */
export async function exportFullBackupJSON() {
  const [profiles, orders] = await Promise.all([getAllProfiles(), getOrders()])

  // Fetch all messages and documents for all orders
  const orderIds = orders.map(o => o.id)
  const [messagesRes, documentsRes] = await Promise.all([
    supabase.from('messages').select('*').in('order_id', orderIds.length ? orderIds : ['_']).order('created_at', { ascending: true }),
    supabase.from('documents').select('*').in('order_id', orderIds.length ? orderIds : ['_']).order('created_at', { ascending: false }),
  ])

  const backup = {
    _meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: 'CARAXES Admin Panel',
      supabase_project: 'nmuqzzedlxilnbpnalsf',
    },
    profiles: profiles || [],
    orders: orders || [],
    messages: messagesRes.data || [],
    documents: documentsRes.data || [],
    stats: {
      total_clients: (profiles || []).length,
      total_orders: (orders || []).length,
      active_orders: (orders || []).filter(o => o.status !== 'delivered' && o.status !== 'completed').length,
      total_messages: (messagesRes.data || []).length,
      total_documents: (documentsRes.data || []).length,
    },
  }

  const now = new Date().toISOString().slice(0, 10)
  downloadFile(JSON.stringify(backup, null, 2), `CARAXES_BACKUP_${now}.json`, 'application/json')
  return backup.stats
}

/**
 * Export all data as multiple CSV files in sequence
 */
export async function exportBackupCSVs() {
  const [profiles, orders] = await Promise.all([getAllProfiles(), getOrders()])
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || p.email || '?']))
  const orderMap = Object.fromEntries((orders || []).map(o => [o.id, o.ref || '?']))

  const orderIds = (orders || []).map(o => o.id)
  const [messagesRes, documentsRes] = await Promise.all([
    supabase.from('messages').select('*').in('order_id', orderIds.length ? orderIds : ['_']).order('created_at', { ascending: true }),
    supabase.from('documents').select('*').in('order_id', orderIds.length ? orderIds : ['_']).order('created_at', { ascending: false }),
  ])

  const messages = messagesRes.data || []
  const documents = documentsRes.data || []
  const now = new Date().toISOString().slice(0, 10)

  // 1. Clients
  downloadFile(
    toCSV(
      ['ID', 'Nom', 'Email', 'Rôle', 'Tier', 'Entreprise', 'Téléphone', 'Ville', 'Adresse', 'Onboarding', 'Créé le'],
      (profiles || []).map(p => [
        p.id, p.full_name, p.email, p.role, p.client_tier,
        p.company, p.phone, p.city, p.address,
        p.onboarding_done ? 'Oui' : 'Non', p.created_at,
      ])
    ),
    `CARAXES_CLIENTS_${now}.csv`
  )

  // 2. Commandes
  downloadFile(
    toCSV(
      ['REF', 'Produit', 'Client', 'Client ID', 'Statut', 'Progression', 'Quantité', 'Budget', 'Deadline', 'Notes', 'Fournisseur', 'Ville', 'Créé le', 'Modifié le'],
      (orders || []).map(o => [
        o.ref, o.product, profileMap[o.client_id] || 'Inconnu', o.client_id,
        o.status, o.progress, o.quantity, o.budget, o.deadline,
        o.notes, o.supplier, o.city, o.created_at, o.updated_at,
      ])
    ),
    `CARAXES_COMMANDES_${now}.csv`
  )

  // 3. Messages
  downloadFile(
    toCSV(
      ['Commande REF', 'Order ID', 'Expéditeur', 'Rôle', 'Contenu', 'Lu', 'Pièce jointe', 'Date'],
      messages.map(m => [
        orderMap[m.order_id] || '?', m.order_id,
        profileMap[m.sender_id] || m.sender_id, m.sender_role,
        m.content, m.read ? 'Oui' : 'Non',
        m.attachment_name || '', m.created_at,
      ])
    ),
    `CARAXES_MESSAGES_${now}.csv`
  )

  // 4. Documents
  downloadFile(
    toCSV(
      ['Commande REF', 'Order ID', 'Nom fichier', 'Taille', 'Storage Path', 'Uploadé par', 'Date'],
      documents.map(d => [
        orderMap[d.order_id] || '?', d.order_id,
        d.original_filename || d.name, d.size,
        d.storage_path, profileMap[d.uploaded_by] || d.uploaded_by, d.created_at,
      ])
    ),
    `CARAXES_DOCUMENTS_${now}.csv`
  )

  return {
    total_clients: (profiles || []).length,
    total_orders: (orders || []).length,
    total_messages: messages.length,
    total_documents: documents.length,
  }
}
