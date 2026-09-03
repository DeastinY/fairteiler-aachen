/** German relative time for report timestamps ("vor 18 Min", "vor 2 Std", "gestern"). */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'noch keine Meldung'
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'noch keine Meldung'

  const diffMs = now.getTime() - then.getTime()
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std`

  if (isYesterday(then, now)) return 'gestern'

  const days = Math.floor(hours / 24)
  return days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`
}

function isYesterday(then: Date, now: Date): boolean {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  return (
    then.getFullYear() === yesterday.getFullYear() &&
    then.getMonth() === yesterday.getMonth() &&
    then.getDate() === yesterday.getDate()
  )
}
