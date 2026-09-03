<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n'

const props = withDefaults(
  defineProps<{
    days: number[]
    /** Height in px of the tallest bar. */
    maxHeight?: number
  }>(),
  { maxHeight: 26 },
)

const MIN_BAR = 4

const heights = computed(() => {
  const max = Math.max(...props.days, 0)
  return props.days.map((value) =>
    max > 0 ? Math.max(MIN_BAR, Math.round((value / max) * props.maxHeight)) : MIN_BAR,
  )
})
</script>

<template>
  <span
    class="bars"
    :style="{ height: `${maxHeight}px` }"
    role="img"
    :aria-label="t('common.activityAria')"
  >
    <span
      v-for="(height, index) in heights"
      :key="index"
      class="bar"
      :class="{ hi: index === heights.length - 1 }"
      :style="{ height: `${height}px` }"
      :data-value="days[index]"
    ></span>
  </span>
</template>

<style scoped>
.bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
}

.bar {
  width: 6px;
  background: var(--bar);
  border-radius: 3px 3px 0 0;
}

.bar.hi {
  background: var(--green);
}
</style>
