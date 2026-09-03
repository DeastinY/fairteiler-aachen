<script setup lang="ts">
import { prefersReducedMotion } from '../composables/useReducedMotion'
import { t } from '../i18n'

/**
 * Shimmering placeholder bar. Height/width via props; shimmer disabled when
 * the user prefers reduced motion (JS class + CSS media query as backup).
 */
withDefaults(
  defineProps<{
    width?: string
    height?: string
    rounded?: boolean
    /** First block on a page announces the loading state to screen readers. */
    announce?: boolean
  }>(),
  { width: '100%', height: '14px', rounded: false, announce: false },
)

const noShimmer = prefersReducedMotion()
</script>

<template>
  <div
    class="skeleton"
    :class="{ 'no-shimmer': noShimmer, rounded }"
    :style="{ width, height }"
    aria-hidden="true"
  ></div>
  <span v-if="announce" class="sr-only" role="status">{{ t('common.loading') }}</span>
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-soft) 25%,
    var(--border-soft) 45%,
    var(--gray-soft) 65%
  );
  background-size: 240% 100%;
  border-radius: 6px;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton.rounded {
  border-radius: 999px;
}

.skeleton.no-shimmer {
  animation: none;
  background: var(--gray-soft);
}

@keyframes shimmer {
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -120% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--gray-soft);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
