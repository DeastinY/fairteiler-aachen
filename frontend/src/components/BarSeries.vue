<script setup lang="ts">
import { computed } from 'vue'

/**
 * Small single-hue bar chart: baseline-anchored bars with rounded tops,
 * the last value (today) emphasized and labeled, muted date labels for
 * first/middle/last only. Zero values render as a hairline.
 */
const props = withDefaults(
  defineProps<{
    values: number[]
    /** Label per index (only first, middle and last are rendered). */
    labels: string[]
    maxHeight?: number
  }>(),
  { maxHeight: 56 },
)

const HAIRLINE = 2

const heights = computed(() => {
  const max = Math.max(...props.values, 0)
  return props.values.map((value) => {
    if (max === 0 || value === 0) return HAIRLINE
    return Math.max(HAIRLINE + 2, Math.round((value / max) * props.maxHeight))
  })
})

const labelIndices = computed(() => {
  const last = props.values.length - 1
  return new Set([0, Math.floor(last / 2), last])
})
</script>

<template>
  <div class="series" :style="{ '--chart-h': `${maxHeight}px` }">
    <div v-for="(value, index) in values" :key="index" class="col">
      <span v-if="index === values.length - 1" class="value">{{ value }}</span>
      <div
        class="bar"
        :class="{ hi: index === values.length - 1 }"
        :style="{ height: `${heights[index]}px` }"
        :data-value="value"
      ></div>
      <span class="label" :class="{ empty: !labelIndices.has(index) }">
        {{ labelIndices.has(index) ? labels[index] : '' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.series {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 3px;
  min-height: calc(var(--chart-h) + 34px);
}

.col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  align-self: stretch;
}

.value {
  font-size: 11px;
  font-weight: 600;
  color: var(--green-dark);
}

.bar {
  width: 100%;
  max-width: 18px;
  background: var(--bar);
  border-radius: 4px 4px 0 0;
}

.bar.hi {
  background: var(--green);
}

.label {
  font-size: 10px;
  color: var(--faint);
  white-space: nowrap;
  height: 13px;
}
</style>
