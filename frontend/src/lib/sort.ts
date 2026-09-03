import type { FairteilerListItem } from '../types'

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
