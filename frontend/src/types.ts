export type StatusState = 'etwas_da' | 'leer' | 'keine_meldung'

export type ReportType = 'brought' | 'taken' | 'empty'

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
  status: FairteilerStatus
  activity7d: number[]
}

export interface Report {
  type: ReportType
  tags: string[]
  createdAt: string
}

export interface FairteilerDetail extends FairteilerListItem {
  description: string
  regionName: string
  picture: string | null
  reports: Report[]
}
