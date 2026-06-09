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
