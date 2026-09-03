<script setup lang="ts">
import { useToast } from '../composables/useToast'

const toast = useToast()
</script>

<template>
  <div id="toast" :class="{ show: toast.visible, green: toast.green }" role="status" aria-live="polite">
    {{ toast.message }}
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
}

#toast.show {
  opacity: 1;
}

#toast.green {
  background: var(--green);
}
</style>
