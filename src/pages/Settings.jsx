import { useState, useRef } from 'react'
import { c, f, size, sp, shadow, ease, radius, gradient, transition } from '../lib/theme'
import { TIERS, getTierByKey, DEFAULT_TIER } from '../lib/clientTiers'
import { updateProfile, supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

/* ── KEYFRAMES ── */
const keyframes = `
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }

.set-root { height:100vh; display:flex; flex-direction:column; background:#0a0908; font-family:'DM Sans',sans-serif; color:#ede9e5 }
.set-root *,:after,:before { box-sizing:border-box }
.set-scroll { flex:1; overflow-y:auto; min-height:0 }
.set-scroll::-webkit-scrollbar { width:4px }
.set-scroll::-webkit-scrollbar-track { background:transparent }
.set-scroll::-webkit-scrollbar-thumb { background:#3a3733 }

.set-input { width:100%; padding:12px 14px; font-size:14px; font-family:'DM Sans',sans-serif; background:${c.bgInput}; border:none; border-bottom:1.5px solid ${c.border}; border-radius:${radius.xs} ${radius.xs} 0 0; color:${c.text}; outline:none; transition:all 0.25s cubic-bezier(0.22,0.61,0.36,1); letter-spacing:0.01em }
.set-input:focus { border-bottom-color:${c.gold}; box-shadow:0 1px 0 0 ${c.gold} }
.set-input::placeholder { color:${c.textTertiary} }
.set-input:disabled { opacity:0.5; cursor:not-allowed }

.set-tier-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:12px }
.set-contact-row { display:grid; grid-template-columns:1fr 1fr; gap:16px }

@media (max-width: 768px) {
  .set-tier-grid { grid-template-columns:1fr !important }
  .set-contact-row { grid-template-columns:1fr !important }
  .set-content { padding:24px 16px !important }
}
`

/* ── Label ── */
const Label = ({ children }) => (
  <label style={{
    display:'block', fontSize:10, fontWeight:600,
    color:c.textTertiary, marginBottom:7, fontFamily:f.mono,
    letterSpacing:'0.08em', textTransform:'uppercase',
  }}>{children}</label>
)

/* ── Section ── */
const Section = ({ title, subtitle, children, accent = c.gold, delay = 0 }) => (
  <div style={{
    background:gradient.card, border:`1px solid ${c.border}`,
    borderRadius:radius.lg, boxShadow:shadow.card,
    position:'relative', overflow:'hidden', marginBottom:16,
    animation:`slideUp 0.4s ease-out ${delay}ms both`,
    transition:transition.lift,
  }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadow.cardHover }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadow.card }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:accent, opacity:0.4 }}/>
    <div style={{ padding:'20px 24px' }}>
      <h3 style={{
        fontFamily:f.display, fontSize:size.base, fontWeight:700,
        margin:0, letterSpacing:'-0.01em',
      }}>{title}</h3>
      {subtitle && (
        <p style={{ fontSize:12, color:c.textSecondary, margin:'6px 0 0', lineHeight:1.5 }}>{subtitle}</p>
      )}
      <div style={{ width:32, height:1, background:accent, opacity:0.3, margin:'12px 0 0' }}/>
      <div style={{ marginTop:16 }}>{children}</div>
    </div>
  </div>
)

export default function Settings({ user, profile, onBack, onUpdate }) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    company: profile?.company || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    address: profile?.address || '',
    website: profile?.website || '',
    client_tier: profile?.client_tier || DEFAULT_TIER,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifs, setNotifs] = useState({
    orders: true,
    messages: true,
    promos: false,
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(user.id, formData)
      setSaved(true)
      if (onUpdate) onUpdate()
      toast.success('Profil sauvegardé')
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const currentTier = getTierByKey(formData.client_tier)

  // Avatar initials
  const initials = (formData.full_name || user?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="set-root">
      <style>{keyframes}</style>

      {/* ── HEADER ── */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', height:56, background:c.bgWarm,
        borderBottom:`1px solid ${c.borderSubtle}`, flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onBack} style={{
            background:'none', border:`1px solid ${c.border}`, borderRadius:radius.md, cursor:'pointer',
            color:c.textSecondary, fontFamily:f.body, fontSize:13,
            display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
            transition:transition.fast,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.text }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
            &larr; Retour
          </button>
          <span style={{ fontFamily:f.display, fontSize:size.md, color:c.gold, letterSpacing:'0.06em', fontWeight:700 }}>
            Parametres
          </span>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          padding:'8px 20px', borderRadius:radius.md,
          background: saved ? c.green : c.red,
          border:'none', color: saved ? c.bg : c.white,
          fontSize:13, fontWeight:700, cursor: saving ? 'wait' : 'pointer',
          fontFamily:f.body, transition:transition.normal,
          letterSpacing:'0.02em',
        }}
          onMouseEnter={(e) => { if (!saved && !saving) { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = saved ? c.green : c.red; e.currentTarget.style.boxShadow = 'none' }}>
          {saving ? 'Sauvegarde...' : saved ? '\u2713 Sauvegarde' : 'Sauvegarder'}
        </button>
      </header>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="set-scroll">
        <div className="set-content" style={{ maxWidth:680, margin:'0 auto', padding:'28px 24px 60px' }}>

          {/* ═══ ACCOUNT ═══ */}
          <Section title="Compte" subtitle="Votre identite et email de connexion." accent={c.gold} delay={0}>
            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20 }}>
              {/* Avatar */}
              <div style={{
                width:56, height:56, flexShrink:0, borderRadius:radius.lg,
                background:c.bgElevated, border:`2px solid ${currentTier.color}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:f.display, fontSize:size.lg, fontWeight:700,
                color:currentTier.color, letterSpacing:'0.03em',
              }}>
                {initials}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:size.sm, marginBottom:2 }}>
                  {formData.full_name || 'Sans nom'}
                </div>
                <div style={{ fontSize:12, color:c.textSecondary }}>
                  {user?.email}
                </div>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  marginTop:6, padding:'3px 10px', borderRadius:radius.sm,
                  background:currentTier.colorSoft, fontSize:10,
                  fontFamily:f.mono, fontWeight:700, color:currentTier.color,
                  letterSpacing:'0.04em', textTransform:'uppercase',
                }}>
                  {currentTier.icon} {currentTier.label}
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <Label>Nom complet</Label>
                <input className="set-input" type="text" value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <div style={{
                  padding:'12px 14px', background:c.bgInput, border:`1px solid ${c.borderSubtle}`,
                  borderRadius:radius.sm, color:c.textTertiary, fontSize:14, display:'flex', alignItems:'center', gap:8,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.textTertiary} strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  {user?.email}
                </div>
              </div>
            </div>
          </Section>

          {/* ═══ COORDONNEES ═══ */}
          <Section title="Coordonnées" subtitle="Informations de contact et livraison." accent={c.blue} delay={80}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <Label>Entreprise / Commerce</Label>
                <input className="set-input" type="text" placeholder="Nom de votre entreprise"
                  value={formData.company} onChange={(e) => handleChange('company', e.target.value)} />
              </div>

              <div className="set-contact-row">
                <div>
                  <Label>Telephone</Label>
                  <input className="set-input" type="tel" placeholder="+33 6 00 00 00 00"
                    value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
                <div>
                  <Label>Ville</Label>
                  <input className="set-input" type="text" placeholder="Paris, Lyon, Marseille..."
                    value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Adresse de livraison</Label>
                <input className="set-input" type="text" placeholder="Adresse complète"
                  value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
              </div>

              <div>
                <Label>Site web / Boutique en ligne</Label>
                <input className="set-input" type="url" placeholder="https://votre-shop.com"
                  value={formData.website} onChange={(e) => handleChange('website', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* ═══ PROFIL REVENDEUR ═══ */}
          <Section title="Profil revendeur" subtitle="Votre tier determine vos prix, quantites minimales et priorite." accent={currentTier.color} delay={160}>
            <div className="set-tier-grid">
              {TIERS.map((tier) => {
                const sel = formData.client_tier === tier.key
                return (
                  <div key={tier.key} onClick={() => handleChange('client_tier', tier.key)}
                    style={{
                      padding:16, background: sel ? c.bgElevated : c.bg,
                      border:`1.5px solid ${sel ? tier.color : c.border}`,
                      borderRadius:radius.md, boxShadow: sel ? shadow.sm : 'none',
                      cursor:'pointer', transition:transition.normal,
                      position:'relative', overflow:'hidden',
                    }}
                    onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = tier.color + '55' }}
                    onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = c.border }}>

                    <div style={{ height: sel ? 2 : 0, position:'absolute', top:0, left:0, right:0, background:tier.color, transition:`height 0.2s` }}/>

                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22 }}>{tier.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:f.display, fontSize:13, fontWeight:700, color: sel ? tier.color : c.text }}>
                          {tier.label}
                        </div>
                        <div style={{ fontSize:10, color:c.textTertiary, fontFamily:f.mono, marginTop:1, letterSpacing:'0.02em' }}>
                          Min. {tier.minOrderValue.toLocaleString('fr-FR')} EUR &middot; {tier.priorityLabel}
                        </div>
                      </div>
                      {sel && (
                        <div style={{
                          width:20, height:20, background:tier.color, borderRadius:radius.xs,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c.bg} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* ═══ NOTIFICATIONS ═══ */}
          <Section title="Notifications" subtitle="Choisissez ce que vous souhaitez recevoir." accent={c.purple} delay={240}>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {[
                { key:'orders', label:'Mises a jour commandes', desc:'Statut, expedition, livraison' },
                { key:'messages', label:'Nouveaux messages', desc:'Messages de votre agent CARAXES' },
                { key:'promos', label:'Offres et nouveautes', desc:'Promotions, nouveaux produits, actualites' },
              ].map((item, i) => (
                <div key={item.key} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 0',
                  borderBottom: i < 2 ? `1px solid ${c.borderSubtle}` : 'none',
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{item.label}</div>
                    <div style={{ fontSize:11, color:c.textTertiary, marginTop:2 }}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={{
                      width:40, height:22, padding:0, border:'none', cursor:'pointer',
                      background: notifs[item.key] ? c.green : c.bgElevated,
                      borderRadius:11, position:'relative',
                      transition:`background 0.2s ${ease.smooth}`,
                      flexShrink:0,
                    }}>
                    <div style={{
                      width:16, height:16, background:c.white,
                      borderRadius:8, position:'absolute', top:3,
                      left: notifs[item.key] ? 21 : 3,
                      transition:`left 0.2s ${ease.out}`,
                    }}/>
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ DANGER ZONE ═══ */}
          <Section title="Session" accent={c.red} delay={320}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>Se deconnecter</div>
                <div style={{ fontSize:11, color:c.textTertiary, marginTop:2 }}>Vous serez redirige vers la page de connexion.</div>
              </div>
              <button onClick={handleSignOut} style={{
                padding:'8px 18px', background:'transparent', borderRadius:radius.md,
                border:`1px solid ${c.red}`, color:c.red,
                fontSize:12, fontWeight:600, cursor:'pointer',
                fontFamily:f.body, transition:transition.fast,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.redSoft }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                Deconnexion
              </button>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
