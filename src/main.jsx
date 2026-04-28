import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { registerServiceWorker } from './lib/pwa'

// Global error logging to N8N webhook
;(function setupErrorLogging() {
  const webhookUrl = import.meta.env.VITE_N8N_ERROR_WEBHOOK
  if (!webhookUrl) return

  const sendError = (payload) => {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: 'caraxes-dashboard', timestamp: new Date().toISOString(), url: window.location.href, ...payload }),
      }).catch(() => {})
    } catch (_) {}
  }

  window.addEventListener('error', (e) => {
    sendError({ type: 'uncaught', error: e.message, stack: e.error?.stack?.slice(0, 1000) || '', file: e.filename, line: e.lineno })
  })

  window.addEventListener('unhandledrejection', (e) => {
    sendError({ type: 'unhandled-promise', error: String(e.reason)?.slice(0, 500), stack: e.reason?.stack?.slice(0, 1000) || '' })
  })
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

registerServiceWorker()