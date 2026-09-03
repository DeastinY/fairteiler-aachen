export interface LatLon {
  lat: number
  lon: number
}

export interface Point {
  x: number
  y: number
}

/**
 * Equirectangular projection of lat/lon points into a width×height viewport.
 * The bounding box of all points is fitted (aspect preserved, centered) with
 * `paddingFrac` padding on every side; longitudes are scaled by cos(midLat)
 * so east-west distances are not distorted relative to north-south.
 */
export function projectPoints(
  points: LatLon[],
  width: number,
  height: number,
  paddingFrac = 0.08,
): Point[] {
  const project = createProjection(points, width, height, paddingFrac)
  return points.map(project)
}

/**
 * Builds the projection function fitted to `points` so that additional
 * coordinates (e.g. the user's position) can be mapped with the same
 * transform. Returns a function LatLon -> viewport Point.
 */
export function createProjection(
  points: LatLon[],
  width: number,
  height: number,
  paddingFrac = 0.08,
): (p: LatLon) => Point {
  if (points.length === 0) {
    return () => ({ x: width / 2, y: height / 2 })
  }

  const lats = points.map((p) => p.lat)
  const lons = points.map((p) => p.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  const midLat = (minLat + maxLat) / 2
  const midLon = (minLon + maxLon) / 2
  const kx = Math.cos((midLat * Math.PI) / 180)

  const spanX = (maxLon - minLon) * kx
  const spanY = maxLat - minLat

  const innerW = width * (1 - 2 * paddingFrac)
  const innerH = height * (1 - 2 * paddingFrac)

  const scaleX = spanX > 0 ? innerW / spanX : Number.POSITIVE_INFINITY
  const scaleY = spanY > 0 ? innerH / spanY : Number.POSITIVE_INFINITY
  let scale = Math.min(scaleX, scaleY)
  if (!Number.isFinite(scale)) scale = 0 // all points identical -> center

  return (p: LatLon) => ({
    x: width / 2 + (p.lon - midLon) * kx * scale,
    y: height / 2 + (midLat - p.lat) * scale,
  })
}

const EARTH_RADIUS_KM = 6371

/** Great-circle distance in kilometers. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** "400 m" below one kilometer, "1,2 km" above (German decimal comma). */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.max(10, Math.round((km * 1000) / 10) * 10)
    return `${meters} m`
  }
  return `${km.toFixed(1).replace('.', ',')} km`
}
