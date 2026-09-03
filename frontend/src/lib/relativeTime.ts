import { t } from '../i18n'

/** Relative time for report timestamps ("vor 18 Min", "vor 2 Std", "gestern"). */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return t('time.none')
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return t('time.none')

  const diffMs = now.getTime() - then.getTime()
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutes', { n: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hours', { n: hours })

  if (isYesterday(then, now)) return t('time.yesterday')

  const days = Math.floor(hours / 24)
  return days === 1 ? t('time.day') : t('time.days', { n: days })
}

function isYesterday(then: Date, now: Date): boolean {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  return (
    then.getFullYear() === yesterday.getFullYear() &&
    then.getMonth() === yesterday.getMonth() &&
    then.getDate() === yesterday.getDate()
  )
}
