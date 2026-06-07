/* ── CARAXES Admin — Team Chat Tab ── */
import { useState, useEffect, useRef } from 'react'
import { useAdmin } from './AdminContext'
import { Icon, icons, DragonMark, DragonEmptyState, fmtDate } from './AdminShared'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'

export default function TeamChatTab() {
  const {
    mainTab, user, profile, allProfiles,
    t, toast,
    supabase,
    getAdminMessages, sendAdminMessage, subscribeToAdminMessages, playNotificationSound,
  } = useAdmin()

  // Local state
  const [teamMessages, setTeamMessages] = useState([])
  const [teamMsgInput, setTeamMsgInput] = useState('')
  const [teamMsgSending, setTeamMsgSending] = useState(false)

  // Refs
  const teamChatRef = useRef(null)
  const teamChatLoadedRef = useRef(false)

  // ── Team Chat: load messages + subscribe ──
  useEffect(() => {
    if (mainTab !== 'team_chat') return
    if (!teamChatLoadedRef.current) {
      getAdminMessages().then(msgs => {
        setTeamMessages(msgs)
        teamChatLoadedRef.current = true
        setTimeout(() => teamChatRef.current?.scrollTo(0, teamChatRef.current.scrollHeight), 100)
      }).catch(console.error)
    }
    const sub = subscribeToAdminMessages((newMsg) => {
      // feed channel
      setTeamMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      if (newMsg.sender_id !== user?.id) {
        playNotificationSound()
      }
      setTimeout(() => teamChatRef.current?.scrollTo(0, teamChatRef.current.scrollHeight), 100)
    }, 'admin-chat-feed')
    return () => { supabase.removeChannel(sub) }
  }, [mainTab, user?.id])

  // ── Team Chat: send internal message ──
  const handleSendTeamMsg = async (e) => {
    e.preventDefault()
    if (!teamMsgInput.trim() || teamMsgSending) return
    setTeamMsgSending(true)
    const text = teamMsgInput; setTeamMsgInput('')
    try {
      const newMsg = await sendAdminMessage({ senderId: user.id, senderName: profile?.full_name || 'Admin', content: text })
      // Optimistic UI: realtime may not echo self-insert, so push the returned message
      if (newMsg) {
        setTeamMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
        setTimeout(() => teamChatRef.current?.scrollTo(0, teamChatRef.current.scrollHeight), 100)
      }
    } catch (err) {
      setTeamMsgInput(text)
      toast.error('Erreur envoi message')
    } finally { setTeamMsgSending(false) }
  }

  if (mainTab !== 'team_chat') return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{
        padding: `${sp[3]} ${sp[4]}`, borderBottom: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', gap: sp[2],
      }}>
        <DragonMark s={22} />
        <div>
          <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>
            Chat Équipe
          </h2>
          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.goldDim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            CANAL INTERNE — {allProfiles.filter(p => p.role === 'admin').length} membres
          </div>
        </div>
      </div>

      {/* Members bar */}
      <div style={{
        padding: `${sp[1.5]} ${sp[4]}`, background: c.bgSurface,
        borderBottom: `1px solid ${c.borderSubtle}`,
        display: 'flex', alignItems: 'center', gap: sp[2], flexWrap: 'wrap',
      }}>
        {allProfiles.filter(p => p.role === 'admin').map((admin, i) => (
          <div key={admin.id} style={{
            display: 'flex', alignItems: 'center', gap: sp[1],
            padding: `4px ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.borderSubtle}`,
            borderRadius: radius.pill,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: c.green,
              boxShadow: `0 0 6px ${c.green}`,
            }} />
            <span style={{ fontFamily: f.body, fontSize: '11px', color: c.text, fontWeight: 500 }}>
              {admin.full_name || admin.email?.split('@')[0] || 'Admin'}
            </span>
          </div>
        ))}
      </div>

      {/* Messages area */}
      <div ref={teamChatRef} className="admin-scroll" style={{
        flex: 1, overflowY: 'auto', padding: `${sp[3]} ${sp[4]}`,
        display: 'flex', flexDirection: 'column', gap: sp[2],
      }}>
        {teamMessages.length === 0 && (
          <DragonEmptyState
            title="Aucun message"
            subtitle="Commencez une discussion avec votre équipe. Les messages sont visibles par tous les admins."
          />
        )}
        {teamMessages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id
          const senderProfile = allProfiles.find(p => p.id === msg.sender_id)
          const senderName = senderProfile?.full_name || senderProfile?.email?.split('@')[0] || 'Admin'
          const showAvatar = i === 0 || teamMessages[i - 1]?.sender_id !== msg.sender_id
          return (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
              animation: `fadeSlideIn 0.2s ${ease.out}`,
            }}>
              <div style={{ maxWidth: '70%' }}>
                {showAvatar && (
                  <div style={{
                    fontSize: '10px', fontFamily: f.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: isMe ? c.gold : c.textTertiary, marginBottom: '4px', fontWeight: 600,
                    textAlign: isMe ? 'right' : 'left',
                  }}>
                    {senderName}
                  </div>
                )}
                <div style={{
                  padding: `${sp[2]} ${sp[3]}`,
                  background: isMe ? c.bgElevated : c.bgCard,
                  border: `1px solid ${isMe ? c.borderGold : c.border}`,
                  borderRadius: radius.md,
                  boxShadow: shadow.xs,
                }}>
                  <div style={{ fontSize: size.sm, lineHeight: 1.6, color: c.text }}>{msg.content}</div>
                  <div style={{ fontSize: '9px', opacity: 0.4, marginTop: '4px', fontFamily: f.mono, letterSpacing: '0.02em', textAlign: 'right' }}>
                    {fmtDate(msg.created_at)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input area */}
      <form onSubmit={handleSendTeamMsg} style={{
        padding: `${sp[2]} ${sp[4]}`, borderTop: `1px solid ${c.border}`,
        display: 'flex', gap: sp[2], alignItems: 'center', background: c.bgSurface,
      }}>
        <input
          type="text"
          value={teamMsgInput}
          onChange={(e) => setTeamMsgInput(e.target.value)}
          placeholder="Écrire un message à l'équipe..."
          style={{
            flex: 1, padding: `11px ${sp[3]}`, background: c.bgInput,
            border: `1px solid ${c.borderSubtle}`, borderRadius: radius.md,
            color: c.text, fontFamily: f.body, fontSize: size.sm,
            outline: 'none', transition: `border-color 0.2s ${ease.luxury}`,
            boxShadow: shadow.inner,
          }}
          onFocus={(e) => e.target.style.borderColor = c.goldDim}
          onBlur={(e) => e.target.style.borderColor = c.borderSubtle}
        />
        <button type="submit" disabled={teamMsgSending || !teamMsgInput.trim()} style={{
          padding: `11px ${sp[3]}`, background: c.gold, border: 'none',
          borderRadius: radius.md, color: c.bg, fontFamily: f.mono,
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
          cursor: teamMsgSending ? 'wait' : 'pointer', textTransform: 'uppercase',
          opacity: teamMsgInput.trim() ? 1 : 0.5,
          boxShadow: `0 2px 8px rgba(196, 163, 90, 0.2)`,
          transition: `all 0.25s ${ease.luxury}`,
          display: 'flex', alignItems: 'center', gap: sp[1],
        }}>
          <Icon d={icons.send} size={14} color={c.bg} sw={2} />
          ENVOYER
        </button>
      </form>
    </div>
  )
}
