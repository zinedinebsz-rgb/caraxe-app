/* ── CARAXES Admin — Véhicules Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, fmtDate, fmtMoney, inputStyle, labelStyle } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'

const DecoPattern = () => null

export default function VehiculesTab() {
  const {
    allProfiles, toast, t, tToast, clientName,
  } = useAdmin()

  // ── Local state ──
  const [vehicleRequests, setVehicleRequests] = useState([])
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '', status: 'demande' })

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
          { label: 'En cours', value: vehicleRequests.filter(v => v.status === 'sourcing' || v.status === 'demande').length, color: c.amber },
          { label: 'Budget total', value: fmtMoney(vehicleRequests.reduce((sum, v) => sum + (parseFloat(v.budget) || 0), 0)), color: c.gold },
          { label: 'Destinations', value: [...new Set(vehicleRequests.map(v => v.destination))].length, color: c.teal },
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
            {vehicleRequests.map((req, idx) => {
              const statusColors = {
                demande: { bg: c.amber, color: c.bg },
                sourcing: { bg: c.blue, color: c.bg },
                inspection: { bg: c.teal, color: c.bg },
                transit: { bg: c.gold, color: c.bg },
                livré: { bg: c.green, color: c.bg },
                annulé: { bg: c.red, color: c.bg },
              }
              const statusStyle = statusColors[req.status] || { bg: c.textSecondary, color: c.bg }
              return (
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px 100px 100px', gap: sp[2],
                  alignItems: 'center', padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}`,
                }}>
                  <div>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{clientName(req.client_id)}</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: 2 }}>{fmtDate(new Date())}</div>
                  </div>
                  <div style={{ fontSize: size.sm, color: c.text }}>{req.type}</div>
                  <div style={{ fontSize: size.sm, color: c.text }}>{req.destination}</div>
                  <div style={{ fontSize: size.sm, fontWeight: 600, color: c.gold }}>{req.budget}€</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      padding: '4px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                      background: statusStyle.bg, color: statusStyle.color, textTransform: 'uppercase', letterSpacing: '0.02em',
                    }}>{req.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: sp[1] }}>
                    <button onClick={() => {
                      setVehicleForm(req)
                      setShowVehicleModal(true)
                    }} style={{
                      padding: '4px 8px', background: 'transparent', border: `1px solid ${c.border}`,
                      color: c.textSecondary, cursor: 'pointer', fontSize: '9px', fontFamily: f.mono,
                    }}>Edit</button>
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
    {showVehicleModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      }} onClick={() => { setShowVehicleModal(false); setVehicleForm({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '', status: 'demande' }) }}>
        <div style={{
          background: c.bgCard, border: `1px solid ${c.borderLight}`, padding: sp[4],
          maxWidth: '520px', width: '90%', maxHeight: '85vh', overflowY: 'auto', borderRadius: radius.sm, boxShadow: shadow.xs,
        }} onClick={e => e.stopPropagation()} className="admin-scroll">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
            <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700 }}>Nouvelle demande véhicule</h2>
            <button onClick={() => { setShowVehicleModal(false); setVehicleForm({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '', status: 'demande' }) }} style={{ background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer' }}>
              <Icon d={icons.close} size={16} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            if (!vehicleForm.client_id || !vehicleForm.destination || !vehicleForm.budget) {
              toast.error(t('toast.destinationAndBudgetRequired'))
              return
            }
            const newVehicle = { ...vehicleForm, id: Date.now() }
            setVehicleRequests([...vehicleRequests, newVehicle])
            setShowVehicleModal(false)
            setVehicleForm({ client_id: '', type: 'Berline', destination: '', budget: '', notes: '', status: 'demande' })
            toast.success(t('toast.requestCreated'))
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
                {['Berline', 'SUV', 'Pick-up', 'Utilitaire', 'Mini-bus', 'Camion', 'Électrique', 'Pièces détachées'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Destination</label>
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

            <div>
              <label style={labelStyle}>Statut</label>
              <select value={vehicleForm.status} onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                {['demande', 'sourcing', 'inspection', 'transit', 'livré', 'annulé'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button type="submit" style={{
              padding: `10px ${sp[3]}`, background: c.red, color: c.bg,
              border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
              marginTop: sp[2],
            }}>Créer demande</button>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
