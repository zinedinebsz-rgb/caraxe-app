/* ── CARAXES — Dynamic SEO per route ── */
import { useEffect } from 'react'

const SEO_DATA = {
  '/': {
    title: 'CARAXES — Agent de Sourcing Chine | Dashboard',
    description: 'Accédez à votre dashboard CARAXES. Suivi commandes, messagerie, documents, expéditions en temps réel.',
  },
  '/login': {
    title: 'Connexion — CARAXES | Agent de Sourcing Chine',
    description: 'Connectez-vous à votre espace CARAXES pour suivre vos commandes et communiquer avec votre agent de sourcing.',
  },
  '/admin': {
    title: 'Administration — CARAXES',
    description: 'Panneau d\'administration CARAXES. Gestion commandes, clients, fournisseurs, expéditions.',
  },
  '/catalogue': {
    title: 'Catalogue Produits — CARAXES | Sourcing Chine',
    description: 'Découvrez notre catalogue de produits sourcés en Chine. Textile, alimentaire halal, cosmétique, électronique.',
  },
  '/onboarding': {
    title: 'Bienvenue — CARAXES | Créer votre profil',
    description: 'Complétez votre profil CARAXES pour commencer à sourcer vos produits depuis la Chine.',
  },
  '/settings': {
    title: 'Paramètres — CARAXES',
    description: 'Gérez vos paramètres de compte CARAXES : profil, notifications, langue.',
  },
  '/mentions-legales': {
    title: 'Mentions Légales — CARAXES',
    description: 'Mentions légales de CARAXES, agent de sourcing en Chine.',
  },
  '/politique-confidentialite': {
    title: 'Politique de Confidentialité — CARAXES',
    description: 'Politique de confidentialité et de protection des données de CARAXES.',
  },
  '/cgv': {
    title: 'Conditions Générales de Vente — CARAXES',
    description: 'Conditions générales de vente de CARAXES, agent de sourcing en Chine.',
  },
  '/reset-password': {
    title: 'Réinitialiser le mot de passe — CARAXES',
    description: 'Réinitialisez votre mot de passe CARAXES.',
  },
}

const DEFAULT_TITLE = 'CARAXES — Agent de Sourcing Chine pour Commerçants'
const DEFAULT_DESC = 'CARAXES, votre agent de sourcing en Chine. Importez vos produits depuis Yiwu, Guangzhou et Shenzhen.'

/**
 * Sets document.title and meta description based on current route.
 * @param {string} [customTitle] — override the default for this route
 * @param {string} [customDesc] — override the description for this route
 */
export function useSEO(customTitle, customDesc) {
  useEffect(() => {
    const path = window.location.pathname
    const seo = SEO_DATA[path] || {}

    // Title
    document.title = customTitle || seo.title || DEFAULT_TITLE

    // Meta description
    const desc = customDesc || seo.description || DEFAULT_DESC
    let metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', desc)
    }

    // OG title
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', customTitle || seo.title || DEFAULT_TITLE)
    }

    // OG description
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) {
      ogDesc.setAttribute('content', desc)
    }

    // Canonical (update for SPA routes)
    let canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      canonical.setAttribute('href', `https://app.caraxes.fr${path === '/' ? '' : path}`)
    }

    // GA4 — track SPA page views on route change
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: path,
      })
    }
  }, [customTitle, customDesc])
}

export default useSEO
