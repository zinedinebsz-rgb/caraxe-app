/* ── CARAXES Admin — Véhicules Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, fmtDate, fmtMoney, inputStyle, labelStyle } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'
import { Modal } from '../../components/Toast'
import { createOrder } from '../../lib/supabase'

const DecoPattern = () => null

export default function VehiculesTab() {
  const {
    orders, allProfiles, toast, t, tToast, clientName,
  } = useAdmin()

  // ── Derive vehicle requests from orders (keyword match) ──
  const vehicleRequests = (orders || []).filter(o => {
    const txt = `${o.notes || ''} ${o.product || ''} ${o.ref || ''}`.toLowerCase()
    return txt.includes('véhicule') || txt.includes('vehicule') || txt.includes('vehicle') || txt.includes('voiture') || txt.includes('camion') || txt.includes('pick-up') || txt.includes('suv') || txt.includes('berline') || txt.includes('mini-bus') || txt.includes('utilitaire')
  })
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '' })
  const [creating, setCreating] = useState(false)

  return (
    <>
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        height: 100, marginBottom: sp[4], position: 'relative', overflow: 'hidden',
        background: `${c.bgCard}`,
        border: `1px solid ${c.borderSubtle}`,
      }}>
        <DecoPattern color={c.red} opacity={0.06} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.red, opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, border: `1px solid ${c.red}22`, transform: 'rotate(45deg)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp[5]}`, zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: f.mono, fontSize: '10px', color: c.red, letterSpacing: '0.12em', textTransform: 'uppercase', margin: `0 0 ${sp[1]}`, fontWeight: 600 }}>◆ EXPORT VÉHICULES</p>
            <h1 style={{ fontSize: size['2xl'], fontFamily: f.display, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>Gestion véhicules</h1>
          </div>
          <button onClick={() => setShowVehicleModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: sp[1],
            padding: `10px ${sp[3]}`, background: c.red, color: c.bg, border: 'none',
            cursor: 'pointer', fontFamily: f.mono, fontSize: size.xs, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <Icon d={icons.plus} size={14} color={c.bg} /> Nouvelle demande
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp[2], marginBottom: sp[4] }}>
        {[
          { label: 'Demandes totales', value: vehicleRequests.length, color: c.red },
          { label: 'En cours', value: vehicleRequests.filter(v => v.status !== 'delivered' && v.status !== 'completed' && v.status !== 'cancelled').length, color: c.amber },
          { label: 'Budget total', value: fmtMoney(vehicleRequests.reduce((sum, v) => sum + (parseFloat(v.budget) || 0), 0)), color: c.gold },
          { label: 'Clients', value: [...new Set(vehicleRequests.map(v => v.client_id))].length, color: c.teal },
        ].map((stat, i) => (
          <div key={i} style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, borderTop: `2px solid ${stat.color}` }}>
            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[1] }}>{stat.label}</div>
            <div style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Vehicle requests table */}
      <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, marginBottom: sp[4] }}>
        <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[3], fontWeight: 600 }}>Demandes véhicules</div>
        {vehicleRequests.length === 0 ? (
          <div style={{ padding: sp[4], textAlign: 'center', color: c.textTertiary }}>
            <p style={{ fontSize: size.sm, margin: 0 }}>Aucune demande véhicule pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
            {vehicleRequests.map((req) => {
              const statusColors = {
                pending: { bg: c.amber, color: c.bg },
                sourcing: { bg: c.blue, color: c.bg },
                production: { bg: c.teal, color: c.bg },
                shipped: { bg: c.gold, color: c.bg },
                delivered: { bg: c.green, color: c.bg },
                completed: { bg: c.green, color: c.bg },
                cancelled: { bg: c.red, color: c.bg },
              }
              const statusStyle = statusColors[req.status] || { bg: c.textSecondary, color: c.bg }
              return (
                <div key={req.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 1.2fr 100px 90px', gap: sp[2],
                  alignItems: 'center', padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}`,
                }}>
                  <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary }}>{req.ref || '—'}</div>
                  <div>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{clientName(req.client_id)}</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: 2 }}>{fmtDate(req.created_at)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: size.sm, color: c.text }}>{req.product || '—'}</div>
                    {req.notes && <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: 2 }}>{req.notes.slice(0, 60)}{req.notes.length > 60 ? '…' : ''}</div>}
                  </div>
                  <div style={{ fontSize: size.sm, fontWeight: 600, color: c.gold }}>{fmtMoney(req.budget)}</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      padding: '4px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                      background: statusStyle.bg, color: statusStyle.color, textTransform: 'uppercase', letterSpacing: '0.02em',
                    }}>{req.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </div>

    {/* ── VEHICLE MODAL ── */}
    <Modal open={showVehicleModal} onClose={() => { setShowVehicleModal(false); setVehicleForm({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '' }) }} title="Nouvelle demande véhicule" maxWidth={520}>

          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!vehicleForm.client_id || !vehicleForm.budget) {
              toast.error('Client et budget requis')
              return
            }
            setCreating(true)
            try {
              const product = `Véhicule ${vehicleForm.type}${vehicleForm.destination ? ` — Export ${vehicleForm.destination}` : ''}`
              const notes = vehicleForm.notes || ''
              await createOrder({
                clientId: vehicleForm.client_id,
                product,
                quantity: 1,
                budget: `${vehicleForm.budget}€`,
                deadline: 'À définir',
                notes: notes ? `[VÉHICULE] ${notes}` : '[VÉHICULE]',
              })
              setShowVehicleModal(false)
              setVehicleForm({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '' })
              toast.success('Demande véhicule créée')
            } catch (err) {
              toast.error(err?.message || 'Erreur lors de la création')
            } finally {
              setCreating(false)
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
            <div>
              <label style={labelStyle}>Client</label>
              <select value={vehicleForm.client_id} onChange={(e) => setVehicleForm({ ...vehicleForm, client_id: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                <option value="">Sélectionner un client</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Type de véhicule</label>
              <select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                {['Berline', 'SUV', 'Pick-up', 'Utilitaire', 'Mini-bus', 'Camion', 'Électrique', 'Pièces détachées'].map(tp => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Destination export</label>
              <input type="text" value={vehicleForm.destination} onChange={(e) => setVehicleForm({ ...vehicleForm, destination: e.target.value })} style={inputStyle} placeholder="ex: Sénégal" />
            </div>

            <div>
              <label style={labelStyle}>Budget (€)</label>
              <input type="number" value={vehicleForm.budget} onChange={(e) => setVehicleForm({ ...vehicleForm, budget: e.target.value })} style={inputStyle} placeholder="5000" />
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} style={{ ...inputStyle, minHeight: 80, fontFamily: f.body }} placeholder="Détails supplémentaires…" />
            </div>

            <button type="submit" disabled={creating} style={{
              padding: `10px ${sp[3]}`, background: creating ? c.textTertiary : c.red, color: c.bg,
              border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: creating ? 'wait' : 'pointer',
              marginTop: sp[2], opacity: creating ? 0.7 : 1,
            }}>{creating ? 'Création…' : 'Créer demande'}</button>
          </form>
    </Modal>
    </>
  )
}
