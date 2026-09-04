<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '../i18n'
import {
  fetchFairteilerList,
  fetchPushConfig,
  fetchStats,
  putPushSubscription,
} from '../composables/api'
import { loadPushPrefs, savePushPrefs } from '../composables/pushPrefs'
import {
  buildSubscriptionPayload,
  isPushSupported,
  pushAvailability,
  urlBase64ToUint8Array,
  type PushConfig,
} from '../lib/push'
import { sortFairteiler } from '../lib/sort'
import type { FairteilerListItem, Stats } from '../types'

const stats = ref<Stats | null>(null)

const items = ref<FairteilerListItem[] | null>(null)
const config = ref<PushConfig | null>(null)
const loadError = ref<string | null>(null)

const selectedIds = ref<number[]>([])
const quietHours = ref(false)
const basketAlerts = ref(false)
const emptyAlerts = ref(false)
const hint = ref<string | null>(null)
const saving = ref(false)

const supported = isPushSupported()
const availability = computed(() => pushAvailability(config.value, supported))
const ready = computed(() => availability.value === 'ready')

const unavailableNote = computed(() => {
  if (availability.value === 'unsupported') return t('aktivitaet.unsupported')
  return t('aktivitaet.serverDisabled')
})

async function load() {
  loadError.value = null
  const prefs = loadPushPrefs()
  selectedIds.value = prefs.ids
  quietHours.value = prefs.quietHours
  basketAlerts.value = prefs.baskets
  emptyAlerts.value = prefs.emptyAlerts
  try {
    const [list, pushConfig, statsData] = await Promise.all([
      fetchFairteilerList(),
      fetchPushConfig().catch(() => null),
      fetchStats().catch(() => null), // stats are a nicety – fail silently
    ])
    items.value = sortFairteiler(list)
    config.value = pushConfig
    stats.value = statsData
  } catch {
    loadError.value = t('common.loadError')
  }
}

onMounted(load)

function isFollowed(id: number): boolean {
  return selectedIds.value.includes(id)
}

/** Ensures permission + subscription, then PUTs the full current state. */
async function syncServer(): Promise<boolean> {
  const key = config.value?.vapidPublicKey
  if (!key) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    hint.value = t('aktivitaet.permissionBlocked')
    return false
  }
  // never hang forever: serviceWorker.ready only resolves once a SW is
  // active — if none installs, fail fast with a clear message instead
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ])
  if (!registration) {
    hint.value = t('aktivitaet.noServiceWorker')
    return false
  }
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
    })
  }
  const payload = buildSubscriptionPayload(
    subscription.toJSON(),
    selectedIds.value,
    quietHours.value,
    basketAlerts.value,
    emptyAlerts.value,
  )
  if (!payload) {
    hint.value = t('aktivitaet.subscribeFailed')
    return false
  }
  await putPushSubscription(payload)
  return true
}

async function applyChange(mutate: () => void, revert: () => void) {
  if (saving.value || !ready.value) return
  hint.value = null
  mutate()
  saving.value = true
  try {
    const ok = await syncServer()
    if (!ok) {
      revert()
      return
    }
    savePushPrefs(selectedIds.value, quietHours.value, basketAlerts.value, emptyAlerts.value)
  } catch {
    revert()
    hint.value = t('aktivitaet.saveFailed')
  } finally {
    saving.value = false
  }
}

function toggleFairteiler(id: number) {
  const before = [...selectedIds.value]
  void applyChange(
    () => {
      selectedIds.value = isFollowed(id)
        ? selectedIds.value.filter((x) => x !== id)
        : [...selectedIds.value, id]
    },
    () => {
      selectedIds.value = before
    },
  )
}

function toggleEmptyAlerts() {
  const before = emptyAlerts.value
  void applyChange(
    () => {
      emptyAlerts.value = !emptyAlerts.value
    },
    () => {
      emptyAlerts.value = before
    },
  )
}

function toggleBasketAlerts() {
  const before = basketAlerts.value
  void applyChange(
    () => {
      basketAlerts.value = !basketAlerts.value
    },
    () => {
      basketAlerts.value = before
    },
  )
}

function toggleQuietHours() {
  const before = quietHours.value
  void applyChange(
    () => {
      quietHours.value = !quietHours.value
    },
    () => {
      quietHours.value = before
    },
  )
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">{{ t('aktivitaet.title') }}</h1>
      <p class="page-sub">{{ t('aktivitaet.subtitle') }}</p>
    </header>

    <p v-if="stats" class="card statsline" data-test="stats">
      <span>{{
        t(stats.reports7d === 1 ? 'aktivitaet.statsOne' : 'aktivitaet.statsMany', {
          n: stats.reports7d,
          withFood: stats.withFood,
          total: stats.fairteilerTotal,
        })
      }}</span>
      <RouterLink to="/statistik" class="statslink">{{ t('aktivitaet.statsLink') }}</RouterLink>
    </p>

    <div v-if="!ready" class="card note" data-test="push-unavailable">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a6516" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 8v4 M12 16h.01"></path>
      </svg>
      <span>{{ unavailableNote }}</span>
    </div>

    <p v-if="hint" class="card hintcard" role="alert">{{ hint }}</p>

    <p v-if="!items && !loadError" class="hint">{{ t('common.loading') }}</p>
    <div v-else-if="loadError" class="hint error">
      <p>{{ loadError }}</p>
      <button type="button" class="retrybtn" @click="load">{{ t('common.retry') }}</button>
    </div>

    <div v-else-if="items" class="card list">
      <div v-for="item in items" :key="item.id" class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="isFollowed(item.id) ? '#2f7d54' : '#a8a494'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"></path>
          <path d="M10.3 20a2 2 0 0 0 3.4 0"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname" :class="{ muted: !isFollowed(item.id) }">{{ item.name }}</span>
          <span class="rownote">
            {{ isFollowed(item.id) ? t('aktivitaet.followOn') : t('aktivitaet.followOff') }}
          </span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="isFollowed(item.id)"
          :disabled="!ready || saving"
          :aria-label="t('aktivitaet.followAria', { name: item.name })"
          @click="toggleFairteiler(item.id)"
        >
          <span class="knob"></span>
        </button>
      </div>
    </div>

    <div v-if="items" class="card list quiet">
      <div class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 8h14l-1.2 12H6.2z"></path>
          <path d="M9 12h6"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">{{ t('aktivitaet.emptyAlerts') }}</span>
          <span class="rownote">{{ t('aktivitaet.emptyAlertsNote') }}</span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="emptyAlerts"
          :disabled="!ready || saving"
          :aria-label="t('aktivitaet.emptyAlerts')"
          data-test="empty-toggle"
          @click="toggleEmptyAlerts"
        >
          <span class="knob"></span>
        </button>
      </div>
      <div class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a6a3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 9h16l-1.5 10.5H5.5z"></path>
          <path d="M9 9 11 4M15 9 13 4"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">{{ t('aktivitaet.baskets') }}</span>
          <span class="rownote">{{ t('aktivitaet.basketsNote') }}</span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="basketAlerts"
          :disabled="!ready || saving"
          :aria-label="t('aktivitaet.baskets')"
          data-test="baskets-toggle"
          @click="toggleBasketAlerts"
        >
          <span class="knob"></span>
        </button>
      </div>
      <div class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M20 13a8 8 0 1 1-9-10 6.5 6.5 0 0 0 9 10z"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">{{ t('aktivitaet.quietTitle') }}</span>
          <span class="rownote">{{ t('aktivitaet.quietNote') }}</span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="quietHours"
          :disabled="!ready || saving"
          :aria-label="t('aktivitaet.quietTitle')"
          data-test="quiet-toggle"
          @click="toggleQuietHours"
        >
          <span class="knob"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statsline {
  margin: 16px 16px 0 16px;
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.statslink {
  font-size: 12px;
  font-weight: 600;
}

.note {
  margin: 16px 16px 0 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--amber-ink);
  background: var(--amber-soft);
  border-color: #e8dcbb;
}

.note svg {
  flex-shrink: 0;
}

.hintcard {
  margin: 12px 16px 0 16px;
  padding: 12px 16px;
  font-size: 13px;
  color: #8a3b2a;
  background: #f6e3dc;
  border-color: #ecd2c6;
}

.list {
  margin: 12px 16px 0 16px;
  padding: 6px 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-soft);
  min-height: 44px;
}

.row:last-child {
  border-bottom: none;
}

.row > svg {
  flex-shrink: 0;
}

.rowbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.rowname {
  font-size: 15px;
  font-weight: 600;
}

.rowname.muted {
  color: var(--muted);
}

.rownote {
  font-size: 12px;
  color: var(--faint);
}

.switch {
  width: 46px;
  height: 28px;
  border-radius: 999px;
  background: #d9d5c7;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.switch[aria-checked='true'] {
  background: var(--green);
}

.switch:disabled {
  opacity: 0.55;
  cursor: default;
}

.switch .knob {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface);
  transition: transform 0.2s;
}

.switch[aria-checked='true'] .knob {
  transform: translateX(18px);
}
</style>
