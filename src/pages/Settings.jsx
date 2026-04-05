import { useState } from 'react'
import { c, f, size, sp, ease } from '../lib/theme'
import { TIERS, getTierByKey, DEFAULT_TIER } from '../lib/clientTiers'
import { updateProfile } from '../lib/supabase'
import { useToast } from '../components/Toast'

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
      toast.success('Profil sauvegard\u00e9')
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde du profil.')
    }
    setSaving(false)
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
    outline: 'none',
    transition: `border 0.15s ${ease.smooth}`,
  }

  const labelStyle = {
    display: 'block', fontSize: size.xs, fontWeight: 600,
    color: c.textTertiary, marginBottom: sp[1], fontFamily: f.mono,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }

  const currentTier = getTierByKey(formData.client_tier)

  return (
    <div style={{
      minHeight: '100vh', background: c.bg,
      fontFamily: f.body, color: c.text,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${sp[2]} ${sp[3]}`, background: c.bgSurface,
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.textSecondary, fontFamily: f.body, fontSize: size.sm,
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: `${sp[1]} ${sp[2]}`,
            }}
          >
            ← Retour
          </button>
          <div style={{
            fontSize: size.lg, fontFamily: f.display, color: c.gold,
            letterSpacing: '0.05em', fontWeight: 700,
          }}>
            Paramètres
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: `${sp[1]} ${sp[3]}`,
            background: saved ? c.green : c.red,
            border: 'none', color: c.white,
            fontSize: size.sm, fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: f.body,
            transition: `all 0.15s ${ease.smooth}`,
          }}
        >
          {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: sp[4] }}>
        {/* Tier selection */}
        <div style={{ marginBottom: sp[4] }}>
          <h3 style={{
            fontFamily: f.display, fontSize: size.lg, fontWeight: 700,
            margin: 0, marginBottom: sp[1],
          }}>
            Votre profil revendeur
          </h3>
          <p style={{ fontSize: size.sm, color: c.textSecondary, margin: 0, marginBottom: sp[3] }}>
            Votre tier détermine vos prix d'achat, vos quantités minimales et votre priorité de traitement.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp[2] }}>
            {TIERS.map(tier => {
              const isSelected = formData.client_tier === tier.key
              return (
                <div
                  key={tier.key}
                  onClick={() => handleChange('client_tier', tier.key)}
                  style={{
                    padding: sp[3],
                    background: isSelected ? c.bgElevated : c.bgSurface,
                    border: `2px solid ${isSelected ? tier.color : c.border}`,
                    cursor: 'pointer',
                    transition: `all 0.2s ${ease.smooth}`,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: isSelected ? 3 : 0, background: tier.color,
                    transition: `height 0.2s ${ease.smooth}`,
                  }} />
                  <div style={{ fontSize: '24px', marginBottom: sp[1] }}>{tier.icon}</div>
                  <div style={{
                    fontFamily: f.display, fontSize: size.sm, fontWeight: 700,
                    color: isSelected ? tier.color : c.text, marginBottom: '4px',
                  }}>
                    {tier.label}
                  </div>
                  <div style={{
                    fontSize: '10px', color: c.textTertiary, fontFamily: f.mono,
                  }}>
                    Min. {tier.minOrderValue.toLocaleString('fr-FR')}€
                  </div>
                  {isSelected && (
                    <div style={{
                      marginTop: sp[1], fontSize: '10px', fontWeight: 600,
                      color: tier.color, fontFamily: f.mono,
                    }}>
                      ✓ Actif
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact info */}
        <div style={{
          background: c.bgSurface, border: `1px solid ${c.border}`,
          padding: sp[4],
        }}>
          <h3 style={{
            fontFamily: f.display, fontSize: size.lg, fontWeight: 700,
            margin: 0, marginBottom: sp[3],
          }}>
            Vos coordonnées
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input type="text" value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = c.gold}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{
                ...inputStyle, background: c.bg, color: c.textTertiary,
                cursor: 'not-allowed',
              }}>
                {user?.email}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Entreprise / Commerce</label>
              <input type="text" value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Nom de votre entreprise"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = c.gold}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[3] }}>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input type="tel" value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = c.gold}
                  onBlur={(e) => e.target.style.borderColor = c.border}
                />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input type="text" value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Paris, Lyon..."
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = c.gold}
                  onBlur={(e) => e.target.style.borderColor = c.border}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Adresse</label>
              <input type="text" value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Adresse de livraison"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = c.gold}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
