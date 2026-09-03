<script setup lang="ts">
import type { FairteilerCare } from '../types'

defineProps<{ care: FairteilerCare }>()
</script>

<template>
  <span v-if="care.needsCleaning" class="badge-amber">Reinigung nötig</span>
  <span v-if="care.needsMaintenance" class="badge-warn">Defekt gemeldet</span>
</template>
