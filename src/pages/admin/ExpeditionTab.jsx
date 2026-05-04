/* ── CARAXES Admin — Expedition Tab ── */
import { useState } from 'react'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'
import { useAdmin } from './AdminContext'
import { Icon, icons, ArtDecoDivider, inputStyle, labelStyle, focusGlow } from './AdminShared'
import { Modal } from '../../components/Toast'

// Status labels — stored as strings in Supabase to match OverviewTab filters
const SHIP_STATUSES = ['production', 'QC', 'douanes', 'transit', 'livré']
// Legacy int → string converter for existing data that was stored as integers
const shipStatusToStr = SHIP_STATUSES
const normalizeStatus = (s) => typeof s === 'number' ? (SHIP_STATUSES[s] || 'production') : (s || 'production')

export default function ExpeditionTab() {
  const {
    shipments, orders, allProfiles, loadAll,
    toast, t, tToast, confirmDialog, setConfirmDialog, clientName,
    createShipment, updateShipment, deleteShipment,
  } = useAdmin()

  // ── Local state ──
  const [showCreateShipment, setShowCreateShipment] = useState(false)
  const [createShipmentData, setCreateShipmentData] = useState({ client_id: '', order_id: '', product_name: '', tracking_number: '', method: 'maritime', destination: '', origin: 'Chine', weight_kg: '', notes: '', status: 'production' })
  const [editingShipment, setEditingShipment] = useState(null)
  const [editShipmentData, setEditShipmentData] = useState({})

  // ── Handlers ──
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
        status: createShipmentData.status || 'production',
      })
      setCreateShipmentData({ client_id: '', order_id: '', product_name: '', tracking_number: '', method: 'maritime', destination: '', origin: 'Chine', weight_kg: '', notes: '', status: 'production' })
      setShowCreateShipment(false)
      await loadAll()
      toast.success(t('toast.shipmentRecorded'))
    } catch (err) { console.error('Create shipment error:', err); toast.error(err?.message ? tToast('genericError', { error: err.message }) : t('toast.shipmentCreationError')) }
  }

  const handleSaveShipment = async () => {
    if (!editingShipment) return
    try {
      const payload = {}
      if (editShipmentData.tracking_number != null) payload.tracking_number = editShipmentData.tracking_number
      if (editShipmentData.method != null) payload.method = editShipmentData.method
      if (editShipmentData.destination != null) payload.destination = editShipmentData.destination
      if (editShipmentData.weight_kg != null) payload.weight_kg = editShipmentData.weight_kg ? parseFloat(editShipmentData.weight_kg) : null
      if (editShipmentData.status != null) payload.status = normalizeStatus(editShipmentData.status)
      if (editShipmentData.notes != null) payload.notes = editShipmentData.notes
      if (editShipmentData.eta != null) payload.eta = editShipmentData.eta
      if (editShipmentData.origin != null) payload.origin = editShipmentData.origin
      await updateShipment(editingShipment.id, payload)
      setEditingShipment(null)
      await loadAll()
      toast.success(t('toast.shipmentUpdated'))
    } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
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
          toast.success(t('toast.shipmentDeleted'))
        } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
      },
    })
  }

  return (
    <>
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
                  transition: `all 0.35s ${ease.luxury}`, display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '3px', boxShadow: shadow.xs,
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
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Client</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Tracking</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Statut</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Méthode</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Origine</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Destination</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>ETA</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Poids</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Actions</th>
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
                                background: (shipStatusToStr[shipment.status] || shipment.status) === 'livré' ? 'rgba(90, 170, 106, 0.1)' :
                                           (shipStatusToStr[shipment.status] || shipment.status) === 'transit' ? 'rgba(196, 58, 47, 0.1)' : 'rgba(180, 60, 80, 0.1)',
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
                                transition: `all 0.35s ${ease.luxury}`, borderRadius: '2px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${c.teal}15`; e.currentTarget.style.borderColor = c.teal }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.border }}>
                                <Icon d={icons.edit} size={12} color={c.teal} />
                              </button>
                              <button onClick={() => handleDeleteShipment(shipment.id)} style={{
                                padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                                color: c.red, fontSize: size.xs, cursor: 'pointer', fontFamily: f.mono,
                                transition: `all 0.35s ${ease.luxury}`, borderRadius: '2px',
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

      {/* ═══════ MODAL: Nouvel envoi ═══════ */}
      <Modal open={showCreateShipment} onClose={() => setShowCreateShipment(false)} title="Nouvel envoi" maxWidth={480}>
            <ArtDecoDivider width={80} color={c.teal} />

            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select value={createShipmentData.client_id} onChange={e => setCreateShipmentData({...createShipmentData, client_id: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingInlineEnd: sp[3]}}
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
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingInlineEnd: sp[3]}}
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
                  cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                  Enregistrer
                </button>
              </div>
            </form>
      </Modal>

      {/* ═══════ MODAL: Edit Shipment ═══════ */}
      <Modal open={!!editingShipment} onClose={() => setEditingShipment(null)} title="Modifier l'envoi" maxWidth={480}>
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
      </Modal>
    </>
  )
}
