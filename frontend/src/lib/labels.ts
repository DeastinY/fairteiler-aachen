import type { ReportType } from '../types'

/** Food tags accepted by the backend, in display order. */
export const FOOD_TAGS = [
  'brot_backwaren',
  'obst',
  'gemuese',
  'gekuehltes',
  'konserven',
  'zubereitetes',
  'sonstiges',
] as const

export type FoodTag = (typeof FOOD_TAGS)[number]

const TAG_LABELS: Record<FoodTag, string> = {
  brot_backwaren: 'Brot & Backwaren',
  obst: 'Obst',
  gemuese: 'Gemüse',
  gekuehltes: 'Gekühltes',
  konserven: 'Konserven',
  zubereitetes: 'Zubereitetes',
  sonstiges: 'Sonstiges',
}

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag as FoodTag] ?? tag
}

export function tagLabels(tags: string[]): string {
  return tags.map(tagLabel).join(', ')
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  brought: 'Etwas gebracht',
  taken: 'Etwas mitgenommen',
  empty: 'Leer gemeldet',
}

export function reportTypeLabel(type: ReportType | string): string {
  return REPORT_TYPE_LABELS[type as ReportType] ?? type
}
