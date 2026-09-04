import { t, type MessageKey } from '../i18n'
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

export function tagLabel(tag: string): string {
  if (!(FOOD_TAGS as readonly string[]).includes(tag)) return tag
  return t(`tags.${tag}` as MessageKey)
}

export function tagLabels(tags: string[]): string {
  return tags.map(tagLabel).join(t('common.listSeparator'))
}

const REPORT_TYPES: readonly ReportType[] = [
  'brought',
  'taken',
  'empty',
  'cleaned',
  'needs_cleaning',
  'needs_maintenance',
  'access_ok',
  'access_hard',
]

export function reportTypeLabel(type: ReportType | string): string {
  if (!REPORT_TYPES.includes(type as ReportType)) return type
  return t(`report.${type}` as MessageKey)
}
