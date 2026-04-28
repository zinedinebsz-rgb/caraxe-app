import { useState, useRef, useEffect } from 'react'
import { signInWithPassword, signUpWithPassword, resetPassword, signInWithEmail, resendConfirmationEmail, signInWithGoogle } from '../lib/supabase'
import { c, f, size, sp, ease, shadow, transition, radius, gradient, glass } from '../lib/theme'
import { useI18n } from '../lib/i18n'

/* ── Dragon mark — refined CARAXES fierce dragon ── */
const DragonMark = ({ s = 44 }) => (
  <svg width={s} height={s} viewBox="0 0 44 44" fill="none" style={{ filter: 'none' }}>
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill={c.red} opacity="0.85"/>
    <path d="M22 3L13 12Q7 18 7 24Q7 32 13 36L17 39Q19 41 22 41Q25 41 27 39L31 36Q37 32 37 24Q37 18 31 12L22 3Z" fill="none" stroke={c.gold} strokeWidth="0.5" opacity="0.3"/>
    <path d="M13 12L7 5M31 12L37 5" stroke={c.gold} strokeWidth="1.2" opacity="0.6"/>
    <path d="M17 8L15 3M27 8L29 3" stroke={c.gold} strokeWidth="0.8" opacity="0.35"/>
    <circle cx="17.5" cy="21" r="2.2" fill={c.gold} opacity="0.9"/>
    <circle cx="26.5" cy="21" r="2.2" fill={c.gold} opacity="0.9"/>
    <ellipse cx="17.5" cy="21" rx="0.9" ry="2" fill={c.black}/>
    <ellipse cx="26.5" cy="21" rx="0.9" ry="2" fill={c.black}/>
    <path d="M15 17L13 14.5M29 17L31 14.5" stroke={c.redDeep} strokeWidth="1.2" opacity="0.5"/>
  </svg>
)

/* ── Film grain overlay ── */
const FilmGrain = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.025, mixBlendMode: 'overlay', zIndex: 1 }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
)

/* ── Art Deco Divider — gold gradient line with diamond center ── */
const ArtDecoDivider = ({ width = 200 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: width }}>
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${c.goldLine})` }} />
    <div style={{ width: 6, height: 6, background: c.gold, transform: 'rotate(45deg)', opacity: 0.4, flexShrink: 0 }} />
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${c.goldLine}, transparent)` }} />
  </div>
)

/* ── Feature Item — premium with stagger ── */
const FeatureItem = ({ icon, label, delay }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: sp[2],
        animation: `featureReveal 0.7s ${ease.out} ${delay}s both`,
        cursor: 'default',
      }}
    >
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        borderRadius: radius.sm,
        background: hovered ? 'rgba(28, 26, 24, 0.8)' : 'rgba(22, 20, 19, 0.6)',
        border: `1px solid ${hovered ? c.goldLine : c.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: transition.normal,
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? c.gold : c.goldDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: transition.color }}>
          <path d={icon} />
        </svg>
      </div>
      <span style={{
        fontSize: size.sm, color: hovered ? c.text : c.textSecondary, lineHeight: 1.5,
        fontFamily: f.body, letterSpacing: '0.01em',
        transition: transition.color,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ── Premium Input — bottom border style, gold focus accent ── */
const PremiumInput = ({ label, type = 'text', value, onChange, placeholder, focused, onFocus, onBlur, autoFocus, minLength, required = true }) => (
  <div style={{ marginBottom: sp[3] }}>
    <label style={{
      display: 'block', fontSize: '10px', fontWeight: 600,
      color: c.textTertiary, marginBottom: sp[1],
      fontFamily: f.mono, letterSpacing: '0.12em', textTransform: 'uppercase',
      transition: transition.color,
      ...(focused && { color: c.goldDim }),
    }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input type={type} required={required} value={value}
        onChange={onChange} placeholder={placeholder}
        autoFocus={autoFocus} minLength={minLength}
        onFocus={onFocus} onBlur={onBlur}
        style={{
          width: '100%', padding: '14px 16px',
          background: c.bgInput,
          border: 'none',
          borderBottom: `2px solid ${focused ? c.gold : c.borderLight}`,
          borderRadius: `${radius.xs} ${radius.xs} 0 0`,
          color: c.text, fontSize: size.sm, fontFamily: f.body,
          outline: 'none', boxSizing: 'border-box',
          transition: `border-color 0.3s ${ease.luxury}, background 0.3s ${ease.luxury}, box-shadow 0.3s ${ease.luxury}`,
          boxShadow: focused ? `0 2px 8px rgba(196, 163, 90, 0.08)` : 'none',
          letterSpacing: '0.01em',
        }}
      />
    </div>
  </div>
)

export default function Login() {
  const { t, locale, setLocale } = useI18n()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [focused, setFocused] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const resetForm = () => { setError(null); setSuccess(null); setSent(false) }
  const switchMode = (m) => { resetForm(); setMode(m) }

  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resending, setResending] = useState(false)

  const translateError = (msg) => {
    if (!msg) return t('common.error') || 'Une erreur est survenue.'
    const m = msg.toLowerCase()
    if (m.includes('invalid login') || m.includes('invalid_credentials')) return t('auth.invalidCredentials') || 'Email ou mot de passe incorrect.'
    if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'Votre email n\u2019est pas encore confirmé. Vérifiez votre boîte de réception (et les spams).'
    if (m.includes('rate limit') || m.includes('too many requests') || m.includes('over_email_send_rate_limit')) return 'Trop de tentatives. Attendez quelques minutes avant de réessayer.'
    if (m.includes('already registered') || m.includes('user_already_exists')) return 'Cet email est déjà utilisé. Connectez-vous ou réinitialisez votre mot de passe.'
    if (m.includes('signup_disabled') || m.includes('signups not allowed')) return 'Les inscriptions sont temporairement désactivées.'
    if (m.includes('invalid email') || m.includes('unable to validate')) return 'Adresse email invalide.'
    if (m.includes('network') || m.includes('fetch') || m.includes('failed')) return 'Erreur de connexion. Vérifiez votre internet et réessayez.'
    if (m.includes('weak password') || m.includes('password')) return 'Le mot de passe doit contenir au moins 6 caractères.'
    return msg
  }

  const handleResendConfirmation = async () => {
    if (!email.trim()) return
    setResending(true); setError(null)
    const { error } = await resendConfirmationEmail(email)
    setResending(false)
    if (error) {
      setError(translateError(error.message))
    } else {
      setSuccess('Email de confirmation renvoyé ! Vérifiez votre boîte de réception.')
      setSent(true)
      setNeedsConfirmation(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError(null); setNeedsConfirmation(false)
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) {
      const msg = error.message || ''
      const isConfirmation = msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('email_not_confirmed')
      if (isConfirmation) setNeedsConfirmation(true)
      setError(translateError(msg))
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    setLoading(true); setError(null)
    const { error } = await signUpWithPassword(email, password, fullName)
    setLoading(false)
    if (error) {
      setError(translateError(error.message))
    } else {
      setSent(true)
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription. Pensez à regarder dans les spams.')
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(translateError(error.message))
    else { setSent(true); setSuccess('Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception et les spams.') }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(translateError(error.message))
    else { setSent(true); setSuccess('Un lien de connexion a été envoyé à votre email. Vérifiez aussi les spams.') }
  }

  const active = email.trim().length > 0

  const titles = {
    login: t('auth.login'),
    signup: t('auth.signupShort') || t('auth.signup'),
    forgot: t('auth.forgotPassword'),
    magic: t('auth.magicLink'),
  }

  const subtitles = {
    login: locale === 'ar' ? 'الوصول إلى مساحتك الشخصية.' : 'Accédez à votre espace de suivi.',
    signup: locale === 'ar' ? 'انضم إلى CARAXES لإدارة طلباتك.' : 'Rejoignez CARAXES pour gérer vos commandes.',
    forgot: locale === 'ar' ? 'إعادة تعيين كلمة المرور عبر البريد.' : 'Réinitialisez votre mot de passe par email.',
    magic: t('auth.magicLinkDesc'),
  }

  const features = [
    { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      label: locale === 'ar' ? 'تتبع طلباتك في الوقت الفعلي' : 'Suivi en temps réel de vos commandes' },
    { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      label: locale === 'ar' ? 'مراسلة مباشرة مع وكيلك' : 'Messagerie directe avec votre agent' },
    { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      label: locale === 'ar' ? 'مستندات وفواتير في مكان واحد' : 'Documents et factures centralisés' },
    { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      label: locale === 'ar' ? 'معاملات آمنة ومحمية' : 'Transactions sécurisées et protégées' },
  ]

  const linkBtn = (text, onClick, highlight = false) => (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', padding: 0,
      color: highlight ? c.gold : c.textTertiary,
      fontSize: size.xs, cursor: 'pointer', fontFamily: f.body,
      fontWeight: highlight ? 600 : 400,
      transition: transition.color,
      borderBottom: `1px solid transparent`,
    }}
      onMouseEnter={(e) => { e.target.style.color = highlight ? c.goldBright : c.textSecondary; if (highlight) e.target.style.borderBottomColor = c.goldBright }}
      onMouseLeave={(e) => { e.target.style.color = highlight ? c.gold : c.textTertiary; e.target.style.borderBottomColor = 'transparent' }}
    >{text}</button>
  )

  return (
    <div style={{
      minHeight: '100vh', background: c.bg,
      display: 'flex', position: 'relative', overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'scale(1)' : 'scale(0.98)',
      transition: `opacity 0.7s ${ease.luxury}, transform 0.7s ${ease.luxury}`,
    }}>

      {/* Language toggle — top right, over everything */}
      <div style={{
        position: 'absolute', top: sp[3], right: sp[3], zIndex: 100,
        display: 'flex', gap: 2, padding: 2,
        borderRadius: radius.sm,
        background: 'rgba(18, 16, 14, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${c.borderSubtle}`,
      }}>
        {['fr', 'ar'].map((loc) => {
          const isActive = locale === loc
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              aria-label={loc === 'fr' ? 'Français' : 'العربية'}
              style={{
                padding: '6px 12px',
                background: isActive ? c.gold : 'transparent',
                color: isActive ? c.black : c.textTertiary,
                border: 'none',
                borderRadius: radius.xs,
                fontSize: '10px',
                fontFamily: f.mono,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: `all 0.2s ${ease.smooth}`,
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = c.text }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = c.textTertiary }}
            >
              {loc === 'fr' ? 'FR' : 'AR'}
            </button>
          )
        })}
      </div>

      {/* ── LEFT PANEL — Atmospheric Brand ── */}
      <div className="login-left" style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: `${sp[8]} ${sp[8]}`, position: 'relative', overflow: 'hidden',
        animation: `panelReveal 0.9s ${ease.out} both`,
      }}>
        {/* Film grain on left panel */}
        <FilmGrain />

        {/* Atmospheric red glow from top */}
        <div style={{
          position: 'absolute', width: '140%', height: '60%',
          background: `radial-gradient(ellipse at 30% 0%, rgba(196, 58, 47, 0.07) 0%, transparent 65%)`,
          top: '-10%', left: '-20%', pointerEvents: 'none',
        }} />

        {/* Subtle gold glow bottom-right */}
        <div style={{
          position: 'absolute', width: '400px', height: '400px',
          background: `radial-gradient(ellipse, rgba(196, 163, 90, 0.03) 0%, transparent 70%)`,
          bottom: '-100px', right: '-50px', pointerEvents: 'none',
        }} />

        {/* Art deco corner ornament — top left */}
        <div style={{
          position: 'absolute', top: sp[4], left: sp[4],
          opacity: 0.12, pointerEvents: 'none',
        }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z" fill={c.gold}/>
            <path d="M12 0 L12 12 L0 12" stroke={c.gold} strokeWidth="0.5" fill="none"/>
          </svg>
        </div>

        {/* Art deco corner ornament — bottom right */}
        <div style={{
          position: 'absolute', bottom: sp[4], right: sp[4],
          opacity: 0.12, pointerEvents: 'none', transform: 'rotate(180deg)',
        }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z" fill={c.gold}/>
            <path d="M12 0 L12 12 L0 12" stroke={c.gold} strokeWidth="0.5" fill="none"/>
          </svg>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px' }}>
          {/* Logo group */}
          <div style={{
            marginBottom: sp[6],
            animation: `featureReveal 0.7s ${ease.out} 0.1s both`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp[2], marginBottom: sp[1.5],
            }}>
              <DragonMark s={64} />
              <div>
                <span style={{
                  fontFamily: f.display, fontWeight: 600, fontSize: size['2xl'],
                  letterSpacing: '0.15em', color: c.gold, display: 'block',
                }}>
                  CARAXE<span style={{ color: c.redVivid }}>S</span>
                </span>
              </div>
            </div>
            <p style={{
              fontFamily: f.mono, fontSize: '10px', color: c.textTertiary,
              letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0,
              paddingLeft: '2px',
            }}>
              {locale === 'ar' ? 'وكيل الاستيراد من الصين' : 'Agent de Sourcing Chine'}
            </p>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: f.display, fontSize: size.hero, fontWeight: 400,
            lineHeight: 1.05, color: c.text, maxWidth: '520px',
            letterSpacing: '-0.03em', margin: `0 0 ${sp[3]} 0`,
            animation: `featureReveal 0.7s ${ease.out} 0.2s both`,
          }}>
            {locale === 'ar' ? (
              <>منتجاتك من الصين —{' '}
                <em style={{
                  fontStyle: 'italic', color: c.red,
                  textShadow: 'none',
                }}>نبحث، نفحص، نسلم.</em>
              </>
            ) : (
              <>Vos produits depuis la Chine —{' '}
                <em style={{
                  fontStyle: 'italic', color: c.red,
                  textShadow: 'none',
                }}>trouvés, inspectés, livrés.</em>
              </>
            )}
          </h1>

          <p style={{
            fontSize: size.base, lineHeight: 1.75, color: c.textSecondary,
            maxWidth: '460px', fontFamily: f.body,
            margin: `0 0 ${sp[5]} 0`, fontWeight: 300,
            animation: `featureReveal 0.7s ${ease.out} 0.3s both`,
          }}>
            {locale === 'ar'
              ? 'تتبع طلباتك في الوقت الفعلي، تواصل مع وكيلك، واستلم مستنداتك — من مساحة واحدة.'
              : 'Suivez vos commandes en temps réel, échangez avec votre agent et recevez vos documents — depuis un seul espace.'}
          </p>

          {/* Art Deco gold divider */}
          <div style={{
            marginBottom: sp[5],
            animation: `featureReveal 0.7s ${ease.out} 0.35s both`,
          }}>
            <ArtDecoDivider width={240} />
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2.5] || sp[3], maxWidth: '440px' }}>
            {features.map((item, i) => (
              <FeatureItem key={i} icon={item.icon} label={item.label} delay={0.4 + i * 0.1} />
            ))}
          </div>

          {/* Social proof stats */}
          <div style={{
            marginTop: sp[6], display: 'flex', gap: sp[6], flexWrap: 'wrap',
            animation: `featureReveal 0.7s ${ease.out} 0.9s both`,
          }}>
            {[
              { value: '847', label: locale === 'ar' ? 'منتج تم إيجاده' : 'Produits sourcés' },
              { value: '96%', label: locale === 'ar' ? 'عميل راض' : 'Clients satisfaits' },
              { value: '-35%', label: locale === 'ar' ? 'تكلفة الشراء' : 'Coûts d\u2019achat' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: f.display, fontSize: size.xl, fontWeight: 600,
                  color: c.gold, letterSpacing: '-0.02em', lineHeight: 1,
                }}>{stat.value}</div>
                <div style={{
                  fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px',
                }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div style={{
            marginTop: sp[4], display: 'flex', alignItems: 'center', gap: sp[1],
            animation: `featureReveal 0.7s ${ease.out} 1s both`,
          }}>
            <div style={{ width: 4, height: 4, background: c.goldDim, borderRadius: '50%', opacity: 0.4 }} />
            <p style={{
              fontFamily: f.mono, fontSize: '9px',
              color: c.textGhost, letterSpacing: '0.14em', textTransform: 'uppercase',
              margin: 0,
            }}>
              Yiwu  ·  Guangzhou  ·  Shenzhen
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Auth Form (glass card) ── */}
      <div className="login-right" style={{
        width: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: sp[6], position: 'relative',
        background: c.bgWarm,
        borderLeft: `1px solid ${c.borderSubtle}`,
        animation: `formReveal 0.9s ${ease.out} 0.15s both`,
      }}>
        {/* Subtle vertical gold accent line on left edge */}
        <div style={{
          position: 'absolute', top: '15%', left: 0, width: '1px', height: '70%',
          background: `linear-gradient(180deg, transparent, ${c.goldLine}, transparent)`,
        }} />

        {/* Subtle radial glow top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
          background: `radial-gradient(circle at top right, rgba(196, 163, 90, 0.03) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: '380px' }}>
          {sent ? (
            /* ── Confirmation state ── */
            <div style={{
              textAlign: 'center',
              animation: `confirmReveal 0.5s ${ease.out}`,
            }}>
              <div style={{
                width: 64, height: 64,
                background: c.greenSoft,
                border: `1px solid rgba(90, 170, 106, 0.15)`,
                borderRadius: radius.lg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: `0 auto ${sp[3]}`,
                animation: `confirmPulse 2s ${ease.smooth} infinite`,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <h2 style={{
                fontFamily: f.display, fontSize: size.lg, fontWeight: 500,
                marginBottom: sp[1], color: c.text, margin: `0 0 ${sp[1]} 0`,
                letterSpacing: '-0.01em',
              }}>{locale === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Vérifiez votre email'}</h2>
              <p style={{
                fontSize: size.sm, color: c.textSecondary, lineHeight: 1.6,
                margin: `0 0 ${sp[2]} 0`,
              }}>{success}</p>
              <p style={{
                fontFamily: f.mono, fontSize: size.xs, color: c.gold,
                padding: `${sp[1]} ${sp[2]}`, background: c.goldSoft,
                borderRadius: radius.sm,
                display: 'inline-block', margin: `0 0 ${sp[3]} 0`,
                letterSpacing: '0.03em', border: `1px solid ${c.goldLine}`,
              }}>{email}</p>
              <p style={{ fontSize: size.xs, color: c.textTertiary, lineHeight: 1.7, margin: 0 }}>
                {mode === 'signup'
                  ? (locale === 'ar' ? 'انقر على الرابط في البريد لتفعيل حسابك.' : 'Cliquez sur le lien dans l\u2019email pour activer votre compte.')
                  : mode === 'forgot'
                  ? (locale === 'ar' ? 'انقر على الرابط لتعيين كلمة مرور جديدة.' : 'Cliquez sur le lien pour définir un nouveau mot de passe.')
                  : (locale === 'ar' ? 'انقر على الرابط للوصول إلى حسابك.' : 'Cliquez sur le lien dans l\u2019email pour accéder à votre espace.')}
              </p>
              <button onClick={() => { switchMode('login'); setEmail(''); setPassword('') }} style={{
                marginTop: sp[4], padding: `12px ${sp[4]}`,
                background: 'transparent', border: `1px solid ${c.border}`,
                borderRadius: radius.sm,
                color: c.textSecondary, fontSize: size.xs, cursor: 'pointer',
                fontFamily: f.body, transition: transition.normal,
                letterSpacing: '0.02em',
              }}
                onMouseEnter={(e) => { e.target.style.borderColor = c.gold; e.target.style.color = c.text }}
                onMouseLeave={(e) => { e.target.style.borderColor = c.border; e.target.style.color = c.textSecondary }}
              >{locale === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Retour à la connexion'}</button>
            </div>
          ) : (
            <div style={{ animation: `formContentReveal 0.6s ${ease.out} 0.3s both` }}>
              {/* Mobile-only logo (shows when left panel is hidden) */}
              <div className="login-mobile-logo" style={{
                display: 'none', alignItems: 'center', gap: sp[2],
                marginBottom: sp[5], justifyContent: 'center', flexDirection: 'column',
              }}>
                <DragonMark s={48} />
                <span style={{
                  fontFamily: f.display, fontWeight: 600, fontSize: size.xl,
                  letterSpacing: '0.15em', color: c.gold,
                }}>CARAXE<span style={{ color: c.redVivid }}>S</span></span>
                <span style={{
                  fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>{locale === 'ar' ? 'وكيل الاستيراد من الصين' : 'Agent de Sourcing Chine'}</span>
              </div>

              {/* Form card — Cinematic Noir */}
              <div style={{
                background: c.bgCard,
                border: 'none',
                borderTop: `2px solid ${c.gold}`,
                borderRadius: radius.md,
                padding: `${sp[5]} ${sp[4]}`,
                boxShadow: shadow.lg,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Gold shine sweep on card */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: gradient.goldShine,
                  pointerEvents: 'none', opacity: 0.6,
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Mode indicator */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: sp[3],
                  }}>
                    <div style={{ width: 24, height: '1.5px', background: gradient.goldLine }} />
                    <span style={{
                      fontFamily: f.mono, fontSize: '9px', color: c.goldDim,
                      letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                    }}>
                      {mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.signup') : mode === 'forgot' ? t('auth.recovery') : t('auth.magicLink')}
                    </span>
                  </div>

                  <h2 style={{
                    fontFamily: f.display, fontSize: size.xl, fontWeight: 400,
                    margin: `0 0 ${sp[1]} 0`, color: c.text, letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}>{titles[mode]}</h2>
                  <p style={{
                    fontSize: size.sm, color: c.textSecondary, margin: `0 0 ${sp[4]} 0`,
                    lineHeight: 1.6, fontFamily: f.body, fontWeight: 300,
                  }}>
                    {subtitles[mode]}
                  </p>

                  <form onSubmit={
                    mode === 'login' ? handleLogin :
                    mode === 'signup' ? handleSignup :
                    mode === 'forgot' ? handleForgot :
                    handleMagicLink
                  }>
                    {mode === 'signup' && (
                      <PremiumInput label={t('auth.name')} value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('auth.namePlaceholder')} focused={focused === 'name'}
                        onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />
                    )}

                    <PremiumInput label={t('auth.email')} type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder')} autoFocus focused={focused === 'email'}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />

                    {(mode === 'login' || mode === 'signup') && (
                      <div style={{ position: 'relative' }}>
                        <PremiumInput label={t('auth.password')} type={showPassword ? 'text' : 'password'} value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? t('auth.passwordSignupPlaceholder') : t('auth.passwordPlaceholder')}
                          minLength={mode === 'signup' ? 6 : undefined}
                          focused={focused === 'pass'}
                          onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          style={{
                            position: 'absolute', right: '12px', top: '38px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: c.textTertiary, padding: '4px',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = c.textSecondary}
                          onMouseLeave={(e) => e.currentTarget.style.color = c.textTertiary}
                          title={showPassword ? 'Masquer' : 'Afficher'}
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    )}

                    {mode === 'login' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: sp[3], marginTop: `-${sp[1]}`,
                      }}>
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          cursor: 'pointer', userSelect: 'none',
                        }}>
                          <input type="checkbox" defaultChecked style={{
                            width: 14, height: 14, accentColor: c.gold,
                            cursor: 'pointer',
                          }} />
                          <span style={{
                            fontFamily: f.body, fontSize: size.xs, color: c.textTertiary,
                          }}>
                            {locale === 'ar' ? 'تذكرني' : 'Rester connecté'}
                          </span>
                        </label>
                        {linkBtn(t('auth.forgotPassword'), () => switchMode('forgot'), true)}
                      </div>
                    )}

                    {error && (
                      <div style={{
                        fontSize: size.xs, color: c.red, marginBottom: sp[3],
                        padding: `${sp[1.5]} ${sp[2]}`, background: c.redSoft, lineHeight: 1.6,
                        border: `1px solid ${c.redGlow}`,
                        borderRadius: radius.sm,
                        animation: `shakeError 0.4s ${ease.out}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp[1] }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.red} strokeWidth="1.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                          </svg>
                          <span>{error}</span>
                        </div>
                        {needsConfirmation && (
                          <button type="button" onClick={handleResendConfirmation} disabled={resending}
                            style={{
                              marginTop: sp[1], padding: '6px 14px', fontSize: size.xs,
                              background: c.red, color: c.white, border: 'none',
                              borderRadius: radius.xs,
                              cursor: resending ? 'wait' : 'pointer', fontFamily: f.body,
                              fontWeight: 600, letterSpacing: '0.02em', width: '100%',
                              opacity: resending ? 0.7 : 1,
                            }}>
                            {resending ? t('auth.resending') : t('auth.resendConfirmation')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Gold divider */}
                    <div style={{
                      height: '1px', margin: `${sp[3]} 0`,
                      background: gradient.goldLine,
                    }} />

                    {/* Submit button — gold CTA */}
                    <button type="submit" disabled={loading || !active} style={{
                      width: '100%', padding: '18px 16px', marginTop: '0',
                      background: active ? c.gold : c.bgElevated,
                      color: active ? c.black : c.textTertiary,
                      border: active ? 'none' : `1px solid ${c.border}`,
                      borderRadius: radius.sm,
                      fontSize: size.sm, fontWeight: 700,
                      fontFamily: f.mono, letterSpacing: '0.12em',
                      cursor: active ? 'pointer' : 'default',
                      transition: `all 0.35s ${ease.luxury}`,
                      opacity: loading ? 0.7 : 1,
                      boxShadow: active ? `0 4px 20px rgba(196, 163, 90, 0.2)` : 'none',
                      textTransform: 'uppercase',
                      position: 'relative', overflow: 'hidden',
                    }}
                      onMouseEnter={(e) => {
                        if (active && !loading) {
                          e.target.style.background = c.goldBright
                          e.target.style.boxShadow = `0 6px 28px rgba(196, 163, 90, 0.3)`
                          e.target.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (active && !loading) {
                          e.target.style.background = c.gold
                          e.target.style.boxShadow = `0 4px 20px rgba(196, 163, 90, 0.2)`
                          e.target.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[1] }}>
                          <span style={{
                            width: 14, height: 14,
                            border: `2px solid ${c.black}`,
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            display: 'inline-block',
                          }} />
                          {t('common.loading')}
                        </span>
                      ) : (
                        mode === 'login' ? t('auth.login') :
                        mode === 'signup' ? (t('auth.createAccount') || 'Créer mon compte') :
                        mode === 'forgot' ? t('auth.sendResetEmail') :
                        t('auth.sendMagicLink')
                      )}
                    </button>
                  </form>

                  {/* ── Social login — Google ── */}
                  {(mode === 'login' || mode === 'signup') && (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        margin: `${sp[4]} 0`,
                      }}>
                        <div style={{ flex: 1, height: '1px', background: c.borderLight }} />
                        <span style={{
                          fontFamily: f.mono, fontSize: '9px', color: c.textTertiary,
                          letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>{locale === 'ar' ? 'أو المتابعة مع' : 'ou continuer avec'}</span>
                        <div style={{ flex: 1, height: '1px', background: c.borderLight }} />
                      </div>

                      <button
                        type="button"
                        disabled={true}
                        title="Google OAuth — bientôt disponible"
                        onClick={async () => {
                          setLoading(true); setError(null)
                          const { error } = await signInWithGoogle()
                          if (error) { setError(translateError(error.message)); setLoading(false) }
                        }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '10px', padding: '13px 16px',
                          background: 'transparent',
                          border: `1px solid ${c.borderLight}`,
                          borderRadius: radius.sm,
                          color: c.textSecondary, fontSize: size.sm, fontFamily: f.body,
                          fontWeight: 500, cursor: 'pointer', letterSpacing: '0.01em',
                          transition: `all 0.25s ${ease.luxury}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.textTertiary; e.currentTarget.style.background = 'rgba(22, 20, 17, 0.5)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.borderLight; e.currentTarget.style.background = 'transparent' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {t('auth.loginWithGoogle')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Mode switchers — outside glass card ── */}
              <div style={{
                marginTop: sp[4], textAlign: 'center',
                fontSize: size.xs, color: c.textTertiary, lineHeight: 2.2,
                fontFamily: f.body,
              }}>
                {mode === 'login' && (
                  <>
                    <span>{t('auth.noAccountYet')}{' '}</span>
                    {linkBtn(t('auth.createAccount'), () => switchMode('signup'), true)}
                    <br />
                    {linkBtn(t('auth.passwordlessLogin'), () => switchMode('magic'))}
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <span>{t('auth.alreadyHaveAccount')}{' '}</span>
                    {linkBtn(t('auth.login'), () => switchMode('login'), true)}
                  </>
                )}
                {(mode === 'forgot' || mode === 'magic') && (
                  linkBtn(locale === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Retour à la connexion', () => switchMode('login'), true)
                )}
              </div>

              {/* ── Support WhatsApp ── */}
              <div style={{
                marginTop: sp[6], textAlign: 'center', paddingTop: sp[3],
                borderTop: `1px solid ${c.borderSubtle}`,
              }}>
                <a href="https://wa.me/33612345678?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20me%20connecter"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    color: c.textTertiary, fontSize: size.xs, fontFamily: f.body,
                    textDecoration: 'none', letterSpacing: '0.02em',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = c.green}
                  onMouseLeave={(e) => e.currentTarget.style.color = c.textTertiary}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {locale === 'ar' ? 'مساعدة للوصول إلى خزنتك' : 'Besoin d\'aide pour accéder à votre coffre-fort ?'}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes panelReveal {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes formReveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes formContentReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes featureReveal {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes confirmReveal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes confirmPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(90, 170, 106, 0.15); }
          50% { box-shadow: 0 0 0 8px rgba(90, 170, 106, 0); }
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-4px); }
          30% { transform: translateX(4px); }
          45% { transform: translateX(-2px); }
          60% { transform: translateX(2px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 900px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; border-left: none !important; min-height: 100vh; }
          .login-mobile-logo { display: flex !important; }
        }
        input::placeholder { color: ${c.textTertiary}; opacity: 0.4; }
      `}</style>
    </div>
  )
}
