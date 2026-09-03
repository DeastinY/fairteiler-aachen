<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OfflineBanner from '../components/OfflineBanner.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { fetchFairteilerDetail } from '../composables/api'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import { reportTypeLabel, tagLabel, tagLabels } from '../lib/labels'
import { formatRelativeTime } from '../lib/relativeTime'
import { statusMeta } from '../lib/status'
import type { FairteilerDetail, Report } from '../types'

const route = useRoute()
const router = useRouter()

const online = useOnline()
const detail = ref<FairteilerDetail | null>(null)
const error = ref<string | null>(null)

const showOffline = computed(() =>
  offlineBannerVisible(online.value, detail.value !== null, error.value !== null),
)

const fairteilerId = computed(() => Number(route.params.id))

async function load() {
  detail.value = null
  error.value = null
  if (!Number.isInteger(fairteilerId.value) || fairteilerId.value <= 0) {
    error.value = 'Dieser Fairteiler wurde nicht gefunden.'
    return
  }
  try {
    detail.value = await fetchFairteilerDetail(fairteilerId.value)
  } catch (e) {
    error.value =
      e instanceof Error && e.message.length > 0 && !(e instanceof TypeError)
        ? e.message
        : 'Der Fairteiler konnte nicht geladen werden. Bist du online?'
  }
}

onMounted(load)
watch(fairteilerId, load)

const address = computed(() => {
  if (!detail.value) return ''
  const d = detail.value
  return [d.street, `${d.postalCode} ${d.city}`].filter(Boolean).join(' · ')
})

const statusLine = computed(() => {
  if (!detail.value) return ''
  const { status } = detail.value
  if (!status.lastReportAt) return 'Noch keine aktuelle Meldung'
  return `Zuletzt gemeldet ${formatRelativeTime(status.lastReportAt)}`
})

const dotColor = computed(() =>
  detail.value ? statusMeta(detail.value.status.state).dotColor : '#c08a1e',
)

/** Description as escaped plain-text paragraphs — never rendered as HTML. */
const paragraphs = computed(() => {
  if (!detail.value?.description) return []
  return detail.value.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
})

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const

const dayLabels = computed(() => {
  const labels: string[] = []
  const today = new Date()
  for (let offset = 6; offset >= 1; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    labels.push(WEEKDAYS[day.getDay()] ?? '')
  }
  labels.push('Heute')
  return labels
})

const MAX_CHART_HEIGHT = 56
const MIN_CHART_HEIGHT = 4

function chartHeight(days: number[], value: number): number {
  const max = Math.max(...days, 0)
  if (max === 0) return MIN_CHART_HEIGHT
  return Math.max(MIN_CHART_HEIGHT, Math.round((value / max) * MAX_CHART_HEIGHT))
}

function reportTitle(report: Report): string {
  const label = reportTypeLabel(report.type)
  const tags = tagLabels(report.tags)
  return tags ? `${label} · ${tags}` : label
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/liste')
}
</script>

<template>
  <div class="page">
    <!-- hero -->
    <div class="hero">
      <svg viewBox="0 0 390 190" aria-hidden="true">
        <rect width="390" height="190" fill="#2f7d54"></rect>
        <path d="M0 190 C80 120 160 150 230 110 C300 70 350 90 390 60 L390 190 Z" fill="#266645"></path>
        <path d="M0 190 C110 160 210 180 300 150 C350 134 380 140 390 132 L390 190 Z" fill="#1d5236"></path>
        <g stroke="#8fc3a4" stroke-width="2.5" fill="none" stroke-linecap="round">
          <path d="M84 96 C84 72 96 56 116 48 C120 72 108 90 84 96 Z"></path>
          <path d="M84 96 C92 82 102 70 112 62"></path>
          <path d="M292 78 C280 62 280 44 292 30 C306 44 306 62 292 78 Z"></path>
          <path d="M292 74 L292 40"></path>
        </g>
        <circle cx="196" cy="66" r="30" fill="none" stroke="#8fc3a4" stroke-width="2.5"></circle>
        <path d="M182 66 C186 56 206 56 210 66 C206 76 186 76 182 66 Z" fill="#8fc3a4"></path>
      </svg>
      <button type="button" class="roundbtn backbtn" aria-label="Zurück" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22301f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6"></path>
        </svg>
      </button>
    </div>

    <OfflineBanner v-if="showOffline" />

    <p v-if="!detail && !error" class="hint">Lade Fairteiler …</p>

    <div v-else-if="error" class="hint error">
      <p>{{ error }}</p>
      <button type="button" class="retrybtn" @click="load">Erneut versuchen</button>
    </div>

    <template v-else-if="detail">
      <!-- title block -->
      <div class="titleblock">
        <div class="titlerow">
          <h1 class="disp page-title">{{ detail.name }}</h1>
          <StatusBadge :state="detail.status.state" />
        </div>
        <p class="page-sub">{{ address }}</p>
        <p v-if="detail.regionName" class="region">{{ detail.regionName }}</p>
      </div>

      <!-- status card -->
      <section class="card block" aria-label="Aktueller Status">
        <div class="statusrow">
          <span class="dot" :style="{ background: dotColor }"></span>
          <span class="statusline">{{ statusLine }}</span>
        </div>
        <div v-if="detail.status.tags.length" class="tagrow">
          <span v-for="tag in detail.status.tags" :key="tag" class="tagchip">
            {{ tagLabel(tag) }}
          </span>
        </div>
      </section>

      <!-- activity -->
      <section class="card block" aria-label="Aktivität">
        <div class="blockhead">
          <span class="disp blocktitle">Aktivität</span>
          <span class="blocknote">Meldungen pro Tag · letzte 7 Tage</span>
        </div>
        <div class="chart">
          <div v-for="(count, index) in detail.activity7d" :key="index" class="chartcol">
            <span v-if="index === detail.activity7d.length - 1 && count > 0" class="chartcount">
              {{ count }}
            </span>
            <div
              class="chartbar"
              :class="{ hi: index === detail.activity7d.length - 1 }"
              :style="{ height: `${chartHeight(detail.activity7d, count)}px` }"
            ></div>
            <span class="chartday" :class="{ today: index === detail.activity7d.length - 1 }">
              {{ dayLabels[index] }}
            </span>
          </div>
        </div>
      </section>

      <!-- description -->
      <section v-if="paragraphs.length" class="card block" aria-label="Beschreibung">
        <span class="disp blocktitle">Über diesen Fairteiler</span>
        <p v-for="(paragraph, index) in paragraphs" :key="index" class="para">{{ paragraph }}</p>
      </section>

      <!-- recent reports -->
      <section class="reports" aria-label="Letzte Meldungen">
        <h2 class="disp sectiontitle">Letzte Meldungen</h2>
        <div class="card reportcard">
          <p v-if="detail.reports.length === 0" class="empty">
            Noch keine Meldungen – sei die erste Person!
          </p>
          <div v-for="(report, index) in detail.reports" :key="index" class="reportrow">
            <span class="reporticon" :class="report.type">
              <svg v-if="report.type === 'brought'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#266645" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5 M5 12l7-7 7 7"></path>
              </svg>
              <svg v-else-if="report.type === 'taken'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#566b5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14 M5 12l7 7 7-7"></path>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f59" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M8 12h8"></path>
              </svg>
            </span>
            <span class="reportbody">
              <span class="reporttitle">{{ reportTitle(report) }}</span>
              <span class="reporttime">{{ formatRelativeTime(report.createdAt) }}</span>
            </span>
          </div>
        </div>
      </section>

      <!-- action -->
      <div class="actions">
        <RouterLink :to="`/melden?fairteiler=${detail.id}`" class="meldenbtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fdfcf8" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <path d="M12 5v14 M5 12h14"></path>
          </svg>
          Jetzt melden
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  background: var(--green);
  overflow: hidden;
}

.hero svg {
  display: block;
  width: 100%;
  height: auto;
}

.backbtn {
  position: absolute;
  left: 16px;
  top: 16px;
  background: rgba(253, 252, 248, 0.92);
}

.titleblock {
  padding: 18px 20px 0 20px;
}

.titlerow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.titlerow h1 {
  margin: 0;
}

.page-sub {
  margin: 4px 0 0 0;
}

.region {
  font-size: 12px;
  color: var(--faint);
  margin: 2px 0 0 0;
}

.block {
  margin: 16px 16px 0 16px;
  padding: 16px;
}

.statusrow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.statusline {
  font-weight: 600;
  font-size: 15px;
}

.tagrow {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tagchip {
  background: var(--green-mist);
  border-radius: 8px;
  padding: 6px 11px;
  font-size: 13px;
  font-weight: 500;
}

.blockhead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.blocktitle {
  font-weight: 650;
  font-size: 16px;
}

.blocknote {
  font-size: 12px;
  color: var(--muted);
}

.chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  height: 96px;
  margin-top: 14px;
  padding: 0 2px;
}

.chartcol {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  align-self: stretch;
  justify-content: flex-end;
}

.chartcount {
  font-size: 11px;
  font-weight: 600;
  color: var(--green-dark);
}

.chartbar {
  width: 26px;
  background: var(--bar);
  border-radius: 4px 4px 0 0;
}

.chartbar.hi {
  background: var(--green);
}

.chartday {
  font-size: 11px;
  color: var(--muted);
}

.chartday.today {
  font-weight: 600;
  color: var(--ink);
}

.para {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
  margin: 10px 0 0 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.reports {
  margin: 16px 16px 0 16px;
}

.sectiontitle {
  font-weight: 650;
  font-size: 16px;
  margin: 0 0 8px 0;
  padding: 0 4px;
}

.reportcard {
  padding: 4px 16px;
}

.empty {
  font-size: 14px;
  color: var(--muted);
  padding: 12px 0;
  margin: 0;
}

.reportrow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-soft);
}

.reportrow:last-child {
  border-bottom: none;
}

.reporticon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reporticon.brought {
  background: var(--green-soft);
}

.reporticon.taken {
  background: var(--green-mist);
}

.reporticon.empty {
  background: var(--gray-soft);
}

.reportbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.reporttitle {
  font-size: 14px;
  font-weight: 600;
}

.reporttime {
  font-size: 12px;
  color: var(--muted);
}

.actions {
  padding: 16px;
  margin-top: 4px;
}

.meldenbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--green);
  color: var(--surface);
  border-radius: 999px;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 600;
  min-height: 44px;
  box-shadow: 0 5px 14px rgba(47, 125, 84, 0.35);
}

.meldenbtn:hover {
  color: var(--surface);
}
</style>
