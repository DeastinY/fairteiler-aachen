<script setup lang="ts">
import { computed } from 'vue'
import { statusMeta } from '../lib/status'
import type { StatusState } from '../types'

const props = defineProps<{ state: StatusState }>()

const meta = computed(() => statusMeta(props.state))
</script>

<template>
  <span :class="meta.badgeClass">{{ meta.label }}</span>
</template>
