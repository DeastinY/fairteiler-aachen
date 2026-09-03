<script setup lang="ts">
import type { FairteilerFilter } from '../lib/filters'
import { useFilters } from '../composables/useFilters'

const filter = useFilters()

const CHIPS: { key: keyof FairteilerFilter; label: string }[] = [
  { key: 'etwasDa', label: 'Etwas da' },
  { key: 'aroundTheClock', label: 'Rund um die Uhr' },
  { key: 'cooled', label: 'Gekühlt' },
]

function toggle(key: keyof FairteilerFilter) {
  filter[key] = !filter[key]
}
</script>

<template>
  <div class="chips" role="group" aria-label="Filter">
    <button
      v-for="chip in CHIPS"
      :key="chip.key"
      type="button"
      class="filterchip"
      :class="{ active: filter[chip.key] }"
      :aria-pressed="filter[chip.key]"
      @click="toggle(chip.key)"
    >
      {{ chip.label }}
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
