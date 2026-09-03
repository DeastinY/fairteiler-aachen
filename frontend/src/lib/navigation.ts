/**
 * Hand-off to the platform's navigation app. The returned URL is used as the
 * href of a user-clicked anchor – the app itself never requests these hosts.
 */
export function navigationUrl(
  lat: number,
  lon: number,
  name: string,
  userAgent: string,
): string {
  const encodedName = encodeURIComponent(name)
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodedName}`
  }
  if (/Android/.test(userAgent)) {
    return `geo:${lat},${lon}?q=${lat},${lon}(${encodedName})`
  }
  return `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}`
}
