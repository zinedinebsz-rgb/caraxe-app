import { describe, it, expect } from 'vitest'
import { isDelivered, statusKey, STATUSES } from '../theme'
import { getTierPrice, getTierMOQ } from '../clientTiers'

describe('status helpers', () => {
  it('isDelivered handles numeric, string and "livré"', () => {
    expect(isDelivered(6)).toBe(true)          // index 6 = delivered
    expect(isDelivered('delivered')).toBe(true)
    expect(isDelivered('livré')).toBe(true)
    expect(isDelivered(0)).toBe(false)
    expect(isDelivered('pending')).toBe(false)
  })
  it('statusKey maps numeric to key', () => {
    expect(statusKey(0)).toBe('pending')
    expect(statusKey(6)).toBe('delivered')
    expect(statusKey('sourcing')).toBe('sourcing')
  })
  it('STATUSES has delivered at index 6', () => {
    expect(STATUSES[6].key).toBe('delivered')
  })
})

describe('tier pricing', () => {
  const cat = { priceRange: '10-20' }
  it('starter tier is not priced (à qualifier)', () => {
    expect(getTierPrice(cat, 'starter')).toBe('À qualifier')
  })
  it('a real tier returns a € range', () => {
    const r = getTierPrice(cat, 'detaillant')
    expect(typeof r).toBe('string')
    expect(r).toMatch(/€$/)
  })
  it('getTierMOQ never goes below 5', () => {
    expect(getTierMOQ(0, 'starter')).toBe(5)
    expect(getTierMOQ(100, 'detaillant')).toBeGreaterThanOrEqual(5)
  })
})

import { computeClientScore } from '../clientScoring'

describe('client scoring (LTV fix)', () => {
  const now = new Date().toISOString()
  it('LTV parses textual budgets (1 500€, 2000) into a number', () => {
    const r = computeClientScore(
      { id: 'c1', client_tier: 'detaillant' },
      [
        { client_id: 'c1', budget: '1 500€', created_at: now },
        { client_id: 'c1', budget: '2000', created_at: now },
        { client_id: 'other', budget: '9999', created_at: now },
      ],
    )
    expect(r.ltv).toBe(3500)        // 1500 + 2000, ignoring other client
    expect(r.orderCount).toBe(2)
    expect(r.score).toBeGreaterThan(0)
    expect(['A', 'B', 'C', 'D']).toContain(r.band)
  })
  it('À définir / empty budgets count as 0, not NaN', () => {
    const r = computeClientScore(
      { id: 'c2', client_tier: 'bronze' },
      [{ client_id: 'c2', budget: 'À définir', created_at: now }],
    )
    expect(r.ltv).toBe(0)
    expect(Number.isNaN(r.score)).toBe(false)
  })
})
