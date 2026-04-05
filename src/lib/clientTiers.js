// ─── CARAXES Client Tiers v2 ───
// 3 profils clients : Grossiste / Détaillant / E-commerce
// Chaque profil = pricing, MOQ, priorité, catalogue dédié

import { c } from './theme'

export const TIERS = [
  {
    key: 'grossiste',
    label: 'Grossiste',
    tagline: 'Volume · Prix usine · Priorité max',
    description: 'Vous achetez en gros pour redistribuer à d\'autres revendeurs ou alimenter un réseau de points de vente.',
    icon: '🏭',
    color: c.gold,
    colorSoft: c.goldSoft,
    minOrderValue: 5000,
    moqMultiplier: 1,
    priceMultiplier: 1,
    priority: 1,
    priorityLabel: 'Express',
    benefits: [
      'Prix usine directs',
      'MOQ négociable',
      'Agent dédié',
      'Priorité sur la production',
      'Rapports qualité inclus',
      'Palettes complètes',
    ],
    catalogCategories: [
      'alimentaire-vrac', 'textile-gros', 'cosmetique-gros',
      'electromenager', 'emballage-packaging', 'bazar-general',
      'epices-condiments', 'hygiene-entretien',
    ],
  },
  {
    key: 'detaillant',
    label: 'Détaillant',
    tagline: 'Boutique · Quantités adaptées · Suivi terrain',
    description: 'Vous avez un ou plusieurs points de vente (boucherie, épicerie, boutique textile, etc.) et cherchez à vous approvisionner.',
    icon: '🏪',
    color: c.blue,
    colorSoft: c.blueSoft,
    minOrderValue: 500,
    moqMultiplier: 0.4,
    priceMultiplier: 1.3,
    priority: 2,
    priorityLabel: 'Standard',
    benefits: [
      'Prix compétitifs',
      'MOQ réduits (petites séries)',
      'Suivi personnalisé',
      'Catalogue adapté boutique',
      'Étiquetage sur mesure',
    ],
    catalogCategories: [
      'boucherie-halal', 'epicerie-orientale', 'textile-boutique',
      'cosmetique-naturel', 'decoration-interieur', 'articles-religieux',
      'vaisselle-ustensiles', 'confiserie-patisserie',
    ],
  },
  {
    key: 'ecommerce',
    label: 'E-commerce',
    tagline: 'En ligne · Dropship · Branding · Scalable',
    description: 'Vous vendez sur Shopify, WooCommerce, Amazon, ou les marketplaces. Vous cherchez des produits à forte marge avec livraison optimisée.',
    icon: '🛒',
    color: c.teal,
    colorSoft: c.tealSoft,
    minOrderValue: 200,
    moqMultiplier: 0.2,
    priceMultiplier: 1.5,
    priority: 3,
    priorityLabel: 'File normale',
    benefits: [
      'Petites quantités / test produit',
      'Packaging personnalisé (branding)',
      'Photos produit pro incluses',
      'Fiches produit optimisées SEO',
      'Envoi direct entrepôt FR',
    ],
    catalogCategories: [
      'gadgets-trending', 'accessoires-tech', 'bijoux-fantaisie',
      'cosmetique-niche', 'fitness-wellness', 'maison-deco',
      'mode-accessoires', 'enfants-jouets',
    ],
  },
]

export const DEFAULT_TIER = 'detaillant'

export const getTierByKey = (key) =>
  TIERS.find(t => t.key === key) || TIERS.find(t => t.key === DEFAULT_TIER)

export const getTierLabel = (key) => getTierByKey(key)?.label || 'Détaillant'

export const getTierColor = (key) => getTierByKey(key)?.color || c.blue

// Calcul du prix adapté au tier pour une catégorie
export function getTierPrice(category, tierKey) {
  const tier = getTierByKey(tierKey)
  if (!tier || !category) return category?.priceRange || '—'

  const match = category.priceRange?.match(/([\d.]+)-([\d.]+)/)
  if (!match) return category.priceRange || '—'

  const minPrice = parseFloat(match[1])
  const maxPrice = parseFloat(match[2])

  const adjMin = (minPrice * tier.priceMultiplier).toFixed(1).replace('.0', '')
  const adjMax = (maxPrice * tier.priceMultiplier).toFixed(1).replace('.0', '')

  return `${adjMin}–${adjMax}€`
}

// Calcul du MOQ adapté au tier
export function getTierMOQ(baseMOQ, tierKey) {
  const tier = getTierByKey(tierKey)
  if (!tier) return baseMOQ
  return Math.max(5, Math.round(baseMOQ * tier.moqMultiplier))
}

// MOQ par défaut par catégorie (backward compat with Dashboard)
export const DEFAULT_MOQS = {
  'enceintes-bluetooth': 500,
  'coques-telephone': 1000,
  'accessoires-fitness': 500,
  'bijoux-fantaisie': 1000,
  'gadgets-cuisine': 500,
  'eclairage-led': 300,
  'organisateurs-rangement': 500,
  'accessoires-animaux': 500,
  'papeterie-creative': 1000,
  'accessoires-tech': 500,
}

export const getCategoryMOQ = (categoryId, tierKey) => {
  const baseMOQ = DEFAULT_MOQS[categoryId] || 500
  return getTierMOQ(baseMOQ, tierKey)
}
