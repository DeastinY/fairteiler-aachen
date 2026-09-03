import { t } from '../i18n'
import type { StatusState } from '../types'

export interface StatusMeta {
  /** Translated label shown in badges. */
  label: string
  /** CSS class of the status chip (defined in the global stylesheet). */
  badgeClass: 'badge-green' | 'badge-gray' | 'badge-amber'
  /** Dot color used next to the status text. */
  dotColor: string
}

const META: Record<StatusState, Omit<StatusMeta, 'label'>> = {
  etwas_da: { badgeClass: 'badge-green', dotColor: '#2f7d54' },
  leer: { badgeClass: 'badge-gray', dotColor: '#6b7570' },
  keine_meldung: { badgeClass: 'badge-amber', dotColor: '#c08a1e' },
}

export function statusMeta(state: StatusState | string): StatusMeta {
  const known = (state in META ? state : 'keine_meldung') as StatusState
  return { ...META[known], label: t(`status.${known}`) }
}
