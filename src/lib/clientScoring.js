/* CARAXES client scoring — compute LTV / frequency / recency / tier-weighted score.
 *
 * Inputs:
 *   client: { id, client_tier, services_enabled, created_at, ... }
 *   orders: full list of Supabase `orders` (budget, created_at, client_id, status)
 *
 * Output:
 *   {
 *     ltv: number (€),
 *     orderCount: number,
 *     frequencyPerMonth: number,
 *     recencyDays: number | null,
 *     tierWeight: number (1..5),
 *     score: number (0..100, higher = better),
 *     band: 'A' | 'B' | 'C' | 'D',
 *     isTop20: boolean (filled by caller using cohort),
 *   }
 *
 * Design: simple, explainable formula — no ML, no DB dependency.
 */

const TIER_WEIGHT = {
  elite: 5, prestige: 4, royal: 4, gold: 3, silver: 2, bronze: 1, starter: 1, default: 1,
}

export function computeClientScore(client, orders = []) {
  const clientOrders = orders.filter((o) => o.client_id === client.id)
  const orderCount = clientOrders.length
  const ltv = clientOrders.reduce((sum, o) => sum + (Number(o.budget) || 0), 0)

  // Recency — days since most recent order (or since profile creation if none).
  const dates = clientOrders
    .map((o) => new Date(o.created_at || 0))
    .filter((d) => !isNaN(d))
  const lastDate = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null
  const recencyDays =
    lastDate ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : null

  // Frequency — orders per month since first order (or last 90d window, whichever is larger).
  let frequencyPerMonth = 0
  if (clientOrders.length > 0) {
    const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null
    const spanMs = earliest ? Math.max(Date.now() - earliest.getTime(), 30 * 24 * 3600 * 1000) : 30 * 24 * 3600 * 1000
    const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30)
    frequencyPerMonth = clientOrders.length / spanMonths
  }

  const tierKey = client.client_tier || 'default'
  const tierWeight = TIER_WEIGHT[tierKey] || 1

  // Normalize each axis to 0..1, then weight.
  const ltvNorm = Math.min(ltv / 20000, 1) // 20k€ → max
  const freqNorm = Math.min(frequencyPerMonth / 4, 1) // 4 orders/mo → max
  const recencyNorm =
    recencyDays == null ? 0 : Math.max(0, 1 - recencyDays / 120) // 0d=1, 120d+=0
  const tierNorm = tierWeight / 5

  // Weighted blend — LTV matters most, then recency, then frequency, then tier.
  const score = Math.round(
    (ltvNorm * 0.40 + recencyNorm * 0.25 + freqNorm * 0.20 + tierNorm * 0.15) * 100
  )

  const band = score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 30 ? 'C' : 'D'

  return {
    ltv,
    orderCount,
    frequencyPerMonth,
    recencyDays,
    tierWeight,
    score,
    band,
    isTop20: false,
  }
}

/** Compute scores for a cohort and flag the top-20% (by score). */
export function scoreCohort(clients = [], orders = []) {
  const withScores = clients.map((cl) => ({ client: cl, ...computeClientScore(cl, orders) }))
  const sorted = [...withScores].sort((a, b) => b.score - a.score)
  const top20Count = Math.max(1, Math.ceil(sorted.length * 0.2))
  const top20Ids = new Set(sorted.slice(0, top20Count).map((x) => x.client.id))
  return withScores.map((x) => ({ ...x, isTop20: top20Ids.has(x.client.id) }))
}

export const SCORE_BAND_COLOR = {
  A: '#5aaa6a',    // green
  B: '#c4a35a',     // gold
  C: '#5a8ac4',    // blue
  D: '#8a8681',    // grey (textSecondary)
}
