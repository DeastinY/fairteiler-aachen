<script setup lang="ts">
import { computed } from 'vue'
import { t, type MessageKey } from '../i18n'
import type { FairteilerFilter } from '../lib/filters'
import { useFilters } from '../composables/useFilters'

const props = defineProps<{ withBaskets?: boolean }>()

const filter = useFilters()

const BASE_CHIPS: { key: keyof FairteilerFilter; labelKey: MessageKey }[] = [
  { key: 'etwasDa', labelKey: 'filters.etwasDa' },
  { key: 'openNow', labelKey: 'filters.openNow' },
  { key: 'aroundTheClock', labelKey: 'filters.aroundTheClock' },
  { key: 'cooled', labelKey: 'filters.cooled' },
]

const chips = computed(() =>
  props.withBaskets
    ? [...BASE_CHIPS, { key: 'baskets' as const, labelKey: 'filters.baskets' as MessageKey }]
    : BASE_CHIPS,
)

function toggle(key: keyof FairteilerFilter) {
  filter[key] = !filter[key]
}
</script>

<template>
  <div class="chips" role="group" :aria-label="t('filters.aria')">
    <button
      v-for="chip in chips"
      :key="chip.key"
      type="button"
      class="filterchip"
      :class="{ active: filter[chip.key] }"
      :aria-pressed="filter[chip.key]"
      @click="toggle(chip.key)"
    >
      {{ t(chip.labelKey) }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px 0;
}

.chips::-webkit-scrollbar {
  display: none;
}

.filterchip {
  background: var(--surface);
  color: var(--ink);
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(34, 48, 31, 0.1);
  min-height: 44px;
  flex-shrink: 0;
}

.filterchip.active {
  background: var(--green);
  color: var(--surface);
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(34, 48, 31, 0.14);
}
</style>
