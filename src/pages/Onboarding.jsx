import { useState } from 'react'
import { c, f, size, sp, shadow, ease, transition } from '../lib/theme'
import { TIERS, DEFAULT_TIER, getTierByKey } from '../lib/clientTiers'
import { getCatalog } from '../lib/catalogsByProfile'
import { updateProfile, sendWelcomeMessage } from '../lib/supabase'
import { useToast } from '../components/Toast'

/* ── KEYFRAMES — premium ── */
const keyframes = `
@keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
@keyframes pulseGold { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }
@keyframes dragonFloat { 0%,100% { transform:translateY(0) rotate(0deg) } 50% { transform:translateY(-8px) rotate(1deg) } }
@keyframes stepReveal { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
@keyframes goldShimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }

.onboarding-nav-bar { position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important; z-index: 100 !important; padding: 14px 24px !important; background: rgba(15,12,10,0.95) !important; backdrop-filter: blur(12px) !important; border-top: 1px solid rgba(255,255,255,0.06) !important; }
@media (max-width: 768px) {
  .onboarding-container { max-width: 100% !important; }
  .onboarding-tier-grid { grid-template-columns: 1fr !important; }
  .onboarding-catalog-grid { grid-template-columns: 1fr !important; }
  .onboarding-contact-row { grid-template-columns: 1fr !important; }
  .onboarding-nav-bar { padding: 12px 16px !important; }
}
`

const STEPS = ['Bienvenue', 'Profil', 'Catalogue', 'Coordonnées']

/* ── ART DECO DIVIDER ── */
const ArtDecoDivider = ({ width = 80, center = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: `${width}px`, margin: center ? `${sp[2]} auto` : `${sp[2]} 0` }}>
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${c.gold})` }} />
    <div style={{ width: 5, height: 5, background: c.gold, transform: 'rotate(45deg)', opacity: 0.6, flexShrink: 0 }} />
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${c.gold})` }} />
  </div>
)

/* ── DRAGON ILLUSTRATION ── */
const DragonWelcome = () => (
  <div style={{ animation: 'dragonFloat 3s ease-in-out infinite', margin: '0 auto', width: 'fit-content' }}>
    <svg width="56" height="56" viewBox="0 0 120 120" fill="none">
      <path d="M60 15L75 35Q80 42 75 55Q70 65 60 70Q50 65 45 55Q40 42 55 35L60 15Z" fill={c.red} opacity="0.7"/>
      <path d="M50 45Q45 50 45 60Q45 75 60 85Q75 75 75 60Q75 50 70 45" fill={c.gold} opacity="0.35"/>
      <circle cx="55" cy="55" r="2.5" fill={c.gold} opacity="0.8"/>
      <circle cx="65" cy="55" r="2.5" fill={c.gold} opacity="0.8"/>
      <path d="M40 70Q30 75 25 90M80 70Q90 75 95 90" stroke={c.gold} strokeWidth="1.5" opacity="0.4"/>
      <path d="M60 85Q55 95 60 110M60 85Q65 95 60 110" stroke={c.red} strokeWidth="2" opacity="0.5"/>
    </svg>
  </div>
)

const focusGlow = `0 0 0 3px ${c.redSoft}`

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

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])
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
      sendWelcomeMessage(user.id).catch(() => {})
      onComplete()
    } catch (err) {
      toast.error('Erreur lors de la finalisation. Réessayez.')
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: `${sp[2]} ${sp[2]}`,
    fontSize: size.sm, fontFamily: f.body,
    background: c.bgSurface, border: `1px solid ${c.border}`,
    color: c.text, boxSizing: 'border-box',
    transition: `all 0.2s ${ease.smooth}`, outline: 'none',
  }

  return (
    <div className="onboarding-root" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: c.bg, overflowY: 'auto', overflowX: 'hidden',
      fontFamily: f.body, color: c.text,
      WebkitOverflowScrolling: 'touch',
    }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: `${sp[4]} ${sp[4]} 100px`,
      minHeight: '100%', boxSizing: 'border-box', width: '100%',
    }}>
      <style>{keyframes}</style>

      <div className="onboarding-container" style={{
        width: '100%',
        maxWidth: step === 2 ? 860 : step === 1 ? 800 : 500,
        transition: `max-width 0.4s ${ease.out}`,
        boxSizing: 'border-box',
      }}>

        {/* ── LOGO ── */}
        <div style={{ textAlign: 'center', marginBottom: sp[2], animation: 'fadeSlideIn 0.5s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.95"/>
              <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.95"/>
              <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.95"/>
            </svg>
            <span style={{ fontSize: size.lg, fontFamily: f.display, color: c.gold, letterSpacing: '0.08em', fontWeight: 700 }}>
              CARAXES
            </span>
          </div>
          <div style={{ width: 40, height: 2, background: c.red, margin: '0 auto' }} />
        </div>

        {/* ── PROGRESS ── */}
        <div style={{ marginBottom: sp[2], animation: 'fadeSlideIn 0.5s ease-out 0.1s both' }}>
          <div style={{ display: 'flex', gap: '3px', padding: '0 15%', marginBottom: sp[1] }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, position: 'relative', overflow: 'hidden',
                background: c.border,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: i < step ? c.red : i === step ? c.gold : 'transparent',
                  transition: `all 0.4s ${ease.out}`,
                  transformOrigin: 'left',
                  transform: i <= step ? 'scaleX(1)' : 'scaleX(0)',
                }} />
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'center', fontSize: '10px', fontFamily: f.mono,
            color: c.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {step + 1}/{STEPS.length} — {STEPS[step]}
          </div>
        </div>

        {/* ════════ STEP 0 — Welcome ════════ */}
        {step === 0 && (
          <div style={{ textAlign: 'center', animation: 'fadeSlideIn 0.5s ease-out 0.15s both' }}>
            <DragonWelcome />
            <h1 style={{
              fontFamily: f.display, fontSize: size.xl, fontWeight: 700,
              margin: 0, marginBottom: '4px', letterSpacing: '-0.01em', marginTop: sp[2],
            }}>
              Bienvenue chez CARAXES
            </h1>
            <ArtDecoDivider width={80} />
            <p style={{
              fontSize: size.xs, color: c.textSecondary, lineHeight: 1.6,
              maxWidth: 340, margin: `${sp[1]} auto ${sp[3]}`,
            }}>
              Votre agent de sourcing en Chine. En 2 minutes, on configure votre compte.
            </p>
            <div style={{ display: 'flex', gap: sp[2], justifyContent: 'center', fontSize: '9px', fontFamily: f.mono, color: c.textTertiary, letterSpacing: '0.04em', marginBottom: sp[3] }}>
              <span>Yiwu</span><span style={{ color: c.gold }}>·</span>
              <span>Guangzhou</span><span style={{ color: c.gold }}>·</span>
              <span>Shenzhen</span>
            </div>
            <button onClick={() => setStep(1)} style={btnPrimary}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
              onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
              Commencer
            </button>
          </div>
        )}

        {/* ════════ STEP 1 — Profile ════════ */}
        {step === 1 && (
          <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
            <h2 style={headingStyle}>Quel est votre profil ?</h2>
            <ArtDecoDivider width={80} />
            <p style={subStyle}>
              Votre profil détermine votre catalogue, vos prix et vos quantités minimales.
            </p>

            <div className="onboarding-tier-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: sp[3] }}>
              {TIERS.map((tier, i) => {
                const isSelected = selectedTier === tier.key
                return (
                  <div key={tier.key}
                    onClick={() => { setSelectedTier(tier.key); setSelectedCategories([]) }}
                    style={{
                      padding: sp[2], background: isSelected ? c.bgElevated : c.bgSurface,
                      border: `2px solid ${isSelected ? tier.color : c.border}`,
                      cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                      position: 'relative', overflow: 'hidden',
                      animation: `stepReveal 0.5s ${ease.out} ${i * 100}ms both`,
                      boxShadow: isSelected ? `0 4px 20px ${tier.color}15` : shadow.card,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = tier.color + '66'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = shadow.cardHover } }}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadow.card } }}>
                    {/* Top accent */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: isSelected ? 3 : 0, background: tier.color,
                      transition: `height 0.2s ${ease.smooth}`,
                    }} />

                    <div style={{ textAlign: 'center', marginBottom: sp[1] }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{tier.icon}</div>
                      <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: isSelected ? tier.color : c.text }}>{tier.label}</div>
                      <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: '2px' }}>{tier.tagline}</div>
                    </div>

                    <p style={{ fontSize: '11px', color: c.textSecondary, lineHeight: 1.5, marginBottom: sp[1], textAlign: 'center' }}>
                      {tier.description}
                    </p>

                    {/* Stats */}
                    <div style={{ padding: sp[2], background: c.bg, border: `1px solid ${c.borderSubtle}`, marginBottom: sp[2], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[1] }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={statLabelStyle}>Commande min.</div>
                        <div style={{ fontSize: size.sm, fontWeight: 700, color: tier.color }}>{tier.minOrderValue.toLocaleString('fr-FR')}€</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={statLabelStyle}>Priorité</div>
                        <div style={{ fontSize: size.sm, fontWeight: 700, color: tier.color }}>{tier.priorityLabel}</div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.8 }}>
                      {tier.benefits.map((b, j) => (
                        <div key={j} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: tier.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    {isSelected && (
                      <div style={{
                        marginTop: sp[2], padding: '5px 0', background: tier.colorSoft,
                        textAlign: 'center', fontSize: '10px', fontWeight: 700,
                        color: tier.color, fontFamily: f.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
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

        {/* ════════ STEP 2 — Catalog ════════ */}
        {step === 2 && (
          <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
            <h2 style={headingStyle}>
              Catalogue <span style={{ color: currentTier.color }}>{currentTier.label}</span>
            </h2>
            <ArtDecoDivider width={80} />
            <p style={subStyle}>
              Sélectionnez les catégories qui vous intéressent.
            </p>

            <div className="onboarding-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: sp[2] }}>
              {catalog.map((cat, i) => {
                const isSelected = selectedCategories.includes(cat.id)
                return (
                  <div key={cat.id} onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding: sp[2], background: isSelected ? c.bgElevated : c.bgSurface,
                      border: `1.5px solid ${isSelected ? currentTier.color : c.border}`,
                      cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                      position: 'relative', overflow: 'hidden',
                      animation: `fadeSlideIn 0.3s ease-out ${i * 40}ms both`,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = currentTier.color + '44' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = c.border }}>
                    {/* Check */}
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      width: 20, height: 20,
                      border: `2px solid ${isSelected ? currentTier.color : c.border}`,
                      background: isSelected ? currentTier.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: `all 0.15s ${ease.smooth}`,
                    }}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c.bg} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </div>

                    {/* Header */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: sp[1] }}>
                      <span style={{ fontSize: '22px' }}>{cat.icon}</span>
                      <span style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, color: isSelected ? currentTier.color : c.text }}>{cat.name}</span>
                    </div>

                    <p style={{ fontSize: size.xs, color: c.textSecondary, lineHeight: 1.5, margin: 0, marginBottom: sp[2] }}>{cat.description}</p>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: sp[2], padding: `${sp[1]} 0`, borderTop: `1px solid ${c.borderSubtle}` }}>
                      <div>
                        <div style={miniLabelStyle}>Prix Chine</div>
                        <div style={{ fontSize: size.xs, fontWeight: 600, color: c.green }}>{cat.priceRange}</div>
                      </div>
                      <div>
                        <div style={miniLabelStyle}>Marge</div>
                        <div style={{ fontSize: size.xs, fontWeight: 600, color: c.gold }}>{cat.margin}</div>
                      </div>
                      <div>
                        <div style={miniLabelStyle}>MOQ</div>
                        <div style={{ fontSize: size.xs, fontWeight: 600, color: c.textSecondary }}>{cat.moq} pcs</div>
                      </div>
                    </div>

                    {/* Top products */}
                    <div style={{ marginTop: sp[1], paddingTop: sp[1], borderTop: `1px solid ${c.borderSubtle}` }}>
                      <div style={miniLabelStyle}>Produits phares</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {cat.topProducts.slice(0, 3).map((p, j) => (
                          <span key={j} style={{
                            fontSize: '9px', padding: '2px 6px',
                            background: c.bg, border: `1px solid ${c.borderSubtle}`,
                            color: c.textTertiary, fontFamily: f.mono,
                          }}>{p}</span>
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
              fontSize: size.xs, color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.02em',
            }}>
              {selectedCategories.length === 0
                ? 'Aucune catégorie sélectionnée (vous pourrez en ajouter plus tard)'
                : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''} sélectionnée${selectedCategories.length > 1 ? 's' : ''}`
              }
            </div>

            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {/* ════════ STEP 3 — Contact ════════ */}
        {step === 3 && (
          <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
            <h2 style={headingStyle}>Vos coordonnées</h2>
            <ArtDecoDivider width={80} />
            <p style={subStyle}>
              Profil <span style={{ color: currentTier.color, fontWeight: 600 }}>{currentTier.label}</span> — plus qu’une étape.
            </p>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: sp[3],
              background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[3],
              boxSizing: 'border-box',
            }}>
              <FieldGroup label="Nom complet *">
                <input type="text" placeholder="Votre nom" value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </FieldGroup>

              <FieldGroup label="Entreprise / Commerce">
                <input type="text" placeholder="Nom de votre entreprise" value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </FieldGroup>

              <div className="onboarding-contact-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3] }}>
                <FieldGroup label="Téléphone">
                  <input type="tel" placeholder="+33 6 00 00 00 00" value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </FieldGroup>
                <FieldGroup label="Ville">
                  <input type="text" placeholder="Paris, Lyon, Marseille..." value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </FieldGroup>
              </div>

              {selectedTier === 'ecommerce' ? (
                <FieldGroup label="URL boutique en ligne">
                  <input type="url" placeholder="https://votre-shop.com" value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </FieldGroup>
              ) : (
                <FieldGroup label="Adresse de livraison">
                  <input type="text" placeholder="Adresse de livraison (optionnel)" value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </FieldGroup>
              )}
            </div>

            {/* Recap */}
            <div style={{
              marginTop: sp[3], padding: sp[3],
              background: c.bgSurface, border: `1px solid ${c.border}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: currentTier.color, opacity: 0.5 }} />
              <div style={{
                fontSize: '10px', fontFamily: f.mono, color: c.textTertiary,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp[2],
              }}>
                Récapitulatif
              </div>
              <div style={{ display: 'flex', gap: sp[3], flexWrap: 'wrap' }}>
                <RecapItem label="Profil" value={currentTier.label} color={currentTier.color} icon={currentTier.icon} />
                <RecapItem label="Commande min." value={`${currentTier.minOrderValue.toLocaleString('fr-FR')}€`} color={currentTier.color} />
                <RecapItem label="Catégories" value={selectedCategories.length > 0 ? `${selectedCategories.length} sélectionnées` : 'Toutes'} color={c.textSecondary} />
              </div>
            </div>

            <div className="onboarding-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', marginTop: sp[3] }}>
              <button onClick={() => setStep(2)} style={btnSecondary}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
                Retour
              </button>
              <button onClick={handleFinish}
                disabled={!formData.full_name.trim() || saving}
                style={{
                  ...btnPrimary, background: c.gold, borderColor: c.gold, color: c.black,
                  opacity: !formData.full_name.trim() ? 0.5 : 1,
                  cursor: saving ? 'wait' : 'pointer',
                }}
                onMouseEnter={(e) => { if (formData.full_name.trim()) { e.currentTarget.style.background = c.goldDim } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.gold }}>
                {saving ? 'Enregistrement...' : 'Terminer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

/* ── SHARED COMPONENTS ── */

function NavButtons({ onBack, onNext, nextLabel = 'Continuer' }) {
  return (
    <div className="onboarding-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', marginTop: sp[3] }}>
      <button onClick={onBack} style={btnSecondary}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
        Retour
      </button>
      <button onClick={onNext} style={btnPrimary}
        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
        onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
        {nextLabel}
      </button>
    </div>
  )
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '10px', fontWeight: 600,
        color: c.textTertiary, marginBottom: '6px', fontFamily: f.mono,
        letterSpacing: '0.08em', textTransform: 'uppercase',
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
      <div style={{ fontSize: '9px', fontFamily: f.mono, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: size.sm, fontWeight: 600, color }}>
        {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
        {value}
      </div>
    </div>
  )
}

/* ── SHARED STYLES ── */

const headingStyle = {
  fontFamily: f.display, fontSize: size.lg, fontWeight: 700,
  margin: 0, marginBottom: '4px', textAlign: 'center', letterSpacing: '-0.01em',
}

const subStyle = {
  fontSize: size.xs, color: c.textSecondary, textAlign: 'center',
  marginBottom: sp[3], lineHeight: 1.5,
}

const statLabelStyle = {
  fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px',
}

const miniLabelStyle = {
  fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const btnPrimary = {
  padding: `${sp[2]} ${sp[4]}`, background: c.red,
  border: `1px solid ${c.red}`, color: c.white,
  fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
  fontFamily: f.body, letterSpacing: '0.02em',
  transition: `all 0.3s ${ease.out}`,
}

const btnSecondary = {
  padding: `${sp[2]} ${sp[3]}`, background: 'transparent',
  border: `1px solid ${c.border}`, color: c.textSecondary,
  fontSize: size.sm, cursor: 'pointer', fontFamily: f.body,
  fontWeight: 600, transition: `all 0.2s ${ease.smooth}`,
}
