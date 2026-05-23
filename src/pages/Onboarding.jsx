import { useState, useRef, useCallback } from 'react'
import { c, f, size, sp, shadow, ease, radius, gradient } from '../lib/theme'
import { TIERS, DEFAULT_TIER, getTierByKey } from '../lib/clientTiers'
import { getCatalog } from '../lib/catalogsByProfile'
import { updateProfile } from '../lib/supabase'
import { useToast } from '../components/Toast'

/* ── KEYFRAMES ── */
const keyframes = `
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
@keyframes scaleReveal { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
@keyframes shimmer { from { background-position:-200% 0 } to { background-position:200% 0 } }
@keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) } }
@keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.7 } }
@keyframes checkPop { 0% { transform:scale(0) } 60% { transform:scale(1.2) } 100% { transform:scale(1) } }

.ob-root { position:fixed; inset:0; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
.ob-root::-webkit-scrollbar { width:4px }
.ob-root::-webkit-scrollbar-track { background:transparent }
.ob-root::-webkit-scrollbar-thumb { background:#2a2825; border-radius:2px }

.ob-tier-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:16px }
.ob-catalog-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px }
.ob-contact-row { display:grid; grid-template-columns:1fr 1fr; gap:20px }

@media (max-width: 768px) {
  .ob-tier-grid { grid-template-columns:1fr !important }
  .ob-catalog-grid { grid-template-columns:1fr !important }
  .ob-contact-row { grid-template-columns:1fr !important }
  .ob-container { padding:24px 16px 120px !important }
  .ob-welcome-title { font-size:clamp(1.4rem,4vw,1.8rem) !important }
}

@media (max-width: 480px) {
  .ob-tier-grid { gap:12px !important }
  .ob-catalog-grid { gap:10px !important }
}

.ob-input { width:100%; padding:14px 16px; font-size:14px; font-family:'DM Sans',sans-serif; background:${c.bgInput}; border:1px solid ${c.borderSubtle}; border-bottom:2px solid ${c.border}; border-radius:${radius.sm}; color:${c.text}; outline:none; transition:all 0.2s cubic-bezier(0.4,0,0.2,1); box-sizing:border-box; letter-spacing:0.01em }
.ob-input:focus { border-color:${c.borderSubtle}; border-bottom-color:${c.gold}; box-shadow:none }
.ob-input::placeholder { color:#59524a }

.ob-btn-primary { padding:14px 32px; background:#c43a2f; border:1px solid #c43a2f; border-radius:${radius.md}; color:#fdfcfa; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; letter-spacing:0.02em; transition:all 0.25s cubic-bezier(0.16,1,0.3,1) }
.ob-btn-primary:hover { background:#a33229; box-shadow:0 0 24px rgba(196, 58, 47, 0.15) }
.ob-btn-primary:active { transform:scale(0.98) }

.ob-btn-gold { padding:14px 32px; background:#c4a35a; border:1px solid #c4a35a; border-radius:${radius.md}; color:#0f0e0d; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; letter-spacing:0.02em; transition:all 0.25s cubic-bezier(0.16,1,0.3,1) }
.ob-btn-gold:hover { background:#ad8e4a; box-shadow:0 0 20px rgba(196, 163, 90, 0.12) }
.ob-btn-gold:active { transform:scale(0.98) }
.ob-btn-gold:disabled { opacity:0.4; cursor:not-allowed }

.ob-btn-secondary { padding:14px 24px; background:transparent; border:1px solid #2a2825; border-radius:${radius.md}; color:#7a7268; font-size:14px; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:500; transition:all 0.2s cubic-bezier(0.4,0,0.2,1) }
.ob-btn-secondary:hover { border-color:#6b614f; color:#ede6dc }

.ob-nav { position:fixed; bottom:0; left:0; right:0; z-index:100; padding:16px 24px; background:rgba(12, 11, 10, 0.92); backdrop-filter:blur(16px); border-top:1px solid rgba(42, 40, 37, 0.5); border-radius:${radius.xl} ${radius.xl} 0 0; display:flex; justify-content:space-between; align-items:center }
`

const STEPS = ['Bienvenue', 'Profil', 'Catalogue', 'Coordonnées']

/* ── Decorative line ── */
const Divider = ({ w = 64, my = '16px' }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, width:w, margin:`${my} auto` }}>
    <div style={{ flex:1, height:1, background:`linear-gradient(to right, transparent, ${c.gold})` }}/>
    <div style={{ width:4, height:4, background:c.gold, transform:'rotate(45deg)', opacity:0.5, flexShrink:0 }}/>
    <div style={{ flex:1, height:1, background:`linear-gradient(to left, transparent, ${c.gold})` }}/>
  </div>
)

/* ── Step indicator (editorial) ── */
const StepIndicator = ({ current, total }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:sp[3], animation:'fadeIn 0.4s ease-out' }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{
          width: i === current ? 28 : 8,
          height: 3,
          background: i < current ? c.red : i === current ? c.gold : c.border,
          transition: `all 0.4s ${ease.out}`,
        }}/>
      </div>
    ))}
    <span style={{
      marginLeft:8, fontSize:10, fontFamily:f.mono,
      color:c.textTertiary, letterSpacing:'0.1em',
    }}>
      {current + 1}/{total}
    </span>
  </div>
)

/* ── Logo mark ── */
const Logo = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, animation:'slideDown 0.5s ease-out' }}>
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.9"/>
      <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.9"/>
      <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.9"/>
    </svg>
    <span style={{
      fontSize:size.base, fontFamily:f.display, color:c.gold,
      letterSpacing:'0.1em', fontWeight:700,
    }}>CARAXES</span>
  </div>
)

export default function Onboarding({ user, profile, onComplete }) {
  const toast = useToast()
  const rootRef = useRef(null)
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
    monthly_volume: '',
    years_active: '',
    has_existing_suppliers: '',
  })
  const [saving, setSaving] = useState(false)
  const [stepDir, setStepDir] = useState('forward')

  const currentTier = getTierByKey(selectedTier)
  const catalog = getCatalog(selectedTier)

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId]
    )
  }

  const goTo = useCallback((next) => {
    setStepDir(next > step ? 'forward' : 'back')
    if (rootRef.current) rootRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    // Small delay so scroll starts before content swaps
    setTimeout(() => setStep(next), 80)
  }, [step])

  const handleFinish = async () => {
    setSaving(true)

    // Cascade of retries — each removes fields that may not exist in Supabase
    const attempts = [
      // 1) All fields
      { ...formData, client_tier: selectedTier, preferred_categories: selectedCategories, onboarding_done: true },
      // 2) Without preferred_categories + address/website
      { full_name: formData.full_name, company: formData.company, phone: formData.phone, city: formData.city, client_tier: selectedTier, onboarding_done: true },
      // 3) Without client_tier (CHECK constraint might block)
      { full_name: formData.full_name, company: formData.company, phone: formData.phone, onboarding_done: true },
      // 4) Absolute minimum — just name + onboarding flag
      { full_name: formData.full_name, onboarding_done: true },
      // 5) Just the name (onboarding_done column might not exist!)
      { full_name: formData.full_name || 'Client' },
    ]

    for (let i = 0; i < attempts.length; i++) {
      try {
        await updateProfile(user.id, attempts[i])
        toast.success('Bienvenue chez CARAXES !')
        onComplete()
        return
      } catch (err) {
        console.error(`Onboarding attempt ${i + 1}/${attempts.length} failed:`, err?.message || err)
        if (i === attempts.length - 1) {
          // All attempts failed — show the last error
          toast.error('Erreur : ' + (err?.message || 'Impossible de sauvegarder. Vérifiez la base de données.'))
          setSaving(false)
        }
      }
    }
  }

  const animKey = `step-${step}-${stepDir}`

  return (
    <div ref={rootRef} className="ob-root" style={{ background:c.bg, fontFamily:f.body, color:c.text }}>
      <style>{keyframes}</style>

      <div className="ob-container" style={{
        maxWidth: step === 2 ? 920 : step === 1 ? 860 : 540,
        margin:'0 auto', padding:'40px 24px 120px',
        transition:`max-width 0.5s ${ease.out}`,
      }}>

        {/* Logo + Progress */}
        <div style={{ marginBottom:sp[3] }}>
          <Logo />
          <div style={{ width:32, height:2, background:c.red, margin:'8px auto 20px', opacity:0.6 }}/>
          <StepIndicator current={step} total={STEPS.length} />
        </div>

        {/* ═══════ STEP 0 — Welcome ═══════ */}
        {step === 0 && (
          <div key={animKey} style={{ textAlign:'center', animation:'slideUp 0.5s ease-out both' }}>

            {/* Dragon illustration */}
            <div style={{ animation:'float 3s ease-in-out infinite', margin:'0 auto 20px' }}>
              <svg width="52" height="52" viewBox="0 0 120 120" fill="none">
                <path d="M60 15L75 35Q80 42 75 55Q70 65 60 70Q50 65 45 55Q40 42 55 35L60 15Z" fill={c.red} opacity="0.65"/>
                <path d="M50 45Q45 50 45 60Q45 75 60 85Q75 75 75 60Q75 50 70 45" fill={c.gold} opacity="0.3"/>
                <circle cx="55" cy="55" r="2.5" fill={c.gold} opacity="0.8"/>
                <circle cx="65" cy="55" r="2.5" fill={c.gold} opacity="0.8"/>
                <path d="M40 70Q30 75 25 90M80 70Q90 75 95 90" stroke={c.gold} strokeWidth="1.5" opacity="0.3"/>
                <path d="M60 85Q55 95 60 110M60 85Q65 95 60 110" stroke={c.red} strokeWidth="2" opacity="0.4"/>
              </svg>
            </div>

            <h1 className="ob-welcome-title" style={{
              fontFamily:f.display, fontSize:size.xl, fontWeight:700,
              margin:0, letterSpacing:'-0.01em', lineHeight:1.2,
            }}>
              Bienvenue chez CARAXES
            </h1>

            <Divider w={72} my="14px" />

            <p style={{
              fontSize:size.sm, color:c.textSecondary, lineHeight:1.7,
              maxWidth:380, margin:'0 auto', marginBottom:sp[3],
            }}>
              Votre agent de sourcing en Chine, sur le terrain.
              <br/>En 2 minutes, on configure votre espace.
            </p>

            {/* Location tags */}
            <div style={{
              display:'flex', gap:20, justifyContent:'center',
              fontSize:10, fontFamily:f.mono, color:c.textTertiary,
              letterSpacing:'0.06em', marginBottom:sp[4],
            }}>
              <span>YIWU</span>
              <span style={{ color:c.gold, opacity:0.4 }}>/</span>
              <span>GUANGZHOU</span>
              <span style={{ color:c.gold, opacity:0.4 }}>/</span>
              <span>SHENZHEN</span>
            </div>

            {/* Trust markers */}
            <div style={{
              display:'flex', justifyContent:'center', gap:sp[4],
              marginBottom:sp[4], animation:'fadeIn 0.6s ease-out 0.2s both',
            }}>
              {[
                { n: '500+', l: 'Fournisseurs' },
                { n: '3 ans', l: 'Sur le terrain' },
                { n: '100%', l: 'QC filme' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:size.md, fontWeight:700, color:c.gold, fontFamily:f.display }}>{s.n}</div>
                  <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.04em', marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <button className="ob-btn-primary" onClick={() => goTo(1)}>
              Configurer mon compte
            </button>
          </div>
        )}

        {/* ═══════ STEP 1 — Profile/Tier ═══════ */}
        {step === 1 && (
          <div key={animKey} style={{ animation:'slideUp 0.45s ease-out both' }}>

            <div style={{ textAlign:'center', marginBottom:sp[3] }}>
              <p style={{
                fontSize:10, fontFamily:f.mono, color:c.textTertiary,
                letterSpacing:'0.12em', textTransform:'uppercase', margin:0, marginBottom:6,
              }}>
                Etape 1
              </p>
              <h2 style={{
                fontFamily:f.display, fontSize:size.lg, fontWeight:700,
                margin:0, letterSpacing:'-0.01em',
              }}>
                Quel est votre profil ?
              </h2>
              <Divider w={64} my="12px" />
              <p style={{ fontSize:size.xs, color:c.textSecondary, lineHeight:1.6, margin:0 }}>
                Votre profil determine votre catalogue, vos prix et vos quantites minimales.
              </p>
            </div>

            <div className="ob-tier-grid">
              {TIERS.map((tier, i) => {
                const sel = selectedTier === tier.key
                return (
                  <div key={tier.key}
                    onClick={() => { setSelectedTier(tier.key); setSelectedCategories([]) }}
                    style={{
                      padding:0, background: sel ? c.bgElevated : gradient.card,
                      border:`1.5px solid ${sel ? tier.color : c.border}`,
                      borderRadius: radius.lg,
                      cursor:'pointer',
                      transition:`all 0.3s ${ease.luxury}`,
                      position:'relative', overflow:'hidden',
                      animation:`scaleReveal 0.4s ${ease.out} ${i * 80}ms both`,
                      boxShadow: sel ? `0 4px 24px ${tier.color}12` : shadow.card,
                    }}
                    onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = tier.color + '55'; e.currentTarget.style.transform = 'translateY(-2px)' }}}
                    onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'none' }}}>

                    {/* Top accent bar */}
                    <div style={{
                      height: sel ? 3 : 0, background: tier.color,
                      transition:`height 0.25s ${ease.out}`,
                    }}/>

                    <div style={{ padding:'20px 20px 16px' }}>
                      {/* Header row */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:24 }}>{tier.icon}</span>
                        <div>
                          <div style={{
                            fontFamily:f.display, fontSize:size.sm, fontWeight:700,
                            color: sel ? tier.color : c.text,
                          }}>{tier.label}</div>
                          <div style={{ fontSize:10, color:c.textTertiary, marginTop:1, fontFamily:f.mono, letterSpacing:'0.02em' }}>
                            {tier.tagline}
                          </div>
                        </div>
                        {sel && (
                          <div style={{
                            marginLeft:'auto',
                            width:22, height:22,
                            borderRadius: radius.xs,
                            background:tier.color,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            animation:'checkPop 0.3s ease-out',
                            flexShrink:0,
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.bg} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>

                      <p style={{
                        fontSize:12, color:c.textSecondary, lineHeight:1.6, margin:'0 0 14px',
                      }}>
                        {tier.description}
                      </p>

                      {/* Stats row */}
                      <div style={{
                        display:'flex', gap:0, background:c.bg,
                        border:`1px solid ${c.borderSubtle}`, borderRadius: radius.md, marginBottom:14,
                      }}>
                        <div style={{ flex:1, textAlign:'center', padding:'10px 8px', borderRight:`1px solid ${c.borderSubtle}` }}>
                          <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.06em', marginBottom:3, textTransform:'uppercase' }}>Cmd min.</div>
                          <div style={{ fontSize:size.sm, fontWeight:700, color:tier.color }}>{tier.minOrderValue.toLocaleString('fr-FR')}&#8239;EUR</div>
                        </div>
                        <div style={{ flex:1, textAlign:'center', padding:'10px 8px' }}>
                          <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.06em', marginBottom:3, textTransform:'uppercase' }}>Priorite</div>
                          <div style={{ fontSize:size.sm, fontWeight:700, color:tier.color }}>{tier.priorityLabel}</div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        {tier.benefits.slice(0, 4).map((b, j) => (
                          <div key={j} style={{ display:'flex', gap:7, alignItems:'flex-start', fontSize:11, color:c.textSecondary, lineHeight:1.4 }}>
                            <span style={{ color:tier.color, fontWeight:700, fontSize:10, marginTop:1, flexShrink:0 }}>&#10003;</span>
                            <span>{b}</span>
                          </div>
                        ))}
                        {tier.benefits.length > 4 && (
                          <div style={{ fontSize:10, color:c.textTertiary, fontFamily:f.mono, marginTop:2 }}>
                            +{tier.benefits.length - 4} avantages
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══════ STEP 2 — Catalogue ═══════ */}
        {step === 2 && (
          <div key={animKey} style={{ animation:'slideUp 0.45s ease-out both' }}>

            <div style={{ textAlign:'center', marginBottom:sp[3] }}>
              <p style={{
                fontSize:10, fontFamily:f.mono, color:c.textTertiary,
                letterSpacing:'0.12em', textTransform:'uppercase', margin:0, marginBottom:6,
              }}>
                Etape 2
              </p>
              <h2 style={{
                fontFamily:f.display, fontSize:size.lg, fontWeight:700,
                margin:0, letterSpacing:'-0.01em',
              }}>
                Catalogue{' '}
                <span style={{ color:currentTier.color }}>{currentTier.label}</span>
              </h2>
              <Divider w={64} my="12px" />
              <p style={{ fontSize:size.xs, color:c.textSecondary, lineHeight:1.6, margin:0 }}>
                Selectionnez les categories qui vous interessent. Vous pourrez modifier plus tard.
              </p>
            </div>

            <div className="ob-catalog-grid">
              {catalog.map((cat, i) => {
                const sel = selectedCategories.includes(cat.id)
                return (
                  <div key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding:16, position:'relative',
                      background: sel ? c.bgElevated : gradient.card,
                      border:`1.5px solid ${sel ? currentTier.color : c.border}`,
                      borderRadius: radius.md,
                      boxShadow: shadow.card,
                      cursor:'pointer',
                      transition:`all 0.2s ${ease.smooth}`,
                      animation:`scaleReveal 0.3s ease-out ${i * 35}ms both`,
                    }}
                    onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = currentTier.color + '40' }}
                    onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = c.border }}>

                    {/* Checkbox */}
                    <div style={{
                      position:'absolute', top:12, right:12,
                      width:18, height:18,
                      border:`1.5px solid ${sel ? currentTier.color : c.border}`,
                      borderRadius: radius.xs,
                      background: sel ? currentTier.color : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:`all 0.15s ${ease.smooth}`,
                    }}>
                      {sel && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.bg} strokeWidth="3" style={{ animation:'checkPop 0.25s ease-out' }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>

                    {/* Header */}
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, paddingRight:28 }}>
                      <span style={{ fontSize:20 }}>{cat.icon}</span>
                      <span style={{
                        fontFamily:f.display, fontWeight:700, fontSize:13,
                        color: sel ? currentTier.color : c.text,
                        transition:`color 0.15s`,
                      }}>{cat.name}</span>
                    </div>

                    <p style={{ fontSize:11, color:c.textSecondary, lineHeight:1.5, margin:'0 0 12px' }}>
                      {cat.description}
                    </p>

                    {/* Stats */}
                    <div style={{
                      display:'flex', gap:16,
                      paddingTop:10, borderTop:`1px solid ${c.borderSubtle}`,
                    }}>
                      <div>
                        <div style={miniLabel}>Prix</div>
                        <div style={{ fontSize:12, fontWeight:600, color:c.green }}>{cat.priceRange}</div>
                      </div>
                      <div>
                        <div style={miniLabel}>Marge</div>
                        <div style={{ fontSize:12, fontWeight:600, color:c.gold }}>{cat.margin}</div>
                      </div>
                      <div>
                        <div style={miniLabel}>MOQ</div>
                        <div style={{ fontSize:12, fontWeight:600, color:c.textSecondary }}>{cat.moq}</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:10 }}>
                      {cat.topProducts.slice(0, 3).map((p, j) => (
                        <span key={j} style={{
                          fontSize:9, padding:'2px 7px', fontFamily:f.mono,
                          background:c.bg, border:`1px solid ${c.borderSubtle}`,
                          borderRadius: radius.xs,
                          color:c.textTertiary, letterSpacing:'0.01em',
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Counter */}
            <div style={{
              textAlign:'center', marginTop:sp[3],
              fontSize:12, color: selectedCategories.length > 0 ? c.text : c.textTertiary,
              fontFamily:f.mono, letterSpacing:'0.02em',
              transition:'color 0.2s',
            }}>
              {selectedCategories.length === 0
                ? 'Aucune categorie selectionnee (optionnel)'
                : `${selectedCategories.length} categorie${selectedCategories.length > 1 ? 's' : ''} selectionnee${selectedCategories.length > 1 ? 's' : ''}`
              }
            </div>
          </div>
        )}

        {/* ═══════ STEP 3 — Contact ═══════ */}
        {step === 3 && (
          <div key={animKey} style={{ animation:'slideUp 0.45s ease-out both' }}>

            <div style={{ textAlign:'center', marginBottom:sp[3] }}>
              <p style={{
                fontSize:10, fontFamily:f.mono, color:c.textTertiary,
                letterSpacing:'0.12em', textTransform:'uppercase', margin:0, marginBottom:6,
              }}>
                Derniere etape
              </p>
              <h2 style={{
                fontFamily:f.display, fontSize:size.lg, fontWeight:700,
                margin:0, letterSpacing:'-0.01em',
              }}>
                Vos coordonnées
              </h2>
              <Divider w={64} my="12px" />
              <p style={{ fontSize:size.xs, color:c.textSecondary, lineHeight:1.6, margin:0 }}>
                Profil{' '}
                <span style={{ color:currentTier.color, fontWeight:600 }}>{currentTier.label}</span>
                {' '}&mdash; plus qu'une etape.
              </p>
            </div>

            <div style={{
              background:gradient.card, border:`1px solid ${c.border}`,
              borderRadius: radius.lg, boxShadow: shadow.card,
              padding:24, display:'flex', flexDirection:'column', gap:20,
            }}>
              <Field label="Nom complet *">
                <input className="ob-input" type="text" placeholder="Votre nom"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)} />
              </Field>

              <Field label="Entreprise / Commerce">
                <input className="ob-input" type="text" placeholder="Nom de votre entreprise"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)} />
              </Field>

              <div className="ob-contact-row">
                <Field label="Telephone">
                  <input className="ob-input" type="tel" placeholder="+33 6 00 00 00 00"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)} />
                </Field>
                <Field label="Ville">
                  <input className="ob-input" type="text" placeholder="Paris, Lyon, Marseille..."
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)} />
                </Field>
              </div>

              {selectedTier === 'ecommerce' ? (
                <Field label="URL boutique en ligne">
                  <input className="ob-input" type="url" placeholder="https://votre-shop.com"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)} />
                </Field>
              ) : (
                <Field label="Adresse de livraison">
                  <input className="ob-input" type="text" placeholder="Adresse de livraison (optionnel)"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)} />
                </Field>
              )}

              {/* ─── Business qualification (helps us calibrate the offer) ─── */}
              <div style={{
                marginTop: 8, paddingTop: 18,
                borderTop: `1px dashed ${c.borderSubtle}`,
              }}>
                <p style={{
                  fontFamily: f.mono, fontSize: 9, color: c.gold,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  margin: '0 0 12px', fontWeight: 600,
                }}>
                  ◆ Pour mieux vous accompagner
                </p>

                <div className="ob-contact-row">
                  <Field label="Volume d'imports mensuel estimé">
                    <select className="ob-input"
                      value={formData.monthly_volume}
                      onChange={(e) => handleChange('monthly_volume', e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      <option value="lt2k">Moins de 2 000 €</option>
                      <option value="2k_10k">2 000 — 10 000 €</option>
                      <option value="10k_50k">10 000 — 50 000 €</option>
                      <option value="50k_plus">Plus de 50 000 €</option>
                    </select>
                  </Field>
                  <Field label="Années d'activité">
                    <select className="ob-input"
                      value={formData.years_active}
                      onChange={(e) => handleChange('years_active', e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      <option value="lt1">Moins d'1 an</option>
                      <option value="1_3">1 à 3 ans</option>
                      <option value="3_plus">Plus de 3 ans</option>
                    </select>
                  </Field>
                </div>

                <Field label="Avez-vous déjà des fournisseurs ?">
                  <select className="ob-input"
                    value={formData.has_existing_suppliers}
                    onChange={(e) => handleChange('has_existing_suppliers', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    <option value="none">Aucun, je débute le sourcing</option>
                    <option value="alibaba">Alibaba / AliExpress uniquement</option>
                    <option value="europe">Fournisseurs européens</option>
                    <option value="china_direct">Déjà des contacts en Chine</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Recap card */}
            <div style={{
              marginTop:20, padding:20,
              background:gradient.card, border:`1px solid ${c.border}`,
              borderRadius: radius.lg, boxShadow: shadow.card,
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', top:0, left:0, right:0, height:2,
                background:`linear-gradient(to right, ${currentTier.color}, transparent)`,
                opacity:0.5,
              }}/>
              <div style={{
                fontSize:9, fontFamily:f.mono, color:c.textTertiary,
                textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14,
              }}>
                Recapitulatif
              </div>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                <RecapItem label="Profil" value={currentTier.label} color={currentTier.color} icon={currentTier.icon} />
                <RecapItem label="Cmd min." value={`${currentTier.minOrderValue.toLocaleString('fr-FR')} EUR`} color={currentTier.color} />
                <RecapItem label="Categories" value={selectedCategories.length > 0 ? `${selectedCategories.length} selectionnees` : 'Toutes'} color={c.textSecondary} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ Fixed bottom nav ═══════ */}
      {step > 0 && (
        <div className="ob-nav">
          <button className="ob-btn-secondary" onClick={() => goTo(step - 1)}>
            Retour
          </button>
          {step < 3 ? (
            <button className="ob-btn-primary" onClick={() => goTo(step + 1)}>
              Continuer
            </button>
          ) : (
            <button className="ob-btn-gold"
              onClick={handleFinish}
              disabled={!formData.full_name.trim() || saving}>
              {saving ? 'Enregistrement...' : 'Terminer'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Shared components ── */

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display:'block', fontSize:10, fontWeight:600,
        color:c.textTertiary, marginBottom:7, fontFamily:f.mono,
        letterSpacing:'0.08em', textTransform:'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function RecapItem({ label, value, color, icon }) {
  return (
    <div style={{ flex:'1 1 100px' }}>
      <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
        {label}
      </div>
      <div style={{ fontSize:size.sm, fontWeight:600, color }}>
        {icon && <span style={{ marginRight:4 }}>{icon}</span>}
        {value}
      </div>
    </div>
  )
}

/* ── Style constants ── */
const miniLabel = {
  fontSize:9, fontFamily:f.mono, color:c.textTertiary,
  textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2,
}
