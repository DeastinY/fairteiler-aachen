<script setup lang="ts">
import { computed } from 'vue'
import { t, type MessageKey } from '../i18n'
import type { FairteilerFilter } from '../lib/filters'
import { useFilters } from '../composables/useFilters'

const props = defineProps<{ withBaskets?: boolean }>()

const filter = useFilters()

/** Chips are deliberately compact: the row has to survive 320px screens and
 * long translations. `short` keeps the wording tight, `icon` drops the label
 * entirely (the full label stays as the accessible name). */
type Chip = {
  key: keyof FairteilerFilter
  labelKey: MessageKey
  shortKey?: MessageKey
  icon?: 'snow' | 'basket' | 'wheelchair'
}

const BASE_CHIPS: Chip[] = [
  { key: 'etwasDa', labelKey: 'filters.etwasDa' },
  { key: 'openNow', labelKey: 'filters.openNow', shortKey: 'filters.openNowShort' },
  {
    key: 'aroundTheClock',
    labelKey: 'filters.aroundTheClock',
    shortKey: 'filters.aroundTheClockShort',
  },
  { key: 'cooled', labelKey: 'filters.cooled', icon: 'snow' },
  { key: 'accessible', labelKey: 'filters.accessible', icon: 'wheelchair' },
]

const chips = computed<Chip[]>(() =>
  props.withBaskets
    ? [...BASE_CHIPS, { key: 'baskets', labelKey: 'filters.baskets', icon: 'basket' }]
    : BASE_CHIPS,
)

const EMOJI: Record<NonNullable<Chip['icon']>, string> = {
  snow: '🧊',
  wheelchair: '♿',
  basket: '🧺',
}

function label(chip: Chip): string {
  return t(chip.shortKey ?? chip.labelKey)
}

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
      :data-test="`chip-${chip.key}`"
      :class="{ active: filter[chip.key], iconchip: !!chip.icon }"
      :aria-pressed="filter[chip.key]"
      :aria-label="chip.icon ? t(chip.labelKey) : undefined"
      :title="chip.icon ? t(chip.labelKey) : undefined"
      @click="toggle(chip.key)"
    >
      <span v-if="chip.icon" class="emoji" aria-hidden="true">{{ EMOJI[chip.icon] }}</span>
      <span v-else>{{ label(chip) }}</span>
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

/* icon-only chips stay square-ish so the row keeps its rhythm */
.filterchip.iconchip {
  width: 44px;
  padding: 0;
}

.emoji {
  font-size: 19px;
  line-height: 1;
}

.filterchip.active {
  background: var(--green);
  color: var(--surface);
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(34, 48, 31, 0.14);
}
</style>
