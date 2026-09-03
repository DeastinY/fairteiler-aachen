import { haversineKm, type LatLon } from './geo'
import type { FairteilerListItem } from '../types'

export type ListSortMode = 'activity' | 'distance' | 'lastReported'

export const LIST_SORT_MODES: ListSortMode[] = ['activity', 'distance', 'lastReported']

export function activitySum(item: FairteilerListItem): number {
  return item.activity7d.reduce((sum, count) => sum + count, 0)
}

/**
 * List order: Fairteiler with "etwas_da" first, then by 7-day activity
 * (descending). Returns a new array, the input is left untouched.
 */
export function sortFairteiler(items: FairteilerListItem[]): FairteilerListItem[] {
  return [...items].sort((a, b) => {
    const aHasFood = a.status.state === 'etwas_da' ? 0 : 1
    const bHasFood = b.status.state === 'etwas_da' ? 0 : 1
    if (aHasFood !== bHasFood) return aHasFood - bHasFood
    return activitySum(b) - activitySum(a)
  })
}

/** Nearest first; requires a user position. */
export function sortByDistance(
  items: FairteilerListItem[],
  here: LatLon,
): FairteilerListItem[] {
  return [...items].sort((a, b) => haversineKm(here, a) - haversineKm(here, b))
}

/** Most recently reported first; Fairteiler without any report go last. */
export function sortByLastReported(items: FairteilerListItem[]): FairteilerListItem[] {
  const stamp = (item: FairteilerListItem): number => {
    const iso = item.status.lastReportAt
    if (!iso) return Number.NEGATIVE_INFINITY
    const time = new Date(iso).getTime()
    return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
  }
  return [...items].sort((a, b) => stamp(b) - stamp(a))
}
