import { t, type MessageKey } from '../i18n'
import type { DayKey, FairteilerListItem, OpeningHours } from '../types'

export const DAY_KEYS: DayKey[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']

export function dayLabel(key: DayKey): string {
  return t(`hours.${key}` as MessageKey)
}

/** 16.5 -> "16:30", 10 -> "10". */
function formatHour(value: number): string {
  const whole = Math.floor(value)
  const minutes = Math.round((value - whole) * 60)
  if (minutes === 0) return String(whole)
  return `${whole}:${String(minutes).padStart(2, '0')}`
}

/** [10, 18] -> "10–18 Uhr", [10, 16.5] -> "10–16:30 Uhr" (per locale). */
export function formatRange(range: [number, number]): string {
  return t('hours.range', { from: formatHour(range[0]), to: formatHour(range[1]) })
}

export interface HoursRow {
  key: DayKey
  label: string
  text: string
  /** Formatted ranges, one entry each – wrap them in <bdi dir="ltr"> for RTL. */
  ranges: string[]
}

/** Seven Mo–So rows; days without ranges read "Geschlossen". */
export function formatHours(hours: OpeningHours): HoursRow[] {
  return DAY_KEYS.map((key) => {
    const ranges = (hours[key] ?? []).map(formatRange)
    return {
      key,
      label: dayLabel(key),
      text: ranges.length > 0 ? ranges.join(` ${t('hours.join')} `) : t('hours.closed'),
      ranges,
    }
  })
}

/** JS Date -> mo..su key (local time). */
export function todayKey(now: Date = new Date()): DayKey {
  // getDay(): 0 = Sunday ... 6 = Saturday
  const byGetDay: DayKey[] = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']
  return byGetDay[now.getDay()]!
}

/**
 * Subtle open/closed hint for list rows and cards.
 * "Jetzt geöffnet" is omitted for 24/7 places (their chip already says so);
 * unknown (null) shows nothing.
 */
export function openHint(
  item: Pick<FairteilerListItem, 'openNow' | 'aroundTheClock'>,
): string | null {
  if (item.openNow === false) return t('hours.closed')
  if (item.openNow === true && !item.aroundTheClock) return t('hours.openNow')
  return null
}
