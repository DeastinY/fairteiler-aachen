<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '../i18n'
import FairteilerCard from '../components/FairteilerCard.vue'
import FairteilerCardSkeleton from '../components/FairteilerCardSkeleton.vue'
import FilterChips from '../components/FilterChips.vue'
import OfflineBanner from '../components/OfflineBanner.vue'
import { fetchFairteilerList } from '../composables/api'
import { loadListSort, saveListSort } from '../composables/settings'
import { useFilters } from '../composables/useFilters'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import { applyFilter } from '../lib/filters'
import { formatDistance, haversineKm, type LatLon } from '../lib/geo'
import {
  sortByDistance,
  sortByLastReported,
  sortFairteiler,
  type ListSortMode,
} from '../lib/sort'
import type { FairteilerListItem } from '../types'

const online = useOnline()
const items = ref<FairteilerListItem[] | null>(null)
const error = ref<string | null>(null)

const sortMode = ref<ListSortMode>(loadListSort())
const userPos = ref<LatLon | null>(null)
const geoHint = ref<string | null>(null)
const locating = ref(false)

const showOffline = computed(() =>
  offlineBannerVisible(online.value, items.value !== null, error.value !== null),
)

const filter = useFilters()

const sorted = computed(() => {
  if (!items.value) return []
  const filtered = applyFilter(items.value, filter)
  if (sortMode.value === 'distance' && userPos.value) {
    return sortByDistance(filtered, userPos.value)
  }
  if (sortMode.value === 'lastReported') return sortByLastReported(filtered)
  return sortFairteiler(filtered)
})

const reported = computed(
  () => items.value?.filter((f) => f.status.state !== 'keine_meldung').length ?? 0,
)

const SORT_CHIPS: { mode: ListSortMode; labelKey: 'liste.sortActivity' | 'liste.sortDistance' | 'liste.sortLastReported' }[] = [
  { mode: 'activity', labelKey: 'liste.sortActivity' },
  { mode: 'distance', labelKey: 'liste.sortDistance' },
  { mode: 'lastReported', labelKey: 'liste.sortLastReported' },
]

function distanceTo(item: FairteilerListItem): string | null {
  if (sortMode.value !== 'distance' || !userPos.value) return null
  return formatDistance(haversineKm(userPos.value, item))
}

function chooseSort(mode: ListSortMode) {
  geoHint.value = null
  if (mode === 'distance') {
    sortMode.value = 'distance'
    saveListSort('distance')
    if (!userPos.value) locate()
    return
  }
  sortMode.value = mode
  saveListSort(mode)
}

/** Same pattern as the Karte: explicit ask, denial falls back gracefully. */
function locate() {
  if (!('geolocation' in navigator)) {
    fallbackToActivity(t('karte.geoUnsupported'))
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false
      userPos.value = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      }
    },
    () => {
      locating.value = false
      fallbackToActivity(t('karte.geoDenied'))
    },
    { timeout: 10_000, maximumAge: 60_000 },
  )
}

function fallbackToActivity(hint: string) {
  geoHint.value = hint
  sortMode.value = 'activity'
  saveListSort('activity')
}

async function load() {
  error.value = null
  items.value = null
  try {
    items.value = await fetchFairteilerList()
  } catch {
    error.value = t('common.loadError')
  }
}

onMounted(async () => {
  await load()
  // restored "distance" choice needs a position again
  if (items.value && sortMode.value === 'distance' && !userPos.value) locate()
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">{{ t('liste.title') }}</h1>
      <p v-if="items" class="page-sub">
        {{ t('liste.summary', { total: items.length, reported }) }}
      </p>
      <p v-else class="page-sub">{{ t('liste.subtitle') }}</p>
      <div class="sortchips" role="group" :aria-label="t('liste.sortAria')">
        <button
          v-for="chip in SORT_CHIPS"
          :key="chip.mode"
          type="button"
          class="sortchip"
          :class="{ active: sortMode === chip.mode }"
          :aria-pressed="sortMode === chip.mode"
          :disabled="locating && chip.mode === 'distance'"
          :data-test="`sort-${chip.mode}`"
          @click="chooseSort(chip.mode)"
        >
          {{ t(chip.labelKey) }}
        </button>
      </div>
      <p v-if="geoHint" class="geohint" data-test="geo-hint">{{ geoHint }}</p>
      <FilterChips class="listchips" />
    </header>

    <OfflineBanner v-if="showOffline" />

    <div v-if="!items && !error" class="cards" data-test="skeletons">
      <FairteilerCardSkeleton announce />
      <FairteilerCardSkeleton />
      <FairteilerCardSkeleton />
    </div>

    <div v-else-if="error" class="hint error">
      <p>{{ error }}</p>
      <button type="button" class="retrybtn" @click="load">{{ t('common.retry') }}</button>
    </div>

    <div v-else-if="items" class="cards">
      <p v-if="items.length === 0" class="hint" data-test="empty">
        {{ t('liste.empty') }}
      </p>
      <p v-else-if="sorted.length === 0" class="hint">
        {{ t('common.noFilterMatch') }}
      </p>
      <FairteilerCard
        v-for="item in sorted"
        :key="item.id"
        :fairteiler="item"
        :distance-text="distanceTo(item)"
      />
    </div>
  </div>
</template>

<style scoped>
.sortchips {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.sortchip {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid #e2ded0;
  border-radius: 999px;
  padding: 9px 15px;
  font-size: 13px;
  font-weight: 500;
  min-height: 38px;
}

.sortchip.active {
  background: var(--ink);
  color: var(--surface);
  border-color: var(--ink);
  font-weight: 600;
}

.sortchip:disabled {
  opacity: 0.6;
}

.geohint {
  font-size: 12px;
  color: var(--faint);
  margin: 8px 0 0 0;
}

.listchips {
  margin-top: 12px;
}

.cards {
  padding: 16px 16px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
