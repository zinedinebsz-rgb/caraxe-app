import { useState, useMemo } from 'react'
import { c, f, size, sp, shadow, ease, gradient, radius } from '../lib/theme'
import { TIERS, getTierByKey } from '../lib/clientTiers'
import { getCatalog } from '../lib/catalogsByProfile'

/* ── KEYFRAMES ── */
const keyframes = `
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }

.cat-root { min-height:100vh; background:#0a0908; font-family:'DM Sans',sans-serif; color:#ede9e5 }
.cat-root *,:after,:before { box-sizing:border-box }
.cat-root::-webkit-scrollbar { width:4px }
.cat-root::-webkit-scrollbar-track { background:transparent }
.cat-root::-webkit-scrollbar-thumb { background:#3a3733 }

.cat-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px }
.cat-tabs { display:flex; gap:6px; flex-wrap:wrap; justify-content:center }

@media (max-width: 768px) {
  .cat-grid { grid-template-columns:1fr !important }
  .cat-hero-stats { gap:24px !important }
  .cat-hero-title { font-size:clamp(1.5rem,5vw,2.2rem) !important }
  .cat-container { padding:24px 16px !important }
  .cat-tabs { gap:4px }
}
`

/* ── Divider ── */
const Divider = ({ w = 64, my = '14px' }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, width:w, margin:`${my} auto` }}>
    <div style={{ flex:1, height:1, background:`linear-gradient(to right, transparent, ${c.gold})` }}/>
    <div style={{ width:4, height:4, background:c.gold, transform:'rotate(45deg)', opacity:0.5, flexShrink:0 }}/>
    <div style={{ flex:1, height:1, background:`linear-gradient(to left, transparent, ${c.gold})` }}/>
  </div>
)

export default function Catalogue() {
  const [activeTier, setActiveTier] = useState('detaillant')
  const tier = getTierByKey(activeTier)
  const catalog = useMemo(() => getCatalog(activeTier), [activeTier])

  const handleCTA = () => {
    window.open('https://caraxes.fr', '_blank')
  }

  return (
    <div className="cat-root">
      <style>{keyframes}</style>

      {/* ═══════ HERO ═══════ */}
      <header style={{
        padding:'48px 24px 40px', textAlign:'center',
        borderBottom:`1px solid ${c.border}`,
        background:`radial-gradient(ellipse at 50% 0%, oklch(12% 0.007 50) 0%, ${c.bg} 70%)`,
      }}>
        {/* Logo */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          marginBottom:24, animation:'fadeIn 0.5s ease-out',
        }}>
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <path d="M20 3L12 11Q7 16 7 22Q7 29 12 33L16 36Q18 38 20 38Q22 38 24 36L28 33Q33 29 33 22Q33 16 28 11L20 3Z" fill={c.red} opacity="0.9"/>
            <circle cx="16" cy="19" r="2" fill={c.gold} opacity="0.9"/>
            <circle cx="24" cy="19" r="2" fill={c.gold} opacity="0.9"/>
          </svg>
          <span style={{ fontSize:size.base, fontFamily:f.display, color:c.gold, letterSpacing:'0.1em', fontWeight:700 }}>
            CARAXES
          </span>
        </div>

        <h1 className="cat-hero-title" style={{
          fontFamily:f.display, fontSize:size['2xl'], fontWeight:700,
          margin:0, letterSpacing:'-0.01em', lineHeight:1.15,
          animation:'slideUp 0.5s ease-out',
        }}>
          Notre catalogue produits
        </h1>

        <Divider w={72} my="14px" />

        <p style={{
          fontSize:size.sm, color:c.textSecondary, lineHeight:1.7,
          maxWidth:480, margin:'0 auto', marginBottom:28,
          animation:'fadeIn 0.5s ease-out 0.1s both',
        }}>
          Explorez les categories disponibles par profil.
          Prix Chine, marges estimees, quantites minimales.
        </p>

        {/* Stats */}
        <div className="cat-hero-stats" style={{
          display:'flex', justifyContent:'center', gap:40,
          marginBottom:28, animation:'fadeIn 0.5s ease-out 0.2s both',
        }}>
          {[
            { n:'500+', l:'Fournisseurs vérifiés' },
            { n:'4', l:'Profils clients' },
            { n:'100%', l:'QC filme' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:size.lg, fontWeight:700, color:c.gold, fontFamily:f.display }}>{s.n}</div>
              <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.04em', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleCTA} style={{
          padding:'14px 32px', background:c.red, border:`1px solid ${c.red}`,
          borderRadius:radius.md,
          color:c.white, fontSize:14, fontWeight:600, cursor:'pointer',
          fontFamily:f.body, letterSpacing:'0.02em',
          transition:`all 0.25s ${ease.out}`,
          animation:'fadeIn 0.5s ease-out 0.3s both',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep; e.currentTarget.style.boxShadow = shadow.glow }}
          onMouseLeave={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.boxShadow = 'none' }}>
          Demander un comparatif gratuit
        </button>
      </header>

      {/* ═══════ CONTENT ═══════ */}
      <div className="cat-container" style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px 80px' }}>

        {/* Tier tabs */}
        <div style={{ marginBottom:28 }}>
          <div style={{
            fontSize:10, fontFamily:f.mono, color:c.textTertiary,
            letterSpacing:'0.12em', textTransform:'uppercase',
            textAlign:'center', marginBottom:12,
          }}>
            Choisir un profil
          </div>
          <div className="cat-tabs">
            {TIERS.map((t) => {
              const sel = activeTier === t.key
              return (
                <button key={t.key} onClick={() => setActiveTier(t.key)}
                  style={{
                    padding:'10px 20px', cursor:'pointer', fontFamily:f.body,
                    fontSize:13, fontWeight: sel ? 700 : 500,
                    borderRadius:radius.md,
                    background: sel ? c.bgElevated : 'transparent',
                    border:`1.5px solid ${sel ? t.color : c.border}`,
                    color: sel ? t.color : c.textSecondary,
                    transition:`all 0.2s ${ease.smooth}`,
                    display:'flex', alignItems:'center', gap:6,
                  }}
                  onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = t.color + '55'; e.currentTarget.style.color = t.color } }}
                  onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary } }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tier summary bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 20px', background:c.bgCard,
          border:`1px solid ${c.border}`, borderRadius:radius.md,
          boxShadow:shadow.card, marginBottom:20,
          flexWrap:'wrap', gap:12,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:20 }}>{tier.icon}</span>
            <span style={{ fontFamily:f.display, fontWeight:700, color:tier.color, fontSize:size.sm }}>{tier.label}</span>
            <span style={{ fontSize:11, color:c.textTertiary }}>&mdash; {tier.tagline}</span>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.06em' }}>CMD MIN.</div>
              <div style={{ fontSize:13, fontWeight:700, color:tier.color }}>{tier.minOrderValue.toLocaleString('fr-FR')}&#8239;EUR</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.06em' }}>PRIORITE</div>
              <div style={{ fontSize:13, fontWeight:700, color:tier.color }}>{tier.priorityLabel}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.06em' }}>CATEGORIES</div>
              <div style={{ fontSize:13, fontWeight:700, color:c.text }}>{catalog.length}</div>
            </div>
          </div>
        </div>

        {/* Catalog grid */}
        <div className="cat-grid">
          {catalog.map((cat, i) => (
            <div key={cat.id} style={{
              background:c.bgCard, border:`1px solid ${c.border}`,
              borderRadius:radius.lg, padding:0, overflow:'hidden',
              boxShadow:shadow.card,
              transition:`all 0.25s ${ease.luxury}`,
              animation:`scaleIn 0.35s ease-out ${i * 40}ms both`,
              cursor:'default',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = tier.color + '44'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = shadow.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

              {/* Color accent */}
              <div style={{ height:2, background:tier.color, opacity:0.4 }}/>

              <div style={{ padding:'18px 18px 16px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:24 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontFamily:f.display, fontWeight:700, fontSize:14, color:c.text }}>{cat.name}</div>
                    {cat.locations && (
                      <div style={{ fontSize:9, fontFamily:f.mono, color:c.textTertiary, letterSpacing:'0.03em', marginTop:1 }}>
                        {cat.locations.join(' / ')}
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ fontSize:12, color:c.textSecondary, lineHeight:1.55, margin:'0 0 14px' }}>
                  {cat.description}
                </p>

                {/* Stats */}
                <div style={{
                  display:'flex', gap:0, background:c.bg,
                  border:`1px solid ${c.borderSubtle}`, borderRadius:radius.sm,
                  marginBottom:12,
                }}>
                  <div style={{ flex:1, textAlign:'center', padding:'9px 6px', borderRight:`1px solid ${c.borderSubtle}` }}>
                    <div style={miniLabel}>Prix Chine</div>
                    <div style={{ fontSize:12, fontWeight:600, color:c.green }}>{cat.priceRange}</div>
                  </div>
                  <div style={{ flex:1, textAlign:'center', padding:'9px 6px', borderRight:`1px solid ${c.borderSubtle}` }}>
                    <div style={miniLabel}>Marge</div>
                    <div style={{ fontSize:12, fontWeight:600, color:c.gold }}>{cat.margin}</div>
                  </div>
                  <div style={{ flex:1, textAlign:'center', padding:'9px 6px' }}>
                    <div style={miniLabel}>MOQ</div>
                    <div style={{ fontSize:12, fontWeight:600, color:c.textSecondary }}>{cat.moq} pcs</div>
                  </div>
                </div>

                {/* Top products */}
                <div>
                  <div style={miniLabel}>Produits phares</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
                    {cat.topProducts.slice(0, 4).map((p, j) => (
                      <span key={j} style={{
                        fontSize:9, padding:'3px 8px', fontFamily:f.mono,
                        borderRadius:radius.xs,
                        background:c.bg, border:`1px solid ${c.borderSubtle}`,
                        color:c.textTertiary, letterSpacing:'0.01em',
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign:'center', marginTop:48,
          padding:'32px 24px',
          background:gradient.card, border:`1px solid ${c.border}`,
          borderRadius:radius.lg, boxShadow:shadow.card,
        }}>
          <h3 style={{
            fontFamily:f.display, fontSize:size.lg, fontWeight:700,
            margin:0, marginBottom:8,
          }}>
            Un produit vous interesse ?
          </h3>
          <p style={{
            fontSize:size.xs, color:c.textSecondary, lineHeight:1.6,
            maxWidth:400, margin:'0 auto', marginBottom:20,
          }}>
            Recevez un comparatif gratuit avec prix, fournisseurs et delais.
            Sans engagement.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={handleCTA} style={{
              padding:'14px 28px', background:c.red, border:`1px solid ${c.red}`,
              borderRadius:radius.md,
              color:c.white, fontSize:14, fontWeight:600, cursor:'pointer',
              fontFamily:f.body, transition:`all 0.25s ${ease.out}`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
              onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
              Demander un comparatif gratuit
            </button>
            <a href="/login" style={{
              padding:'14px 28px', background:'transparent',
              border:`1px solid ${c.border}`, borderRadius:radius.md,
              color:c.textSecondary,
              fontSize:14, cursor:'pointer', fontFamily:f.body,
              textDecoration:'none', display:'inline-block',
              transition:`all 0.2s ${ease.smooth}`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textSecondary; e.currentTarget.style.color = c.text }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary }}>
              Se connecter
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign:'center', marginTop:32,
          fontSize:10, fontFamily:f.mono, color:c.textTertiary,
          letterSpacing:'0.04em',
        }}>
          CARAXES &mdash; Agent de sourcing en Chine, sur le terrain &mdash; Yiwu / Guangzhou / Shenzhen
        </div>
      </div>
    </div>
  )
}

/* ── Styles ── */
const miniLabel = {
  fontSize:9, fontFamily:"'JetBrains Mono','SF Mono',monospace",
  color:'#6d6b68', textTransform:'uppercase',
  letterSpacing:'0.04em', marginBottom:3,
}
