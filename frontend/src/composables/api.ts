import { t } from '../i18n'
import { apiUrl } from '../lib/apiBase'
import type { PushConfig, PushSubscriptionPayload } from '../lib/push'
import type {
  BasketsResponse,
  CreatedReport,
  FairteilerDetail,
  FairteilerListItem,
  ReportType,
  Stats,
} from '../types'
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init)
  if (!response.ok) {
    let detail = t('api.genericError')
    try {
      const body = await response.json()
      if (body && typeof body.detail === 'string') detail = body.detail
    } catch {
      // non-JSON error body – keep the generic message
    }
    throw new ApiError(response.status, detail)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function fetchFairteilerList(): Promise<FairteilerListItem[]> {
  return request<FairteilerListItem[]>('/api/fairteiler')
}

export function fetchFairteilerDetail(id: number): Promise<FairteilerDetail> {
  return request<FairteilerDetail>(`/api/fairteiler/${id}`)
}

/** Essenskörbe (private food offers) – server-side cached upstream proxy. */
export function fetchBaskets(): Promise<BasketsResponse> {
  return request<BasketsResponse>('/api/baskets')
}

export function fetchStats(): Promise<Stats> {
  return request<Stats>('/api/stats')
}

export function fetchPushConfig(): Promise<PushConfig> {
  return request<PushConfig>('/api/push/config')
}

/** Full-state upsert; an empty fairteilerIds list unsubscribes server-side. */
export function putPushSubscription(payload: PushSubscriptionPayload): Promise<void> {
  return request<void>('/api/push/subscription', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
    },
    body: JSON.stringify(payload),
  })
}

export function submitReport(
  fairteilerId: number,
  body: { type: ReportType; tags: string[] },
): Promise<CreatedReport> {
  return request<CreatedReport>(`/api/fairteiler/${fairteilerId}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
    },
    body: JSON.stringify(body),
  })
}

/** Undo an own report (only within the backend's 15-minute window). */
export function deleteReport(reportId: number): Promise<void> {
  return request<void>(`/api/reports/${reportId}`, {
    method: 'DELETE',
    headers: { 'X-Device-Id': getDeviceId() },
  })
}
