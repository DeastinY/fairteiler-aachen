<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../i18n'
import FilterChips from '../components/FilterChips.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import OfflineBanner from '../components/OfflineBanner.vue'
import { fetchFairteilerList } from '../composables/api'
import { loadAutoLocate } from '../composables/settings'
import { useFilters } from '../composables/useFilters'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import { formatDistance, haversineKm, type LatLon } from '../lib/geo'
import { applyFilter } from '../lib/filters'
import { openHint } from '../lib/hours'
import { tagLabels } from '../lib/labels'
import { formatRelativeTime } from '../lib/relativeTime'
import { sortFairteiler } from '../lib/sort'
import { statusMeta } from '../lib/status'
import type { FairteilerListItem } from '../types'

const TILE_URL =
  'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/{z}/{y}/{x}.png'
const ATTRIBUTION =
  '© <a href="https://basemap.de" target="_blank" rel="noopener noreferrer">basemap.de</a> / BKG 2026'

const router = useRouter()
const online = useOnline()
const filter = useFilters()

const items = ref<FairteilerListItem[] | null>(null)
const error = ref<string | null>(null)

const userPos = ref<LatLon | null>(null)
const geoHint = ref<string | null>(null)
const locating = ref(false)

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let userMarker: L.CircleMarker | null = null

const filtered = computed(() =>
  items.value ? applyFilter(items.value, filter) : [],
)

const showOffline = computed(() =>
  offlineBannerVisible(online.value, items.value !== null, error.value !== null),
)

const reportedCount = computed(
  () => items.value?.filter((f) => f.status.state !== 'keine_meldung').length ?? 0,
)

const nearest = computed(() => {
  if (userPos.value) {
    const here = userPos.value
    return [...filtered.value].sort(
      (a, b) => haversineKm(here, a) - haversineKm(here, b),
    )
  }
  return sortFairteiler(filtered.value)
})

const topRows = computed(() => nearest.value.slice(0, 3))

async function load() {
  error.value = null
  items.value = null
  try {
    items.value = await fetchFairteilerList()
    await nextTick()
    initMap()
  } catch {
    error.value = t('common.loadError')
  }
}

onMounted(async () => {
  await load()
  if (items.value && loadAutoLocate()) useLocation()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
  userMarker = null
})

function initMap() {
  if (map || !mapEl.value || !items.value?.length) return
  map = L.map(mapEl.value, { zoomControl: false })
  L.tileLayer(TILE_URL, { maxZoom: 18, attribution: ATTRIBUTION }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  const bounds = L.latLngBounds(
    items.value.map((item) => [item.lat, item.lon] as [number, number]),
  )
  map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  renderMarkers()
}

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  for (const item of filtered.value) {
    const color = statusMeta(item.status.state).dotColor
    const visual = L.circleMarker([item.lat, item.lon], {
      radius: 10,
      color: '#fdfcf8',
      weight: 2.5,
      fillColor: color,
      fillOpacity: 1,
      interactive: false,
    })
    // invisible, larger circle = the actual tap target (~44px diameter)
    const hit = L.circleMarker([item.lat, item.lon], {
      radius: 22,
      stroke: false,
      fill: true,
      fillOpacity: 0,
    })
    hit.on('click', () => openDetail(item.id))
    hit.bindTooltip(`${item.name} – ${statusMeta(item.status.state).label}`, {
      direction: 'top',
      offset: L.point(0, -10),
    })
    markerLayer.addLayer(visual)
    markerLayer.addLayer(hit)
    // axe: interactive SVG paths need a name and a role
    const el = hit.getElement?.()
    if (el) {
      el.setAttribute('role', 'button')
      el.setAttribute('aria-label', item.name)
      el.setAttribute('tabindex', '0')
    }
  }
}

watch(filtered, renderMarkers)

function renderUserMarker() {
  if (!map || !userPos.value) return
  userMarker?.remove()
  userMarker = L.circleMarker([userPos.value.lat, userPos.value.lon], {
    radius: 7,
    color: '#fdfcf8',
    weight: 3,
    fillColor: '#3b6ea5',
    fillOpacity: 1,
    interactive: false,
  }).addTo(map)
}

function distanceTo(item: FairteilerListItem): string | null {
  if (!userPos.value) return null
  return formatDistance(haversineKm(userPos.value, item))
}

function rowLine(item: FairteilerListItem): string {
  const meta = statusMeta(item.status.state)
  const parts = [meta.label]
  if (item.status.lastReportAt) {
    parts.push(formatRelativeTime(item.status.lastReportAt))
    const tags = tagLabels(item.status.tags)
    if (tags) parts.push(tags)
  }
  const hint = openHint(item)
  if (hint) parts.push(hint)
  return parts.join(' · ')
}

function openDetail(id: number) {
  router.push(`/fairteiler/${id}`)
}

function useLocation() {
  geoHint.value = null
  if (!('geolocation' in navigator)) {
    geoHint.value = t('karte.geoUnsupported')
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
      renderUserMarker()
    },
    () => {
      locating.value = false
      geoHint.value = t('karte.geoDenied')
    },
    { timeout: 10_000, maximumAge: 60_000 },
  )
}
</script>

<template>
  <div class="page">
    <h1 class="sr-only">{{ t('nav.karte') }}</h1>
    <div class="map-area">
      <div ref="mapEl" class="map" role="region" :aria-label="t('karte.mapAria')"></div>

      <!-- brand pill + locate -->
      <div class="map-topbar">
        <div class="brandpill">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 20 C5 11 10 5 20 4 C21 14 15 19 8 19"></path>
            <path d="M5 20 C8 15 12 12 16 10"></path>
          </svg>
          <span class="disp brandname">{{ t('common.appName') }}</span>
        </div>
        <button type="button" class="locbtn" :disabled="locating" @click="useLocation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="7"></circle>
            <path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3"></path>
          </svg>
          {{ locating ? t('karte.locating') : t('karte.locate') }}
        </button>
      </div>

      <!-- filter chips -->
      <FilterChips class="map-chips" />
    </div>

    <!-- sheet -->
    <div class="sheet">
      <div class="grip" aria-hidden="true"></div>

      <OfflineBanner v-if="showOffline" class="sheet-offline" />

      <div v-if="!items && !error" data-test="skeletons">
        <div class="sk-head">
          <SkeletonBlock width="38%" height="19px" announce />
          <SkeletonBlock width="90px" height="13px" />
        </div>
        <div v-for="n in 3" :key="n" class="sk-row">
          <SkeletonBlock width="10px" height="10px" rounded />
          <div class="sk-rowbody">
            <SkeletonBlock width="45%" height="15px" />
            <SkeletonBlock width="70%" height="13px" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="hint error">
        <p>{{ error }}</p>
        <button type="button" class="retrybtn" @click="load">{{ t('common.retry') }}</button>
      </div>

      <template v-else-if="items">
        <div class="sheethead">
          <span class="disp sheettitle">{{ t('karte.nearby') }}</span>
          <RouterLink to="/liste" class="alllink">{{ t('karte.showAll', { n: items.length }) }}</RouterLink>
        </div>
        <p class="summary">
          {{ t('karte.summary', { reported: reportedCount, total: items.length }) }}
        </p>
        <p v-if="geoHint" class="geohint">{{ geoHint }}</p>

        <p v-if="filtered.length === 0" class="summary nofilter">
          {{ t('common.noFilterMatch') }}
        </p>

        <button
          v-for="item in topRows"
          :key="item.id"
          type="button"
          class="nearrow"
          @click="openDetail(item.id)"
        >
          <span class="dot" :style="{ background: statusMeta(item.status.state).dotColor }"></span>
          <span class="rowbody">
            <span class="rowname">{{ item.name }}</span>
            <span class="rowline">{{ rowLine(item) }}</span>
          </span>
          <span v-if="distanceTo(item)" class="rowdist">{{ distanceTo(item) }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6"></path>
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.map-area {
  position: relative;
  background: #e9e5d8;
  /* contain Leaflet's internal z-indexes (panes 400+, controls 800+) so
     they can never rise above the welcome overlay, nav, or toasts */
  isolation: isolate;
  z-index: 0;
}

.map {
  position: relative;
  width: 100%;
  height: 48vh;
  min-height: 300px;
  background: #e9e5d8;
  z-index: 1;
}

.map-topbar {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 500;
  pointer-events: none;
}

.brandpill,
.locbtn {
  pointer-events: auto;
}

.brandpill {
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--surface);
  border-radius: 999px;
  padding: 10px 16px;
  box-shadow: 0 3px 12px rgba(34, 48, 31, 0.12);
}

.brandname {
  font-weight: 700;
  font-size: 16px;
}

.locbtn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface);
  border-radius: 999px;
  padding: 10px 14px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  box-shadow: 0 3px 12px rgba(34, 48, 31, 0.12);
  flex-shrink: 0;
}

.locbtn:disabled {
  opacity: 0.6;
}

.map-chips {
  position: absolute;
  left: 0;
  right: 0;
  top: 74px;
  padding: 4px 16px;
  z-index: 500;
}

.sheet {
  min-height: 180px;
  margin-top: -26px;
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -6px 24px rgba(34, 48, 31, 0.1);
  padding: 10px 20px 8px 20px;
  position: relative;
  z-index: 2;
}

.sheet-offline {
  margin: 0 0 10px 0;
}

.sk-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sk-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  min-height: 44px;
  border-bottom: 1px solid var(--border-soft);
}

.sk-row:last-of-type {
  border-bottom: none;
}

.sk-rowbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #d9d5c7;
  margin: 0 auto 14px auto;
}

.sheethead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.sheettitle {
  font-weight: 700;
  font-size: 19px;
}

.alllink {
  font-size: 13px;
  font-weight: 600;
  color: var(--green);
  padding: 6px 0;
}

.summary {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 6px 0;
}

.nofilter {
  padding: 8px 0;
}

.geohint {
  font-size: 12px;
  color: var(--faint);
  margin: 0 0 6px 0;
}

.nearrow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  min-height: 44px;
  width: 100%;
  border-bottom: 1px solid var(--border-soft);
}

.nearrow:last-of-type {
  border-bottom: none;
}

.rowbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.rowname {
  font-weight: 600;
  font-size: 15px;
}

.rowline {
  font-size: 13px;
  color: var(--muted);
}

.rowdist {
  font-size: 13px;
  color: var(--muted);
  flex-shrink: 0;
}
</style>
