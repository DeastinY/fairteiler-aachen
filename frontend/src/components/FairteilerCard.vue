<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n'
import { openHint } from '../lib/hours'
import { tagLabels } from '../lib/labels'
import { formatRelativeTime } from '../lib/relativeTime'
import type { FairteilerListItem } from '../types'
import ActivityBars from './ActivityBars.vue'
import CareBadges from './CareBadges.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ fairteiler: FairteilerListItem; distanceText?: string | null }>()

const timeline = computed(() => {
  const { status } = props.fairteiler
  if (!status.lastReportAt) return t('time.none')
  const time = formatRelativeTime(status.lastReportAt)
  const tags = tagLabels(status.tags)
  return tags ? `${time} · ${tags}` : time
})
</script>

<template>
  <RouterLink :to="`/fairteiler/${fairteiler.id}`" class="card listecard">
    <span class="toprow">
      <span class="disp name">{{ fairteiler.name }}</span>
      <span class="badges">
        <CareBadges :care="fairteiler.care" />
        <StatusBadge :state="fairteiler.status.state" />
      </span>
    </span>
    <span class="street">
      {{ fairteiler.street }} · {{ fairteiler.city }}
      <span v-if="distanceText" class="distance" data-test="distance">· {{ distanceText }}</span>
      <span v-if="openHint(fairteiler)" class="openhint">· {{ openHint(fairteiler) }}</span>
    </span>
    <span class="bottomrow">
      <span class="timeline">{{ timeline }}</span>
      <span class="chart">
        <ActivityBars :days="fairteiler.activity7d" />
        <span class="caption">{{ t('liste.chartCaption') }}</span>
      </span>
    </span>
  </RouterLink>
</template>

<style scoped>
.listecard {
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  color: inherit;
}

.listecard:hover {
  color: inherit;
}

.toprow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.name {
  font-weight: 650;
  font-size: 17px;
  /* floor keeps the name from collapsing to a one-letter column when two
     badges compete for the row (hyphens:auto shrinks min-content a lot) */
  min-width: min(55%, 16ch);
  flex: 1;
  hyphens: auto;
  overflow-wrap: break-word;
}

.badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 1;
}

.street {
  font-size: 13px;
  color: var(--muted);
}

.openhint {
  color: var(--gray-ink);
  font-weight: 500;
}

.distance {
  font-weight: 600;
  color: var(--gray-ink);
}

.bottomrow {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.timeline {
  min-width: 0;
}

.timeline {
  font-size: 13px;
  color: var(--ink);
}

.chart {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.caption {
  font-size: 10px;
  color: var(--faint);
}

</style>
