import type { FairteilerListItem } from '../types'

export interface FairteilerFilter {
  /** Only Fairteiler currently reported as "etwas da". */
  etwasDa: boolean
  /** Only Fairteiler accessible around the clock. */
  aroundTheClock: boolean
  /** Only Fairteiler with a fridge. */
  cooled: boolean
  /** Only Fairteiler that are open right now (unknown hours are excluded). */
  openNow: boolean
  /** Visibility toggle for basket markers on the Karte (default on). */
  baskets: boolean
}

export function emptyFilter(): FairteilerFilter {
  return {
    etwasDa: false,
    aroundTheClock: false,
    cooled: false,
    openNow: false,
    baskets: true,
  }
}

/** Active chips combine with AND; inactive chips do not restrict. */
export function applyFilter(
  items: FairteilerListItem[],
  filter: FairteilerFilter,
): FairteilerListItem[] {
  return items.filter((item) => {
    if (filter.etwasDa && item.status.state !== 'etwas_da') return false
    if (filter.aroundTheClock && !item.aroundTheClock) return false
    if (filter.cooled && !item.cooled) return false
    // honest semantics: with the filter active, unknown hours (null) are
    // excluded – we only show places we KNOW to be open
    if (filter.openNow && !(item.openNow === true || item.aroundTheClock)) return false
    return true
  })
}
