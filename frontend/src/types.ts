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
  status: FairteilerStatus
  care: FairteilerCare
  activity7d: number[]
}

export interface Report {
  type: ReportType
  tags: string[]
  createdAt: string
}

/** POST /api/fairteiler/{id}/reports response – includes the undo id. */
export interface CreatedReport extends Report {
  id: number
}

export interface FairteilerDetail extends FairteilerListItem {
  description: string
  regionName: string
  picture: string | null
  reports: Report[]
}
