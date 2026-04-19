/* LocaleAndPwaControls — language toggle + install button + notifications toggle.
 * Compact inline control strip for use in Dashboard/Admin headers.
 */
import { useEffect, useState } from 'react'
import { c, f, size, sp, ease } from '../lib/theme'
import { useI18n } from '../lib/i18n.jsx'
import {
  onInstallAvailabilityChange,
  promptInstall,
  isStandalone,
  notificationPermission,
  requestNotificationPermission,
} from '../lib/pwa'
import { subscribeToPush, isPushSupported } from '../lib/push'

const btn = {
  background: 'transparent',
  border: `1px solid ${c.border}`,
  color: c.textSecondary,
  fontFamily: f.mono,
  fontSize: size.xs,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: `6px 10px`,
  cursor: 'pointer',
  transition: `all 0.2s ${ease.smooth}`,
  height: 30,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  lineHeight: 1,
}
const btnActive = {
  ...btn,
  background: c.goldSoft,
  borderColor: c.gold,
  color: c.gold,
}

export default function LocaleAndPwaControls({ compact = false }) {
  const { locale, setLocale, t } = useI18n()
  const [installAvailable, setInstallAvailable] = useState(false)
  const [standalone] = useState(isStandalone())
  const [perm, setPerm] = useState(notificationPermission())

  useEffect(() => onInstallAvailabilityChange(setInstallAvailable), [])

  const handleInstall = async () => {
    await promptInstall()
  }

  const handleNotif = async () => {
    const r = await requestNotificationPermission()
    setPerm(r)
    // If user just granted permission, subscribe to VAPID push.
    if (r === 'granted' && isPushSupported()) {
      try { await subscribeToPush() } catch (_) {}
    }
  }

  // On mount, if permission was already granted (e.g. from a previous visit),
  // ensure we have an active subscription registered on the server.
  useEffect(() => {
    if (perm === 'granted' && isPushSupported()) {
      subscribeToPush().catch(() => {})
    }
  }, [perm])

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: compact ? 4 : 6,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {/* Language toggle */}
      <div
        role="group"
        aria-label={t('common.language')}
        style={{ display: 'inline-flex', border: `1px solid ${c.border}`, height: 30 }}
      >
        <button
          type="button"
          onClick={() => setLocale('fr')}
          aria-pressed={locale === 'fr'}
          style={{
            ...btn,
            border: 'none',
            background: locale === 'fr' ? c.goldSoft : 'transparent',
            color: locale === 'fr' ? c.gold : c.textSecondary,
            padding: '0 10px',
          }}
        >
          FR
        </button>
        <span style={{ width: 1, background: c.border }} />
        <button
          type="button"
          onClick={() => setLocale('ar')}
          aria-pressed={locale === 'ar'}
          style={{
            ...btn,
            border: 'none',
            background: locale === 'ar' ? c.goldSoft : 'transparent',
            color: locale === 'ar' ? c.gold : c.textSecondary,
            padding: '0 10px',
            fontFamily: f.body,
          }}
        >
          عربي
        </button>
      </div>

      {/* Install app — only if available and not already standalone */}
      {installAvailable && !standalone && (
        <button
          type="button"
          onClick={handleInstall}
          title={t('pwa.installTitle')}
          style={{ ...btnActive }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
          {compact ? '' : t('common.install')}
        </button>
      )}

      {/* Notification toggle */}
      {perm !== 'unsupported' && perm !== 'granted' && (
        <button
          type="button"
          onClick={handleNotif}
          title={t('pwa.notifTitle')}
          disabled={perm === 'denied'}
          style={{
            ...btn,
            opacity: perm === 'denied' ? 0.45 : 1,
            cursor: perm === 'denied' ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.4-1.4A7 7 0 0 0 19 11V8a7 7 0 1 0-14 0v3a7 7 0 0 0 .4 4.6L4 17h5" />
            <path d="M9 17a3 3 0 0 0 6 0" />
          </svg>
          {compact ? '' : t('common.enableNotifications')}
        </button>
      )}

      {perm === 'granted' && (
        <span
          title={t('common.notificationsEnabled')}
          style={{
            ...btn,
            borderColor: c.green,
            color: c.green,
            background: c.greenSoft,
            cursor: 'default',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {compact ? '' : t('common.notificationsEnabled')}
        </span>
      )}
    </div>
  )
}
