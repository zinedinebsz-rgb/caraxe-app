import { useState } from 'react'
import { c, f, size, sp, ease } from '../lib/theme'
import { TIERS, DEFAULT_TIER, getTierByKey } from '../lib/clientTiers'
import { getCatalog } from '../lib/catalogsByProfile'
import { updateProfile } from '../lib/supabase'
import { useToast } from '../components/Toast'

/* ─── STEP LABELS ─── */
const STEPS = ['Bienvenue', 'Profil', 'Catalogue', 'Coordonnées']

export default function Onboarding({ user, profile, onComplete }) {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [selectedTier, setSelectedTier] = useState(DEFAULT_TIER)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    company: '',
    phone: '',
    city: '',
    address: '',
    website: '',
  })
  const [saving, setSaving] = useState(false)

  const currentTier = getTierByKey(selectedTier)
  const catalog = getCatalog(selectedTier)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    )
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await updateProfile(user.id, {
        ...formData,
        client_tier: selectedTier,
        preferred_categories: selectedCategories,
        onboarding_done: true,
      })
      toast.success('Bienvenue chez CARAXES !')
      onComplete()
    } catch (err) {
      toast.error('Erreur lors de la finalisation. Réessayez.')
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: `${sp[2]} ${sp[2]}`,
    fontSize: size.sm,
    fontFamily: f.body,
    background: c.bgSurface,
    border: `1px solid ${c.border}`,
    color: c.text,
    boxSizing: 'border-box',
    transition: `border 0.15s ${ease.smooth}`,
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: f.body,
      color: c.text,
      padding: sp[4],
    }}>
      <div style={{
        width: '100%',
        maxWidth: step === 2 ? 840 : step === 1 ? 780 : 480,
        transition: `max-width 0.3s ${ease.smooth}`,
      }}>
        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: sp[3] }}>
          <div style={{
            fontSize: size['2xl'],
            fontFamily: f.display,
            color: c.gold,
            letterSpacing: '0.06em',
            fontWeight: 700,
            marginBottom: sp[1],
          }}>
            ◆ CARAXES
          </div>
          <div style={{
            width: 60, height: 3, background: c.red, margin: '0 auto',
          }} />
        </div>

        {/* ── Progress bar ── */}
        <div style={{ marginBottom: sp[4] }}>
          <div style={{
            display: 'flex', gap: '3px',
            padding: '0 15%',
            marginBottom: sp[1],
          }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3,
                background: i <= step ? c.red : c.border,
                transition: `background 0.3s ${ease.smooth}`,
              }} />
            ))}
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: size.xs,
            fontFamily: f.mono,
            color: c.textTertiary,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {step + 1}/{STEPS.length} — {STEPS[step]}
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* STEP 0 — Welcome                        */}
        {/* ═══════════════════════════════════════ */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: sp[3] }}>🐉</div>
            <h1 style={{
              fontFamily: f.display, fontSize: size['2xl'], fontWeight: 700,
              margin: 0, marginBottom: sp[2], letterSpacing: '-0.01em',
            }}>
              Bienvenue chez CARAXES
            </h1>
            <p style={{
              fontSize: size.sm, color: c.textSecondary, lineHeight: 1.7,
              maxWidth: 380, margin: '0 auto', marginBottom: sp[4],
            }}>
              Votre agent de sourcing en Chine. En 2 minutes, on configure votre compte pour vous proposer les bons produits, aux bons prix.
            </p>
            <button
              onClick={() => setStep(1)}
              style={btnPrimary}
            >
              Commencer
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STEP 1 — Choose Profile                 */}
        {/* ═══════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <h2 style={headingStyle}>Quel est votre profil ?</h2>
            <p style={subStyle}>
              Votre profil détermine votre catalogue, vos prix et vos quantités minimales.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: sp[3],
            }}>
              {TIERS.map(tier => {
                const isSelected = selectedTier === tier.key
                return (
                  <div
                    key={tier.key}
                    onClick={() => {
                      setSelectedTier(tier.key)
                      setSelectedCategories([]) // reset categories on tier change
                    }}
                    style={{
                      padding: sp[3],
                      background: isSelected ? c.bgElevated : c.bgSurface,
                      border: `2px solid ${isSelected ? tier.color : c.border}`,
                      cursor: 'pointer',
                      transition: `all 0.2s ${ease.smooth}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Top accent line */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: isSelected ? 4 : 0, background: tier.color,
                      transition: `height 0.2s ${ease.smooth}`,
                    }} />

                    <div style={{ textAlign: 'center', marginBottom: sp[2] }}>
                      <div style={{ fontSize: '36px', marginBottom: sp[1] }}>{tier.icon}</div>
                      <div style={{
                        fontFamily: f.display, fontSize: size.md, fontWeight: 700,
                        color: isSelected ? tier.color : c.text,
                      }}>
                        {tier.label}
                      </div>
                      <div style={{
                        fontSize: size.xs, color: c.textTertiary, marginTop: '4px',
                      }}>
                        {tier.tagline}
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: size.xs, color: c.textSecondary,
                      lineHeight: 1.6, marginBottom: sp[2], textAlign: 'center',
                    }}>
                      {tier.description}
                    </p>

                    {/* Key stats */}
                    <div style={{
                      padding: sp[2], background: c.bg,
                      border: `1px solid ${c.borderSubtle}`,
                      marginBottom: sp[2],
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[1],
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={statLabelStyle}>Commande min.</div>
                        <div style={{ ...statValueStyle, color: tier.color }}>
                          {tier.minOrderValue.toLocaleString('fr-FR')}€
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={statLabelStyle}>Priorité</div>
                        <div style={{ ...statValueStyle, color: tier.color }}>
                          {tier.priorityLabel}
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.8 }}>
                      {tier.benefits.map((b, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: tier.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <div style={{
                        marginTop: sp[2], padding: `4px ${sp[2]}`,
                        background: tier.colorSoft, border: `1px solid ${tier.color}33`,
                        textAlign: 'center', fontSize: size.xs, fontWeight: 600,
                        color: tier.color, fontFamily: f.mono,
                      }}>
                        Sélectionné
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STEP 2 — Catalog Preview                */}
        {/* ═══════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <h2 style={headingStyle}>
              Catalogue{' '}
              <span style={{ color: currentTier.color }}>{currentTier.label}</span>
            </h2>
            <p style={subStyle}>
              Sélectionnez les catégories qui vous intéressent. On adaptera vos recommandations en conséquence.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: sp[2],
            }}>
              {catalog.map(cat => {
                const isSelected = selectedCategories.includes(cat.id)
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding: sp[3],
                      background: isSelected ? c.bgElevated : c.bgSurface,
                      border: `1.5px solid ${isSelected ? currentTier.color : c.border}`,
                      cursor: 'pointer',
                      transition: `all 0.15s ${ease.smooth}`,
                      position: 'relative',
                    }}
                  >
                    {/* Selection check */}
                    <div style={{
                      position: 'absolute', top: sp[1], right: sp[1],
                      width: 22, height: 22,
                      border: `2px solid ${isSelected ? currentTier.color : c.border}`,
                      background: isSelected ? currentTier.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: `all 0.15s ${ease.smooth}`,
                    }}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.black} strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Header */}
                    <div style={{ display: 'flex', gap: sp[1], alignItems: 'center', marginBottom: sp[1] }}>
                      <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                      <span style={{
                        fontFamily: f.display, fontWeight: 700, fontSize: size.sm,
                        color: isSelected ? currentTier.color : c.text,
                      }}>
                        {cat.name}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5,
                      margin: 0, marginBottom: sp[2],
                    }}>
                      {cat.description}
                    </p>

                    {/* Stats row */}
                    <div style={{
                      display: 'flex', gap: sp[2],
                      padding: `${sp[1]} 0`,
                      borderTop: `1px solid ${c.borderSubtle}`,
                    }}>
                      <div>
                        <div style={miniLabelStyle}>Prix Chine</div>
                        <div style={{ fontSize: size.xs, fontWeight: 600, color: c.green }}>
                          {cat.priceRange}
                        </div>
                      </div>
                      <div>
                        <div style={miniLabelStyle}>Marge</div>
                        <div style={{ fontSize: size.xs, fontWeight: 600, color: c.gold }}>
                          {cat.margin}
                        </div>
                      </div>
                      <div>
                        <div style={miniLabelStyle}>MOQ</div>
                        <div style={{ fontSize: size.xs, fontWeight: 600, color: c.textSecondary }}>
                          {cat.moq} pcs
                        </div>
                      </div>
                    </div>

                    {/* Top products */}
                    <div style={{
                      marginTop: sp[1], paddingTop: sp[1],
                      borderTop: `1px solid ${c.borderSubtle}`,
                    }}>
                      <div style={miniLabelStyle}>Produits phares</div>
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px',
                      }}>
                        {cat.topProducts.slice(0, 3).map((p, i) => (
                          <span key={i} style={{
                            fontSize: '10px', padding: '2px 6px',
                            background: c.bg, border: `1px solid ${c.borderSubtle}`,
                            color: c.textTertiary, fontFamily: f.mono,
                          }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selection count */}
            <div style={{
              textAlign: 'center', marginTop: sp[3],
              fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono,
            }}>
              {selectedCategories.length === 0
                ? 'Aucune catégorie sélectionnée (vous pourrez en ajouter plus tard)'
                : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''} sélectionnée${selectedCategories.length > 1 ? 's' : ''}`
              }
            </div>

            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STEP 3 — Contact Info                   */}
        {/* ═══════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <h2 style={headingStyle}>Vos coordonnées</h2>
            <p style={subStyle}>
              On adapte tout à votre profil{' '}
              <span style={{ color: currentTier.color, fontWeight: 600 }}>{currentTier.label}</span>.
              Plus qu'une étape.
            </p>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: sp[3],
              background: c.bgSurface, border: `1px solid ${c.border}`,
              padding: sp[4],
            }}>
              <FieldGroup label="Nom complet *">
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = c.gold}
                  onBlur={(e) => e.target.style.borderColor = c.border}
                />
              </FieldGroup>

              <FieldGroup label="Entreprise / Commerce">
                <input
                  type="text"
                  placeholder="Nom de votre entreprise"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = c.gold}
                  onBlur={(e) => e.target.style.borderColor = c.border}
                />
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3] }}>
                <FieldGroup label="Téléphone">
                  <input
                    type="tel"
                    placeholder="+33 6 00 00 00 00"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = c.gold}
                    onBlur={(e) => e.target.style.borderColor = c.border}
                  />
                </FieldGroup>
                <FieldGroup label="Ville">
                  <input
                    type="text"
                    placeholder="Paris, Lyon, Marseille..."
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = c.gold}
                    onBlur={(e) => e.target.style.borderColor = c.border}
                  />
                </FieldGroup>
              </div>

              {selectedTier === 'ecommerce' ? (
                <FieldGroup label="URL boutique en ligne">
                  <input
                    type="url"
                    placeholder="https://votre-shop.com"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = c.gold}
                    onBlur={(e) => e.target.style.borderColor = c.border}
                  />
                </FieldGroup>
              ) : (
                <FieldGroup label="Adresse de livraison">
                  <input
                    type="text"
                    placeholder="Adresse de livraison (optionnel)"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = c.gold}
                    onBlur={(e) => e.target.style.borderColor = c.border}
                  />
                </FieldGroup>
              )}
            </div>

            {/* Recap */}
            <div style={{
              marginTop: sp[3], padding: sp[3],
              background: c.bgSurface, border: `1px solid ${c.border}`,
            }}>
              <div style={{
                fontSize: size.xs, fontFamily: f.mono, color: c.textTertiary,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: sp[1],
              }}>
                Récapitulatif
              </div>
              <div style={{ display: 'flex', gap: sp[3], flexWrap: 'wrap' }}>
                <RecapItem label="Profil" value={currentTier.label} color={currentTier.color} icon={currentTier.icon} />
                <RecapItem label="Commande min." value={`${currentTier.minOrderValue.toLocaleString('fr-FR')}€`} color={currentTier.color} />
                <RecapItem label="Catégories" value={selectedCategories.length > 0 ? `${selectedCategories.length} sélectionnées` : 'Toutes'} color={c.textSecondary} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: sp[4] }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>
                Retour
              </button>
              <button
                onClick={handleFinish}
                disabled={!formData.full_name.trim() || saving}
                style={{
                  ...btnPrimary,
                  background: c.gold,
                  borderColor: c.gold,
                  color: c.black,
                  opacity: !formData.full_name.trim() ? 0.5 : 1,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Enregistrement...' : 'Terminer la configuration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── SHARED COMPONENTS ─── */

function NavButtons({ onBack, onNext, nextLabel = 'Continuer' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: sp[4] }}>
      <button onClick={onBack} style={btnSecondary}>
        Retour
      </button>
      <button onClick={onNext} style={btnPrimary}>
        {nextLabel}
      </button>
    </div>
  )
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: size.xs, fontWeight: 600,
        color: c.textTertiary, marginBottom: sp[1], fontFamily: f.mono,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function RecapItem({ label, value, color, icon }) {
  return (
    <div style={{ flex: '1 1 120px' }}>
      <div style={{
        fontSize: '9px', fontFamily: f.mono, color: c.textTertiary,
        textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{ fontSize: size.sm, fontWeight: 600, color }}>
        {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
        {value}
      </div>
    </div>
  )
}

/* ─── SHARED STYLES ─── */

const headingStyle = {
  fontFamily: f.display, fontSize: size.xl, fontWeight: 700,
  margin: 0, marginBottom: sp[1], textAlign: 'center',
}

const subStyle = {
  fontSize: size.sm, color: c.textSecondary, textAlign: 'center',
  marginBottom: sp[4], lineHeight: 1.6,
}

const statLabelStyle = {
  fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
}

const statValueStyle = {
  fontSize: size.md, fontWeight: 700,
}

const miniLabelStyle = {
  fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const btnPrimary = {
  padding: `${sp[2]} ${sp[4]}`,
  background: c.red,
  border: `1px solid ${c.red}`,
  color: c.white,
  fontSize: size.sm,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: f.body,
  letterSpacing: '0.02em',
  transition: `all 0.15s ${ease.smooth}`,
}

const btnSecondary = {
  padding: `${sp[2]} ${sp[3]}`,
  background: c.bgSurface,
  border: `1px solid ${c.border}`,
  color: c.textSecondary,
  fontSize: size.sm,
  cursor: 'pointer',
  fontFamily: f.body,
}
