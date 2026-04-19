/* CARAXES i18n — FR (default) + AR (RTL). Zero-dependency. */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { translations, SUPPORTED_LOCALES } from './translations'

const I18nContext = createContext(null)
const STORAGE_KEY = 'caraxes_locale'

function resolve(dict, key) {
  if (!key) return ''
  const parts = key.split('.')
  let cur = dict
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p]
    else return null
  }
  return typeof cur === 'string' ? cur : null
}

function format(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

function pickInitialLocale() {
  if (typeof window === 'undefined') return 'fr'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved
  } catch (_) {}
  const nav = (navigator.language || 'fr').toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  return 'fr'
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(pickInitialLocale)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const isRtl = locale === 'ar'
    document.documentElement.lang = locale
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    try { localStorage.setItem(STORAGE_KEY, locale) } catch (_) {}
  }, [locale])

  const setLocale = useCallback((loc) => {
    if (SUPPORTED_LOCALES.includes(loc)) setLocaleState(loc)
  }, [])

  const t = useCallback((key, vars) => {
    const dict = translations[locale] || translations.fr
    const fallback = translations.fr
    const hit = resolve(dict, key) ?? resolve(fallback, key) ?? key
    return format(hit, vars)
  }, [locale])

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    isRtl: locale === 'ar',
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    supported: SUPPORTED_LOCALES,
  }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Safe fallback if provider isn't mounted (e.g. unit tests).
    return {
      locale: 'fr',
      setLocale: () => {},
      t: (k) => k,
      isRtl: false,
      dir: 'ltr',
      supported: SUPPORTED_LOCALES,
    }
  }
  return ctx
}

export function useT() {
  return useI18n().t
}
