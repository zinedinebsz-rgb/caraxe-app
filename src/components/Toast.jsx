import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { c, f, size, sp, ease, shadow } from '../lib/theme'

/* ── Toast Context ── */
const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
}

const COLORS = {
  success: { bg: 'oklch(72% 0.16 155 / 0.12)', border: 'oklch(72% 0.16 155 / 0.25)', color: 'oklch(72% 0.16 155)' },
  error:   { bg: 'oklch(55% 0.22 25 / 0.12)', border: 'oklch(55% 0.22 25 / 0.25)', color: 'oklch(55% 0.22 25)' },
  info:    { bg: 'oklch(68% 0.15 250 / 0.12)', border: 'oklch(68% 0.15 250 / 0.25)', color: 'oklch(68% 0.15 250)' },
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, toast.duration || 3500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const colors = COLORS[toast.type] || COLORS.info

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px',
      background: c.bgElevated,
      border: `1px solid ${colors.border}`,
      boxShadow: shadow.md,
      fontFamily: f.body,
      fontSize: size.sm,
      color: c.text,
      minWidth: 280,
      maxWidth: 420,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(20px)',
      transition: `all 0.3s ${ease.out}`,
      cursor: 'pointer',
    }} onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300) }}>
      <span style={{ color: colors.color, flexShrink: 0, display: 'flex' }}>
        {ICONS[toast.type] || ICONS.info}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  )
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }])
    return id
  }, [])

  const success = useCallback((msg) => toast(msg, 'success'), [toast])
  const error = useCallback((msg) => toast(msg, 'error', 5000), [toast])
  const info = useCallback((msg) => toast(msg, 'info'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed',
        top: sp[3],
        right: sp[3],
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: toasts.length ? 'auto' : 'none',
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ── Confirm Dialog ── */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel, danger = false }) {
  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
    }} onClick={onCancel}>
      <div style={{
        background: c.bgElevated,
        border: `1px solid ${c.border}`,
        padding: sp[4],
        maxWidth: 400,
        width: '90%',
        boxShadow: shadow.lg,
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{
          margin: 0, marginBottom: sp[2],
          fontSize: size.md, fontFamily: f.display,
          color: c.text,
        }}>{title}</h3>
        <p style={{
          margin: 0, marginBottom: sp[3],
          fontSize: size.sm, color: c.textSecondary,
          lineHeight: 1.5,
        }}>{message}</p>
        <div style={{ display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: `${sp[1]} ${sp[3]}`,
            background: 'transparent',
            border: `1px solid ${c.border}`,
            color: c.textSecondary,
            fontSize: size.sm,
            fontFamily: f.body,
            cursor: 'pointer',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            padding: `${sp[1]} ${sp[3]}`,
            background: danger ? c.red : c.gold,
            border: 'none',
            color: danger ? c.white : c.black,
            fontSize: size.sm,
            fontFamily: f.body,
            fontWeight: 600,
            cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
