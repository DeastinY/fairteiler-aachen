import { describe, expect, it } from 'vitest'
import { formatDistance, haversineKm, projectPoints } from '../src/lib/geo'

describe('projectPoints', () => {
  it('maps the bounding box into the padded viewport, north up', () => {
    const points = [
      { lat: 50.0, lon: 6.0 }, // south-west
      { lat: 51.0, lon: 7.0 }, // north-east
    ]
    const [sw, ne] = projectPoints(points, 100, 100, 0.08)

    // north (higher lat) is up -> smaller y
    expect(ne!.y).toBeLessThan(sw!.y)
    // east (higher lon) is right -> larger x
    expect(ne!.x).toBeGreaterThan(sw!.x)

    // fits within the 8% padding
    for (const p of [sw!, ne!]) {
      expect(p.x).toBeGreaterThanOrEqual(8 - 1e-9)
      expect(p.x).toBeLessThanOrEqual(92 + 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(8 - 1e-9)
      expect(p.y).toBeLessThanOrEqual(92 + 1e-9)
    }

    // the limiting axis (latitude here) uses the full padded height
    expect(sw!.y).toBeCloseTo(92, 6)
    expect(ne!.y).toBeCloseTo(8, 6)
  })

  it('corrects east-west distances by cos(midLat)', () => {
    // one degree of longitude vs one degree of latitude at ~50.5°N
    const points = [
      { lat: 50.0, lon: 6.0 },
      { lat: 50.0, lon: 7.0 },
      { lat: 51.0, lon: 6.0 },
      { lat: 51.0, lon: 7.0 },
    ]
    const [a, b, c] = projectPoints(points, 200, 200, 0)
    const pixelDx = Math.abs(b!.x - a!.x)
    const pixelDy = Math.abs(c!.y - a!.y)
    const midLatRad = (50.5 * Math.PI) / 180
    expect(pixelDx / pixelDy).toBeCloseTo(Math.cos(midLatRad), 6)
  })

  it('keeps relative positions: a midpoint lands between the extremes', () => {
    const points = [
      { lat: 50.0, lon: 6.0 },
      { lat: 51.0, lon: 6.0 },
      { lat: 50.5, lon: 6.0 },
    ]
    const [south, north, mid] = projectPoints(points, 100, 100, 0.1)
    expect(mid!.x).toBeCloseTo(south!.x, 6)
    expect(mid!.y).toBeCloseTo((south!.y + north!.y) / 2, 6)
  })

  it('centers a single point', () => {
    const [only] = projectPoints([{ lat: 50.77, lon: 6.08 }], 390, 452, 0.08)
    expect(only!.x).toBeCloseTo(195, 6)
    expect(only!.y).toBeCloseTo(226, 6)
  })

  it('returns an empty array for no points', () => {
    expect(projectPoints([], 100, 100)).toEqual([])
  })
})

describe('haversineKm', () => {
  it('computes one degree of latitude as ~111.2 km', () => {
    const km = haversineKm({ lat: 50, lon: 6 }, { lat: 51, lon: 6 })
    expect(km).toBeGreaterThan(110.5)
    expect(km).toBeLessThan(111.8)
  })

  it('computes one degree of longitude at 50°N as ~71.5 km', () => {
    const km = haversineKm({ lat: 50, lon: 6 }, { lat: 50, lon: 7 })
    expect(km).toBeGreaterThan(71)
    expect(km).toBeLessThan(72)
  })

  it('is zero for identical points and symmetric', () => {
    const a = { lat: 50.7766, lon: 6.0834 }
    const b = { lat: 50.7593, lon: 6.1296 }
    expect(haversineKm(a, a)).toBe(0)
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 12)
  })
})

describe('formatDistance', () => {
  it('renders meters below 1 km', () => {
    expect(formatDistance(0.4)).toBe('400 m')
    expect(formatDistance(0.05)).toBe('50 m')
  })

  it('renders kilometers with a German decimal comma', () => {
    expect(formatDistance(1.23)).toBe('1,2 km')
    expect(formatDistance(12.5)).toBe('12,5 km')
  })
})
