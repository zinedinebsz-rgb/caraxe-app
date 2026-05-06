/* ── CARAXES Admin — Stock Tab ── */
import { useState } from 'react'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'
import { useAdmin } from './AdminContext'
import { Icon, icons, ArtDecoDivider, inputStyle, labelStyle, focusGlow } from './AdminShared'
import { Modal } from '../../components/Toast'

export default function StockTab() {
  const {
    inventory, allProfiles, loadAll,
    toast, t, tToast, confirmDialog, setConfirmDialog, clientName,
    updateInventoryItem, createInventoryItem, deleteInventoryItem,
  } = useAdmin()

  // ── Local state ──
  const [showCreateInventory, setShowCreateInventory] = useState(false)
  const [createInventoryData, setCreateInventoryData] = useState({ client_id: '', product_name: '', sku: '', quantity: '', alert_threshold: '10', warehouse: 'France', unit_price: '', notes: '' })
  const [editingInventoryItem, setEditingInventoryItem] = useState(null)
  const [editInventoryData, setEditInventoryData] = useState({})

  // ── Handlers ──
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
      toast.success(t('toast.inventoryItemAdded'))
    } catch (err) { toast.error(t('toast.inventoryItemCreationError')) }
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
      toast.success(t('toast.inventoryItemUpdated'))
    } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
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
          toast.success(t('toast.inventoryItemDeleted'))
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
                  transition: `all 0.35s ${ease.luxury}`, display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '3px', boxShadow: shadow.xs,
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
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Produit</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>SKU</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Quantité</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Seuil alerte</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Entrepôt</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Statut</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Mis à jour</th>
                          <th style={{ padding: sp[3], textAlign: 'start', fontFamily: f.mono, fontWeight: 600, color: c.textSecondary }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item, idx) => {
                          const isLowStock = (item.quantity || 0) <= (item.alert_threshold || 0)
                          return (
                            <tr key={item.id || idx} style={{
                              borderBottom: `1px solid ${c.borderSubtle}`,
                              background: isLowStock ? 'rgba(180, 60, 80, 0.05)' : 'transparent',

                            }}>
                              <td style={{ padding: sp[3], color: c.text }}>{item.product_name || 'N/A'}</td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontFamily: f.mono, fontSize: size.xs }}>{item.sku || '—'}</td>
                              <td style={{ padding: sp[3], color: isLowStock ? c.red : c.text, fontWeight: isLowStock ? 600 : 400 }}>{item.quantity || 0}</td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{item.alert_threshold || '—'}</td>
                              <td style={{ padding: sp[3], color: c.textSecondary, fontSize: size.xs }}>{item.warehouse || '—'}</td>
                              <td style={{ padding: sp[3] }}>
                                <span style={{
                                  display: 'inline-block', padding: '3px 8px',
                                  background: isLowStock ? 'rgba(180, 60, 80, 0.1)' : 'rgba(90, 170, 106, 0.1)',
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
                                  transition: `all 0.35s ${ease.luxury}`, borderRadius: '2px',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = `${c.purple}15`; e.currentTarget.style.borderColor = c.purple }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.border }}>
                                  <Icon d={icons.edit} size={12} color={c.purple} />
                                </button>
                                <button onClick={() => handleDeleteInventory(item.id)} style={{
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
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

      {/* ═══════ MODAL: Nouvel article stock ═══════ */}
      <Modal open={showCreateInventory} onClose={() => setShowCreateInventory(false)} title="Nouvel article" maxWidth={480}>
            <ArtDecoDivider width={80} color={c.purple} />

            <form onSubmit={handleCreateInventory} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select value={createInventoryData.client_id} onChange={e => setCreateInventoryData({...createInventoryData, client_id: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'none', paddingInlineEnd: sp[3]}}
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
                  cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                  Ajouter au stock
                </button>
              </div>
            </form>
      </Modal>

      {/* ═══════ MODAL: Edit Inventory ═══════ */}
      <Modal open={!!editingInventoryItem} onClose={() => setEditingInventoryItem(null)} title="Modifier l'article" maxWidth={480}>
            <ArtDecoDivider width={80} />
            {editingInventoryItem && <div style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3] }}>
              Client : {clientName(editingInventoryItem.client_id)}
            </div>}

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
      </Modal>
    </>
  )
}
