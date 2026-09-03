<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CareBadges from '../components/CareBadges.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import OfflineBanner from '../components/OfflineBanner.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { ApiError, deleteReport, fetchFairteilerDetail } from '../composables/api'
import { renderMarkdown } from '../lib/markdown'
import { forgetOwnReport, isOwnReport } from '../composables/ownReports'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import { showToast } from '../composables/useToast'
import { t, useI18n } from '../i18n'
import { dayLabel, formatHours, todayKey, DAY_KEYS } from '../lib/hours'
import { reportTypeLabel, tagLabel, tagLabels } from '../lib/labels'
import { navigationUrl } from '../lib/navigation'
import { formatRelativeTime } from '../lib/relativeTime'
import { statusMeta } from '../lib/status'
import type { FairteilerDetail, Report } from '../types'

const { locale } = useI18n()

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
    error.value = t('detail.notFound')
    return
  }
  try {
    detail.value = await fetchFairteilerDetail(fairteilerId.value)
  } catch (e) {
    error.value =
      e instanceof Error && e.message.length > 0 && !(e instanceof TypeError)
        ? e.message
        : t('detail.loadError')
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
  if (!status.lastReportAt) return t('detail.noCurrentReport')
  return t('detail.lastReported', { time: formatRelativeTime(status.lastReportAt) })
})

const dotColor = computed(() =>
  detail.value ? statusMeta(detail.value.status.state).dotColor : '#c08a1e',
)

/** Description rendered through our own escaping markdown renderer —
 * the source is untrusted, renderMarkdown escapes ALL input HTML first. */
const descriptionHtml = computed(() => renderMarkdown(detail.value?.description))

const dayLabels = computed(() => {
  const labels: string[] = []
  const today = new Date()
  for (let offset = 6; offset >= 1; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    // getDay(): 0 = Sunday; DAY_KEYS starts at Monday
    labels.push(dayLabel(DAY_KEYS[(day.getDay() + 6) % 7]!))
  }
  labels.push(t('detail.today'))
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

const undoing = ref(false)

function ownReportId(report: Report): number | null {
  return isOwnReport(report.id) ? report.id : null
}

async function undoReport(report: Report) {
  const reportId = ownReportId(report)
  if (reportId === null || undoing.value) return
  undoing.value = true
  try {
    await deleteReport(reportId)
    forgetOwnReport(reportId)
    showToast(t('detail.undone'))
    await load()
  } catch (e) {
    showToast(
      e instanceof ApiError
        ? e.message
        : t('detail.undoFailed'),
    )
  } finally {
    undoing.value = false
  }
}

const bestTimeText = computed(() => {
  switch (detail.value?.bestTime) {
    case 'morning':
      return t('detail.bestTimeMorning')
    case 'afternoon':
      return t('detail.bestTimeAfternoon')
    case 'evening':
      return t('detail.bestTimeEvening')
    default:
      return null
  }
})

function hasShareApi(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

function hasClipboard(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  )
}

const canShare = hasShareApi() || hasClipboard()

async function share() {
  if (!detail.value) return
  const url = window.location.href
  if (hasShareApi()) {
    try {
      await navigator.share({ title: detail.value.name, url })
    } catch {
      // user dismissed the share sheet
    }
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    showToast(t('detail.linkCopied'))
  } catch {
    // clipboard refused – nothing sensible to do
  }
}

/** Hours table rows – omitted for 24/7 places (their chip says it all). */
const hoursRows = computed(() => {
  if (!detail.value?.hours || detail.value.aroundTheClock) return null
  return formatHours(detail.value.hours)
})

const today = todayKey()

const routeHref = computed(() =>
  detail.value
    ? navigationUrl(detail.value.lat, detail.value.lon, detail.value.name, navigator.userAgent)
    : null,
)

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
      <button type="button" class="roundbtn backbtn" :aria-label="t('common.back')" @click="goBack">
        <svg class="dir-flip" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22301f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6"></path>
        </svg>
      </button>
      <button
        v-if="canShare"
        type="button"
        class="roundbtn sharebtn"
        :aria-label="t('detail.share')"
        data-test="share"
        @click="share"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22301f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="6" cy="12" r="2.5"></circle>
          <circle cx="17" cy="5.5" r="2.5"></circle>
          <circle cx="17" cy="18.5" r="2.5"></circle>
          <path d="M8.2 10.8l6.6-4 M8.2 13.2l6.6 4"></path>
        </svg>
      </button>
    </div>

    <OfflineBanner v-if="showOffline" />

    <div v-if="!detail && !error" class="sk-detail" data-test="skeletons">
      <div class="sk-title">
        <SkeletonBlock width="55%" height="24px" announce />
        <SkeletonBlock width="80px" height="24px" rounded />
      </div>
      <SkeletonBlock width="70%" height="14px" />
      <div class="card sk-status">
        <SkeletonBlock width="60%" height="16px" />
        <SkeletonBlock width="40%" height="14px" />
      </div>
      <div class="card sk-status">
        <SkeletonBlock width="35%" height="16px" />
        <SkeletonBlock width="100%" height="72px" />
      </div>
    </div>

    <div v-else-if="error" class="hint error">
      <p>{{ error }}</p>
      <button type="button" class="retrybtn" @click="load">{{ t('common.retry') }}</button>
    </div>

    <template v-else-if="detail">
      <!-- title block -->
      <div class="titleblock">
        <div class="titlerow">
          <h1 class="disp page-title">{{ detail.name }}</h1>
          <span class="titlebadges">
            <CareBadges :care="detail.care" />
            <StatusBadge :state="detail.status.state" />
          </span>
        </div>
        <p class="page-sub">{{ address }}</p>
        <p v-if="detail.regionName && detail.regionName !== detail.city" class="region">{{ detail.regionName }}</p>
        <div v-if="detail.aroundTheClock || detail.cooled" class="inforow">
          <span v-if="detail.aroundTheClock" class="infochip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 3"></path>
            </svg>
            {{ t('detail.aroundTheClock') }}
          </span>
          <span v-if="detail.cooled" class="infochip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 2v20 M4 6l16 12 M20 6L4 18"></path>
            </svg>
            {{ t('detail.cooled') }}
          </span>
        </div>
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
        <p v-if="bestTimeText" class="besttime" data-test="best-time">{{ bestTimeText }}</p>
      </section>

      <!-- activity -->
      <section class="card block" :aria-label="t('detail.activity')">
        <div class="blockhead">
          <span class="disp blocktitle">{{ t('detail.activity') }}</span>
          <span class="blocknote">{{ t('detail.activityCaption') }}</span>
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

      <!-- opening hours (24/7 places keep their chip instead) -->
      <section
        v-if="hoursRows"
        class="card block"
        aria-label="Öffnungszeiten"
        data-test="hours"
      >
        <span class="disp blocktitle">{{ t('hours.title') }}</span>
        <dl class="hourstable">
          <div
            v-for="row in hoursRows"
            :key="row.key"
            class="hoursrow"
            :class="{ today: row.key === today }"
          >
            <dt>{{ row.label }}</dt>
            <dd>
              <template v-if="row.ranges.length === 0">{{ row.text }}</template>
              <template v-else>
                <template v-for="(range, index) in row.ranges" :key="index">
                  <template v-if="index > 0"> {{ t('hours.join') }} </template>
                  <bdi dir="ltr">{{ range }}</bdi>
                </template>
              </template>
            </dd>
          </div>
        </dl>
      </section>

      <!-- description -->
      <section v-if="descriptionHtml" class="card block" aria-label="Beschreibung">
        <span class="disp blocktitle">{{ t('detail.about') }}</span>
        <!-- eslint-disable-next-line vue/no-v-html — renderMarkdown escapes all input -->
        <div class="para md ltr-content" dir="ltr" v-html="descriptionHtml"></div>
        <p v-if="locale !== 'de'" class="descsource">{{ t('detail.descriptionSource') }}</p>
        <a
          :href="`https://foodsharing.de/fairteiler/${detail.id}`"
          class="fslink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('detail.fsLink') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 17L17 7 M9 7h8v8"></path>
          </svg>
        </a>
      </section>
      <div v-else class="fsblock">
        <a
          :href="`https://foodsharing.de/fairteiler/${detail.id}`"
          class="fslink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('detail.fsLink') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 17L17 7 M9 7h8v8"></path>
          </svg>
        </a>
      </div>

      <!-- recent reports -->
      <section class="reports" :aria-label="t('detail.reports')">
        <h2 class="disp sectiontitle">{{ t('detail.reports') }}</h2>
        <div class="card reportcard">
          <p v-if="detail.reports.length === 0" class="empty">
            {{ t('detail.noReports') }}
          </p>
          <div v-for="(report, index) in detail.reports" :key="index" class="reportrow">
            <span class="reporticon" :class="report.type">
              <svg v-if="report.type === 'brought'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#266645" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5 M5 12l7-7 7 7"></path>
              </svg>
              <svg v-else-if="report.type === 'taken'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#566b5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14 M5 12l7 7 7-7"></path>
              </svg>
              <svg v-else-if="report.type === 'cleaned'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#266645" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M8.5 12.5l2.5 2.5 5-5.5"></path>
              </svg>
              <svg v-else-if="report.type === 'needs_cleaning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a6516" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3 C12 3 6 10.5 6 14.5 a6 6 0 0 0 12 0 C18 10.5 12 3 12 3 Z"></path>
              </svg>
              <svg v-else-if="report.type === 'needs_maintenance'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a4432f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14.5 6.5a4 4 0 0 1 5-5l-3 3 1 2 2 1 3-3a4 4 0 0 1-5 5L8 19.5a2 2 0 0 1-3-3z"></path>
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
            <button
              v-if="ownReportId(report) !== null"
              type="button"
              class="undobtn"
              :disabled="undoing"
              @click="undoReport(report)"
            >
              {{ t('detail.undo') }}
            </button>
          </div>
        </div>
      </section>

      <!-- actions -->
      <div class="actions">
        <a
          v-if="routeHref"
          :href="routeHref"
          class="routebtn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22301f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 11l19-8-8 19-2.5-8.5z"></path>
          </svg>
          {{ t('detail.route') }}
        </a>
        <RouterLink :to="`/melden?fairteiler=${detail.id}`" class="meldenbtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fdfcf8" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <path d="M12 5v14 M5 12h14"></path>
          </svg>
          {{ t('detail.reportNow') }}
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
  inset-inline-start: 16px;
  top: 16px;
  background: rgba(253, 252, 248, 0.92);
}

.sharebtn {
  position: absolute;
  inset-inline-end: 16px;
  top: 16px;
  background: rgba(253, 252, 248, 0.92);
}

.besttime {
  font-size: 13px;
  color: var(--muted);
  margin: 12px 0 0 0;
  border-top: 1px solid var(--border-soft);
  padding-top: 10px;
}

.sk-detail {
  padding: 18px 20px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sk-status {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
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
  min-width: 0;
  hyphens: auto;
  overflow-wrap: break-word;
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
  background: var(--bar-hi);
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
  flex-wrap: wrap;
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

.reporticon.cleaned {
  background: var(--green-soft);
}

.reporticon.needs_cleaning {
  background: var(--amber-soft);
}

.reporticon.needs_maintenance {
  background: #f4e0da;
}

.titlebadges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.reportbody {
  flex: 1 1 180px;
  min-width: 0;
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

.undobtn {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--green);
  min-height: 44px;
  padding: 8px 4px;
}

.undobtn:disabled {
  opacity: 0.6;
}

.hourstable {
  margin: 12px 0 0 0;
}

.hoursrow {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--border-soft);
}

.hoursrow:last-child {
  border-bottom: none;
}

.hoursrow dt {
  color: var(--muted);
}

.hoursrow dd {
  margin: 0;
}

.hoursrow.today dt,
.hoursrow.today dd {
  font-weight: 650;
  color: var(--ink);
}

.fsblock {
  margin: 16px 16px 0 16px;
}

.fslink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  min-height: 44px;
  font-size: 14px;
  font-weight: 600;
}

.fsblock .fslink {
  margin-top: 0;
}

.ltr-content {
  text-align: start;
}

.descsource {
  font-size: 12px;
  color: var(--faint);
  margin: 8px 0 0 0;
}

.actions {
  padding: 16px;
  margin-top: 4px;
  display: flex;
  gap: 10px;
}

.inforow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.infochip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
}

.routebtn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1.5px solid #cfcaba;
  border-radius: 999px;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 600;
  min-height: 44px;
  color: var(--ink);
}

.routebtn:hover {
  color: var(--ink);
}

.meldenbtn {
  flex: 1.4;
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

.md :deep(p) { margin: 0 0 10px 0; }
.md :deep(p:last-child) { margin-bottom: 0; }
.md :deep(ul) { margin: 0 0 10px 0; padding-inline-start: 20px; }
.md :deep(li) { margin: 2px 0; }
.md :deep(hr) { border: none; border-top: 1px solid #edeadf; margin: 12px 0; }
.md :deep(strong) { font-weight: 650; }
.md :deep(a) { color: var(--green); word-break: break-all; }
.md { overflow-wrap: anywhere; }

.titlerow { flex-wrap: wrap; }
.titlerow h1 { min-width: 0; overflow-wrap: anywhere; }
</style>
