<script setup lang="ts">
import { hideToast, useToast } from '../composables/useToast'

const toast = useToast()

function runAction() {
  const action = toast.action
  hideToast()
  action?.handler()
}
</script>

<template>
  <div id="toast" :class="{ show: toast.visible, green: toast.green }" role="status" aria-live="polite">
    <span>{{ toast.message }}</span>
    <button
      v-if="toast.action"
      type="button"
      class="toastaction"
      @click="runAction"
    >
      {{ toast.action.label }}
    </button>
  </div>
</template>

<style scoped>
#toast {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(104px + env(safe-area-inset-bottom));
  margin: 0 auto;
  width: max-content;
  max-width: 90vw;
  z-index: 100;
  background: var(--ink);
  color: var(--surface);
  border-radius: 999px;
  padding: 11px 18px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(34, 48, 31, 0.25);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s;
  display: flex;
  align-items: center;
  gap: 12px;
}

#toast.show {
  opacity: 1;
  pointer-events: auto;
}

#toast.green {
  background: var(--green);
}

.toastaction {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  min-height: 24px;
  padding: 4px 2px;
  flex-shrink: 0;
}
</style>
