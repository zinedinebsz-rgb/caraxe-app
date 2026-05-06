import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
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
  success: { bg: 'rgba(90, 170, 106, 0.12)', border: 'rgba(90, 170, 106, 0.25)', color: '#5aaa6a' },
  error:   { bg: 'rgba(196, 58, 47, 0.12)', border: 'rgba(196, 58, 47, 0.25)', color: '#c43a2f' },
  info:    { bg: 'rgba(90, 138, 196, 0.12)', border: 'rgba(90, 138, 196, 0.25)', color: '#5a8ac4' },
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
      {/* Toast container — aria-live for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        style={{
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

/* ── Confirm Dialog (ARIA + focus trap + Escape) ── */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel, danger = false }) {
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Focus trap + Escape key
  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement
    // Focus the dialog container after mount
    const raf = requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector('button')
      first?.focus()
    })

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onCancel?.(); return }
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [open, onCancel])

  if (!open) return null

  const titleId = 'confirm-dialog-title'
  const descId = 'confirm-dialog-desc'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
    }} onClick={onCancel} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={{
          background: c.bgElevated,
          border: `1px solid ${c.border}`,
          padding: sp[4],
          maxWidth: 400,
          width: '90%',
          boxShadow: shadow.lg,
        }} onClick={e => e.stopPropagation()}>
        <h3 id={titleId} style={{
          margin: 0, marginBottom: sp[2],
          fontSize: size.md, fontFamily: f.display,
          color: c.text,
        }}>{title}</h3>
        <p id={descId} style={{
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

/* ── Reusable Modal (ARIA + focus trap + Escape) ── */
export function Modal({ open, onClose, title, children, maxWidth = 600 }) {
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement
    const raf = requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose?.(); return }
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const titleId = `modal-title-${title?.replace(/\s/g, '-')?.toLowerCase() || 'default'}`

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: c.bgOverlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
      padding: sp[3],
    }} onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          background: c.bgElevated,
          border: `1px solid ${c.border}`,
          padding: sp[4],
          maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: shadow.lg,
          outline: 'none',
        }} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
            <h3 id={titleId} style={{ margin: 0, fontSize: size.md, fontFamily: f.display, color: c.text }}>{title}</h3>
            <button onClick={onClose} aria-label="Fermer" style={{
              background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer', padding: sp[1], fontSize: '18px', lineHeight: 1,
            }}>&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
