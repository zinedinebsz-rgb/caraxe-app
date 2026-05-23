/* ── CARAXES Admin — Formation Tab ── */
import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, ArtDecoDivider } from './AdminShared'
import { c, f, size, sp, ease } from '../../lib/theme'
import { FORMATION_INTERNE, FORMATION_CLIENT } from '../../lib/formationData'

const DecoPattern = () => null

export default function FormationTab() {
  const {
    t, toast, tToast,
    mainTab, clients,
  } = useAdmin()

  const [adminActiveLesson, setAdminActiveLesson] = useState(null)
  const [adminExpandedModule, setAdminExpandedModule] = useState(null)
  const [adminFormationType, setAdminFormationType] = useState('interne')

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('email')

  const handleSendToClient = () => {
    setSelectedClientId('')
    setSelectedChannel('email')
    setSendModalOpen(true)
  }

  const handleConfirmSend = () => {
    if (!selectedClientId) { toast.error('Sélectionne un client'); return }
    const client = (clients || []).find(c => c.id === selectedClientId)
    if (!client) { toast.error('Client introuvable'); return }
    const formationLabel = adminFormationType === 'interne' ? 'Formation Interne CARAXES (~20h)' : 'Formation Client CARAXES (2h)'
    const htmlPath = adminFormationType === 'interne' ? '/FORMATION_INTERNE_CARAXES.html' : '/FORMATION_CLIENT_CARAXES.html'
    const pdfPath = adminFormationType === 'interne' ? '/FORMATION_INTERNE_CARAXES.pdf' : '/FORMATION_CLIENT_CARAXES.pdf'
    const baseUrl = (typeof window !== 'undefined' && window.location?.origin) || 'https://app.caraxes.fr'
    const htmlUrl = baseUrl + htmlPath
    const pdfUrl = baseUrl + pdfPath
    const firstName = (client.full_name || '').split(' ')[0] || 'cher client'
    if (selectedChannel === 'email') {
      const subject = `Votre formation CARAXES : ${formationLabel}`
      const body = `Bonjour ${firstName},\n\nComme convenu, voici votre accès à la formation CARAXES.\n\nVersion interactive (HTML) : ${htmlUrl}\nVersion PDF à télécharger : ${pdfUrl}\n\nPrends ton temps pour la parcourir. Toutes les questions sont les bienvenues — réponds-moi directement à cet email ou via WhatsApp.\n\nBonne formation,\nZinédine — CARAXES`
      const mailto = `mailto:${encodeURIComponent(client.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailto, '_blank')
      toast.success(`Email pré-rempli pour ${firstName} ouvert`)
      setSendModalOpen(false)
      return
    }
    if (selectedChannel === 'whatsapp') {
      if (!client.phone) { toast.error('Ce client n\'a pas de numéro de téléphone enregistré'); return }
      const msg = `Bonjour ${firstName},\n\nVoici votre accès à la ${formationLabel} :\n\nVersion HTML : ${htmlUrl}\nVersion PDF : ${pdfUrl}\n\nToutes les questions sont les bienvenues. Bonne formation !\n— Zinédine, CARAXES`
      const phoneClean = String(client.phone).replace(/[^0-9]/g, '')
      const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
      window.open(waLink, '_blank')
      toast.success(`WhatsApp ouvert pour ${firstName}`)
      setSendModalOpen(false)
      return
    }
  }

  if (mainTab !== 'formation') return null

  return (
    <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ height: 100, marginBottom: sp[4], position: 'relative', overflow: 'hidden', background: `${c.bgCard}`, border: `1px solid ${c.borderSubtle}` }}>
        <DecoPattern color={c.purple} opacity={0.06} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.purple, opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp[5]}`, zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: f.mono, fontSize: '10px', color: c.purple, letterSpacing: '0.12em', textTransform: 'uppercase', margin: `0 0 ${sp[1]}`, fontWeight: 600 }}>◆ BASE DE CONNAISSANCES</p>
            <h1 style={{ fontSize: size['2xl'], fontFamily: f.display, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>Formations CARAXES</h1>
          </div>
          <Icon d="M12 14l9-5-9-5-9 5 9 5zM12 14v7" size={48} color={c.purple} sw={1} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1px', marginBottom: sp[4], background: c.border, border: `1px solid ${c.border}` }}>
        {[{ key: 'interne', label: 'Formation Interne (~20h)', sub: 'Équipe CARAXES' }, { key: 'client', label: 'Formation Client (2H)', sub: 'Offre Création Boutique' }].map(tab => (
          <button key={tab.key} onClick={() => { setAdminFormationType(tab.key); setAdminActiveLesson(null); setAdminExpandedModule(null) }} style={{ flex: 1, padding: `${sp[2]} ${sp[3]}`, background: adminFormationType === tab.key ? c.bgElevated : c.bg, border: 'none', cursor: 'pointer', textAlign: 'start', borderBottom: `2px solid ${adminFormationType === tab.key ? c.purple : 'transparent'}` }}>
            <div style={{ fontWeight: 600, fontSize: size.sm, color: adminFormationType === tab.key ? c.text : c.textTertiary }}>{tab.label}</div>
            <div style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary }}>{tab.sub}</div>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: sp[3], display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: sp[2] }}>
        <a href={adminFormationType === 'interne' ? '/FORMATION_INTERNE_CARAXES.pdf' : '/FORMATION_CLIENT_CARAXES.pdf'} download target="_blank" rel="noopener noreferrer" style={{ padding: `8px ${sp[3]}`, background: 'transparent', color: c.red, border: `1px solid ${c.red}33`, fontFamily: f.mono, fontSize: '10px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', textDecoration: 'none', transition: `all 0.2s ${ease.smooth}` }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.background = `${c.red}08` }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.red}33`; e.currentTarget.style.background = 'transparent' }}>
          <Icon d={icons.download} size={13} color={c.red} />
          PDF
        </a>
        <button onClick={() => { const formUrl = adminFormationType === 'interne' ? '/FORMATION_INTERNE_CARAXES.html' : '/FORMATION_CLIENT_CARAXES.html'; window.open(formUrl, '_blank') }} style={{ padding: `8px ${sp[3]}`, background: 'transparent', color: c.gold, border: `1px solid ${c.gold}33`, fontFamily: f.mono, fontSize: '10px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', transition: `all 0.2s ${ease.smooth}` }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = `${c.gold}08` }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.gold}33`; e.currentTarget.style.background = 'transparent' }}>
          <Icon d={icons.eye} size={13} color={c.gold} />
          Voir HTML
        </button>
        <button onClick={handleSendToClient} style={{ padding: `8px ${sp[3]}`, background: c.purple, color: c.text, border: 'none', fontFamily: f.mono, fontSize: '10px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', transition: `all 0.35s ${ease.luxury}` }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.purpleSoft}` }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}>
          <Icon d={icons.send} size={13} color={c.text} />
          Envoyer au client
        </button>
      </div>

      {(() => {
        const formation = adminFormationType === 'interne' ? FORMATION_INTERNE : FORMATION_CLIENT
        if (adminActiveLesson) {
          const lesson = formation.modules.flatMap(m => m.lessons).find(l => l.id === adminActiveLesson)
          const parentModule = formation.modules.find(m => m.lessons.some(l => l.id === adminActiveLesson))
          if (!lesson) return null
          return (
            <div style={{ animation: `fadeSlideUp 0.3s ${ease.out} both` }}>
              <button onClick={() => setAdminActiveLesson(null)} style={{ background: 'none', border: 'none', color: c.textSecondary, fontSize: size.xs, fontFamily: f.mono, cursor: 'pointer', marginBottom: sp[3], padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>← Retour aux modules</button>
              <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderTop: `3px solid ${parentModule.color}`, padding: sp[4] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
                  <div>
                    <span style={{ fontFamily: f.mono, fontSize: '9px', color: parentModule.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{parentModule.icon} {parentModule.title}</span>
                    <h2 style={{ fontFamily: f.display, fontSize: size.xl, fontWeight: 700, color: c.text, margin: `${sp[1]} 0 0` }}>{lesson.title}</h2>
                  </div>
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, padding: '3px 10px', border: `1px solid ${c.gold}33` }}>{lesson.duration}</span>
                </div>
                <ArtDecoDivider color={parentModule.color} />
                <div style={{ fontSize: size.sm, color: c.textSecondary, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginTop: sp[3] }}>
                  {lesson.content.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i} style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: `${sp[3]} 0 ${sp[1]}` }}>{line.replace(/\*\*/g, '')}</h3>
                    if (line.startsWith('**') && line.includes('**')) { const parts = line.split('**'); return <p key={i} style={{ margin: `${sp[1]} 0` }}>{parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: c.text }}>{part}</strong> : part)}</p> }
                    if (line.startsWith('- ') || line.startsWith('→ ')) return <div key={i} style={{ paddingInlineStart: sp[2], margin: '4px 0', display: 'flex', gap: '8px' }}><span style={{ color: c.gold }}>·</span><span>{line.slice(2)}</span></div>
                    if (line.match(/^\d+\./)) return <div key={i} style={{ paddingInlineStart: sp[2], margin: '4px 0', display: 'flex', gap: '8px' }}><span style={{ color: c.gold, fontFamily: f.mono, fontSize: '10px', fontWeight: 700 }}>{line.match(/^\d+/)[0]}</span><span>{line.replace(/^\d+\.\s*/, '')}</span></div>
                    if (line.startsWith('|')) return null
                    if (line.trim() === '') return <div key={i} style={{ height: sp[2] }} />
                    return <p key={i} style={{ margin: `${sp[1]} 0` }}>{line}</p>
                  })}
                </div>
                {(() => {
                  const allLessons = formation.modules.flatMap(m => m.lessons)
                  const idx = allLessons.findIndex(l => l.id === adminActiveLesson)
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: sp[4], paddingTop: sp[3], borderTop: `1px solid ${c.borderSubtle}` }}>
                      {idx > 0 ? (<button onClick={() => setAdminActiveLesson(allLessons[idx - 1].id)} style={{ background: 'none', border: `1px solid ${c.border}`, color: c.textSecondary, padding: `6px ${sp[2]}`, fontSize: '10px', fontFamily: f.mono, cursor: 'pointer' }}>← {allLessons[idx - 1].title.slice(0, 30)}...</button>) : <div />}
                      {idx < allLessons.length - 1 ? (<button onClick={() => setAdminActiveLesson(allLessons[idx + 1].id)} style={{ background: 'none', border: `1px solid ${c.purple}`, color: c.purple, padding: `6px ${sp[2]}`, fontSize: '10px', fontFamily: f.mono, cursor: 'pointer' }}>{allLessons[idx + 1].title.slice(0, 30)}... →</button>) : <div />}
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(formation.modules.length, 3)}, 1fr)`, gap: sp[2], marginBottom: sp[2] }}>
              <div style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, borderInlineStart: `3px solid ${c.purple}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.08em' }}>MODULES</div>
                <div style={{ fontSize: size.lg, fontWeight: 700, color: c.text }}>{formation.modules.length}</div>
              </div>
              <div style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, borderInlineStart: `3px solid ${c.gold}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.08em' }}>LEÇONS</div>
                <div style={{ fontSize: size.lg, fontWeight: 700, color: c.text }}>{formation.modules.reduce((a, m) => a + m.lessons.length, 0)}</div>
              </div>
              <div style={{ padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`, borderInlineStart: `3px solid ${c.teal}` }}>
                <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, letterSpacing: '0.08em' }}>DURÉE</div>
                <div style={{ fontSize: size.lg, fontWeight: 700, color: c.text }}>{formation.duration}</div>
              </div>
            </div>
            {formation.modules.map((mod, modIdx) => (
              <div key={mod.id} style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderInlineStart: `3px solid ${mod.color}`, overflow: 'hidden', animation: `cardReveal 0.5s ${ease.smooth} ${modIdx * 50}ms backwards` }}>
                <button onClick={() => setAdminExpandedModule(adminExpandedModule === mod.id ? null : mod.id)} style={{ width: '100%', padding: `${sp[3]} ${sp[3]}`, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                    <span style={{ fontFamily: f.mono, fontSize: size.sm, color: mod.color, fontWeight: 700 }}>{mod.icon}</span>
                    <div>
                      <h3 style={{ fontFamily: f.display, fontSize: size.base, fontWeight: 700, color: c.text, margin: 0 }}>{mod.title}</h3>
                      <p style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary, margin: '2px 0 0' }}>{mod.lessons.length} leçons · {mod.duration}</p>
                    </div>
                  </div>
                  <Icon d={adminExpandedModule === mod.id ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} size={16} color={c.textTertiary} />
                </button>
                {adminExpandedModule === mod.id && (
                  <div style={{ borderTop: `1px solid ${c.borderSubtle}`, padding: `0 ${sp[3]} ${sp[2]}` }}>
                    {mod.lessons.map((lesson, lIdx) => (
                      <button key={lesson.id} onClick={() => setAdminActiveLesson(lesson.id)} style={{ width: '100%', padding: `${sp[2]} ${sp[2]}`, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: lIdx < mod.lessons.length - 1 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'start', transition: `background 0.15s ${ease.smooth}` }} onMouseEnter={(e) => { e.currentTarget.style.background = c.bgHover }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp[2] }}>
                          <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontFamily: f.mono, fontWeight: 700, color: mod.color, border: `1px solid ${mod.color}33`, flexShrink: 0 }}>{lIdx + 1}</span>
                          <span style={{ fontSize: size.sm, color: c.text, fontWeight: 500 }}>{lesson.title}</span>
                        </div>
                        <span style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary, flexShrink: 0 }}>{lesson.duration}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })()}
    </div>

    {sendModalOpen && (
      <div onClick={(e) => { if (e.target === e.currentTarget) setSendModalOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: c.bgElevated, border: `1px solid ${c.border}`, borderTop: `3px solid ${c.purple}`, width: 'min(480px, 92vw)', padding: sp[4], maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp[3] }}>
            <div>
              <p style={{ fontFamily: f.mono, fontSize: '10px', color: c.purple, letterSpacing: '0.12em', textTransform: 'uppercase', margin: `0 0 4px`, fontWeight: 600 }}>◆ Envoi formation</p>
              <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.01em' }}>{adminFormationType === 'interne' ? 'Formation Interne (~20h)' : 'Formation Client (2h)'}</h3>
            </div>
            <button onClick={() => setSendModalOpen(false)} style={{ background: 'transparent', border: 'none', color: c.textTertiary, cursor: 'pointer', padding: 4 }} aria-label="Fermer"><Icon d={icons.close} size={18} color={c.textTertiary} /></button>
          </div>
          <label style={{ display: 'block', fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[1] }}>Client destinataire</label>
          <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} style={{ width: '100%', padding: `${sp[2]} ${sp[2]}`, background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 0, fontSize: size.sm, fontFamily: f.body, marginBottom: sp[3] }}>
            <option value="">— Sélectionner un client —</option>
            {(clients || []).map((cl) => (<option key={cl.id} value={cl.id}>{cl.full_name || cl.email || cl.id.slice(0, 8)}{cl.email ? ` · ${cl.email}` : ''}</option>))}
          </select>
          <label style={{ display: 'block', fontFamily: f.mono, fontSize: '10px', color: c.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sp[1] }}>Canal d'envoi</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2], marginBottom: sp[4] }}>
            {[{ key: 'email', label: 'Email', icon: icons.mail, accent: c.gold }, { key: 'whatsapp', label: 'WhatsApp', icon: 'M20.52 3.48A12 12 0 0 0 3.48 20.52L2 22l1.6-4.7a10 10 0 1 0 16.92-13.82z', accent: '#25D366' }].map((opt) => (
              <button key={opt.key} onClick={() => setSelectedChannel(opt.key)} style={{ padding: sp[2], background: selectedChannel === opt.key ? `${opt.accent}15` : 'transparent', border: `1px solid ${selectedChannel === opt.key ? opt.accent : c.border}`, color: selectedChannel === opt.key ? opt.accent : c.textSecondary, fontFamily: f.body, fontSize: size.sm, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: `all 0.2s ${ease.smooth}` }}>
                <Icon d={opt.icon} size={14} color={selectedChannel === opt.key ? opt.accent : c.textSecondary} />
                {opt.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: c.textTertiary, fontStyle: 'italic', marginBottom: sp[3], lineHeight: 1.5 }}>{selectedChannel === 'email' ? 'Ouvrira votre client mail avec un message pré-rempli contenant les liens HTML et PDF.' : 'Ouvrira WhatsApp dans un nouvel onglet avec un message pré-rempli pour le numéro du client.'}</p>
          <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
            <button onClick={() => setSendModalOpen(false)} style={{ padding: `${sp[2]} ${sp[3]}`, background: 'transparent', color: c.textSecondary, border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, cursor: 'pointer' }}>Annuler</button>
            <button onClick={handleConfirmSend} disabled={!selectedClientId} style={{ padding: `${sp[2]} ${sp[3]}`, background: selectedClientId ? c.purple : c.bgHover, color: selectedClientId ? c.text : c.textTertiary, border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: selectedClientId ? 'pointer' : 'not-allowed', letterSpacing: '0.02em' }}>Envoyer →</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
