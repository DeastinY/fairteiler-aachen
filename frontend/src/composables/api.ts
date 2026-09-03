import type { FairteilerDetail, FairteilerListItem, Report, ReportType } from '../types'
import { getDeviceId } from './device'

/**
 * Thin fetch wrapper around OUR backend API (proxied under /api).
 * The app never talks to foodsharing.de or any other external service.
 */

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const GENERIC_ERROR = 'Da ist etwas schiefgelaufen. Bitte versuch es später noch einmal.'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let detail = GENERIC_ERROR
    try {
      const body = await response.json()
      if (body && typeof body.detail === 'string') detail = body.detail
    } catch {
      // non-JSON error body – keep the generic message
    }
    throw new ApiError(response.status, detail)
  }
  return (await response.json()) as T
}

export function fetchFairteilerList(): Promise<FairteilerListItem[]> {
  return request<FairteilerListItem[]>('/api/fairteiler')
}

export function fetchFairteilerDetail(id: number): Promise<FairteilerDetail> {
  return request<FairteilerDetail>(`/api/fairteiler/${id}`)
}

export function submitReport(
  fairteilerId: number,
  body: { type: ReportType; tags: string[] },
): Promise<Report> {
  return request<Report>(`/api/fairteiler/${fairteilerId}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
    },
    body: JSON.stringify(body),
  })
}
