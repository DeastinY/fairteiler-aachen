import type { FairteilerDetail, FairteilerListItem } from '../src/types'

export function makeFairteiler(
  overrides: Partial<FairteilerListItem> = {},
): FairteilerListItem {
  return {
    id: 810,
    name: 'Fairteiler "BreitSeite"',
    street: 'Kleinkölnstraße 18',
    postalCode: '52062',
    city: 'Aachen',
    lat: 50.7766,
    lon: 6.0834,
    aroundTheClock: false,
    cooled: false,
    status: { state: 'keine_meldung', lastReportAt: null, tags: [] },
    care: { needsCleaning: false, needsMaintenance: false },
    activity7d: [0, 0, 0, 0, 0, 0, 0],
    ...overrides,
  }
}

export function makeDetail(overrides: Partial<FairteilerDetail> = {}): FairteilerDetail {
  return {
    ...makeFairteiler(),
    description: 'Öffnungszeiten: rund um die Uhr.\n\nBitte nichts Verdorbenes einstellen.',
    regionName: 'Aachen',
    picture: null,
    reports: [],
    ...overrides,
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
