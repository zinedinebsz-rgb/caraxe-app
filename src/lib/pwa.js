/* CARAXES PWA helpers — registration, install prompt, push notifications. */

let deferredInstallPrompt = null
const installListeners = new Set()

/** Register the service worker. Call once on app boot. */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  // Avoid SW in dev mode — Vite HMR + SW don't mix.
  if (import.meta.env && import.meta.env.DEV) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Auto-check for updates every hour.
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
      })
      .catch((err) => {
        console.warn('[PWA] SW registration failed', err)
      })
  })

  // beforeinstallprompt — capture to trigger later from UI.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e
    installListeners.forEach((cb) => cb(true))
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    installListeners.forEach((cb) => cb(false))
  })
}

/** Subscribe to install-available status changes. Returns unsubscribe fn. */
export function onInstallAvailabilityChange(cb) {
  installListeners.add(cb)
  cb(Boolean(deferredInstallPrompt))
  return () => installListeners.delete(cb)
}

export function isInstallAvailable() {
  return Boolean(deferredInstallPrompt)
}

/** Trigger the browser install prompt. Returns 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall() {
  if (!deferredInstallPrompt) return 'unavailable'
  deferredInstallPrompt.prompt()
  const choice = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  installListeners.forEach((cb) => cb(false))
  return choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed'
}

/** True when the app runs as an installed PWA (standalone display mode). */
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/** Request notification permission. Returns 'granted' | 'denied' | 'default' | 'unsupported'. */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const perm = await Notification.requestPermission()
    return perm
  } catch {
    return 'default'
  }
}

export function notificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Send a local notification via the SW (so it works when the tab is backgrounded). */
export async function sendLocalNotification({ title, body, url, tag }) {
  if (notificationPermission() !== 'granted') return false
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) {
    // Fallback to Notification API directly
    try {
      new Notification(title, { body, icon: '/icons/icon-192.png', tag })
      return true
    } catch {
      return false
    }
  }
  reg.active?.postMessage({ type: 'LOCAL_NOTIFICATION', title, body, url, tag })
  return true
}
