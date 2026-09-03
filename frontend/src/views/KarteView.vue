<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import OfflineBanner from '../components/OfflineBanner.vue'
import { fetchFairteilerList } from '../composables/api'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import {
  createProjection,
  formatDistance,
  haversineKm,
  type LatLon,
} from '../lib/geo'
import { tagLabels } from '../lib/labels'
import { formatRelativeTime } from '../lib/relativeTime'
import { sortFairteiler } from '../lib/sort'
import { statusMeta } from '../lib/status'
import type { FairteilerListItem } from '../types'

const MAP_W = 390
const MAP_H = 452

const router = useRouter()
const online = useOnline()

const items = ref<FairteilerListItem[] | null>(null)
const error = ref<string | null>(null)

const userPos = ref<LatLon | null>(null)
const geoHint = ref<string | null>(null)
const locating = ref(false)

async function load() {
  error.value = null
  items.value = null
  try {
    items.value = await fetchFairteilerList()
  } catch {
    error.value = 'Die Fairteiler konnten nicht geladen werden. Bist du online?'
  }
}

onMounted(load)

const showOffline = computed(() =>
  offlineBannerVisible(online.value, items.value !== null, error.value !== null),
)

const projection = computed(() =>
  createProjection(items.value ?? [], MAP_W, MAP_H, 0.08),
)

const pins = computed(() => {
  if (!items.value) return []
  return items.value.map((item) => ({
    item,
    ...projection.value(item),
    color: statusMeta(item.status.state).dotColor,
  }))
})

const userDot = computed(() => {
  if (!userPos.value || !items.value?.length) return null
  const p = projection.value(userPos.value)
  // hide the dot if the user is far outside the schematic view
  if (p.x < 0 || p.x > MAP_W || p.y < 0 || p.y > MAP_H) return null
  return p
})

const reportedCount = computed(
  () => items.value?.filter((f) => f.status.state !== 'keine_meldung').length ?? 0,
)

const nearest = computed(() => {
  if (!items.value) return []
  if (userPos.value) {
    const here = userPos.value
    return [...items.value].sort(
      (a, b) => haversineKm(here, a) - haversineKm(here, b),
    )
  }
  return sortFairteiler(items.value)
})

const topRows = computed(() => nearest.value.slice(0, 3))

function distanceTo(item: FairteilerListItem): string | null {
  if (!userPos.value) return null
  return formatDistance(haversineKm(userPos.value, item))
}

function rowLine(item: FairteilerListItem): string {
  const meta = statusMeta(item.status.state)
  if (!item.status.lastReportAt) return meta.label
  const parts = [meta.label, formatRelativeTime(item.status.lastReportAt)]
  const tags = tagLabels(item.status.tags)
  if (tags) parts.push(tags)
  return parts.join(' · ')
}

function openDetail(id: number) {
  router.push(`/fairteiler/${id}`)
}

function pinLabel(item: FairteilerListItem): string {
  return `${item.name} – ${statusMeta(item.status.state).label}`
}

function useLocation() {
  geoHint.value = null
  if (!('geolocation' in navigator)) {
    geoHint.value = 'Standort ist in diesem Browser nicht verfügbar.'
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
      geoHint.value = 'Standort nicht verfügbar – Sortierung ohne Entfernung.'
    },
    { timeout: 10_000, maximumAge: 60_000 },
  )
}
</script>

<template>
  <div class="page">
    <div class="map-area">
      <svg
        class="map"
        :viewBox="`0 0 ${MAP_W} ${MAP_H}`"
        aria-label="Schematische Karte der Fairteiler in Aachen"
      >
        <rect x="0" y="0" :width="MAP_W" :height="MAP_H" fill="#e9e5d8"></rect>
        <!-- decorative park blobs (no street network – this is a schematic) -->
        <path d="M96 30 C140 18 178 40 172 74 C166 106 118 118 88 100 C62 84 60 42 96 30 Z" fill="#d5decb"></path>
        <path d="M18 236 C52 224 74 246 68 278 C62 306 24 312 6 292 C-8 276 -6 246 18 236 Z" fill="#d5decb"></path>
        <path d="M330 128 C362 120 384 140 378 166 C372 190 336 196 320 178 C306 162 306 136 330 128 Z" fill="#d5decb"></path>
        <path d="M300 388 C336 376 366 396 360 424 C354 448 312 456 292 438 C276 424 274 398 300 388 Z" fill="#d5decb"></path>

        <!-- pins -->
        <g
          v-for="pin in pins"
          :key="pin.item.id"
          class="pin"
          :class="pin.item.status.state"
          role="button"
          tabindex="0"
          :aria-label="pinLabel(pin.item)"
          @click="openDetail(pin.item.id)"
          @keydown.enter="openDetail(pin.item.id)"
          @keydown.space.prevent="openDetail(pin.item.id)"
        >
          <circle :cx="pin.x" :cy="pin.y" r="22" fill="transparent"></circle>
          <circle
            :cx="pin.x"
            :cy="pin.y"
            r="9"
            :fill="pin.color"
            stroke="#fdfcf8"
            stroke-width="2.5"
          ></circle>
        </g>

        <!-- user position -->
        <circle
          v-if="userDot"
          class="userdot"
          :cx="userDot.x"
          :cy="userDot.y"
          r="7"
          fill="#3b6ea5"
          stroke="#fdfcf8"
          stroke-width="3"
        ></circle>
      </svg>

      <!-- brand pill -->
      <div class="map-topbar">
        <div class="brandpill">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 20 C5 11 10 5 20 4 C21 14 15 19 8 19"></path>
            <path d="M5 20 C8 15 12 12 16 10"></path>
          </svg>
          <span class="disp brandname">Fairteiler Aachen</span>
        </div>
        <button
          type="button"
          class="locbtn"
          :disabled="locating"
          @click="useLocation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="7"></circle>
            <path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3"></path>
          </svg>
          {{ locating ? 'Suche …' : 'Standort verwenden' }}
        </button>
      </div>

      <span class="schema-badge">Schemakarte – keine Straßenkarte</span>
    </div>

    <!-- sheet -->
    <div class="sheet">
      <div class="grip" aria-hidden="true"></div>

      <OfflineBanner v-if="showOffline" class="sheet-offline" />

      <p v-if="!items && !error" class="hint">Lade Fairteiler …</p>

      <div v-else-if="error" class="hint error">
        <p>{{ error }}</p>
        <button type="button" class="retrybtn" @click="load">Erneut versuchen</button>
      </div>

      <template v-else-if="items">
        <div class="sheethead">
          <span class="disp sheettitle">In deiner Nähe</span>
          <RouterLink to="/liste" class="alllink">Alle {{ items.length }} anzeigen</RouterLink>
        </div>
        <p class="summary">
          {{ reportedCount }} von {{ items.length }} mit aktueller Meldung
        </p>
        <p v-if="geoHint" class="geohint">{{ geoHint }}</p>

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
}

.map {
  display: block;
  width: 100%;
  height: auto;
}

.pin {
  cursor: pointer;
}

.pin:focus-visible circle:last-of-type {
  stroke: #22301f;
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

.schema-badge {
  position: absolute;
  left: 16px;
  bottom: 38px;
  background: rgba(253, 252, 248, 0.9);
  color: var(--muted);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
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
