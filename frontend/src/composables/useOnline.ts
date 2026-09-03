import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/** Reactive navigator.onLine, updated via the window online/offline events. */
export function useOnline(): Ref<boolean> {
  const online = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  const goOnline = () => (online.value = true)
  const goOffline = () => (online.value = false)

  onMounted(() => {
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', goOnline)
    window.removeEventListener('offline', goOffline)
  })

  return online
}

/**
 * The offline banner ("Offline – letzter bekannter Stand") is shown while the
 * browser is offline and a load either produced (possibly stale, cache-served)
 * data or failed. Before any load attempt there is nothing to flag.
 */
export function offlineBannerVisible(
  online: boolean,
  hasData: boolean,
  hasError: boolean,
): boolean {
  return !online && (hasData || hasError)
}
