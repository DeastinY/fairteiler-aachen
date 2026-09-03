<script setup lang="ts">
import { computed } from 'vue'
import { tagLabels } from '../lib/labels'
import { formatRelativeTime } from '../lib/relativeTime'
import type { FairteilerListItem } from '../types'
import ActivityBars from './ActivityBars.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ fairteiler: FairteilerListItem }>()

const timeline = computed(() => {
  const { status } = props.fairteiler
  if (!status.lastReportAt) return 'Noch keine Meldung'
  const time = formatRelativeTime(status.lastReportAt)
  const tags = tagLabels(status.tags)
  return tags ? `${time} · ${tags}` : time
})
</script>

<template>
  <RouterLink :to="`/fairteiler/${fairteiler.id}`" class="card listecard">
    <span class="toprow">
      <span class="disp name">{{ fairteiler.name }}</span>
      <StatusBadge :state="fairteiler.status.state" />
    </span>
    <span class="street">{{ fairteiler.street }} · {{ fairteiler.city }}</span>
    <span class="bottomrow">
      <span class="timeline">{{ timeline }}</span>
      <span class="chart">
        <ActivityBars :days="fairteiler.activity7d" />
        <span class="caption">Meldungen · 7 Tage</span>
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
}

.street {
  font-size: 13px;
  color: var(--muted);
}

.bottomrow {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
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
