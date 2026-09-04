<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../i18n'
import FilterChips from '../components/FilterChips.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import OfflineBanner from '../components/OfflineBanner.vue'
import { fetchBaskets, fetchFairteilerList } from '../composables/api'
import { loadAutoLocate } from '../composables/settings'
import { useFilters } from '../composables/useFilters'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import { formatDistance, haversineKm, selectionView, type LatLon } from '../lib/geo'
import { applyFilter } from '../lib/filters'
import { openHint } from '../lib/hours'
import { tagLabels } from '../lib/labels'
import { navigationUrl } from '../lib/navigation'
import { formatRelativeTime } from '../lib/relativeTime'
import { sortFairteiler } from '../lib/sort'
import { statusMeta } from '../lib/status'
import type { Basket, BasketsResponse, FairteilerListItem } from '../types'

const TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'

/** Flying to a fix further than this from the region would leave the map lost. */
const MAX_FLY_DISTANCE_KM = 100
/** Selection never zooms past this – neighbors stay visible. */
const SELECT_MAX_ZOOM = 16
/** Remote pins without neighbors: close, but not empty-street level. */
const SELECT_REMOTE_ZOOM = 14
const LOCATE_ZOOM = 15
/** Accuracy circles beyond this radius just swallow the map – cap the visual. */
const MAX_ACCURACY_RADIUS_M = 200

const router = useRouter()
const online = useOnline()
const filter = useFilters()

const items = ref<FairteilerListItem[] | null>(null)
const error = ref<string | null>(null)

const userPos = ref<LatLon | null>(null)
const userAccuracy = ref<number | null>(null)
const geoHint = ref<string | null>(null)
const locating = ref(false)

const selected = ref<FairteilerListItem | null>(null)
const selectedBasket = ref<Basket | null>(null)

const basketsData = ref<BasketsResponse | null>(null)

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let basketLayer: L.LayerGroup | null = null
let userMarker: L.Marker | null = null
let accuracyCircle: L.Circle | null = null

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

const selectedRouteHref = computed(() =>
  selected.value
    ? navigationUrl(
        selected.value.lat,
        selected.value.lon,
        selected.value.name,
        navigator.userAgent,
      )
    : null,
)

/** Announced via the aria-live region so a selection is never silent. */
const selectionAnnouncement = computed(() => {
  if (selectedBasket.value) return t('karte.basketTitle')
  return selected.value ? `${selected.value.name} – ${rowLine(selected.value)}` : ''
})

/** The chip appears whenever the basket lookup worked — an empty result is
 * information ("gerade keine da"), only a failed fetch hides the feature. */
const basketsAvailable = computed(() => basketsData.value !== null)

const basketsEmptyLine = computed(() =>
  basketsAvailable.value &&
  filter.baskets &&
  (basketsData.value?.baskets.length ?? 0) === 0
    ? t('karte.basketsEmpty')
    : null,
)

const basketStaleLine = computed(() => {
  if (!basketsData.value?.stale || !basketsData.value.fetchedAt) return null
  return t('karte.basketStale', {
    time: formatRelativeTime(basketsData.value.fetchedAt),
  })
})

async function load() {
  error.value = null
  items.value = null
  try {
    const [list, baskets] = await Promise.all([
      fetchFairteilerList(),
      fetchBaskets().catch(() => null), // baskets are a bonus – silently absent
    ])
    items.value = list
    basketsData.value = baskets
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
  basketLayer = null
  userMarker = null
  accuracyCircle = null
})

function initMap() {
  if (map || !mapEl.value || !items.value?.length) return
  map = L.map(mapEl.value, { zoomControl: false })
  L.tileLayer(TILE_URL, {
    maxZoom: 19,
    attribution: `© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>${t('karte.osmContributors')}`,
  }).addTo(map)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  basketLayer = L.layerGroup().addTo(map)
  // bounds stay fairteiler-only: baskets must not drag the initial view
  const bounds = L.latLngBounds(
    items.value.map((item) => [item.lat, item.lon] as [number, number]),
  )
  map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  // tapping empty map clears the selection
  map.on('click', deselect)
  renderMarkers()
  renderBasketMarkers()
}

/** Teardrop pin: status-colored fill, white inner dot, shadow, tip-anchored. */
function pinHtml(color: string, isSelected: boolean): string {
  const scale = isSelected ? 1.35 : 1
  const width = Math.round(30 * scale)
  const height = Math.round(40 * scale)
  const ring = isSelected
    ? '<circle cx="15" cy="14" r="12.5" fill="none" stroke="#fdfcf8" stroke-width="2.5" opacity="0.9"></circle>'
    : ''
  return (
    `<svg width="${width}" height="${height}" viewBox="0 0 30 40" aria-hidden="true" style="display:block;filter:drop-shadow(0 3px 4px rgba(34,48,31,0.35))">` +
    `<path d="M15 39 C10 30 2 22.5 2 14 A13 13 0 0 1 28 14 C28 22.5 20 30 15 39 Z" fill="${color}" stroke="#fdfcf8" stroke-width="2"></path>` +
    ring +
    '<circle cx="15" cy="14" r="4.5" fill="#fdfcf8"></circle>' +
    '</svg>'
  )
}

function pinIcon(item: FairteilerListItem, isSelected: boolean): L.DivIcon {
  const color = statusMeta(item.status.state).dotColor
  // the wrapper div is the ≥44px tap target; the pin sits tip-down inside it
  const size: [number, number] = isSelected ? [48, 56] : [44, 48]
  return L.divIcon({
    className: `pin-wrap${isSelected ? ' pin-selected' : ''}`,
    html: `<div class="pin-inner">${pinHtml(color, isSelected)}</div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] - 2],
  })
}

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  for (const item of filtered.value) {
    const marker = L.marker([item.lat, item.lon], {
      icon: pinIcon(item, selected.value?.id === item.id),
    })
    marker.on('click', () => onMarkerTap(item))
    markerLayer.addLayer(marker)
    // axe: the interactive pin element needs a name and a role
    const el = marker.getElement?.()
    if (el) {
      el.setAttribute('role', 'button')
      el.setAttribute('aria-label', item.name)
      el.setAttribute('tabindex', '0')
    }
  }
}

/** First tap selects and flies in; a second tap on the same pin opens details. */
function onMarkerTap(item: FairteilerListItem) {
  if (selected.value?.id === item.id) {
    openDetail(item.id)
    return
  }
  selectedBasket.value = null
  selected.value = item
  // keep context: fly to the selected pin plus its nearby neighbors
  const view = selectionView(item, filtered.value)
  if (view.single) {
    map?.flyTo([item.lat, item.lon], SELECT_REMOTE_ZOOM, { animate: true })
  } else {
    const bounds = L.latLngBounds(
      view.points.map((p) => [p.lat, p.lon] as [number, number]),
    )
    map?.flyToBounds(bounds, {
      // clear of the topbar/filter chips above and the sheet card below
      paddingTopLeft: [40, 130],
      paddingBottomRight: [40, 70],
      maxZoom: SELECT_MAX_ZOOM,
      animate: true,
    })
  }
  renderMarkers()
}

function deselect() {
  if (!selected.value && !selectedBasket.value) return
  selected.value = null
  selectedBasket.value = null
  renderMarkers()
}

/** Small basket-glyph pin – warm neutral, outside the status color language. */
function basketIcon(): L.DivIcon {
  const html =
    '<div class="pin-inner">' +
    '<svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true" style="display:block;filter:drop-shadow(0 2px 3px rgba(34,48,31,0.35))">' +
    '<path d="M13 33 C9 25.5 2 19 2 12 A11 11 0 0 1 24 12 C24 19 17 25.5 13 33 Z" fill="#8a6a3b" stroke="#fdfcf8" stroke-width="2"></path>' +
    '<g stroke="#fdfcf8" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M7.5 10.5h11l-1.4 6h-8.2z"></path>' +
    '<path d="M10 10.5 L13 6.5 L16 10.5"></path>' +
    '</g>' +
    '</svg></div>'
  return L.divIcon({
    className: 'basket-wrap',
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 42],
  })
}

function renderBasketMarkers() {
  if (!map || !basketLayer) return
  basketLayer.clearLayers()
  const list = basketsData.value?.baskets
  if (!filter.baskets || !Array.isArray(list)) return
  for (const basket of list) {
    const marker = L.marker([basket.lat, basket.lon], { icon: basketIcon() })
    marker.on('click', () => onBasketTap(basket))
    basketLayer.addLayer(marker)
    const el = marker.getElement?.()
    if (el) {
      el.setAttribute('role', 'button')
      el.setAttribute('aria-label', t('karte.basket'))
      el.setAttribute('tabindex', '0')
    }
  }
}

function onBasketTap(basket: Basket) {
  selected.value = null
  selectedBasket.value = basket
  map?.flyTo([basket.lat, basket.lon], 15, { animate: true })
  renderMarkers()
}

watch(() => filter.baskets, () => {
  if (!filter.baskets) selectedBasket.value = null
  renderBasketMarkers()
})

watch(filtered, () => {
  if (selected.value && !filtered.value.some((f) => f.id === selected.value?.id)) {
    selected.value = null
  }
  renderMarkers()
})

function renderUserMarker() {
  if (!map || !userPos.value) return
  userMarker?.remove()
  accuracyCircle?.remove()
  const latlng: [number, number] = [userPos.value.lat, userPos.value.lon]
  if (userAccuracy.value && userAccuracy.value > 0) {
    accuracyCircle = L.circle(latlng, {
      radius: Math.min(userAccuracy.value, MAX_ACCURACY_RADIUS_M),
      color: '#3b6ea5',
      weight: 1,
      opacity: 0.4,
      fillColor: '#3b6ea5',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map)
  }
  userMarker = L.marker(latlng, {
    icon: L.divIcon({
      className: 'userdot-wrap',
      html: '<span class="userdot-pulse"></span><span class="userdot-core"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    }),
    interactive: false,
  }).addTo(map)
}

/** Bounding-box center of all fairteiler – the "home" of this map. */
function regionCenter(): LatLon | null {
  if (!items.value?.length) return null
  const lats = items.value.map((f) => f.lat)
  const lons = items.value.map((f) => f.lon)
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lon: (Math.min(...lons) + Math.max(...lons)) / 2,
  }
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

/* ---------------- bottom sheet: peek / default / full ---------------- */

type SheetState = 'peek' | 'default' | 'full'
const SHEET_KEY = 'fairteiler-sheet-state'
const ORDER: SheetState[] = ['peek', 'default', 'full']

function loadSheetState(): SheetState {
  try {
    const stored = localStorage.getItem(SHEET_KEY)
    if (stored === 'peek' || stored === 'default' || stored === 'full') return stored
  } catch {
    // storage unavailable
  }
  return 'default'
}

const sheetState = ref<SheetState>(loadSheetState())
const dragOffset = ref(0)
let dragStartY: number | null = null

function setSheetState(next: SheetState) {
  sheetState.value = next
  try {
    localStorage.setItem(SHEET_KEY, next)
  } catch {
    // storage unavailable – state still applies this session
  }
  // Leaflet needs to know the viewport changed
  window.setTimeout(() => map?.invalidateSize({ animate: false }), 260)
}

/** Tap on the handle cycles default → peek → default (and full → default). */
function toggleSheet() {
  setSheetState(sheetState.value === 'peek' ? 'default' : 'peek')
}

function onDragStart(event: PointerEvent) {
  dragStartY = event.clientY
  dragOffset.value = 0
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

function onDragMove(event: PointerEvent) {
  if (dragStartY === null) return
  dragOffset.value = event.clientY - dragStartY
}

function onDragEnd() {
  if (dragStartY === null) return
  const moved = dragOffset.value
  dragStartY = null
  dragOffset.value = 0
  if (Math.abs(moved) < 24) {
    toggleSheet() // treat as a tap
    return
  }
  const index = ORDER.indexOf(sheetState.value)
  // dragging down (positive) collapses, dragging up expands
  const next = moved > 0 ? ORDER[Math.max(0, index - 1)] : ORDER[Math.min(2, index + 1)]
  setSheetState(next ?? 'default')
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
      userAccuracy.value = position.coords.accuracy ?? null
      renderUserMarker()
      const center = regionCenter()
      if (center && haversineKm(userPos.value, center) > MAX_FLY_DISTANCE_KM) {
        // don't jump the map to another city – distances still work
        geoHint.value = t('karte.farAway')
      } else {
        map?.flyTo([userPos.value.lat, userPos.value.lon], LOCATE_ZOOM, {
          animate: true,
        })
      }
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
  <div class="page" :class="`sheet-${sheetState}`">
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
      <FilterChips class="map-chips" :with-baskets="basketsAvailable" />
    </div>

    <!-- sheet -->
    <div class="sheet" :style="dragOffset ? { transform: `translateY(${Math.max(-40, Math.min(120, dragOffset))}px)` } : undefined">
      <button
        type="button"
        class="griphit"
        data-test="sheet-grip"
        :aria-label="t('karte.sheetToggle')"
        :aria-expanded="sheetState !== 'peek'"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span class="grip" aria-hidden="true"></span>
      </button>

      <!-- selections are announced, never silent -->
      <p class="sr-only" role="status">{{ selectionAnnouncement }}</p>

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

      <!-- selected basket card -->
      <div v-else-if="selectedBasket" class="selcard" data-test="basket-card">
        <div class="selhead">
          <span class="dot" style="background: #8a6a3b"></span>
          <span class="disp selname">{{ t('karte.basketTitle') }}</span>
          <button
            type="button"
            class="roundbtn selclose"
            :aria-label="t('karte.deselect')"
            data-test="deselect-basket"
            @click="deselect"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12 M18 6L6 18"></path>
            </svg>
          </button>
        </div>
        <p class="selline">{{ t('karte.basketCaption') }}</p>
        <p v-if="basketStaleLine" class="geohint" data-test="basket-stale">{{ basketStaleLine }}</p>
        <div class="selactions">
          <a
            :href="`https://foodsharing.de/essenskoerbe/${selectedBasket.id}`"
            class="seldetails basketlink"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('detail.fsLink') }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M7 17L17 7 M9 7h8v8"></path>
            </svg>
          </a>
        </div>
      </div>

      <!-- selected fairteiler card -->
      <div v-else-if="selected" class="selcard" data-test="selection-card">
        <div class="selhead">
          <span class="dot" :style="{ background: statusMeta(selected.status.state).dotColor }"></span>
          <span class="disp selname">{{ selected.name }}</span>
          <button
            type="button"
            class="roundbtn selclose"
            :aria-label="t('karte.deselect')"
            data-test="deselect"
            @click="deselect"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12 M18 6L6 18"></path>
            </svg>
          </button>
        </div>
        <p class="selline">{{ rowLine(selected) }}</p>
        <p class="selstreet">
          {{ selected.street }} · {{ selected.city }}
          <span v-if="distanceTo(selected)"> · {{ distanceTo(selected) }}</span>
        </p>
        <div class="selactions">
          <a
            v-if="selectedRouteHref"
            :href="selectedRouteHref"
            class="selroute"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 11l19-8-8 19-2.5-8.5z"></path>
            </svg>
            {{ t('detail.route') }}
          </a>
          <button type="button" class="seldetails" data-test="selection-details" @click="openDetail(selected.id)">
            {{ t('karte.details') }}
          </button>
        </div>
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

        <p v-if="basketsEmptyLine" class="geohint" data-test="baskets-empty">
          {{ basketsEmptyLine }}
        </p>

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
          <svg class="dir-flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6"></path>
          </svg>
        </button>
      </template>

      <p v-if="selected && geoHint" class="geohint">{{ geoHint }}</p>
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
  height: 100%;
  min-height: 220px;
  background: #e9e5d8;
  z-index: 1;
}

/* the page owns the viewport; map takes whatever the sheet leaves */
.page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 100dvh;
  padding-bottom: 0;
  overflow: hidden;
}

.map-area {
  flex: 1;
  min-height: 0;
}

/* Leaflet pins (divIcon) */
.map :deep(.pin-wrap) {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.map :deep(.pin-inner) {
  pointer-events: none;
}

.map :deep(.pin-selected) {
  z-index: 700 !important;
}

/* user location: pulsing blue dot */
.map :deep(.userdot-wrap) {
  background: none;
  border: none;
}

.map :deep(.userdot-core) {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #3b6ea5;
  border: 2.5px solid #fdfcf8;
  box-shadow: 0 1px 4px rgba(34, 48, 31, 0.4);
}

.map :deep(.userdot-pulse) {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(59, 110, 165, 0.45);
  animation: userdot-pulse 2s ease-out infinite;
}

@keyframes userdot-pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map :deep(.userdot-pulse) {
    animation: none;
    opacity: 0;
  }
}

/* zoom control: house style, ≥44px targets, clear of the sheet overlap */
.map :deep(.leaflet-control-zoom) {
  margin-bottom: 44px;
  margin-inline-end: 12px;
  border: none;
  box-shadow: 0 3px 12px rgba(34, 48, 31, 0.18);
  border-radius: 12px;
  overflow: hidden;
}

.map :deep(.leaflet-control-zoom a) {
  width: 44px;
  height: 44px;
  line-height: 44px;
  font-size: 20px;
  color: var(--ink);
  background: var(--surface);
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
  flex-shrink: 0;
  height: 46dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: height 0.25s ease, transform 0.15s ease;
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
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

/* selection card */
.selcard {
  padding: 2px 0 6px 0;
}

.selhead {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selname {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  font-size: 18px;
  hyphens: auto;
  overflow-wrap: break-word;
}

.selclose {
  background: var(--gray-soft);
  width: 36px;
  height: 36px;
  min-width: 44px;
  min-height: 44px;
  color: var(--gray-ink);
}

.selline {
  font-size: 13px;
  color: var(--ink);
  margin: 4px 0 0 0;
}

.selstreet {
  font-size: 13px;
  color: var(--muted);
  margin: 2px 0 0 0;
}

.selactions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.selroute {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1.5px solid #cfcaba;
  border-radius: 999px;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  min-height: 44px;
  color: var(--ink);
}

.selroute:hover {
  color: var(--ink);
}

.basketlink {
  color: var(--surface);
}

.basketlink:hover {
  color: var(--surface);
}

.map :deep(.basket-wrap) {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.seldetails {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--green);
  color: var(--surface);
  border-radius: 999px;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  min-height: 44px;
  box-shadow: 0 4px 12px rgba(47, 125, 84, 0.3);
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

/* the handle is a real control: tap toggles, drag snaps between states */
.griphit {
  display: block;
  width: 100%;
  padding: 6px 0 12px 0;
  margin: -6px 0 0 0;
  touch-action: none;
  cursor: grab;
}

.griphit:active {
  cursor: grabbing;
}

.grip {
  display: block;
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: #cfcaba;
  margin: 0 auto;
}

/* sheet states */
.page.sheet-peek .sheet {
  height: 84px;
  overflow: hidden;
}

.page.sheet-full .sheet {
  height: 76dvh;
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    transition: none;
  }
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
