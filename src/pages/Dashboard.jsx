import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { c, f, size, sp, shadow, ease, transition, STATUSES } from '../lib/theme'
import {
  getOrders, createOrder, getMessages, sendMessage,
  markMessagesRead, getDocuments, getDocumentUrl,
  subscribeToMessages, subscribeToOrders, supabase,
  getShipments, createShipment, getInventory, getActiveProducts, sendWelcomeMessage,
  getShops, createEcomOrder, getEcomServices, getUnreadCounts,
} from '../lib/supabase'
import { getCatalog } from '../lib/catalogsByProfile'
import { getTierByKey, getTierPrice, getTierMOQ, DEFAULT_TIER } from '../lib/clientTiers'
import StatusPill, { ProgressBar, PipelineStepper } from '../components/StatusPill'
import { useToast } from '../components/Toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

/* ── SVG ICONS ── */
const Icon = ({ d, size: s = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
  back: 'M15 18l-6-6 6-6',
  close: 'M18 6L6 18M6 6l12 12',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  plus: 'M12 5v14M5 12h14',
  settings: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtQty = (n) => (n || 0).toLocaleString('fr-FR')

/* ── EMPTY STATE ── */
function DragonEmptyState({ text = 'Sélectionnez une commande', sub = '' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center',
      padding: sp[4],
    }}>
      <p style={{
        fontSize: size.lg, fontFamily: f.display, color: c.text,
        margin: 0, marginBottom: sp[1], letterSpacing: '0.02em',
        fontWeight: 500,
      }}>{text}</p>
      {sub && <p style={{ fontSize: size.sm, color: c.textSecondary, margin: 0, lineHeight: 1.6, maxWidth: 340 }}>{sub}</p>}
    </div>
  )
}

/* ── ORDER CARD (SIDEBAR) ── */
function OrderCard({ order, selected, onClick, unreadCount }) {
  const statusObj = (typeof order.status === 'number' ? STATUSES[order.status] : STATUSES.find(s => s.key === order.status)) || STATUSES[0]

  return (
    <div onClick={onClick}
      style={{
        padding: `14px ${sp[3]}`,
        cursor: 'pointer',
        background: selected ? c.bgElevated : 'transparent',
        borderLeft: `2px solid ${selected ? c.red : 'transparent'}`,
        borderBottom: `1px solid ${c.borderSubtle}`,
        transition: `background 0.2s ${ease.smooth}, border-color 0.2s ${ease.smooth}`,
        position: 'relative',
      }}>
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div style={{
          position: 'absolute', top: 14, right: sp[2],
          minWidth: 18, height: 18, borderRadius: '9999px',
          background: c.red, color: c.white, fontSize: '9px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
        }}>{unreadCount}</div>
      )}

      {/* Ref */}
      <div style={{
        fontFamily: f.mono, fontSize: '9px', color: selected ? c.gold : c.textTertiary,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px',
        transition: transition.color,
      }}>{order.ref}</div>

      {/* Product name */}
      <div style={{
        fontWeight: 600, fontSize: size.sm, marginBottom: '8px',
        lineHeight: 1.35, color: selected ? c.text : c.text,
        fontFamily: f.body, letterSpacing: '0.01em',
      }}>{order.product}</div>

      {/* Meta row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize: size.xs, color: c.textSecondary, fontWeight: 300 }}>
          {fmtQty(order.quantity)} unites &middot; {order.budget}
        </span>
        <StatusPill status={order.status} size="sm" />
      </div>

      {/* Progress bar */}
      <ProgressBar value={order.progress} color={statusObj.color} height={2} />
    </div>
  )
}

/* ── DATE SEPARATOR ── */
function DateSeparator({ date }) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  let label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  if (d.toDateString() === today.toDateString()) label = "Aujourd'hui"
  else if (d.toDateString() === yesterday.toDateString()) label = 'Hier'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      margin: '16px 0 12px', opacity: 0.5,
    }}>
      <div style={{ flex: 1, height: '1px', background: 'oklch(30% 0.01 50)' }} />
      <span style={{ fontSize: '9px', fontFamily: 'var(--f-mono, monospace)', color: 'oklch(55% 0.02 50)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'oklch(30% 0.01 50)' }} />
    </div>
  )
}

/* ── CHAT BUBBLE ── */
function ChatBubble({ msg }) {
  const isAgent = msg.sender_role === 'admin'
  return (
    <div style={{
      display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end',
      marginBottom: sp[2],
    }}>
      <div style={{
        maxWidth: '72%', padding: `14px ${sp[3]}`,
        background: isAgent ? c.bgElevated : c.redSoft,
        border: `1px solid ${isAgent ? c.border : c.redGlow}`,
        fontSize: size.sm, lineHeight: 1.7, color: c.text,
        position: 'relative',
        boxShadow: isAgent ? shadow.xs : `0 1px 4px oklch(55% 0.22 25 / 0.08)`,
      }}>
        {/* Sender tag */}
        <div style={{
          fontSize: '9px', color: isAgent ? c.gold : c.red,
          marginBottom: '8px', fontFamily: f.mono,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {isAgent && <div style={{ width: 4, height: 4, background: c.gold, transform: 'rotate(45deg)', opacity: 0.6 }} />}
          {isAgent ? 'Agent CARAXES' : 'Vous'}
          <span style={{ color: c.textGhost || c.textTertiary, fontWeight: 400, letterSpacing: '0.02em', textTransform: 'none', fontSize: '9px' }}>
            {fmtDate(msg.created_at)}
          </span>
        </div>
        <p style={{ margin: 0, wordWrap: 'break-word', whiteSpace: 'pre-wrap', fontWeight: 300 }}>
          {msg.content}
        </p>
      </div>
    </div>
  )
}

/* ── DOCUMENT CARD ── */
function DocumentCard({ doc, onDownload }) {
  const fileName = doc.name || doc.file_name || 'Document'
  const fileExt = fileName.split('.').pop().toUpperCase()

  return (
    <div
      onClick={onDownload}
      style={{
        display: 'flex', alignItems: 'center', gap: sp[2],
        padding: `${sp[2]} ${sp[3]}`,
        background: c.bgElevated,
        border: `1px solid ${c.border}`,
        transition: `border-color 0.2s ${ease.smooth}`,
        cursor: 'pointer',
      }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: c.redSoft, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon d={icons.file} size={18} color={c.red} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: size.sm, color: c.text, fontWeight: 500,
          marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{fileName}</div>
        <div style={{ fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.03em' }}>
          {fileExt} &middot; {fmtDate(doc.created_at)}
        </div>
      </div>
      <div style={{
        opacity: 0.6,
        transition: `opacity 0.2s ${ease.smooth}`,
      }}>
        <Icon d={icons.download} size={16} color={c.gold} />
      </div>
    </div>
  )
}

/* ── PIPELINE TRACKER — Art Deco Diamond ── */
function PipelineTracker({ status }) {
  return (
    <div style={{
      background: c.bgElevated, border: `1px solid ${c.border}`,
      padding: `${sp[3]} ${sp[3]}`, paddingBottom: sp[4], marginBottom: sp[3],
    }}>
      <div style={{
        fontSize: '10px', color: c.textTertiary, marginBottom: sp[1],
        fontFamily: f.mono, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
      }}>
        Progression
      </div>
      <PipelineStepper currentStatus={status} />
    </div>
  )
}

/* ── MODAL: NOUVELLE DEMANDE ── */
function NewOrderModal({ isOpen, onClose, onSubmit, initialProduct = '' }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: '', quantity: '', budget: '', deadline: '', notes: '',
  })

  useEffect(() => { if (initialProduct) setFormData(prev => ({ ...prev, product: initialProduct })) }, [initialProduct])

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const handleNext = () => { if (step < 3) setStep(step + 1) }
  const handleBack = () => { if (step > 1) setStep(step - 1) }
  const handleSubmit = () => {
    if (!formData.product.trim()) return
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) return
    onSubmit(formData)
    setFormData({ product: '', quantity: '', budget: '', deadline: '', notes: '' })
    setStep(1); onClose()
  }

  if (!isOpen) return null

  const modalInput = {
    width: '100%', padding: `14px ${sp[2]}`,
    fontSize: size.sm, fontFamily: f.body,
    background: c.bgSurface, border: `1px solid ${c.border}`,
    color: c.text, boxSizing: 'border-box', outline: 'none',
    transition: `border-color 0.2s ${ease.smooth}, box-shadow 0.2s ${ease.smooth}`,
  }
  const modalLabel = {
    display: 'block', marginBottom: sp[1],
    fontSize: '10px', fontFamily: f.mono, color: c.textTertiary,
    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
  }

  const stepLabels = ['Produit', 'Détails', 'Notes']

  return (
    <div style={{
      position: 'fixed', inset: 0, background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: `fadeIn 0.2s ${ease.out}`,
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: c.bgElevated, border: `1px solid ${c.border}`,
        width: '100%', maxWidth: 480, padding: sp[4], boxShadow: shadow.xl,
        position: 'relative',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
          <div>
            <h2 style={{ margin: 0, fontSize: size.lg, fontFamily: f.display, color: c.text, letterSpacing: '-0.01em' }}>
              Nouvelle demande
            </h2>
            <div style={{ display: 'flex', gap: sp[2], marginTop: sp[1] }}>
              {stepLabels.map((label, i) => (
                <span key={i} style={{
                  fontSize: '9px', fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: i + 1 === step ? c.red : i + 1 < step ? c.green : c.textTertiary,
                  fontWeight: i + 1 === step ? 700 : 400,
                }}>{i + 1}. {label}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: sp[1],
            color: c.textSecondary, display: 'flex', alignItems: 'center',
          }}>
            <Icon d={icons.close} size={18} color="currentColor" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 2, background: c.bgSurface, marginBottom: sp[4], overflow: 'hidden' }}>
          <div style={{
            width: `${(step / 3) * 100}%`, height: '100%', background: c.red,
            transition: `width 0.4s ${ease.out}`,
          }} />
        </div>

        {/* Content */}
        <div style={{ minHeight: 180 }}>
          {step === 1 && (
            <div>
              <label style={modalLabel} htmlFor="product-input">Que recherchez-vous ?</label>
              <input id="product-input" type="text" placeholder="Ex: vêtements coton, chaussures sport..."
                value={formData.product} onChange={(e) => handleChange('product', e.target.value)}
                style={modalInput} autoFocus
                onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
              />
              <p style={{ margin: `${sp[2]} 0 0`, fontSize: size.xs, color: c.textTertiary, lineHeight: 1.6 }}>
                Décrivez le produit que vous souhaitez sourcer depuis la Chine.
              </p>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
              <div>
                <label style={modalLabel} htmlFor="quantity-input">Quantité</label>
                <input id="quantity-input" type="number" placeholder="Ex: 1000" value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={modalLabel} htmlFor="budget-input">Budget</label>
                <input id="budget-input" type="text" placeholder="Ex: 5 000 €" value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={modalLabel} htmlFor="deadline-input">Délai souhaité</label>
                <input id="deadline-input" type="date" value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={modalLabel} htmlFor="notes-input">Notes (optionnel)</label>
              <textarea id="notes-input" placeholder="Spécifications, références visuelles, exigences..."
                value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)}
                style={{ ...modalInput, minHeight: 140, resize: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = c.red; e.target.style.boxShadow = `0 0 0 3px ${c.redSoft}` }}
                onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: sp[2], marginTop: sp[4], justifyContent: 'flex-end' }}>
          {step > 1 && (
            <button onClick={handleBack} style={{
              padding: `12px ${sp[3]}`, background: 'transparent',
              border: `1px solid ${c.border}`, color: c.text,
              fontSize: size.sm, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`,
            }}
              onMouseOver={(e) => { e.target.style.borderColor = c.gold }}
              onMouseOut={(e) => { e.target.style.borderColor = c.border }}
            >Retour</button>
          )}
          {step < 3 ? (
            <button onClick={handleNext}
              disabled={step === 1 && !formData.product || step === 2 && !formData.quantity}
              style={{
                padding: `12px ${sp[3]}`, background: c.red,
                border: `1px solid ${c.red}`, color: c.white,
                fontSize: size.sm, cursor: 'pointer', fontFamily: f.body, fontWeight: 600,
                transition: `all 0.2s ${ease.smooth}`,
                opacity: (step === 1 && !formData.product || step === 2 && !formData.quantity) ? 0.4 : 1,
              }}
              onMouseOver={(e) => { e.target.style.background = c.redDeep }}
              onMouseOut={(e) => { e.target.style.background = c.red }}
            >Suivant</button>
          ) : (
            <button onClick={handleSubmit} style={{
              padding: `12px ${sp[4]}`, background: c.gold,
              border: `1px solid ${c.gold}`, color: c.black,
              fontSize: size.sm, fontWeight: 700, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
            }}
              onMouseOver={(e) => { e.target.style.background = c.goldDim }}
              onMouseOut={(e) => { e.target.style.background = c.gold }}
            >Soumettre la demande</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── ECOM ORDER MODAL ── */
const ECOM_PACKS = [
  { key: 'creation', label: 'Création Boutique', price: 1490, priceFmt: '1 490 €', desc: 'Boutique clé en main : design, catalogue, paiement, livraison', recurring: false },
  { key: 'gestion', label: 'Gestion Boutique', price: 249, priceFmt: '249 €/mois', desc: 'Gestion complète : MAJ produits, SAV, fulfillment, analytics', recurring: true },
  { key: 'bundle', label: 'Bundle Sourcing + E-com', price: 1490, priceFmt: 'À partir de 1 341 €', desc: 'Création + sourcing combinés, -10% sur le total', recurring: false, discount: 10 },
]

const PLATFORMS = [
  { key: 'shopify', label: 'Shopify', desc: 'Idéal pour débuter rapidement' },
  { key: 'woocommerce', label: 'WooCommerce', desc: 'Plus flexible, basé sur WordPress' },
  { key: 'prestashop', label: 'PrestaShop', desc: 'Populaire en France' },
  { key: 'undecided', label: 'Je ne sais pas', desc: 'On vous conseillera' },
]

function EcomOrderModal({ isOpen, onClose, onSubmit, submitting }) {
  const [step, setStep] = useState(1)
  const [selectedPack, setSelectedPack] = useState(null)
  const [form, setForm] = useState({
    platform: '', shopName: '', productCategory: '', estimatedProducts: '',
    hasBranding: false, notes: '', paymentMethod: '',
  })

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const pack = ECOM_PACKS.find(p => p.key === selectedPack)

  const handleSubmit = () => {
    const resolvedPack = ECOM_PACKS.find(p => p.key === selectedPack)
    if (!selectedPack || !resolvedPack || !form.paymentMethod) return
    onSubmit({
      serviceType: selectedPack,
      pack: selectedPack,
      platform: form.platform || 'undecided',
      shopName: form.shopName,
      productCategory: form.productCategory,
      estimatedProducts: form.estimatedProducts,
      hasBranding: form.hasBranding,
      notes: form.notes,
      paymentMethod: form.paymentMethod,
      price: resolvedPack.price,
      isRecurring: resolvedPack.recurring || false,
      discountPct: resolvedPack.discount || 0,
    })
  }

  const reset = () => {
    setStep(1); setSelectedPack(null)
    setForm({ platform: '', shopName: '', productCategory: '', estimatedProducts: '', hasBranding: false, notes: '', paymentMethod: '' })
  }

  useEffect(() => { if (!isOpen) reset() }, [isOpen])

  if (!isOpen) return null

  const modalInput = {
    width: '100%', padding: `14px ${sp[2]}`, fontSize: size.sm, fontFamily: f.body,
    background: c.bgSurface, border: `1px solid ${c.border}`, color: c.text,
    boxSizing: 'border-box', outline: 'none', transition: `border-color 0.2s ${ease.smooth}, box-shadow 0.2s ${ease.smooth}`,
  }
  const modalLabel = {
    display: 'block', marginBottom: sp[1], fontSize: '10px', fontFamily: f.mono,
    color: c.textTertiary, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
  }
  const stepLabels = ['Service', 'Détails', 'Paiement']

  const canNext = step === 1 ? !!selectedPack : step === 2 ? true : !!form.paymentMethod

  return (
    <div style={{
      position: 'fixed', inset: 0, background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: `fadeIn 0.2s ${ease.out}`,
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: c.bgElevated, border: `1px solid ${c.border}`,
        width: '100%', maxWidth: 540, padding: sp[4], boxShadow: shadow.xl,
        position: 'relative', maxHeight: '90vh', overflow: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[3] }}>
          <div>
            <h2 style={{ margin: 0, fontSize: size.lg, fontFamily: f.display, color: c.text, letterSpacing: '-0.01em' }}>
              Commander un service e-commerce
            </h2>
            <div style={{ display: 'flex', gap: sp[2], marginTop: sp[1] }}>
              {stepLabels.map((label, i) => (
                <span key={i} style={{
                  fontSize: '9px', fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: i + 1 === step ? c.gold : i + 1 < step ? c.green : c.textTertiary,
                  fontWeight: i + 1 === step ? 700 : 400,
                }}>{i + 1}. {label}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: sp[1], color: c.textSecondary, display: 'flex' }}>
            <Icon d={icons.close} size={18} color="currentColor" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 2, background: c.bgSurface, marginBottom: sp[4], overflow: 'hidden' }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: c.gold, transition: `width 0.4s ${ease.out}` }} />
        </div>

        {/* Step 1: Choose pack */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
            <p style={{ fontSize: size.sm, color: c.textSecondary, margin: `0 0 ${sp[2]}`, lineHeight: 1.6 }}>
              Choisissez le service e-commerce qui correspond à vos besoins.
            </p>
            {ECOM_PACKS.map(pk => (
              <div key={pk.key} onClick={() => setSelectedPack(pk.key)} style={{
                padding: sp[3], border: `1px solid ${selectedPack === pk.key ? c.gold : c.border}`,
                background: selectedPack === pk.key ? 'oklch(18% 0.01 85 / 0.3)' : c.bgSurface,
                cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`, position: 'relative',
              }}>
                {selectedPack === pk.key && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: c.gold }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text }}>{pk.label}</span>
                  <span style={{ fontFamily: f.mono, fontSize: size.sm, color: c.gold, fontWeight: 700 }}>{pk.priceFmt}</span>
                </div>
                <p style={{ margin: 0, fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5 }}>{pk.desc}</p>
                {pk.discount && <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', fontSize: '9px', fontFamily: f.mono, background: c.greenSoft, color: c.green, fontWeight: 700, letterSpacing: '0.06em' }}>-{pk.discount}% BUNDLE</span>}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
            <div>
              <label style={modalLabel}>Plateforme souhaitée</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[1] }}>
                {PLATFORMS.map(pl => (
                  <div key={pl.key} onClick={() => update('platform', pl.key)} style={{
                    padding: `10px ${sp[2]}`, border: `1px solid ${form.platform === pl.key ? c.gold : c.border}`,
                    background: form.platform === pl.key ? 'oklch(18% 0.01 85 / 0.3)' : 'transparent',
                    cursor: 'pointer', transition: `all 0.15s ${ease.smooth}`, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: size.sm, fontWeight: 600, color: form.platform === pl.key ? c.gold : c.text, fontFamily: f.body }}>{pl.label}</div>
                    <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>{pl.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={modalLabel}>Nom de la boutique</label>
              <input type="text" placeholder="Ex: Ma Boutique Halal" value={form.shopName}
                onChange={(e) => update('shopName', e.target.value)} style={modalInput}
                onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = `0 0 0 3px oklch(75% 0.12 85 / 0.15)` }}
                onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
              <div>
                <label style={modalLabel}>Catégorie produits</label>
                <input type="text" placeholder="Textile, alimentaire..." value={form.productCategory}
                  onChange={(e) => update('productCategory', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = `0 0 0 3px oklch(75% 0.12 85 / 0.15)` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={modalLabel}>Nb produits estimé</label>
                <input type="number" placeholder="20" value={form.estimatedProducts}
                  onChange={(e) => update('estimatedProducts', e.target.value)} style={modalInput}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = `0 0 0 3px oklch(75% 0.12 85 / 0.15)` }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
              <div onClick={() => update('hasBranding', !form.hasBranding)} style={{
                width: 20, height: 20, border: `1px solid ${form.hasBranding ? c.gold : c.border}`,
                background: form.hasBranding ? c.gold : 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: `all 0.15s ${ease.smooth}`,
              }}>
                {form.hasBranding && <span style={{ color: c.black, fontSize: '12px', fontWeight: 700 }}>✓</span>}
              </div>
              <label style={{ fontSize: size.sm, color: c.textSecondary, cursor: 'pointer' }} onClick={() => update('hasBranding', !form.hasBranding)}>
                J'ai déjà un logo / charte graphique
              </label>
            </div>
            <div>
              <label style={modalLabel}>Notes additionnelles</label>
              <textarea placeholder="Domaine souhaité, réseaux sociaux, inspiration..."
                value={form.notes} onChange={(e) => update('notes', e.target.value)}
                style={{ ...modalInput, minHeight: 80, resize: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = `0 0 0 3px oklch(75% 0.12 85 / 0.15)` }}
                onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
            {/* Recap */}
            <div style={{ padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}` }}>
              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[1] }}>Récapitulatif</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text }}>{pack?.label}</span>
                <span style={{ fontFamily: f.mono, fontSize: size.lg, color: c.gold, fontWeight: 700 }}>{pack?.priceFmt}</span>
              </div>
              {form.shopName && <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: '4px' }}>Boutique : {form.shopName}</div>}
              {form.platform && form.platform !== 'undecided' && <div style={{ fontSize: size.xs, color: c.textSecondary, marginTop: '2px' }}>Plateforme : {PLATFORMS.find(p => p.key === form.platform)?.label}</div>}
            </div>

            <div>
              <label style={modalLabel}>Moyen de paiement</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[1] }}>
                {[
                  { key: 'stripe', label: 'Carte bancaire', desc: 'Paiement sécurisé via Stripe — traitement immédiat', icon: '💳' },
                  { key: 'virement', label: 'Virement bancaire', desc: 'Validé manuellement sous 24-48h après réception', icon: '🏦' },
                ].map(pm => (
                  <div key={pm.key} onClick={() => update('paymentMethod', pm.key)} style={{
                    padding: sp[3], border: `1px solid ${form.paymentMethod === pm.key ? c.gold : c.border}`,
                    background: form.paymentMethod === pm.key ? 'oklch(18% 0.01 85 / 0.3)' : 'transparent',
                    cursor: 'pointer', transition: `all 0.15s ${ease.smooth}`,
                    display: 'flex', alignItems: 'center', gap: sp[2],
                  }}>
                    <span style={{ fontSize: '20px' }}>{pm.icon}</span>
                    <div>
                      <div style={{ fontSize: size.sm, fontWeight: 600, color: form.paymentMethod === pm.key ? c.gold : c.text }}>{pm.label}</div>
                      <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>{pm.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {form.paymentMethod === 'virement' && (
              <div style={{ padding: sp[2], background: 'oklch(25% 0.01 85 / 0.5)', border: `1px solid ${c.border}`, fontSize: size.xs, color: c.textSecondary, lineHeight: 1.6 }}>
                Après validation de la commande, vous recevrez une référence unique et les coordonnées bancaires pour effectuer le virement. La commande sera activée dès réception du paiement.
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: sp[2], marginTop: sp[4], justifyContent: 'flex-end' }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{
              padding: `12px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.border}`,
              color: c.text, fontSize: size.sm, cursor: 'pointer', fontFamily: f.body,
              transition: `all 0.2s ${ease.smooth}`,
            }}
              onMouseOver={(e) => e.target.style.borderColor = c.gold}
              onMouseOut={(e) => e.target.style.borderColor = c.border}
            >Retour</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext} style={{
              padding: `12px ${sp[3]}`, background: canNext ? c.gold : c.bgSurface,
              border: `1px solid ${canNext ? c.gold : c.border}`, color: canNext ? c.black : c.textTertiary,
              fontSize: size.sm, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: f.body, fontWeight: 600,
              transition: `all 0.2s ${ease.smooth}`, opacity: canNext ? 1 : 0.5,
            }}>Suivant</button>
          ) : (
            <button onClick={handleSubmit} disabled={!canNext || submitting} style={{
              padding: `12px ${sp[4]}`, background: canNext && !submitting ? c.gold : c.bgSurface,
              border: `1px solid ${canNext ? c.gold : c.border}`, color: canNext && !submitting ? c.black : c.textTertiary,
              fontSize: size.sm, fontWeight: 700, cursor: canNext && !submitting ? 'pointer' : 'not-allowed',
              fontFamily: f.body, transition: `all 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
              opacity: canNext && !submitting ? 1 : 0.5,
            }}>
              {submitting ? 'Envoi en cours...' : form.paymentMethod === 'stripe' ? 'Payer par carte' : 'Valider la commande'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── MAIN DASHBOARD ── */
export default function Dashboard({ user, profile, onSignOut }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [prefilledProduct, setPrefilledProduct] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [activeTab, setActiveTab] = useState('messages')
  const [viewMode, setViewMode] = useState('orders')
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null)
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true)
  const [shipments, setShipments] = useState([])
  const [inventory, setInventory] = useState([])
  const [shops, setShops] = useState([])
  const [dynamicProducts, setDynamicProducts] = useState([])
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false)
  const [creatingShipment, setCreatingShipment] = useState(false)
  const [isEcomOrderOpen, setIsEcomOrderOpen] = useState(false)
  const [submittingEcom, setSubmittingEcom] = useState(false)
  const [ecomServices, setEcomServices] = useState([])
  const [ecomVirementInfo, setEcomVirementInfo] = useState(null)
  const messagesEndRef = useRef(null)
  const uploadInputRef = useRef(null)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders(user.id)
        setOrders(data || [])
        if (data?.length > 0) setSelectedOrder(data[0])
      } catch (err) { console.error('Failed to load orders:', err); toast.error('Erreur lors du chargement des commandes') }
    }
    loadOrders()
    // Load shipments, inventory, and dynamic products
    getShipments(user.id).then(setShipments).catch((err) => { console.error('Failed to load shipments:', err); toast.error('Erreur : expéditions') })
    getInventory(user.id).then(setInventory).catch((err) => { console.error('Failed to load inventory:', err); toast.error('Erreur : stock') })
    getActiveProducts().then(setDynamicProducts).catch((err) => { console.error('Failed to load products:', err); toast.error('Erreur : produits') })
    getShops(user.id).then(setShops).catch((err) => { console.error('Failed to load shops:', err); toast.error('Erreur : boutiques') })
    getEcomServices(user.id).then(setEcomServices).catch((err) => console.error('Failed to load ecom services:', err))
    getUnreadCounts(user.id).then(setUnreadCounts).catch((err) => console.error('Failed to load unread counts:', err))
    const sub = subscribeToOrders(() => {
      try {
        getOrders(user.id).then(data => {
          setOrders(data || [])
          // Update selectedOrder with fresh data to avoid stale state
          setSelectedOrder(prev => {
            if (!prev) return prev
            const updated = data?.find(o => o.id === prev.id)
            return updated || prev
          })
        }).catch(err => console.error('Error loading orders in subscription:', err))
      } catch (err) {
        console.error('Error in subscribeToOrders callback:', err)
      }
    })
    return () => sub?.unsubscribe?.()
  }, [user.id])

  useEffect(() => {
    if (!selectedOrder) return
    const loadMessages = async () => {
      try {
        const data = await getMessages(selectedOrder.id)
        setMessages(data || [])
        await markMessagesRead(selectedOrder.id, user.id)
        setUnreadCounts(prev => ({ ...prev, [selectedOrder.id]: 0 }))
      } catch (err) { console.error('Failed to load messages:', err); toast.error('Erreur lors du chargement des messages') }
    }
    loadMessages()
    const sub = subscribeToMessages(selectedOrder.id, (newMsg) => {
      try {
        setMessages(prev => [...prev, newMsg])
        // Auto-mark as read since user is viewing this order
        if (newMsg.sender_id !== user.id) {
          markMessagesRead(selectedOrder.id, user.id).catch(() => {})
        }
      } catch (err) {
        console.error('Error in subscribeToMessages callback:', err)
      }
    })
    return () => sub?.unsubscribe?.()
  }, [selectedOrder, user.id])

  useEffect(() => {
    if (!selectedOrder) return
    const loadDocs = async () => {
      try {
        const data = await getDocuments(selectedOrder.id)
        setDocuments(data || [])
      } catch (err) { console.error('Failed to load documents:', err); toast.error('Erreur lors du chargement des documents') }
    }
    loadDocs()
  }, [selectedOrder])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll to top on mount (page refresh)
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const filteredOrders = useMemo(() => orders.filter(order => {
    const matchesSearch = (order.product || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'delivered' ? (order.status === 6 || order.status === 'delivered') :
       filterStatus === 'in-progress' ? (order.status !== 6 && order.status !== 'delivered') :
       order.status === filterStatus)
    return matchesSearch && matchesStatus
  }), [orders, searchQuery, filterStatus])

  const searchTimerRef = useRef(null)
  const handleSearchChange = (value) => {
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setSearchQuery(value), 250)
  }

  const lastMsgTime = useRef(0)
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedOrder || sendingMsg) return
    const now = Date.now()
    if (now - lastMsgTime.current < 1000) return // 1 msg/sec throttle
    lastMsgTime.current = now
    setSendingMsg(true)
    try {
      await sendMessage({ orderId: selectedOrder.id, senderId: user.id, senderRole: 'client', content: newMessage })
      setNewMessage('')
    } catch (err) { toast.error('Impossible d’envoyer le message.') }
    finally { setSendingMsg(false) }
  }

  const handleCreateOrder = async (formData) => {
    if (creatingOrder) return
    setCreatingOrder(true)
    try {
      await createOrder({
        clientId: user.id, product: formData.product,
        quantity: parseInt(formData.quantity, 10), budget: formData.budget,
        deadline: formData.deadline, notes: formData.notes,
      })
      const updated = await getOrders(user.id)
      setOrders(updated)
      if (updated?.length > 0) setSelectedOrder(updated[0])
      toast.success('Demande envoyée !')
    } catch (err) { console.error('createOrder failed:', err); toast.error('Erreur : ' + (err?.message || 'création impossible')) }
    finally { setCreatingOrder(false) }
  }

  const handleEcomOrder = async (formData) => {
    if (submittingEcom) return
    setSubmittingEcom(true)
    try {
      const result = await createEcomOrder({ clientId: user.id, ...formData })
      // Refresh ecom services list
      const updated = await getEcomServices(user.id)
      setEcomServices(updated)
      setIsEcomOrderOpen(false)

      if (formData.paymentMethod === 'virement' && result.virement_reference) {
        setEcomVirementInfo({
          reference: result.virement_reference,
          amount: formData.price,
          pack: ECOM_PACKS.find(p => p.key === formData.pack)?.label || formData.pack,
        })
      } else if (formData.paymentMethod === 'stripe') {
        // TODO: redirect to Stripe checkout when keys are configured
        toast.success('Commande enregistrée ! Vous serez redirigé vers le paiement sous peu.')
      }

      if (formData.paymentMethod === 'virement' && result.virement_reference) {
        toast.success('Commande créée ! Référence : ' + result.virement_reference)
      }
    } catch (err) {
      console.error('createEcomOrder failed:', err)
      toast.error('Erreur : ' + (err?.message || 'impossible de créer la commande'))
    } finally {
      setSubmittingEcom(false)
    }
  }

  const handleUploadClick = () => uploadInputRef.current?.click()

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedOrder || uploadingFile) return
    if (file.size > MAX_FILE_SIZE) { toast.error('Fichier trop volumineux (max 10 Mo)'); e.target.value = ''; return }
    if (ALLOWED_FILE_TYPES.length && !ALLOWED_FILE_TYPES.includes(file.type)) { toast.error('Type de fichier non supporté'); e.target.value = ''; return }
    setUploadingFile(true)
    try {
      const { error } = await supabase.storage.from('documents').upload(`${selectedOrder.id}/${Date.now()}_${file.name}`, file)
      if (error) throw error
      const updated = await getDocuments(selectedOrder.id)
      setDocuments(updated)
      toast.success('Document ajouté')
    } catch (err) { toast.error('Erreur lors de l’envoi.') }
    finally { setUploadingFile(false); e.target.value = '' }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.storage_path || doc.file_path)
      if (url) window.open(url, '_blank')
      else toast.error('Lien de téléchargement indisponible')
    } catch (err) { toast.error('Téléchargement impossible.') }
  }

  const tier = getTierByKey(profile?.client_tier || DEFAULT_TIER)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: c.bg, color: c.text, fontFamily: f.body,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 oklch(55% 0.22 25 / 0) } 50% { box-shadow: 0 0 12px 2px oklch(55% 0.22 25 / 0.15) } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes cardReveal { from { opacity:0; transform:translateY(12px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }
        @keyframes unreadPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${c.redGlow}; }
          50% { box-shadow: 0 0 0 6px oklch(55% 0.22 25 / 0); }
        }
        @media (max-width: 768px) {
          .sidebar { width: 100% !important; border-right: none !important; display: ${mobileShowSidebar ? 'flex' : 'none'} !important; }
          .main-panel { width: 100% !important; }
          .desktop-only { display: none !important; }
          .mobile-back-btn { display: inline-block !important; }
          .dash-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .dash-tabs::-webkit-scrollbar { display: none; }
          .dash-content { padding: 12px !important; }
          .dash-catalog-grid { grid-template-columns: 1fr !important; }
          .header-center-tabs { display: none !important; }
          .order-metadata { grid-template-columns: repeat(2, 1fr) !important; }
          .header-label-client { display: none !important; }
          .header-tier-badge { display: none !important; }
          .header-divider { display: none !important; }
          .header-settings-btn { display: none !important; }
          .header-logout-btn { display: none !important; }
          .header-demande-label { display: none !important; }
          .mobile-view-toggle { display: flex !important; }
        }
        @media (max-width: 480px) {
          .dash-content { padding: 8px !important; }
        }
        input::placeholder, textarea::placeholder { color: ${c.textTertiary}; opacity: 0.5; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; }
        ::-webkit-scrollbar-thumb:hover { background: oklch(30% 0.008 50); }
        * { scrollbar-width: thin; scrollbar-color: ${c.border} transparent; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${sp[3]}`, height: 56,
        background: c.bgSurface, borderBottom: `1px solid ${c.border}`,
        position: 'relative', zIndex: 10,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <span style={{
            fontSize: size.md, fontFamily: f.display, fontWeight: 700,
            letterSpacing: '0.06em', color: c.text,
          }}>
            CARAXE<span style={{ color: c.red }}>S</span>
          </span>
          <div className="header-divider" style={{
            width: '1px', height: 20, background: c.border, margin: `0 ${sp[1]}`,
          }} />
          <span className="header-label-client" style={{
            fontSize: '9px', fontFamily: f.mono, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 700, color: c.gold,
          }}>Espace Client</span>
          <span className="header-tier-badge" style={{
            padding: '2px 8px', background: tier.colorSoft,
            border: `1px solid ${tier.color}33`, color: tier.color,
            fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>{tier.icon} {tier.label}</span>
        </div>

        {/* Center — View toggle */}
        <div className="header-center-tabs" style={{
          display: 'flex', gap: '1px', background: c.border, padding: '1px',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          {(() => {
          const services = profile?.services_enabled || ['sourcing']
          const tabs = [
            { key: 'orders', label: 'Commandes', activeColor: c.red, icon: '◆' },
            { key: 'catalogue', label: 'Catalogue', activeColor: c.gold, icon: '◈' },
          ]
          if (services.includes('logistics') || services.includes('expedition')) {
            tabs.push({ key: 'expedition', label: 'Expédition', activeColor: c.teal, icon: '▸' })
          }
          if (services.includes('stock') || services.includes('boutique')) {
            tabs.push({ key: 'stock', label: 'Stock', activeColor: c.purple, icon: '⬡' })
          }
          // Boutique tab always visible — clients can order e-com services from here
          tabs.push({ key: 'boutique', label: 'E-commerce', activeColor: c.gold, icon: '◉' })
          return tabs
        })().map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)} style={{
              padding: `6px ${sp[3]}`, background: viewMode === v.key ? v.activeColor : c.bgSurface,
              border: 'none', color: viewMode === v.key ? (v.key === 'catalogue' || v.key === 'stock' ? c.black : c.white) : c.textSecondary,
              fontSize: '10px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: `all 0.2s ${ease.smooth}`,
            }}>{v.icon} {v.label}</button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
          {/* Notification */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifPanel(prev => !prev)} style={{
              background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
              color: c.textSecondary, display: 'flex', position: 'relative',
              transition: `color 0.2s ${ease.smooth}`,
            }}
              onMouseOver={(e) => e.currentTarget.style.color = c.gold}
              onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
            >
              <Icon d={icons.bell} size={16} color="currentColor" />
              {Object.values(unreadCounts).some(v => v > 0) && (
                <div style={{
                  position: 'absolute', top: 6, right: 6, width: 6, height: 6,
                  borderRadius: '50%', background: c.red,
                }} />
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifPanel && (
              <>
                <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 100,
                  width: 320, maxHeight: 380, overflowY: 'auto',
                  background: c.bgSurface, border: `1px solid ${c.border}`,
                  boxShadow: shadow.lg || '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <div style={{
                    padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: c.text }}>
                      Notifications
                    </span>
                    <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>
                      {Object.values(unreadCounts).reduce((a, b) => a + b, 0)} non lus
                    </span>
                  </div>

                  {orders.filter(o => (unreadCounts[o.id] || 0) > 0).length === 0 ? (
                    <div style={{ padding: sp[4], textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', opacity: 0.3, marginBottom: sp[1] }}>🔔</div>
                      <p style={{ fontSize: size.sm, color: c.textTertiary, margin: 0 }}>Aucune notification</p>
                    </div>
                  ) : (
                    orders.filter(o => (unreadCounts[o.id] || 0) > 0).map(order => (
                      <div key={order.id} onClick={() => {
                        setSelectedOrder(order)
                        setViewMode('orders')
                        setMobileShowSidebar(false)
                        setShowNotifPanel(false)
                      }} style={{
                        padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp[2],
                        transition: `background 0.15s ${ease.smooth}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = c.bgElevated}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', background: c.red, flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: size.sm, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.product || `Commande #${order.id?.slice(0, 6)}`}
                          </div>
                          <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
                            {unreadCounts[order.id]} message{unreadCounts[order.id] > 1 ? 's' : ''} non lu{unreadCounts[order.id] > 1 ? 's' : ''}
                          </div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.textTertiary} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* New order */}
          <button onClick={() => setIsNewOrderOpen(true)} style={{
            padding: `6px ${sp[2]}`, background: c.red,
            border: 'none', color: c.white, fontSize: '10px', fontWeight: 700,
            cursor: 'pointer', fontFamily: f.mono, letterSpacing: '0.06em',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px',
            transition: `background 0.2s ${ease.smooth}`,
          }}
            onMouseOver={(e) => { e.currentTarget.style.background = c.redDeep }}
            onMouseOut={(e) => { e.currentTarget.style.background = c.red }}
          >
            <Icon d={icons.plus} size={12} color="currentColor" />
            <span className="header-demande-label">Demande</span>
          </button>

          {/* Settings */}
          <button className="header-settings-btn" onClick={() => navigate('/settings')} style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: c.textSecondary, display: 'flex',
            transition: `color 0.2s ${ease.smooth}`,
          }}
            onMouseOver={(e) => e.currentTarget.style.color = c.gold}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d={icons.settings} />
            </svg>
          </button>

          {/* Sign out */}
          <button className="header-logout-btn" onClick={onSignOut} style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: c.textSecondary, display: 'flex',
            transition: `color 0.2s ${ease.smooth}`,
          }}
            onMouseOver={(e) => e.currentTarget.style.color = c.red}
            onMouseOut={(e) => e.currentTarget.style.color = c.textSecondary}
          >
            <Icon d={icons.logout} size={16} color="currentColor" />
          </button>
        </div>
      </header>

      {/* ── MOBILE VIEW TOGGLE ── */}
      <div className="mobile-view-toggle" style={{
        display: 'none', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        background: c.bgSurface, borderBottom: `1px solid ${c.border}`,
        padding: '0 8px', gap: '1px', flexShrink: 0, scrollbarWidth: 'none',
      }}>
        {(() => {
          const services = profile?.services_enabled || ['sourcing']
          const tabs = [
            { key: 'orders', label: 'Commandes', activeColor: c.red, icon: '◆' },
            { key: 'catalogue', label: 'Catalogue', activeColor: c.gold, icon: '◈' },
          ]
          if (services.includes('logistics') || services.includes('expedition')) {
            tabs.push({ key: 'expedition', label: 'Expédition', activeColor: c.teal, icon: '▸' })
          }
          if (services.includes('stock') || services.includes('boutique')) {
            tabs.push({ key: 'stock', label: 'Stock', activeColor: c.purple, icon: '⬡' })
          }
          // Boutique tab always visible — clients can order e-com services from here
          tabs.push({ key: 'boutique', label: 'E-commerce', activeColor: c.gold, icon: '◉' })
          return tabs.map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)} style={{
              padding: '10px 14px', background: 'none', whiteSpace: 'nowrap',
              border: 'none', borderBottom: viewMode === v.key ? `2px solid ${v.activeColor}` : '2px solid transparent',
              color: viewMode === v.key ? v.activeColor : c.textSecondary,
              fontSize: '10px', fontFamily: f.mono, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}>{v.icon} {v.label}</button>
          ))
        })()}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {viewMode === 'catalogue' ? (
          /* ── CATALOGUE REFACTORED ── */
          (() => {
            const tierKey = profile?.client_tier || DEFAULT_TIER
            const fullCatalog = getCatalog(tierKey)
            const preferredCats = profile?.preferred_categories || []
            const preferredSet = new Set(preferredCats)
            const sortedCatalog = preferredCats.length > 0
              ? [...fullCatalog.filter(cat => preferredSet.has(cat.id)), ...fullCatalog.filter(cat => !preferredSet.has(cat.id))]
              : fullCatalog
            return (
          <div style={{ flex: 1, overflowY: 'auto', padding: sp[4], background: c.bg }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ marginBottom: sp[5] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[1] }}>
                  <div style={{ width: 24, height: '1px', background: c.gold }} />
                  <span style={{
                    fontFamily: f.mono, fontSize: '10px', color: c.gold,
                    letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                  }}>Catalogue {tier.label}</span>
                </div>
                <h2 style={{
                  margin: 0, fontFamily: f.display, fontSize: size['2xl'],
                  color: c.text, letterSpacing: '-0.02em', fontWeight: 500,
                }}>
                  {fullCatalog.length} cat{'é'}gories <em style={{ fontStyle: 'italic', color: c.gold }}>adapt{'é'}es</em> {'à'} votre profil
                </h2>
                <p style={{
                  margin: `${sp[2]} 0 0`, fontSize: size.sm, color: c.textSecondary,
                  lineHeight: 1.7, maxWidth: 600,
                }}>
                  Produits sourcés directement depuis nos usines partenaires en Chine.
                  Prix et quantités minimales calibrés pour votre profil {tier.icon} {tier.label}.
                  <br /><span style={{ color: c.gold, fontStyle: 'italic', fontSize: '11px' }}>Les prix et MOQ affichés sont des estimations indicatives — le tarif final dépend du volume, des specs et du fournisseur sélectionné.</span>
                </p>

                {/* Demande produit personnalisé */}
                <div style={{
                  marginTop: sp[3], padding: `${sp[2]} ${sp[3]}`,
                  background: `${c.gold}08`, border: `1px solid ${c.gold}25`,
                  display: 'flex', alignItems: 'center', gap: sp[2], flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <span style={{ fontSize: size.sm, color: c.textSecondary, flex: 1 }}>
                    Votre produit n'est pas dans le catalogue ?{' '}
                    <a href="mailto:contact@caraxes.fr?subject=Demande%20de%20sourcing%20personnalis%C3%A9" style={{
                      color: c.gold, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${c.gold}40`,
                    }}>Faites-nous votre demande par email</a>
                    {' '}&mdash; on source n'importe quel produit depuis la Chine.
                  </span>
                </div>
              </div>

              {/* ── DYNAMIC PRODUCTS FROM SUPABASE ── */}
              {dynamicProducts.length > 0 && (
                <div style={{ marginBottom: sp[5] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[3] }}>
                    <div style={{ width: 24, height: '1px', background: c.red }} />
                    <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.red, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      Nos produits
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: sp[3] }}>
                    {dynamicProducts.map((prod, i) => (
                      <div key={prod.id} style={{
                        background: c.bgElevated, border: `1px solid ${c.border}`, overflow: 'hidden',
                        transition: `border-color 0.2s ${ease.smooth}`, cursor: 'pointer',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = c.gold }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = c.border }}>
                        <div style={{ height: 180, background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {prod.image_urls?.[0] ? (
                            <img src={prod.image_urls[0]} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '48px', opacity: 0.15 }}>📦</span>
                          )}
                        </div>
                        <div style={{ padding: sp[3] }}>
                          <div style={{ fontFamily: f.display, fontWeight: 600, fontSize: size.base, marginBottom: '4px' }}>{prod.name}</div>
                          {prod.category && <span style={{ fontSize: '9px', color: c.gold, fontFamily: f.mono, padding: '1px 6px', background: c.goldSoft, border: `1px solid ${c.gold}33` }}>{prod.category}</span>}
                          {prod.description && <p style={{ fontSize: '11px', color: c.textSecondary, marginTop: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.description}</p>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${c.borderSubtle}` }}>
                          {[
                            { label: 'Prix', value: prod.price_min && prod.price_max ? `${prod.price_min}-${prod.price_max}` : '-', color: c.green },
                            { label: 'Marge', value: prod.margin_estimate || '-', color: c.gold },
                            { label: 'MOQ', value: prod.moq || '-', color: c.amber },
                          ].map((cell, j) => (
                            <div key={j} style={{ padding: `${sp[1]} ${sp[2]}`, borderRight: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.xs, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: sp[3],
              }}>
                {sortedCatalog.map((cat, catIdx) => {
                  const isPreferred = preferredSet.has(cat.id)
                  const tierPrice = getTierPrice(cat, tierKey)
                  const moq = getTierMOQ(cat.moq, tierKey)
                  return (
                    <div key={cat.id} onClick={() => setSelectedCatalogItem(cat)} style={{
                      background: c.bgElevated, border: `1px solid ${c.border}`,
                      padding: 0, transition: `border-color 0.2s ${ease.smooth}`,
                      position: 'relative', overflow: 'hidden',
                      display: 'flex', flexDirection: 'column', cursor: 'pointer',
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = tier.color
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = c.border
                      }}>

                      {/* Accent bar */}
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${isPreferred && preferredCats.length > 0 ? c.gold : tier.color}, ${isPreferred && preferredCats.length > 0 ? c.gold : tier.color}44)` }} />

                      {/* Header */}
                      <div style={{ padding: `${sp[3]} ${sp[3]} ${sp[2]}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                          <span style={{
                            fontSize: '26px', width: 46, height: 46,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: c.bgSurface, border: `1px solid ${isPreferred && preferredCats.length > 0 ? c.gold + '44' : c.borderSubtle}`,
                            flexShrink: 0,
                          }}>{cat.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                              <span style={{
                                fontFamily: f.display, fontSize: size.base, color: c.text,
                                fontWeight: 600, lineHeight: 1.3,
                              }}>{cat.name}</span>
                              {isPreferred && preferredCats.length > 0 && (
                                <span style={{ fontSize: '8px', fontFamily: f.mono, fontWeight: 700, color: c.gold, background: c.goldSoft, padding: '1px 6px', border: `1px solid ${c.gold}33`, letterSpacing: '0.06em' }}>VOTRE S{'É'}LECTION</span>
                              )}
                            </div>
                            <div style={{
                              fontSize: '11px', color: c.textTertiary, marginTop: '3px',
                              lineHeight: 1.5,
                            }}>{cat.description}</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px',
                        background: c.borderSubtle, margin: `0 ${sp[3]}`,
                        border: `1px solid ${c.borderSubtle}`, marginBottom: sp[2],
                      }}>
                        {[
                          { label: 'Prix unit. ~', value: '~' + tierPrice, color: c.green, est: true },
                          { label: 'Marge est.', value: cat.margin, color: c.gold, est: true },
                          { label: 'MOQ ~', value: '~' + moq.toLocaleString('fr-FR'), color: c.amber, est: true },
                        ].map((m, i) => (
                          <div key={i} style={{
                            padding: `${sp[1]} ${sp[2]}`, background: c.bgSurface, textAlign: 'center',
                          }}>
                            <div style={{
                              fontFamily: f.mono, fontSize: '8px', color: c.textTertiary,
                              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px',
                            }}>{m.label}</div>
                            <div style={{ fontSize: size.sm, fontWeight: 700, color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Top products */}
                      <div style={{ padding: `0 ${sp[3]} ${sp[2]}`, flex: 1 }}>
                        <div style={{
                          fontFamily: f.mono, fontSize: '8px', color: c.textTertiary,
                          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: sp[1],
                        }}>Produits phares</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {cat.topProducts.slice(0, 4).map((p, i) => (
                            <span key={i} style={{
                              padding: '3px 8px', background: c.bgSurface,
                              border: `1px solid ${c.borderSubtle}`, fontSize: '10px',
                              color: c.textSecondary, lineHeight: 1.4,
                            }}>{p}</span>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{
                        padding: `${sp[2]} ${sp[3]}`, borderTop: `1px solid ${c.borderSubtle}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: c.bgSurface,
                      }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {cat.locations.map(loc => (
                            <span key={loc} style={{
                              fontSize: '9px', fontFamily: f.mono, color: c.textTertiary,
                              letterSpacing: '0.02em',
                            }}>{loc}</span>
                          ))}
                        </div>
                        <button onClick={(e) => {
                          e.stopPropagation(); setPrefilledProduct(cat.name); setViewMode('orders'); setIsNewOrderOpen(true)
                        }} style={{
                          padding: '6px 14px',
                          background: tier.color, border: 'none',
                          color: c.bg, fontSize: '9px', fontFamily: f.mono,
                          cursor: 'pointer', letterSpacing: '0.06em', fontWeight: 700,
                          textTransform: 'uppercase', transition: `all 0.2s ${ease.smooth}`,
                        }}
                          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85' }}
                          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                        >Commander</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── CATALOG DETAIL MODAL ── */}
              {selectedCatalogItem && (() => {
                const cat = selectedCatalogItem
                const tierPrice = getTierPrice(cat, tierKey)
                const moq = getTierMOQ(cat.moq, tierKey)
                return (
                  <div onClick={() => setSelectedCatalogItem(null)} style={{
                    position: 'fixed', inset: 0, background: c.bgOverlay,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, padding: sp[3],
                    animation: `fadeIn 0.2s ${ease.out}`,
                    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                  }}>
                    <div onClick={e => e.stopPropagation()} style={{
                      background: c.bgElevated, border: `1px solid ${c.border}`,
                      maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto',
                      position: 'relative', boxShadow: shadow.xl,
                    }}>
                      {/* Accent bar */}
                      <div style={{ height: 4, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}44)` }} />

                      {/* Close btn */}
                      <button onClick={() => setSelectedCatalogItem(null)} style={{
                        position: 'absolute', top: 16, right: 16, background: 'none',
                        border: 'none', color: c.textSecondary, cursor: 'pointer', padding: 4,
                      }}><Icon d={icons.close} /></button>

                      <div style={{ padding: sp[4] }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[3] }}>
                          <span style={{
                            fontSize: '36px', width: 56, height: 56,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: c.bgSurface, border: `1px solid ${c.borderSubtle}`,
                          }}>{cat.icon}</span>
                          <div>
                            <h3 style={{ margin: 0, fontFamily: f.display, fontSize: size.lg, color: c.text, fontWeight: 600 }}>{cat.name}</h3>
                            <p style={{ margin: '4px 0 0', fontSize: size.sm, color: c.textSecondary, lineHeight: 1.5 }}>{cat.description}</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px',
                          background: c.borderSubtle, border: `1px solid ${c.borderSubtle}`, marginBottom: sp[3],
                        }}>
                          {[
                            { label: 'Prix unitaire ~', value: '~' + tierPrice, color: c.green },
                            { label: 'Marge estimée', value: cat.margin, color: c.gold },
                            { label: 'MOQ ~', value: '~' + moq.toLocaleString('fr-FR'), color: c.amber },
                          ].map((m, i) => (
                            <div key={i} style={{ padding: `${sp[2]} ${sp[2]}`, background: c.bgSurface, textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                              <div style={{ fontSize: size.base, fontWeight: 700, color: m.color }}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{
                          padding: `${sp[1]} ${sp[2]}`, background: `${c.gold}08`, border: `1px solid ${c.gold}22`,
                          marginBottom: sp[3], fontSize: '11px', color: c.gold, fontStyle: 'italic', lineHeight: 1.6,
                        }}>
                          Les prix et MOQ sont des estimations indicatives. Le tarif final sera ajusté selon le volume commandé, les spécifications exactes et le fournisseur sélectionné.
                        </div>

                        {/* Products list */}
                        <div style={{ marginBottom: sp[3] }}>
                          <div style={{
                            fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
                            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[2], fontWeight: 600,
                          }}>Produits disponibles dans cette catégorie</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {cat.topProducts.map((p, i) => (
                              <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: sp[2],
                                padding: `${sp[1]} ${sp[2]}`, background: c.bgSurface,
                                border: `1px solid ${c.borderSubtle}`,
                              }}>
                                <span style={{ fontSize: '14px', color: c.gold, fontWeight: 700, fontFamily: f.mono }}>{String(i + 1).padStart(2, '0')}</span>
                                <span style={{ fontSize: size.sm, color: c.text, flex: 1 }}>{p}</span>
                                <button onClick={(e) => {
                                  e.stopPropagation(); setPrefilledProduct(p); setSelectedCatalogItem(null); setViewMode('orders'); setIsNewOrderOpen(true)
                                }} style={{
                                  padding: '4px 10px', background: 'none', border: `1px solid ${tier.color}44`,
                                  color: tier.color, fontSize: '9px', fontFamily: f.mono, cursor: 'pointer',
                                  letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase',
                                  transition: `all 0.2s ${ease.smooth}`,
                                }}
                                  onMouseOver={e => { e.currentTarget.style.background = tier.color; e.currentTarget.style.color = c.bg }}
                                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = tier.color }}
                                >Commander</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Locations */}
                        <div style={{ display: 'flex', gap: sp[1], alignItems: 'center', marginBottom: sp[3] }}>
                          <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Zones de sourcing :</span>
                          {cat.locations.map(loc => (
                            <span key={loc} style={{
                              padding: '3px 8px', background: c.bgSurface, border: `1px solid ${c.borderSubtle}`,
                              fontSize: '10px', fontFamily: f.mono, color: c.textSecondary,
                            }}>{loc}</span>
                          ))}
                        </div>

                        {/* CTA */}
                        <button onClick={() => {
                          setPrefilledProduct(cat.name); setSelectedCatalogItem(null); setViewMode('orders'); setIsNewOrderOpen(true)
                        }} style={{
                          width: '100%', padding: `${sp[2]}`,
                          background: tier.color, border: 'none', color: c.bg,
                          fontSize: size.sm, fontFamily: f.mono, fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                          transition: `all 0.2s ${ease.smooth}`,
                        }}
                          onMouseOver={e => { e.currentTarget.style.opacity = '0.85' }}
                          onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                        >Demander un devis pour {cat.name}</button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
            )
          })()
        ) : viewMode === 'expedition' ? (
          /* ─── EXPEDITION VIEW ─── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }} className="admin-scroll">
            <div style={{ padding: sp[4], maxWidth: '900px', width: '100%', margin: '0 auto' }}>
              {/* Header + New Shipment Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4] }}>
                <div>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[1] }}>Service 02</div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, margin: 0, marginBottom: sp[1] }}>Suivi des expéditions</h2>
                  <p style={{ color: c.textSecondary, fontSize: size.sm, margin: 0 }}>Suivez vos envois depuis l'usine jusqu'à votre porte en France.</p>
                </div>
                <button onClick={() => setIsNewShipmentOpen(!isNewShipmentOpen)} style={{
                  padding: `${sp[1]} ${sp[3]}`, background: isNewShipmentOpen ? c.bgElevated : c.teal,
                  border: `1px solid ${isNewShipmentOpen ? c.border : c.teal}`, color: isNewShipmentOpen ? c.textSecondary : c.black,
                  fontSize: '10px', fontFamily: f.mono, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  transition: `all 0.2s ${ease.smooth}`,
                }}>{isNewShipmentOpen ? 'Annuler' : '+ Nouvel envoi'}</button>
              </div>

              {/* ─── NEW SHIPMENT FORM ─── */}
              {isNewShipmentOpen && (
                <div style={{
                  background: c.bgSurface, border: `1px solid ${c.teal}33`, padding: sp[3],
                  marginBottom: sp[3], animation: `fadeSlideIn 0.2s ease-out both`,
                }}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.teal, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[3] }}>Créer un envoi</div>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    setCreatingShipment(true)
                    try {
                      const fd = new FormData(e.target)
                      const shipStatusMap = { production: 0, quality: 1, transit: 2, customs: 3, delivered: 4 }
                      const newShip = {
                        client_id: user.id,
                        product_name: fd.get('product_name'),
                        tracking_number: fd.get('tracking_number') || null,
                        status: shipStatusMap[fd.get('status')] ?? 0,
                        method: fd.get('method') || null,
                        weight_kg: parseFloat(fd.get('weight')) || null,
                        origin: fd.get('origin') || 'Chine',
                        destination: fd.get('destination') || 'France',
                        eta: fd.get('eta') || null,
                        order_id: fd.get('order_id') || null,
                      }
                      await createShipment(newShip)
                      const fresh = await getShipments(user.id)
                      setShipments(fresh)
                      setIsNewShipmentOpen(false)
                      toast?.success?.('Envoi créé avec succès')
                    } catch (err) {
                      console.error('Create shipment error:', err)
                      toast?.error?.('Erreur lors de la création')
                    } finally { setCreatingShipment(false) }
                  }}>
                    {/* Link to order */}
                    <div style={{ marginBottom: sp[2] }}>
                      <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Commande liée</label>
                      <select name="order_id" style={{
                        width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                        color: c.text, fontSize: size.sm, fontFamily: f.body,
                      }}>
                        <option value="">— Aucune —</option>
                        {orders.filter(o => { const st = typeof o.status === 'number' ? o.status : 0; return st >= 3 }).map(o => (
                          <option key={o.id} value={o.id}>{o.ref} — {o.product}</option>
                        ))}
                      </select>
                    </div>
                    {/* Product name */}
                    <div style={{ marginBottom: sp[2] }}>
                      <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Produit / Description</label>
                      <input name="product_name" required placeholder="Ex: Tapis de prière 1000u" style={{
                        width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                        color: c.text, fontSize: size.sm, fontFamily: f.body,
                      }} />
                    </div>
                    {/* Grid: tracking, status, method, weight */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], marginBottom: sp[2] }}>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>N° Tracking</label>
                        <input name="tracking_number" placeholder="Optionnel" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Statut</label>
                        <select name="status" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }}>
                          <option value="production">Production</option>
                          <option value="quality">Contrôle qualité</option>
                          <option value="transit">En transit</option>
                          <option value="customs">Douanes</option>
                          <option value="delivered">Livré</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Mode</label>
                        <select name="method" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }}>
                          <option value="">—</option>
                          <option value="Maritime">Maritime</option>
                          <option value="Aérien">Aérien</option>
                          <option value="Ferroviaire">Ferroviaire</option>
                          <option value="Express">Express</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Poids</label>
                        <input name="weight" placeholder="Ex: 250 kg" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }} />
                      </div>
                    </div>
                    {/* Grid: origin, destination, ETA */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2], marginBottom: sp[3] }}>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Départ</label>
                        <input name="origin" defaultValue="Chine" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Arrivée</label>
                        <input name="destination" defaultValue="France" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>ETA</label>
                        <input name="eta" type="date" style={{
                          width: '100%', padding: sp[1], background: c.bgElevated, border: `1px solid ${c.border}`,
                          color: c.text, fontSize: size.sm, fontFamily: f.body,
                        }} />
                      </div>
                    </div>
                    <button type="submit" disabled={creatingShipment} style={{
                      padding: `${sp[1]} ${sp[3]}`, background: c.teal, border: 'none',
                      color: c.black, fontSize: '10px', fontFamily: f.mono, fontWeight: 700,
                      cursor: creatingShipment ? 'wait' : 'pointer', opacity: creatingShipment ? 0.6 : 1,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>{creatingShipment ? 'Création...' : 'Créer l\'envoi'}</button>
                  </form>
                </div>
              )}

              {/* ─── ORDERS IN SHIPPING WITHOUT SHIPMENT ─── */}
              {(() => {
                const shippingOrders = orders.filter(o => {
                  const st = typeof o.status === 'number' ? o.status : 0
                  return st >= 4 && !shipments.some(s => s.order_id === o.id)
                })
                if (shippingOrders.length === 0) return null
                return (
                  <div style={{
                    background: `${c.gold}08`, border: `1px solid ${c.gold}22`,
                    padding: sp[3], marginBottom: sp[3],
                  }}>
                    <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[2] }}>
                      Commandes en expédition sans envoi
                    </div>
                    <p style={{ fontSize: size.xs, color: c.textSecondary, margin: `0 0 ${sp[2]}` }}>
                      Ces commandes sont en phase d'expédition mais n'ont pas encore d'envoi associé.
                    </p>
                    {shippingOrders.map(o => (
                      <div key={o.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: `${sp[1]} 0`, borderBottom: `1px solid ${c.gold}15`,
                      }}>
                        <div>
                          <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold, marginRight: sp[1] }}>{o.ref}</span>
                          <span style={{ fontSize: size.sm, color: c.text }}>{o.product}</span>
                          <StatusPill status={o.status} size="sm" />
                        </div>
                        <button onClick={async () => {
                          setCreatingShipment(true)
                          try {
                            await createShipment({
                              client_id: user.id,
                              product_name: o.product,
                              status: 0,
                              origin: 'Chine',
                              destination: 'France',
                              order_id: o.id,
                            })
                            const fresh = await getShipments(user.id)
                            setShipments(fresh)
                            toast?.success?.(`Envoi créé pour ${o.ref}`)
                          } catch (err) {
                            console.error(err)
                            toast?.error?.('Erreur')
                          } finally { setCreatingShipment(false) }
                        }} style={{
                          padding: '3px 10px', background: c.teal, border: 'none',
                          color: c.black, fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                          cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>Créer l'envoi</button>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {shipments.length === 0 && orders.filter(o => { const st = typeof o.status === 'number' ? o.status : 0; return st >= 4 && !shipments.some(s => s.order_id === o.id) }).length === 0 ? (
                <div style={{ padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', opacity: 0.15, marginBottom: sp[2] }}>🚢</div>
                  <div style={{ fontFamily: f.display, fontSize: size.lg, color: c.textSecondary, marginBottom: sp[1] }}>Aucune expédition en cours</div>
                  <p style={{ fontSize: size.sm, color: c.textTertiary, margin: 0, maxWidth: '40ch', marginLeft: 'auto', marginRight: 'auto' }}>
                    Vos expéditions apparaîtront ici dès qu'une commande sera en phase d'envoi. Cliquez sur "+ Nouvel envoi" pour en créer une manuellement.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                  {shipments.map((ship, i) => {
                    const steps = [
                      { key: 'production', label: 'Production', icon: '🏭' },
                      { key: 'quality', label: 'Contrôle qualité', icon: '✓' },
                      { key: 'transit', label: 'En transit', icon: '🚢' },
                      { key: 'customs', label: 'Douanes', icon: '📋' },
                      { key: 'delivered', label: 'Livré', icon: '✦' },
                    ]
                    const currentStep = typeof ship.status === 'number' ? ship.status : (steps.findIndex(s => s.key === ship.status) || 0)
                    return (
                      <div key={ship.id || i} style={{
                        background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[3],
                      }}>
                        {/* Shipment header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
                          <div>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.teal, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{ship.tracking_number || 'EN ATTENTE'}</div>
                            <div style={{ fontWeight: 700, fontSize: size.md, color: c.text }}>{ship.product_name || ship.description || 'Envoi'}</div>
                            {/* Link to related order */}
                            {(() => {
                              const relatedOrder = ship.order_id ? orders.find(o => o.id === ship.order_id) : null
                              if (!relatedOrder) return null
                              return (
                                <button onClick={() => { setSelectedOrder(relatedOrder); setViewMode('orders') }} style={{
                                  background: 'none', border: 'none', padding: 0, marginTop: '4px',
                                  fontFamily: f.mono, fontSize: '9px', color: c.gold, cursor: 'pointer',
                                  letterSpacing: '0.04em', textDecoration: 'underline', textDecorationColor: `${c.gold}44`,
                                }}>
                                  ← Commande {relatedOrder.ref} · {relatedOrder.product}
                                </button>
                              )
                            })()}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase' }}>ETA</div>
                            <div style={{ fontSize: size.sm, fontWeight: 600, color: c.gold }}>{ship.eta ? new Date(ship.eta).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</div>
                          </div>
                        </div>
                        {/* Progress timeline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: sp[2] }}>
                          {steps.map((step, si) => (
                            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                              <div style={{
                                width: 28, height: 28,
                                background: si <= currentStep ? c.teal : c.bgElevated,
                                border: `2px solid ${si <= currentStep ? c.teal : c.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', color: si <= currentStep ? c.black : c.textTertiary,
                                fontWeight: 700, zIndex: 1,
                                transition: `all 0.35s ${ease.out}`,
                                boxShadow: si === currentStep ? `0 0 12px ${c.teal}33` : 'none',
                              }}>{si < currentStep ? '\u2713' : step.icon}</div>
                              <div style={{ fontSize: '9px', color: si <= currentStep ? c.teal : c.textTertiary, marginTop: '6px', textAlign: 'center', fontFamily: f.mono, letterSpacing: '0.02em' }}>{step.label}</div>
                              {si < steps.length - 1 && (
                                <div style={{ position: 'absolute', top: 14, left: '60%', width: '80%', height: 2, background: si < currentStep ? c.teal : c.border, zIndex: 0 }} />
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Details row */}
                        <div style={{ display: 'flex', gap: sp[3], paddingTop: sp[2], borderTop: `1px solid ${c.borderSubtle}` }}>
                          {ship.method && <div><span style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase' }}>Mode</span><div style={{ fontSize: size.sm, color: c.text }}>{ship.method}</div></div>}
                          {ship.weight && <div><span style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase' }}>Poids</span><div style={{ fontSize: size.sm, color: c.text }}>{ship.weight}</div></div>}
                          {ship.origin && <div><span style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase' }}>Départ</span><div style={{ fontSize: size.sm, color: c.text }}>{ship.origin}</div></div>}
                          {ship.destination && <div><span style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase' }}>Arrivée</span><div style={{ fontSize: size.sm, color: c.text }}>{ship.destination}</div></div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'stock' ? (
          /* ─── STOCK & BOUTIQUE VIEW ─── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }} className="admin-scroll">
            <div style={{ padding: sp[4], maxWidth: '900px', width: '100%', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ marginBottom: sp[4] }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.purple, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[1] }}>Service 03 — Option</div>
                <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, margin: 0, marginBottom: sp[1] }}>Gestion de stock & Boutique</h2>
                <p style={{ color: c.textSecondary, fontSize: size.sm, margin: 0 }}>Votre entrepôt en Chine et votre boutique en ligne, gérés par CARAXES.</p>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: sp[2], marginBottom: sp[4] }}>
                {[
                  { label: 'Références', value: inventory.length, color: c.purple },
                  { label: 'Stock total', value: inventory.reduce((s, i) => s + (i.quantity || 0), 0).toLocaleString('fr-FR') + ' u.', color: c.teal },
                  { label: 'Alertes stock', value: inventory.filter(i => (i.quantity || 0) <= (i.alert_threshold || 10)).length, color: c.red },
                  { label: 'Valeur est.', value: '—', color: c.gold },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                  }}>
                    <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sp[1] }}>{stat.label}</div>
                    <div style={{ fontSize: size.xl, fontWeight: 700, fontFamily: f.display, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {inventory.length === 0 ? (
                <div style={{ padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', opacity: 0.15, marginBottom: sp[2] }}>📦</div>
                  <div style={{ fontFamily: f.display, fontSize: size.lg, color: c.textSecondary, marginBottom: sp[1] }}>Votre entrepôt est vide</div>
                  <p style={{ fontSize: size.sm, color: c.textTertiary, margin: 0, maxWidth: '48ch', marginLeft: 'auto', marginRight: 'auto' }}>
                    Dès que vous activez le service de gestion de stock, votre inventaire apparaîtra ici avec suivi en temps réel, alertes stock bas et gestion des mouvements.
                  </p>
                  <div style={{ marginTop: sp[3], display: 'inline-flex', gap: sp[2] }}>
                    <a href="https://wa.me/8618042710257?text=Bonjour%2C%20je%20souhaite%20activer%20le%20service%20gestion%20de%20stock" target="_blank" rel="noopener noreferrer" style={{
                      padding: `${sp[1]} ${sp[3]}`, background: c.purple, border: 'none', color: c.white,
                      fontSize: size.xs, fontFamily: f.mono, fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none',
                    }}>Activer ce service</a>
                  </div>
                </div>
              ) : (
                <div style={{ background: c.bgSurface, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                    padding: `${sp[1]} ${sp[3]}`, borderBottom: `1px solid ${c.border}`, background: c.bgElevated,
                  }}>
                    {['Produit', 'Qté', 'Seuil', 'Entrepôt', 'État'].map(h => (
                      <div key={h} style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                    ))}
                  </div>
                  {/* Table rows */}
                  {inventory.map((item, i) => {
                    const isLow = (item.quantity || 0) <= (item.alert_threshold || 10)
                    return (
                      <div key={item.id || i} style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                        padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`,
                        transition: `background 0.2s ${ease.smooth}`,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = c.bgElevated}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{item.product_name}</div>
                          {item.sku && <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>{item.sku}</div>}
                        </div>
                        <div style={{ fontSize: size.sm, fontWeight: 700, color: isLow ? c.red : c.text, fontFamily: f.mono }}>{(item.quantity || 0).toLocaleString('fr-FR')}</div>
                        <div style={{ fontSize: size.sm, color: c.textTertiary, fontFamily: f.mono }}>{item.alert_threshold || 10}</div>
                        <div style={{ fontSize: size.xs, color: c.textSecondary }}>{item.warehouse || 'Yiwu'}</div>
                        <div>
                          <span style={{
                            padding: '2px 8px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                            background: isLow ? c.redSoft : c.greenSoft,
                            color: isLow ? c.red : c.green,
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>{isLow ? 'Bas' : 'OK'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Boutique section */}
              <div style={{ marginTop: sp[4] }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.purple, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[2] }}>Boutique en ligne</div>
                <div style={{ padding: sp[4], background: c.bgSurface, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', opacity: 0.15, marginBottom: sp[2] }}>🛒</div>
                  <div style={{ fontFamily: f.display, fontSize: size.md, color: c.textSecondary, marginBottom: sp[1] }}>Boutique en préparation</div>
                  <p style={{ fontSize: size.xs, color: c.textTertiary, margin: 0, maxWidth: '40ch', marginLeft: 'auto', marginRight: 'auto' }}>
                    Votre boutique Shopify/WooCommerce sera accessible ici avec les stats de commandes et le fulfillment automatisé.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'boutique' ? (
          /* ─── BOUTIQUE E-COMMERCE VIEW ─── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }} className="admin-scroll">
            <div style={{ padding: sp[4], maxWidth: 960, margin: '0 auto', width: '100%' }}>
              {/* Header + CTA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[4], flexWrap: 'wrap', gap: sp[2] }}>
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                    Ma boutique en ligne
                  </h2>
                  <div style={{ width: 40, height: 1, background: c.gold, opacity: 0.3, margin: `${sp[1]} 0` }} />
                  <p style={{ fontSize: size.sm, color: c.textSecondary, margin: 0, marginTop: sp[1], lineHeight: 1.6 }}>
                    Commandez, gérez et suivez vos services e-commerce CARAXES.
                  </p>
                </div>
                <button onClick={() => setIsEcomOrderOpen(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: `10px ${sp[3]}`, fontSize: size.sm, fontWeight: 700, fontFamily: f.body,
                  color: c.black, background: c.gold, border: 'none',
                  cursor: 'pointer', transition: `opacity 0.2s ${ease.smooth}`, letterSpacing: '0.02em',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                  <Icon d={icons.plus} size={14} color={c.black} /> Commander un service
                </button>
              </div>

              {/* Virement info banner */}
              {ecomVirementInfo && (
                <div style={{ padding: sp[3], background: 'oklch(22% 0.02 85)', border: `1px solid ${c.gold}33`, marginBottom: sp[4], position: 'relative' }}>
                  <button onClick={() => setEcomVirementInfo(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.textTertiary, padding: 4 }}>
                    <Icon d={icons.close} size={14} />
                  </button>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.gold, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[2], fontWeight: 700 }}>Informations virement</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], fontSize: size.sm }}>
                    <div>
                      <div style={{ color: c.textTertiary, fontSize: '10px', fontFamily: f.mono, marginBottom: '2px' }}>RÉFÉRENCE</div>
                      <div style={{ color: c.gold, fontWeight: 700, fontFamily: f.mono }}>{ecomVirementInfo.reference}</div>
                    </div>
                    <div>
                      <div style={{ color: c.textTertiary, fontSize: '10px', fontFamily: f.mono, marginBottom: '2px' }}>MONTANT</div>
                      <div style={{ color: c.text, fontWeight: 700 }}>{ecomVirementInfo.amount?.toLocaleString('fr-FR')} EUR</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: c.textTertiary, fontSize: '10px', fontFamily: f.mono, marginBottom: '2px' }}>COORDONNÉES BANCAIRES</div>
                      <div style={{ color: c.text, fontSize: size.xs, lineHeight: 1.6 }}>
                        CARAXES TRADING — IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX<br/>
                        BIC : XXXXXXXX — Banque : CIC<br/>
                        Indiquez la référence <span style={{ color: c.gold, fontWeight: 700 }}>{ecomVirementInfo.reference}</span> dans le motif du virement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ecom services / orders list */}
              {ecomServices.length > 0 && (
                <div style={{ marginBottom: sp[4] }}>
                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: sp[2], fontWeight: 600 }}>
                    Mes commandes e-commerce ({ecomServices.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                    {ecomServices.map(svc => {
                      const payColors = {
                        pending: { bg: c.bgSurface, color: c.textSecondary, label: 'En attente' },
                        paid: { bg: c.greenSoft, color: c.green, label: 'Payé' },
                        failed: { bg: c.redSoft, color: c.red, label: 'Échoué' },
                      }
                      const statusColors = {
                        pending: { bg: c.bgSurface, color: c.textSecondary, label: 'En attente' },
                        in_progress: { bg: 'oklch(90% 0.08 85)', color: c.gold, label: 'En cours' },
                        delivered: { bg: c.greenSoft, color: c.green, label: 'Livré' },
                        cancelled: { bg: c.redSoft, color: c.red, label: 'Annulé' },
                      }
                      const pay = payColors[svc.payment_status] || payColors.pending
                      const st = statusColors[svc.status] || statusColors.pending
                      const packLabel = ECOM_PACKS.find(p => p.key === svc.service_type)?.label || svc.service_type
                      const platformLabel = PLATFORMS.find(p => p.key === svc.platform)?.label || svc.platform

                      return (
                        <div key={svc.id} style={{
                          padding: sp[3], background: c.bgSurface, border: `1px solid ${c.border}`,
                          position: 'relative', overflow: 'hidden',
                        }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: st.color }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp[2], flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, marginBottom: '4px' }}>
                                {packLabel}
                              </div>
                              <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.04em' }}>
                                {platformLabel}{svc.shop_name ? ` — ${svc.shop_name}` : ''} — {new Date(svc.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: sp[1], flexShrink: 0 }}>
                              <span style={{ padding: '2px 8px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700, background: pay.bg, color: pay.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{pay.label}</span>
                              <span style={{ padding: '2px 8px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700, background: st.bg, color: st.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{st.label}</span>
                            </div>
                          </div>
                          {svc.payment_method === 'virement' && svc.payment_status === 'pending' && svc.virement_reference && (
                            <div style={{ marginTop: sp[2], padding: `${sp[1]} ${sp[2]}`, background: c.bg, border: `1px solid ${c.borderSubtle}`, fontSize: '10px', color: c.textSecondary, fontFamily: f.mono }}>
                              Ref virement : <span style={{ color: c.gold, fontWeight: 700 }}>{svc.virement_reference}</span> — {svc.price?.toLocaleString('fr-FR')} EUR
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Existing shops */}
              {shops.length === 0 && ecomServices.length === 0 ? (
                <div style={{ padding: `${sp[5]} ${sp[4]}`, background: c.bgSurface, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', opacity: 0.12, marginBottom: sp[2] }}>🛒</div>
                  <div style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[1] }}>
                    Pas encore de boutique
                  </div>
                  <p style={{ fontSize: size.sm, color: c.textSecondary, margin: 0, maxWidth: '45ch', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                    Commandez une création de boutique ou un service de gestion pour démarrer votre e-commerce avec CARAXES.
                  </p>
                  <button onClick={() => setIsEcomOrderOpen(true)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: sp[3],
                    padding: `10px ${sp[3]}`, fontSize: size.sm, fontWeight: 700, fontFamily: f.body,
                    color: c.black, background: c.gold, border: 'none',
                    cursor: 'pointer', transition: `opacity 0.2s ${ease.smooth}`,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                    Commander un service e-commerce
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                  {shops.map(shop => {
                    const statusColors = {
                      draft: { bg: c.bgSurface, color: c.textSecondary, label: 'Brouillon' },
                      building: { bg: c.goldSoft || 'oklch(90% 0.08 85)', color: c.gold, label: 'En construction' },
                      review: { bg: c.purpleSoft || 'oklch(90% 0.08 300)', color: c.purple, label: 'En révision' },
                      active: { bg: c.greenSoft, color: c.green, label: 'Active' },
                      paused: { bg: c.redSoft, color: c.red, label: 'En pause' },
                      archived: { bg: c.bgSurface, color: c.textTertiary, label: 'Archivée' },
                    }
                    const st = statusColors[shop.status] || statusColors.draft
                    const platformLabels = { shopify: 'Shopify', woocommerce: 'WooCommerce', prestashop: 'PrestaShop', custom: 'Custom' }

                    return (
                      <div key={shop.id} style={{
                        background: c.bgSurface, border: `1px solid ${c.border}`,
                        padding: sp[4], position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: st.color, opacity: 0.5 }} />

                        {/* Shop header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
                          <div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text, marginBottom: '4px' }}>
                              {shop.name}
                            </div>
                            <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {platformLabels[shop.platform] || shop.platform} — Template {shop.template || 'classic'}
                            </div>
                          </div>
                          <span style={{
                            padding: '3px 10px', fontSize: '9px', fontFamily: f.mono, fontWeight: 700,
                            background: st.bg, color: st.color,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                          }}>{st.label}</span>
                        </div>

                        {/* Domain */}
                        {shop.domain && (
                          <div style={{ marginBottom: sp[3], display: 'flex', alignItems: 'center', gap: sp[1] }}>
                            <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>URL</span>
                            <a href={shop.domain.startsWith('http') ? shop.domain : `https://${shop.domain}`} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: f.mono, fontSize: size.sm, color: c.gold, textDecoration: 'none', borderBottom: `1px solid ${c.gold}33` }}>
                              {shop.domain}
                            </a>
                          </div>
                        )}

                        {/* Setup progress for non-active shops */}
                        {shop.status !== 'active' && shop.status !== 'paused' && shop.status !== 'archived' && (() => {
                          const steps = ['draft', 'building', 'review', 'active']
                          const currentStep = steps.indexOf(shop.status)
                          const progress = currentStep >= 0 ? ((currentStep + 1) / steps.length) * 100 : 0
                          const stepLabels = { draft: 'Création', building: 'Construction', review: 'Revue', active: 'En ligne' }
                          return (
                            <div style={{ marginBottom: sp[3], padding: `${sp[2]} ${sp[3]}`, background: c.bg, border: `1px solid ${c.borderSubtle}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[1] }}>
                                <span style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progression</span>
                                <span style={{ fontFamily: f.mono, fontSize: '9px', color: st.color, fontWeight: 700 }}>{Math.round(progress)}%</span>
                              </div>
                              <div style={{ height: 4, background: c.borderSubtle, overflow: 'hidden', marginBottom: sp[1] }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: st.color, transition: 'width 0.5s ease' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                {steps.map((s, i) => (
                                  <span key={s} style={{ fontSize: '8px', fontFamily: f.mono, color: i <= currentStep ? st.color : c.textTertiary, fontWeight: i === currentStep ? 700 : 400 }}>
                                    {stepLabels[s]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp[2] }}>
                          <div style={{ padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}` }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Produits</div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text }}>{shop.products_synced || 0}</div>
                          </div>
                          <div style={{ padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}` }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Commandes/mois</div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text }}>{shop.monthly_orders || 0}</div>
                          </div>
                          <div style={{ padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}` }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Revenu/mois</div>
                            <div style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold }}>
                              {(shop.monthly_revenue || 0).toLocaleString('fr-FR')}€
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {shop.notes && (
                          <div style={{ marginTop: sp[3], padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}`, fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6 }}>
                            {shop.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── SIDEBAR ── */}
            <div className="sidebar" style={{
              width: 340, background: c.bgWarm,
              borderRight: `1px solid ${c.border}`,
              display: mobileShowSidebar || window.innerWidth > 768 ? 'flex' : 'none', flexDirection: 'column',
            }}>
              {/* Search */}
              <div style={{ padding: `${sp[2]} ${sp[2]}`, borderBottom: `1px solid ${c.border}` }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}>
                    <Icon d={icons.search} size={14} color={c.textTertiary} />
                  </div>
                  <input type="text" placeholder="Rechercher..."
                    value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)}
                    style={{
                      width: '100%', padding: `10px 12px 10px 34px`,
                      background: c.bgSurface, border: `1px solid ${c.border}`,
                      fontSize: size.sm, color: c.text, fontFamily: f.body,
                      outline: 'none', boxSizing: 'border-box',
                      transition: `border-color 0.2s ${ease.smooth}`,
                    }}
                    onFocus={(e) => e.target.style.borderColor = c.gold}
                    onBlur={(e) => e.target.style.borderColor = c.border}
                  />
                </div>
              </div>

              {/* Filters */}
              <div style={{
                display: 'flex', gap: '4px', padding: `${sp[1]} ${sp[2]}`,
                borderBottom: `1px solid ${c.border}`,
              }}>
                {[
                  { label: 'Toutes', value: 'all' },
                  { label: 'En cours', value: 'in-progress' },
                  { label: 'Terminées', value: 'delivered' },
                ].map(fl => (
                  <button key={fl.value} onClick={() => setFilterStatus(fl.value)} style={{
                    padding: `6px ${sp[2]}`,
                    background: filterStatus === fl.value ? c.red : 'transparent',
                    border: `1px solid ${filterStatus === fl.value ? c.red : c.border}`,
                    color: filterStatus === fl.value ? c.white : c.textSecondary,
                    fontSize: '10px', cursor: 'pointer', fontFamily: f.mono,
                    fontWeight: filterStatus === fl.value ? 700 : 500,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    transition: `all 0.2s ${ease.smooth}`,
                  }}
                    onMouseOver={(e) => { if (filterStatus !== fl.value) e.target.style.borderColor = c.gold }}
                    onMouseOut={(e) => { if (filterStatus !== fl.value) e.target.style.borderColor = c.border }}
                  >{fl.label}</button>
                ))}
              </div>

              {/* Order list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredOrders.length === 0 ? (
                  <div style={{
                    padding: sp[4], textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, border: `1px solid ${c.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: sp[2], background: c.bgElevated,
                    }}>
                      <Icon d={icons.folder} size={20} color={c.textTertiary} />
                    </div>
                    <span style={{
                      fontSize: size.xs, color: c.textTertiary,
                      fontFamily: f.mono, letterSpacing: '0.04em',
                    }}>Aucune commande</span>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order}
                      selected={selectedOrder?.id === order.id}
                      onClick={() => { setSelectedOrder(order); setMobileShowSidebar(false) }}
                      unreadCount={unreadCounts[order.id] || 0}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── MAIN PANEL ── */}
            <div className="main-panel" style={{
              flex: 1, display: !mobileShowSidebar || window.innerWidth > 768 ? 'flex' : 'none', flexDirection: 'column', background: c.bg,
              overflow: 'hidden',
            }}>
              {selectedOrder ? (
                <>
                  {/* Scrollable order metadata zone */}
                  <div style={{ overflowY: 'auto', flexShrink: 1, minHeight: 0 }}>
                  {/* Order header */}
                  <div style={{
                    padding: `${sp[3]} ${sp[4]}`,
                    borderBottom: `1px solid ${c.border}`,
                    background: c.bgSurface,
                    animation: `fadeSlideIn 0.3s ${ease.out}`,
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: sp[2],
                    }}>
                      <div>
                        <button onClick={() => setMobileShowSidebar(true)} style={{
                          display: 'none', background: 'none', border: 'none', color: c.red,
                          fontSize: size.sm, fontFamily: f.mono, cursor: 'pointer', padding: 0,
                          marginBottom: '6px', letterSpacing: '0.04em',
                        }} className="mobile-back-btn">← Retour</button>
                        <div style={{
                          fontSize: '10px', color: c.textTertiary, marginBottom: '6px',
                          fontFamily: f.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>{selectedOrder.ref}</div>
                        <h1 style={{
                          margin: 0, fontSize: size.xl, fontFamily: f.display,
                          color: c.text, letterSpacing: '-0.02em',
                        }}>{selectedOrder.product}</h1>
                      </div>
                      <StatusPill status={selectedOrder.status} size="md" />
                    </div>

                    {/* Metadata */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: sp[3], fontSize: size.sm,
                    }}>
                      {[
                        { label: 'Quantité', value: `${fmtQty(selectedOrder.quantity)} unités` },
                        { label: 'Budget', value: selectedOrder.budget },
                        { label: 'Délai', value: selectedOrder.deadline || '—' },
                        { label: 'Fournisseur', value: selectedOrder.city || '—' },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{
                            color: c.textTertiary, marginBottom: '4px',
                            fontFamily: f.mono, fontSize: '9px',
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                          }}>{m.label}</div>
                          <div style={{ color: c.text, fontWeight: 600 }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline */}
                  <div style={{ padding: `${sp[3]} ${sp[4]} 0` }}>
                    <PipelineTracker status={selectedOrder.status} />
                  </div>

                  {/* ─── LINKED SHIPMENTS ─── */}
                  {(() => {
                    const linked = shipments.filter(s => s.order_id === selectedOrder.id)
                    const orderStatus = typeof selectedOrder.status === 'number' ? selectedOrder.status : 0
                    if (linked.length === 0 && orderStatus < 4) return null
                    const shipSteps = [
                      { key: 'production', label: 'Prod.', icon: '🏭' },
                      { key: 'quality', label: 'QC', icon: '✓' },
                      { key: 'transit', label: 'Transit', icon: '🚢' },
                      { key: 'customs', label: 'Douanes', icon: '📋' },
                      { key: 'delivered', label: 'Livré', icon: '✦' },
                    ]
                    return (
                      <div style={{ padding: `${sp[2]} ${sp[4]}` }}>
                        <div style={{
                          background: `${c.teal}08`, border: `1px solid ${c.teal}22`,
                          padding: sp[3],
                        }}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: linked.length > 0 ? sp[2] : 0,
                          }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.teal, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              🚢 Expédition liée
                            </div>
                            <button onClick={() => setViewMode('expedition')} style={{
                              background: 'none', border: `1px solid ${c.teal}33`, padding: '2px 8px',
                              fontFamily: f.mono, fontSize: '8px', color: c.teal, cursor: 'pointer',
                              letterSpacing: '0.04em', textTransform: 'uppercase',
                              transition: `opacity 0.2s ${ease.smooth}`,
                            }}
                              onMouseOver={e => { e.currentTarget.style.opacity = '0.7' }}
                              onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                            >Voir expéditions →</button>
                          </div>
                          {linked.length > 0 ? linked.map((ship, si) => {
                            const curStep = typeof ship.status === 'number' ? ship.status : (shipSteps.findIndex(s => s.key === ship.status) || 0)
                            return (
                              <div key={ship.id || si} style={{ marginTop: si > 0 ? sp[2] : 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp[1] }}>
                                  <span style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{ship.product_name || ship.description || 'Envoi'}</span>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, marginRight: '4px' }}>ETA</span>
                                    <span style={{ fontSize: size.sm, fontWeight: 600, color: c.gold }}>{ship.eta ? new Date(ship.eta).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</span>
                                  </div>
                                </div>
                                {/* Mini timeline */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                  {shipSteps.map((step, sti) => (
                                    <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                      <div style={{
                                        width: 22, height: 22,
                                        background: sti <= curStep ? c.teal : c.bgElevated,
                                        border: `2px solid ${sti <= curStep ? c.teal : c.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', color: sti <= curStep ? c.black : c.textTertiary,
                                        fontWeight: 700, zIndex: 1,
                                        boxShadow: sti === curStep ? `0 0 8px ${c.teal}33` : 'none',
                                      }}>{sti < curStep ? '✓' : step.icon}</div>
                                      <div style={{ fontSize: '7px', color: sti <= curStep ? c.teal : c.textTertiary, marginTop: '4px', textAlign: 'center', fontFamily: f.mono }}>{step.label}</div>
                                      {sti < shipSteps.length - 1 && (
                                        <div style={{ position: 'absolute', top: 11, left: '60%', width: '80%', height: 2, background: sti < curStep ? c.teal : c.border, zIndex: 0 }} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {ship.tracking_number && (
                                  <div style={{ marginTop: sp[1], fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>
                                    N° {ship.tracking_number}
                                  </div>
                                )}
                              </div>
                            )
                          }) : (
                            <div style={{ fontSize: size.sm, color: c.textSecondary, fontStyle: 'italic' }}>
                              Commande en phase d'expédition — aucun envoi enregistré pour le moment.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* ─── LINKED STOCK ─── */}
                  {(() => {
                    const productName = selectedOrder.product?.toLowerCase() || ''
                    const matchedStock = inventory.filter(i =>
                      i.product_name?.toLowerCase().includes(productName) ||
                      productName.includes(i.product_name?.toLowerCase() || '')
                    )
                    if (matchedStock.length === 0) return null
                    return (
                      <div style={{ padding: `0 ${sp[4]} ${sp[2]}` }}>
                        <div style={{
                          background: `${c.purple}08`, border: `1px solid ${c.purple}22`,
                          padding: sp[3],
                        }}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: sp[2],
                          }}>
                            <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.purple, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              📦 Stock lié
                            </div>
                            <button onClick={() => setViewMode('stock')} style={{
                              background: 'none', border: `1px solid ${c.purple}33`, padding: '2px 8px',
                              fontFamily: f.mono, fontSize: '8px', color: c.purple, cursor: 'pointer',
                              letterSpacing: '0.04em', textTransform: 'uppercase',
                              transition: `opacity 0.2s ${ease.smooth}`,
                            }}
                              onMouseOver={e => { e.currentTarget.style.opacity = '0.7' }}
                              onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                            >Voir stock →</button>
                          </div>
                          {matchedStock.map((item, ii) => {
                            const isLow = (item.quantity || 0) <= (item.alert_threshold || 10)
                            return (
                              <div key={item.id || ii} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: `${sp[1]} 0`,
                                borderTop: ii > 0 ? `1px solid ${c.purple}15` : 'none',
                              }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: size.sm, color: c.text }}>{item.product_name}</div>
                                  <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary }}>{item.warehouse || 'Yiwu'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                                  <span style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: isLow ? c.red : c.text }}>
                                    {(item.quantity || 0).toLocaleString('fr-FR')} u.
                                  </span>
                                  <span style={{
                                    padding: '2px 8px', fontSize: '8px', fontFamily: f.mono, fontWeight: 700,
                                    background: isLow ? c.redSoft : c.greenSoft,
                                    color: isLow ? c.red : c.green,
                                    letterSpacing: '0.04em', textTransform: 'uppercase',
                                  }}>{isLow ? 'Stock bas' : 'OK'}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* WhatsApp CTA */}
                  <div style={{ padding: `0 ${sp[4]} ${sp[2]}` }}>
                    <a
                      href={`https://wa.me/8613800000000?text=${encodeURIComponent(`Bonjour CARAXES, je vous contacte au sujet de ma commande ${selectedOrder.ref} (${selectedOrder.product}).`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: `6px ${sp[2]}`, fontSize: '10px', fontFamily: f.mono,
                        letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
                        color: '#25D366', border: `1px solid #25D36633`,
                        background: '#25D36608', textDecoration: 'none',
                        transition: `all 0.2s ${ease.smooth}`, cursor: 'pointer',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#25D36618'; e.currentTarget.style.borderColor = '#25D36666' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#25D36608'; e.currentTarget.style.borderColor = '#25D36633' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Contacter sur WhatsApp
                    </a>
                  </div>

                  </div>{/* END scrollable order metadata zone */}

                  {/* Tabs */}
                  <div style={{
                    display: 'flex', padding: `0 ${sp[4]}`,
                    borderBottom: `1px solid ${c.border}`, gap: sp[4],
                    flexShrink: 0,
                  }}>
                    {['messages', 'documents'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: `${sp[2]} 0`, background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: size.sm,
                        fontWeight: activeTab === tab ? 700 : 400,
                        color: activeTab === tab ? c.red : c.textSecondary,
                        borderBottom: `2px solid ${activeTab === tab ? c.red : 'transparent'}`,
                        transition: `all 0.2s ${ease.smooth}`,
                        fontFamily: activeTab === tab ? f.mono : f.body,
                        letterSpacing: activeTab === tab ? '0.04em' : '0.01em',
                        textTransform: activeTab === tab ? 'uppercase' : 'capitalize',
                      }}
                        onMouseOver={(e) => { if (activeTab !== tab) e.target.style.color = c.text }}
                        onMouseOut={(e) => { if (activeTab !== tab) e.target.style.color = c.textSecondary }}
                      >{tab === 'messages' ? 'Messages' : 'Documents'}</button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 220 }}>
                    {activeTab === 'messages' ? (
                      <>
                        <div style={{
                          flex: 1, overflowY: 'auto', padding: sp[4],
                          display: 'flex', flexDirection: 'column',
                        }}>
                          {messages.length === 0 ? (
                            <DragonEmptyState
                              text="Aucun message"
                              sub="Démarrez la conversation avec votre agent"
                            />
                          ) : (
                            messages.map((msg, idx) => {
                              const msgDate = new Date(msg.created_at).toDateString()
                              const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at).toDateString() : null
                              const showDate = idx === 0 || msgDate !== prevDate
                              return (
                                <div key={msg.id}>
                                  {showDate && <DateSeparator date={msg.created_at} />}
                                  <ChatBubble msg={msg} />
                                </div>
                              )
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div style={{
                          padding: `${sp[2]} ${sp[4]}`,
                          borderTop: `1px solid ${c.border}`, background: c.bgSurface,
                        }}>
                          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: sp[2] }}>
                            <input type="text" value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Votre message..."
                              style={{
                                flex: 1, padding: `12px ${sp[2]}`,
                                background: c.bgElevated, border: `1px solid ${c.border}`,
                                color: c.text, fontSize: size.sm, fontFamily: f.body,
                                outline: 'none', boxSizing: 'border-box',
                                transition: `border-color 0.2s ${ease.smooth}`,
                              }}
                              onFocus={(e) => e.target.style.borderColor = c.gold}
                              onBlur={(e) => e.target.style.borderColor = c.border}
                            />
                            <button type="submit" disabled={!newMessage.trim()} style={{
                              padding: `12px ${sp[2]}`,
                              background: newMessage.trim() ? c.red : c.bgHover,
                              border: 'none', color: c.white,
                              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.smooth}`,
                            }}
                              onMouseOver={(e) => { if (newMessage.trim()) e.currentTarget.style.background = c.redDeep }}
                              onMouseOut={(e) => { if (newMessage.trim()) e.currentTarget.style.background = c.red }}
                            >
                              <Icon d={icons.send} size={14} color="currentColor" />
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
                          {documents.length === 0 ? (
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              height: '100%', flexDirection: 'column',
                            }}>
                              <div style={{
                                width: 80, height: 80, border: `2px dashed ${c.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: sp[2], cursor: 'pointer',
                                transition: `all 0.2s ${ease.smooth}`,
                              }}
                                onClick={handleUploadClick}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = c.gold
                                  e.currentTarget.style.background = c.goldSoft
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = c.border
                                  e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                <Icon d={icons.upload} size={28} color={c.textTertiary} />
                              </div>
                              <p style={{ color: c.text, fontSize: size.sm, fontWeight: 600, marginBottom: sp[1], margin: `0 0 ${sp[1]} 0` }}>
                                Ajouter des documents
                              </p>
                              <p style={{ color: c.textTertiary, fontSize: size.xs, margin: 0 }}>
                                Images, PDF, Word, Excel
                              </p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
                              {documents.map(doc => (
                                <DocumentCard key={doc.id} doc={doc}
                                  onDownload={() => handleDownloadDocument(doc)}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{
                          padding: `${sp[2]} ${sp[4]}`,
                          borderTop: `1px solid ${c.border}`, background: c.bgSurface,
                        }}>
                          <button onClick={handleUploadClick} style={{
                            width: '100%', padding: '12px',
                            background: c.bgElevated, border: `1px dashed ${c.border}`,
                            color: c.textSecondary, cursor: 'pointer', fontFamily: f.body,
                            fontSize: size.sm, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: sp[1],
                            transition: `all 0.2s ${ease.smooth}`,
                          }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}
                          >
                            <Icon d={icons.clip} size={14} color="currentColor" />
                            Ajouter un fichier
                          </button>
                          <input ref={uploadInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', textAlign: 'center', padding: sp[4],
                }}>
                  <DragonEmptyState
                    text={orders.length === 0 ? 'Bienvenue sur CARAXES' : 'Sélectionnez une commande'}
                    sub={orders.length === 0 ? 'Commencez par explorer le catalogue ou créez votre première demande' : 'Choisissez une commande dans la liste pour voir les détails'}
                  />
                  {orders.length === 0 && (
                    <div style={{ display: 'flex', gap: sp[2], marginTop: sp[3] }}>
                      <button onClick={() => setViewMode('catalogue')} style={{
                        padding: `10px ${sp[3]}`, background: c.gold, border: 'none',
                        color: c.bg, fontSize: size.xs, fontFamily: f.mono, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                        transition: `all 0.2s ${ease.smooth}`,
                      }}
                        onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85' }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                      >Explorer le catalogue</button>
                      <button onClick={() => setIsNewOrderOpen(true)} style={{
                        padding: `10px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.red}`,
                        color: c.red, fontSize: size.xs, fontFamily: f.mono, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                        transition: `all 0.2s ${ease.smooth}`,
                      }}
                        onMouseOver={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.color = c.white }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.red }}
                      >Nouvelle demande</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <NewOrderModal isOpen={isNewOrderOpen} onClose={() => { setIsNewOrderOpen(false); setPrefilledProduct('') }} onSubmit={handleCreateOrder} initialProduct={prefilledProduct} />
      <EcomOrderModal isOpen={isEcomOrderOpen} onClose={() => setIsEcomOrderOpen(false)} onSubmit={handleEcomOrder} submitting={submittingEcom} />
    </div>
  )
}
