/* CARAXES Web Push helpers — browser-side VAPID subscription + server trigger.
 * Requires a service worker registered at /sw.js (see pwa.js).
 */
import { supabase } from './supabase'

// VAPID public key (base64url). Exposed intentionally — it's a public key.
// Private counterpart lives only in the Supabase Edge Function env.
export const VAPID_PUBLIC_KEY =
  'BDVdpl8EdOzhyEpydGwRIIPLLy5OKs1mmoPLd0JQxIbr3DtqFP0oAwAllNVboRv0DIOWfEVHv-gPIU_ubQaENow'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

/**
 * Subscribe the current browser to Web Push and persist the subscription
 * in Supabase under the current authenticated user. Idempotent.
 *
 * Returns: { ok: true } on success, { ok: false, error } otherwise.
 */
export async function subscribeToPush() {
  if (!isPushSupported()) return { ok: false, error: 'push-unsupported' }

  try {
    // Wait for SW to be ready.
    const reg = await navigator.serviceWorker.ready

    // Ensure we have permission.
    const perm = Notification.permission
    if (perm !== 'granted') return { ok: false, error: 'permission-denied' }

    // Try to reuse existing subscription, else create new.
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return { ok: false, error: 'not-authenticated' }

    const raw = sub.toJSON()
    const endpoint = raw.endpoint
    const p256dh = raw.keys?.p256dh
    const auth = raw.keys?.auth
    if (!endpoint || !p256dh || !auth) return { ok: false, error: 'invalid-subscription' }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent.slice(0, 300),
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      )

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

/**
 * Unsubscribe current browser from Web Push and delete the row in Supabase.
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return { ok: false, error: 'push-unsupported' }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe().catch(() => {})
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (userId && endpoint) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint)
      }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

/**
 * Trigger a push notification to a given user via the send-push Edge Function.
 * Called by admins from the Kanban when an order status changes.
 *
 * Requires the caller to be authenticated (Edge Function uses SERVICE_ROLE internally).
 */
export async function sendPushToUser({ userId, title, body, url = '/', tag }) {
  if (!userId) return { ok: false, error: 'user-id-required' }
  try {
    const { data: sess } = await supabase.auth.getSession()
    const jwt = sess?.session?.access_token
    if (!jwt) return { ok: false, error: 'no-session' }

    // Read URL + anon key from the already-initialized supabase client.
    const supaUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!supaUrl) return { ok: false, error: 'no-supabase-url' }

    const res = await fetch(`${supaUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        apikey: anonKey || '',
      },
      body: JSON.stringify({ user_id: userId, title, body, url, tag }),
    })
    const out = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: out?.error || `http-${res.status}` }
    return { ok: true, ...out }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}
