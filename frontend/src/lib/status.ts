import type { StatusState } from '../types'

export interface StatusMeta {
  /** German label shown in badges. */
  label: string
  /** CSS class of the status chip (defined in the global stylesheet). */
  badgeClass: 'badge-green' | 'badge-gray' | 'badge-amber'
  /** Dot color used next to the status text. */
  dotColor: string
}

const META: Record<StatusState, StatusMeta> = {
  etwas_da: { label: 'Etwas da', badgeClass: 'badge-green', dotColor: '#2f7d54' },
  leer: { label: 'Leer gemeldet', badgeClass: 'badge-gray', dotColor: '#6b7570' },
  keine_meldung: {
    label: 'Keine aktuelle Meldung',
    badgeClass: 'badge-amber',
    dotColor: '#c08a1e',
  },
}

export function statusMeta(state: StatusState | string): StatusMeta {
  return META[state as StatusState] ?? META.keine_meldung
}
