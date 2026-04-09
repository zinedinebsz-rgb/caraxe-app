import { useState } from 'react'
import { c, f, size, sp, shadow, ease, transition } from '../lib/theme'
import { TIERS, getTierByKey, DEFAULT_TIER } from '../lib/clientTiers'
import { updateProfile } from '../lib/supabase'
import { useToast } from '../components/Toast'

const focusGlow = `0 0 0 2px ${c.redSoft}`

export default function Settings({ user, profile, onBack, onUpdate }) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    company: profile?.company || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    address: profile?.address || '',
    client_tier: profile?.client_tier || DEFAULT_TIER,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
      toast.error('Erreur lors de la sauvegarde du profil.')
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: `${sp[2]} ${sp[2]}`,
    fontSize: size.sm, fontFamily: f.body,
    background: c.bgSurface, border: `1px solid ${c.border}`,
    color: c.text, boxSizing: 'border-box', outline: 'none',
    transition: `all 0.2s ${ease.smooth}`,
  }

  const labelStyle = {
    display: 'block', fontSize: '10px', fontWeight: 600,
    color: c.textTertiary, marginBottom: '6px', fontFamily: f.mono,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  const currentTier = getTierByKey(formData.client_tier)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: c.bg, fontFamily: f.body, color: c.text }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${sp[4]}`, height: '56px', background: c.bgWarm,
        borderBottom: `1px solid ${c.borderSubtle}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[3] }}>
          <button onClick={onBack} style={{
            background: 'none', border: `1px solid ${c.border}`, cursor: 'pointer',
            color: c.textSecondary, fontFamily: f.body, fontSize: size.sm,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: `6px ${sp[2]}`, transition: `all 0.2s ${ease.smooth}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.text }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
            ← Retour
          </button>
          <span style={{ fontFamily: f.display, fontSize: size.md, color: c.gold, letterSpacing: '0.06em', fontWeight: 700 }}>
            Paramètres
          </span>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          padding: `8px ${sp[3]}`,
          background: saved ? c.green : c.red,
          border: 'none', color: saved ? c.bg : c.text,
          fontSize: size.sm, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
          fontFamily: f.body, transition: `all 0.3s ${ease.out}`,
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => { if (!saved && !saving) { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = saved ? c.green : c.red; e.currentTarget.style.boxShadow = 'none' }}>
          {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>
      </header>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: `${sp[4]} ${sp[4]}` }}>

          {/* ── TIER SELECTION ── */}
          <div style={{ marginBottom: sp[5] }}>
            <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0, marginBottom: '4px', letterSpacing: '-0.01em' }}>
              Votre profil revendeur
            </h3>
            <div style={{ width: 40, height: 1, background: c.gold, opacity: 0.3, margin: `${sp[1]} 0` }} />
            <p style={{ fontSize: size.sm, color: c.textSecondary, margin: 0, marginBottom: sp[3], lineHeight: 1.6, marginTop: sp[1] }}>
              Votre tier détermine vos prix, quantités minimales et priorité de traitement.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp[2] }}>
              {TIERS.map((tier, i) => {
                const isSelected = formData.client_tier === tier.key
                return (
                  <div key={tier.key} onClick={() => handleChange('client_tier', tier.key)}
                    style={{
                      padding: sp[3], background: isSelected ? c.bgElevated : c.bgSurface,
                      border: `2px solid ${isSelected ? tier.color : c.border}`,
                      cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                      textAlign: 'center', position: 'relative', overflow: 'hidden',
                      boxShadow: isSelected ? `0 4px 20px ${tier.color}12` : shadow.card,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = tier.color + '66' } }}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = c.border } }}>
                    {/* Accent line */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: isSelected ? 3 : 0, background: tier.color,
                      transition: `height 0.2s ${ease.smooth}`,
                    }} />
                    <div style={{ fontSize: '28px', marginBottom: sp[1] }}>{tier.icon}</div>
                    <div style={{ fontFamily: f.display, fontSize: size.sm, fontWeight: 700, color: isSelected ? tier.color : c.text, marginBottom: '4px' }}>
                      {tier.label}
                    </div>
                    <div style={{ fontSize: '10px', color: c.textTertiary, fontFamily: f.mono, letterSpacing: '0.04em' }}>
                      Min. {tier.minOrderValue.toLocaleString('fr-FR')}€
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: sp[1], fontSize: '10px', fontWeight: 700, color: tier.color, fontFamily: f.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        ✓ Actif
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── CONTACT INFO ── */}
          <div style={{
            background: c.bgSurface, border: `1px solid ${c.border}`, padding: sp[4],
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.gold, opacity: 0.3 }} />
            <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0, marginBottom: '4px', letterSpacing: '-0.01em' }}>
              Vos coordonnées
            </h3>
            <div style={{ width: 40, height: 1, background: c.gold, opacity: 0.3, margin: `${sp[1]} 0` }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
              <div>
                <label style={labelStyle}>Nom complet</label>
                <input type="text" value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <div style={{ ...inputStyle, background: c.bg, color: c.textTertiary, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: sp[1] }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.textTertiary} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {user?.email}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Entreprise / Commerce</label>
                <input type="text" value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Nom de votre entreprise" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3] }}>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+33 6 00 00 00 00" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input type="text" value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Paris, Lyon..." style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                    onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Adresse</label>
                <input type="text" value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Adresse de livraison" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                  onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
              </div>
            </div>
          </div>

          {/* ── CURRENT TIER SUMMARY ── */}
          <div style={{
            marginTop: sp[3], padding: sp[3],
            background: c.bgSurface, border: `1px solid ${c.border}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: currentTier.color, opacity: 0.5 }} />
            <div style={{ display: 'flex', gap: sp[4], alignItems: 'center' }}>
              <div>
                <div style={labelStyle}>Profil actif</div>
                <div style={{ fontFamily: f.display, fontSize: size.md, fontWeight: 700, color: currentTier.color }}>
                  {currentTier.icon} {currentTier.label}
                </div>
              </div>
              <div style={{ width: '1px', height: '32px', background: c.border }} />
              <div>
                <div style={labelStyle}>Commande min.</div>
                <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: currentTier.color }}>
                  {currentTier.minOrderValue.toLocaleString('fr-FR')}€
                </div>
              </div>
              <div style={{ width: '1px', height: '32px', background: c.border }} />
              <div>
                <div style={labelStyle}>Priorité</div>
                <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: currentTier.color }}>
                  {currentTier.priorityLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom spacing for comfortable scroll */}
          <div style={{ height: sp[5] }} />
        </div>
      </div>
    </div>
  )
}
