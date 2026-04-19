import { useState, useEffect } from 'react'
import { c, f, size, sp } from '../lib/theme'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookies_consent')
    if (!consent) {
      setShowBanner(true)
    } else {
      // Load GA if consent was previously given
      if (consent === 'accepted') {
        loadGoogleAnalytics()
      }
    }
  }, [])

  const loadGoogleAnalytics = () => {
    if (typeof window === 'undefined') return

    // Google Analytics tracking code
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'
    document.head.appendChild(script1)

    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', 'G-XXXXXXXXXX')
  }

  const handleAccept = () => {
    localStorage.setItem('cookies_consent', 'accepted')
    loadGoogleAnalytics()
    setShowBanner(false)
  }

  const handleRefuse = () => {
    localStorage.setItem('cookies_consent', 'refused')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: c.bgSurface,
      borderTop: `1px solid ${c.border}`,
      padding: sp[3],
      zIndex: 50,
      maxHeight: '200px',
      overflow: 'auto',
      fontFamily: f.body,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: sp[3],
        flexWrap: 'wrap',
      }}>
        <div style={{
          flex: '1 1 auto',
          minWidth: '250px',
        }}>
          <p style={{
            fontSize: size.sm,
            color: c.textSecondary,
            lineHeight: 1.5,
            margin: 0,
          }}>
            Ce site utilise des cookies pour améliorer votre expérience et analyser le trafic.
          </p>
          <a href="/politique-confidentialite" style={{
            fontSize: size.xs,
            color: c.gold,
            textDecoration: 'none',
            marginTop: sp[1],
            display: 'inline-block',
          }}>
            En savoir plus →
          </a>
        </div>

        <div style={{
          display: 'flex',
          gap: sp[2],
          flex: '0 1 auto',
          minWidth: '200px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleRefuse}
            style={{
              padding: `${sp[1.5]} ${sp[3]}`,
              background: 'transparent',
              border: `1px solid ${c.border}`,
              color: c.textSecondary,
              fontSize: size.sm,
              fontWeight: 600,
              fontFamily: f.body,
              cursor: 'pointer',
              transition: `all 0.2s ${c.ease}`,
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.bgHover
              e.currentTarget.style.borderColor = c.textTertiary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = c.border
            }}
          >
            Refuser
          </button>

          <button
            onClick={handleAccept}
            style={{
              padding: `${sp[1.5]} ${sp[3]}`,
              background: c.gold,
              border: `1px solid ${c.gold}`,
              color: c.bg,
              fontSize: size.sm,
              fontWeight: 600,
              fontFamily: f.body,
              cursor: 'pointer',
              transition: `all 0.2s`,
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.goldDim
              e.currentTarget.style.borderColor = c.goldDim
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = c.gold
              e.currentTarget.style.borderColor = c.gold
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
