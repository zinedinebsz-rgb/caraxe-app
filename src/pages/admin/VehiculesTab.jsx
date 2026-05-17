/* ── CARAXES Admin — Véhicules Tab (v2 enrichi) ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, fmtDate, fmtMoney, inputStyle, labelStyle } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'
import { Modal } from '../../components/Toast'
import { createOrder } from '../../lib/supabase'

const DecoPattern = () => null

// ── Référentiel véhicules (aligné landing /vehicules.html) ──
const VEHICLE_TYPES = [
  { key: 'berline',      label: 'Berline',           icon: '🚗' },
  { key: 'suv',          label: 'SUV',               icon: '🚙' },
  { key: 'pickup',       label: 'Pick-up',           icon: '🛻' },
  { key: 'utilitaire',   label: 'Utilitaire',        icon: '🚚' },
  { key: 'minibus',      label: 'Mini-bus',          icon: '🚌' },
  { key: 'pieces',       label: 'Pièces détachées',  icon: '🔧' },
  { key: 'electrique',   label: 'Électrique',        icon: '⚡' },
  { key: 'camion',       label: 'Camion',            icon: '🚛' },
]

const DESTINATIONS = [
  { key: 'senegal',     label: 'Sénégal',         flag: '🇸🇳', port: 'Dakar' },
  { key: 'cotedivoire', label: 'Côte d\'Ivoire', flag: '🇨🇮', port: 'Abidjan' },
  { key: 'congo',       label: 'Congo',           flag: '🇨🇬', port: 'Pointe-Noire' },
  { key: 'cameroun',    label: 'Cameroun',        flag: '🇨🇲', port: 'Douala' },
  { key: 'maroc',       label: 'Maroc',           flag: '🇲🇦', port: 'Casablanca' },
  { key: 'algerie',     label: 'Algérie',         flag: '🇩🇿', port: 'Alger' },
  { key: 'autre',       label: 'Autre',           flag: '🌍', port: 'Sur demande' },
]

const TRANSPORT_MODES = [
  { key: 'roro',      label: 'RORO',      desc: 'Roll-on/Roll-off — véhicule seul' },
  { key: 'container', label: 'Conteneur', desc: 'Conteneur fermé — peut grouper pièces' },
]

// Marqueur structuré dans le champ notes pour parser ensuite
const VEHICLE_TAG = '[VEHICULE]'
const META_PREFIX = '##META:'

function buildVehicleNotes({ brand, model, year, km, destination, transport, freeText }) {
  const meta = { brand, model, year, km, destination, transport }
  const cleanMeta = Object.fromEntries(Object.entries(meta).filter(([_, v]) => v))
  return `${VEHICLE_TAG} ${META_PREFIX}${JSON.stringify(cleanMeta)}\n${freeText || ''}`.trim()
}

function parseVehicleNotes(notes) {
  if (!notes) return { meta: null, free: '' }
  const m = notes.match(/##META:(\{[^}]*\})/)
  if (!m) return { meta: null, free: notes.replace(VEHICLE_TAG, '').trim() }
  try {
    const meta = JSON.parse(m[1])
    const free = notes.replace(VEHICLE_TAG, '').replace(m[0], '').trim()
    return { meta, free }
  } catch {
    return { meta: null, free: notes }
  }
}

export default function VehiculesTab() {
  const {
    orders, allProfiles, toast, t, tToast, clientName, loadAll,
  } = useAdmin()

  // ── Derive vehicle requests from orders (keyword match + tag) ──
  const vehicleRequests = (orders || []).filter(o => {
    const txt = `${o.notes || ''} ${o.product || ''} ${o.ref || ''}`.toLowerCase()
    return txt.includes('véhicule') || txt.includes('vehicule') || txt.includes('vehicle') ||
           txt.includes('voiture') || txt.includes('camion') || txt.includes('pick-up') ||
           txt.includes('suv') || txt.includes('berline') || txt.includes('mini-bus') ||
           txt.includes('utilitaire')
  })

  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({
    client_id: '',
    type: 'berline',
    destination: 'senegal',
    transport: 'roro',
    brand: '',
    model: '',
    year: '',
    km: '',
    budget: '',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  const resetForm = () => setVehicleForm({
    client_id: '', type: 'berline', destination: 'senegal', transport: 'roro',
    brand: '', model: '', year: '', km: '', budget: '', notes: '',
  })

  return (
    <>
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        height: 100, marginBottom: sp[4], position: 'relative', overflow: 'hidden',
        background: c.bgCard, border: `1px solid ${c.borderSubtle}`,
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

      {/* ── Stats row ── */}
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

      {/* ── Destinations légende (informative) ── */}
      <div style={{ padding: sp[3], background: c.bgCard, border: `1px solid ${c.border}`, marginBottom: sp[4] }}>
        <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2], fontWeight: 600 }}>Destinations desservies</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp[2] }}>
          {DESTINATIONS.filter(d => d.key !== 'autre').map((d) => (
            <div key={d.key} style={{
              padding: `${sp[1]} ${sp[2]}`, background: c.bg, border: `1px solid ${c.borderSubtle}`,
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: size.xs, color: c.text,
            }}>
              <span style={{ fontSize: '14px' }}>{d.flag}</span>
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              <span style={{ color: c.textTertiary, fontFamily: f.mono, fontSize: '10px' }}>· {d.port}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vehicle requests table ── */}
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
                pending:    { bg: c.amber, color: c.bg },
                sourcing:   { bg: c.blue,  color: c.bg },
                production: { bg: c.teal,  color: c.bg },
                shipped:    { bg: c.gold,  color: c.bg },
                delivered:  { bg: c.green, color: c.bg },
                completed:  { bg: c.green, color: c.bg },
                cancelled:  { bg: c.red,   color: c.bg },
              }
              const statusStyle = statusColors[req.status] || { bg: c.textSecondary, color: c.bg }
              const { meta } = parseVehicleNotes(req.notes)
              const dest = meta?.destination && DESTINATIONS.find(d => d.key === meta.destination)
              const transp = meta?.transport && TRANSPORT_MODES.find(m => m.key === meta.transport)
              return (
                <div key={req.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 1.4fr 110px 110px 90px', gap: sp[2],
                  alignItems: 'center', padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}`,
                }}>
                  <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary }}>{req.ref || '—'}</div>
                  <div>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text }}>{clientName(req.client_id)}</div>
                    <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: 2 }}>{fmtDate(req.created_at)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: size.sm, color: c.text }}>{req.product || '—'}</div>
                    {meta && (
                      <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: 2, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {meta.brand && <span>🏷 {meta.brand} {meta.model || ''}</span>}
                        {meta.year && <span>📅 {meta.year}</span>}
                        {meta.km && <span>🛣 {meta.km} km</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: size.xs, color: c.text }}>
                    {dest ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px' }}>{dest.flag}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{dest.label}</div>
                          <div style={{ fontSize: '9px', color: c.textTertiary }}>{dest.port}</div>
                        </div>
                      </div>
                    ) : <span style={{ color: c.textTertiary }}>—</span>}
                  </div>
                  <div style={{ fontSize: size.xs, color: c.text }}>
                    {transp ? (
                      <span style={{
                        padding: '3px 8px', background: c.bgElevated, border: `1px solid ${c.borderSubtle}`,
                        fontFamily: f.mono, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{transp.label}</span>
                    ) : <span style={{ color: c.textTertiary }}>—</span>}
                  </div>
                  <div style={{ fontSize: size.sm, fontWeight: 600, color: c.gold }}>{fmtMoney(req.budget)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </div>

    {/* ══════════════ VEHICLE CREATION MODAL ══════════════ */}
    <Modal open={showVehicleModal} onClose={() => { setShowVehicleModal(false); resetForm() }} title="Nouvelle demande véhicule" maxWidth={680}>

      <form onSubmit={async (e) => {
        e.preventDefault()
        if (!vehicleForm.client_id || !vehicleForm.budget) {
          toast.error('Client et budget requis')
          return
        }
        setCreating(true)
        try {
          const typeLabel = VEHICLE_TYPES.find(t => t.key === vehicleForm.type)?.label || vehicleForm.type
          const destLabel = DESTINATIONS.find(d => d.key === vehicleForm.destination)?.label || vehicleForm.destination
          const product = `Véhicule ${typeLabel} — Export ${destLabel}`
          const fullNotes = buildVehicleNotes({
            brand: vehicleForm.brand,
            model: vehicleForm.model,
            year: vehicleForm.year,
            km: vehicleForm.km,
            destination: vehicleForm.destination,
            transport: vehicleForm.transport,
            freeText: vehicleForm.notes,
          })
          await createOrder({
            clientId: vehicleForm.client_id,
            product,
            quantity: 1,
            budget: `${vehicleForm.budget}€`,
            deadline: 'À définir',
            notes: fullNotes,
          })
          setShowVehicleModal(false)
          resetForm()
          toast.success('Demande véhicule créée')
          loadAll()
        } catch (err) {
          toast.error(err?.message || 'Erreur lors de la création')
        } finally {
          setCreating(false)
        }
      }} style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>

        {/* Client */}
        <div>
          <label style={labelStyle}>Client *</label>
          <select value={vehicleForm.client_id} onChange={(e) => setVehicleForm({ ...vehicleForm, client_id: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
            <option value="">Sélectionner un client</option>
            {allProfiles.map(p => p && p.id && (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </select>
        </div>

        {/* Type véhicule + Destination en 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
          <div>
            <label style={labelStyle}>Type de véhicule *</label>
            <select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
              {VEHICLE_TYPES.map(tp => (
                <option key={tp.key} value={tp.key}>{tp.icon} {tp.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Destination *</label>
            <select value={vehicleForm.destination} onChange={(e) => setVehicleForm({ ...vehicleForm, destination: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
              {DESTINATIONS.map(d => (
                <option key={d.key} value={d.key}>{d.flag} {d.label} — {d.port}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transport mode toggles */}
        <div>
          <label style={labelStyle}>Mode de transport *</label>
          <div style={{ display: 'flex', gap: sp[1] }}>
            {TRANSPORT_MODES.map(m => (
              <button key={m.key} type="button"
                onClick={() => setVehicleForm({ ...vehicleForm, transport: m.key })}
                style={{
                  flex: 1, padding: `${sp[2]} ${sp[3]}`, cursor: 'pointer',
                  background: vehicleForm.transport === m.key ? c.red : c.bgElevated,
                  color: vehicleForm.transport === m.key ? c.bg : c.text,
                  border: `1px solid ${vehicleForm.transport === m.key ? c.red : c.border}`,
                  fontFamily: f.mono, fontWeight: 700, textAlign: 'left',
                }}>
                <div style={{ fontSize: size.sm, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: 2 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Marque / Modèle / Année / Km */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px', gap: sp[2] }}>
          <div>
            <label style={labelStyle}>Marque</label>
            <input type="text" value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} style={inputStyle} placeholder="Toyota, BYD…" />
          </div>
          <div>
            <label style={labelStyle}>Modèle</label>
            <input type="text" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} style={inputStyle} placeholder="Hilux, Han EV…" />
          </div>
          <div>
            <label style={labelStyle}>Année</label>
            <input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })} style={inputStyle} placeholder="2024" min="2000" max="2030" />
          </div>
          <div>
            <label style={labelStyle}>Km</label>
            <input type="number" value={vehicleForm.km} onChange={(e) => setVehicleForm({ ...vehicleForm, km: e.target.value })} style={inputStyle} placeholder="0" min="0" />
          </div>
        </div>

        {/* Budget */}
        <div>
          <label style={labelStyle}>Budget total estimé (€) *</label>
          <input type="number" value={vehicleForm.budget} onChange={(e) => setVehicleForm({ ...vehicleForm, budget: e.target.value })} style={inputStyle} placeholder="ex: 8000" min="0" />
          <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: 4 }}>
            Inclut prix du véhicule + frais logistiques (1 500–4 000 € selon mode/destination)
          </div>
        </div>

        {/* Notes libres */}
        <div>
          <label style={labelStyle}>Notes / spécificités</label>
          <textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} style={{ ...inputStyle, minHeight: 80, fontFamily: f.body }} placeholder="État, options, demandes spéciales…" />
        </div>

        <button type="submit" disabled={creating} style={{
          padding: `10px ${sp[3]}`, background: creating ? c.textTertiary : c.red, color: c.bg,
          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: creating ? 'wait' : 'pointer',
          marginTop: sp[2], opacity: creating ? 0.7 : 1,
        }}>{creating ? 'Création…' : 'Créer demande véhicule'}</button>
      </form>
    </Modal>
    </>
  )
}
