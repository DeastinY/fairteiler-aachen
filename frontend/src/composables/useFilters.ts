import { reactive, watch } from 'vue'
import { emptyFilter, type FairteilerFilter } from '../lib/filters'

const STORAGE_KEY = 'fairteiler-filter'

function restore(): FairteilerFilter {
  const filter = emptyFilter()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored: unknown = JSON.parse(raw)
      if (typeof stored === 'object' && stored !== null) {
        const record = stored as Record<string, unknown>
        filter.etwasDa = record['etwasDa'] === true
        filter.aroundTheClock = record['aroundTheClock'] === true
        filter.cooled = record['cooled'] === true
        filter.accessible = record['accessible'] === true
        filter.openNow = record['openNow'] === true
        filter.baskets = record['baskets'] !== false // default on
      }
    }
  } catch {
    // storage unavailable – start with an empty filter
  }
  return filter
}

/** Shared across Karte and Liste, persisted per browser. */
const filter = reactive<FairteilerFilter>(restore())

watch(filter, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // storage unavailable – filter still works for this session
  }
})

export function useFilters(): FairteilerFilter {
  return filter
}

export function resetFilters(): void {
  Object.assign(filter, emptyFilter())
}
