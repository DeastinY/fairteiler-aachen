export type StatusState = 'etwas_da' | 'leer' | 'keine_meldung'

export type ReportType =
  | 'brought'
  | 'taken'
  | 'empty'
  | 'cleaned'
  | 'needs_cleaning'
  | 'needs_maintenance'

export interface FairteilerCare {
  needsCleaning: boolean
  needsMaintenance: boolean
}

export type DayKey = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'

/** Local hours per day, ranges [start, end) in (possibly fractional) hours. */
export type OpeningHours = Partial<Record<DayKey, [number, number][]>>

export interface UsageDay {
  day: string // "YYYY-MM-DD"
  listViews: number
  detailViews: number
  reports: number
}

export interface Basket {
  id: number
  lat: number
  lon: number
}

export interface BasketsResponse {
  baskets: Basket[]
  fetchedAt: string | null
  stale: boolean
}

export interface Stats {
  fairteilerTotal: number
  withFood: number
  reports7d: number
  pushSubscriptions: number
  /** 14 entries, oldest first, zero-filled. */
  usage14d: UsageDay[]
}

export interface FairteilerStatus {
  state: StatusState
  lastReportAt: string | null
  tags: string[]
}

export interface FairteilerListItem {
  id: number
  name: string
  street: string
  postalCode: string
  city: string
  lat: number
  lon: number
  aroundTheClock: boolean
  cooled: boolean
  /** Open right now? null = unknown (no curated hours). */
  openNow: boolean | null
  status: FairteilerStatus
  care: FairteilerCare
  activity7d: number[]
}

export interface Report {
  id: number
  type: ReportType
  tags: string[]
  createdAt: string
}

/** POST /api/fairteiler/{id}/reports response shape. */
export type CreatedReport = Report

export type BestTime = 'morning' | 'afternoon' | 'evening'

export interface FairteilerDetail extends FairteilerListItem {
  description: string
  regionName: string
  picture: string | null
  hours: OpeningHours | null
  photoUrl: string | null
  /** Time of day food usually arrives – null when the data is too thin. */
  bestTime: BestTime | null
  reports: Report[]
}
